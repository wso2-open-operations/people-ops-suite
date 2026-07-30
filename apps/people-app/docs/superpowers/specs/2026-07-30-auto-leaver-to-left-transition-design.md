# Auto-transition Marked Leaver → Left

## Overview

Today, HR can only set an employee's status directly to `Left`, supplying the
resignation details (final day in office, final day of employment, reason) in
the same request. There is no way to record a *future-dated* departure — the
`Marked leaver` status exists in the data model but nothing lets HR attach a
final day of employment to it, and nothing watches that date.

This feature lets HR mark an employee as `Marked leaver` with a future
`final_day_of_employment`, and have the backend automatically flip that
employee's status to `Left` once the date arrives — no manual follow-up
required. HR/Admins receive an email summary after each automated run.

**Out of scope:** any offboarding side effect beyond the status change itself
(the existing manager-relationship deactivation cascade already fires earlier,
when HR records the leaver fields — see "Existing cascade" below); retroactive
backfill of final-day dates for employees already in `Marked leaver` status
today (they'll simply have a `NULL` final day until HR edits them); a new
dedicated "offboard employee" UI flow (the existing Job Info edit form is
extended instead).

## Current state (context for the changes below)

- `EmployeeStatus` enum (`backend/modules/database/enums.bal:36-41`): `Active`,
  `Left`, `Marked leaver`.
- `resignation` table (`backend/resources/people_app_creation.sql:361-374`),
  keyed by `employee_id` (FK to `employee.id`), holds `final_day_in_office`,
  `final_day_of_employment` (DATE, nullable), `reason`.
- `PATCH /employees/{employeeId}/job-info` (`backend/service.bal:1470-1559`)
  is the only way to set these fields today. The current guard
  (`service.bal:1536-1545`) *blocks* setting any resignation field unless the
  employee's status is (or is becoming) `Left` — so `Marked leaver` +
  a final day is currently impossible to record.
- Webapp `JobInfo.tsx` mirrors this: the Resignation Details fields
  (`finalDayInOffice`, `finalDayOfEmployment`, `resignationReason`) are
  disabled unless `employeeStatus === Left` (lines 1769, 1794, 1821), and are
  cleared whenever status changes away from `Left` (lines 1435-1439).
- **Existing cascade** (`db_functions.bal:789-796`, `syncResignationRecord`):
  whenever any leaver field is present in a job-info update payload
  (regardless of status), the `resignation` row is upserted and
  `inactivateEmployeeRelationshipsOnOffboarding` deactivates any
  additional-manager relationships where this employee is listed as manager.
  This already fires at the point HR records the leaver fields (i.e., at
  `Marked leaver` time under the new design) — unaffected by this feature.
- No scheduled/background job infrastructure exists in the backend today.
  `ballerina/task` is present as a transitive dependency (via
  `ballerinax/mysql`/`ballerina/http`), so it can be imported directly without
  adding a new external dependency.
- The `email` module (`backend/modules/email/`) is fully implemented but its
  only current caller (`notifyGroupAssignmentFailure`, used for onboarding
  SCIM failures) is commented out in `service.bal`, tied to an unrelated,
  separately-disabled SCIM/onboarding flow. The module itself is functional;
  this feature adds a new, independent call site.

## Changes

### 1. Webapp (`webapp/src/view/employees/onboarding/singleOnboarding/steps/JobInfo.tsx`)

- **Enable fields for `Marked leaver` too:**
  - Line 1435 `onChange` handler: only clear the three resignation fields when
    the new status is `Active` (currently clears for anything not `Left`).
  - Lines 1769, 1794, 1821: change
    `disabled={values.employeeStatus !== EmployeeStatus.Left}` to
    `disabled={![EmployeeStatus.MarkedLeaver, EmployeeStatus.Left].includes(values.employeeStatus)}`.
- **Require all three fields when applicable** (Yup schema, lines 152-163):
  change `finalDayInOffice`, `finalDayOfEmployment`, `resignationReason` from
  plain `.nullable()` to `.when("employeeStatus", ...)`, requiring a
  non-empty value when `employeeStatus` is `Marked leaver` or `Left`
  (otherwise remaining nullable) — following the same conditional-validation
  pattern already used for `employeeId` later in the same file
  (lines 168-178). Add a helper/error message explaining the requirement.

### 2. Backend validation (`backend/service.bal`, ~lines 1536-1545)

Replace the current "block unless Left" guard with a "require when
Marked-leaver-or-Left" check, evaluated against the **effective/merged**
state (payload value if provided, else the employee's existing stored
value — `employeeInfo` is already fetched earlier in this resource function
and already includes `finalDayInOffice`/`finalDayOfEmployment`/
`resignationReason` via the `resignation` table join, so no new query is
needed):

```ballerina
database:EmployeeStatus? resultingStatus = payload.employeeStatus ?: employeeInfo.employeeStatus;
if resultingStatus == database:EMPLOYEE_MARKED_LEAVER || resultingStatus == database:EMPLOYEE_LEFT {
    string? finalDayInOffice = payload.finalDayInOffice ?: employeeInfo.finalDayInOffice;
    string? finalDayOfEmployment = payload.finalDayOfEmployment ?: employeeInfo.finalDayOfEmployment;
    string? resignationReason = payload.resignationReason ?: employeeInfo.resignationReason;

    if finalDayInOffice is () || finalDayOfEmployment is () || resignationReason is () {
        return <http:BadRequest>{
            body: {
                message: "Final day in office, final day of employment, and resignation reason are all required when status is 'Marked leaver' or 'Left'"
            }
        };
    }
}
```

Because this checks the merged state, the first request that sets status to
`Marked leaver` must supply all three fields, but later unrelated edits (e.g.
changing manager) while status remains `Marked leaver` are not blocked, since
the previously-stored values already satisfy the check.

### 3. Scheduled job (new file, e.g. `backend/leaver_scheduler.bal`)

Uses `ballerina/task`. A `task:Job` implementation runs on a configurable
interval (default **24 hours**) and, on each run:

1. Calls a new database function, `transitionExpiredLeavers(string actor)`,
   which in a single `transaction`:
   - `SELECT`s employees where `employee_status = 'Marked leaver'` AND
     `resignation.final_day_of_employment IS NOT NULL AND <= CURDATE()`
     (joining `employee`/`resignation` on `employee.id = resignation.employee_id`,
     following the existing join style used by `upsertResignationQuery`).
   - `UPDATE`s those same rows' `employee.employee_status` to `Left` and
     `updated_by` to the passed-in `actor` (fires the existing
     `trg_employee_audit_update` trigger automatically, same as any other
     status change).
   - Returns the list of transitioned employees (id, name, work email, final
     day of employment) as a new `LeaverTransition[]` record type — empty
     array if none matched (not an error).
2. If the returned list is non-empty, calls
   `email:notifyLeaverAutoTransition(transitions)` (see below). Email failures
   are logged (`log:printError`) and do not roll back or retry the
   already-committed status transitions — no email is sent on a no-op run.

The job is started once from the existing `service.bal` `init()`
(lines 57-59).

New configurable: `configurable decimal leaverSweepIntervalHours = 24;`
(root-level, alongside other top-level configurables).

### 4. Email notification (`backend/modules/email/`)

- New configurable, separate from the existing onboarding-alert recipient
  list: `public configurable string[] leaverNotificationRecipients = ?;`
  (`modules/email/client.bal`), configured under `[people.email]`.
- New template `leaverAutoTransitionSummaryTemplate` in `templates.bal`,
  matching the existing WSO2-branded HTML style, with placeholders
  `APP_NAME`, `RUN_DATE`, `COUNT`, `EMPLOYEE_LIST` (HTML `<li>` list, one
  escaped entry per transitioned employee: name, ID, work email, final day),
  `YEAR`.
- New function `notifyLeaverAutoTransition(database:LeaverTransition[] transitions) returns error?`
  in `email.bal`, mirroring `notifyGroupAssignmentFailure`: builds the
  placeholder map, calls `bindKeyValues`, then `sendEmail` with `to:
  leaverNotificationRecipients`.

### 5. Config additions

`Config.toml.local` (blank placeholders):
```toml
leaverSweepIntervalHours = 24

[people.email]
    appName = ""
    leaverNotificationRecipients = [""]

[people.email.emailServiceConfig]
    emailServiceEndpoint = ""
    to = [""]
    from = ""

[people.email.emailServiceConfig.oauthConfig]
    tokenUrl = ""
    clientId = ""
    clientSecret = ""
```

`Config.toml` (active local dev config): add `leaverSweepIntervalHours` at
root level and `leaverNotificationRecipients` under the existing (currently
commented) `[people.email]` block.

## Testing / verification plan

No automated test suite exists in `backend/` today (no `tests/` directory);
this feature does not introduce one, consistent with existing scope.

- **Build:** `bal build` in `backend/` to confirm the new module/type/query
  code compiles.
- **Manual, local DB:**
  1. Set an employee to `Marked leaver` via the webapp with
     `final_day_of_employment` today or in the past; confirm the form now
     allows this and requires all three resignation fields.
  2. Confirm `employee.employee_status` and the `resignation` row are
     populated correctly.
  3. Trigger the sweep (temporarily lower `leaverSweepIntervalHours`, or run
     locally) and confirm the employee flips to `Left`, with
     `updated_by = 'system-scheduler'` and an audit trigger entry.
  4. Confirm the summary email call is reached/logged.
  5. Negative: an employee with a future final day is not transitioned.
  6. Negative: a `Marked leaver`/`Left` update missing any of the three
     resignation fields is rejected with `400`, both client-side (Yup) and
     server-side.
- **Webapp:** manually exercise the edit form, toggling status between
  `Active` → `Marked leaver` → `Left`, confirming field enable/disable and
  validation behavior.
