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

### 3. Scheduled sweep — standalone component (`apps/people-app/leaver-sweep/`)

**Amendment (2026-07-30):** the sweep is a separate, independently-deployable
Ballerina package — not an in-process `ballerina/task` job inside the
`backend` HTTP service. This follows the existing precedent set by
`apps/visitor-app/active-visit-reminder/`: a small standalone package with a
`public function main() returns error?` entry point, deployed as a WSO2
Choreo **Scheduled Task** component. Choreo's own cron configuration controls
execution frequency — nothing in this repo declares an interval. Unlike the
`active-visit-reminder` precedent (which calls its backend's HTTP API rather
than touching the database), this component connects to the people_ops_suite
database **directly**, with its own `mysql:Client` and `dbConfig`
configurable, and calls the email-alerting-service directly with its own
`http:Client` — it shares no Ballerina module with `apps/people-app/backend`
(a separate Ballerina package cannot import another package's internal
modules without publishing them, and duplicating this small amount of logic
is simpler than doing so).

Package layout:
- `Ballerina.toml`, `Config.toml`/`Config.toml.local`, `.gitignore` (same
  shape as `active-visit-reminder`'s).
- `main.bal` — `public function main() returns error?`: calls the database
  module's sweep function, and if it returns any transitions, calls the
  email module's notify function. Logs start/completion. No retry loop, no
  scheduling code — one run, then exit.
- `modules/database/`: own `DatabaseConfig` configurable + `mysql:Client`
  (same shape as `backend/modules/database/client.bal`'s), plus:
  - a query that `SELECT`s employees where `employee_status = 'Marked leaver'`
    AND `resignation.final_day_of_employment IS NOT NULL AND <= CURDATE()`
    (joining `employee`/`resignation` on `employee.id = resignation.employee_id`),
  - a query that `UPDATE`s those same rows' `employee.employee_status` to
    `Left` and `updated_by` to the literal `"system-scheduler"` (fires the
    existing `trg_employee_audit_update` trigger automatically, same as any
    other status change),
  - a function that runs the `SELECT`, and only runs the `UPDATE` (in a
    `transaction`) when the `SELECT` found at least one row — returning the
    list of transitioned employees (id, name, work email, final day of
    employment) as a `LeaverTransition[]` record type, empty if none matched
    (not an error).
- `modules/email/`: own `EmailServiceConfig`/`appName`/
  `leaverNotificationRecipients` configurables, own `http:Client` to the
  email-alerting-service (OAuth2 client-credentials, matching
  `backend/modules/email/client.bal`'s shape), the same
  `leaverAutoTransitionSummaryTemplate` HTML template content designed
  earlier in this doc, and a `notifyLeaverAutoTransition(LeaverTransition[])`
  function that builds and sends the summary email. Failures are logged
  (`log:printError`) and do not fail `main()`'s exit code for the DB-update
  part already committed — no email is sent when zero employees transitioned.

This supersedes the earlier "in-process `ballerina/task`" design entirely;
`backend/modules/database` and `backend/modules/email` are **not** modified
by this feature at all — the backend's `email` module stays exactly as
dormant as it is today (no reactivation risk).

### 4. Config (new `apps/people-app/leaver-sweep/Config.toml.local`)

```toml
[dbConfig]
    host = ""
    user = ""
    password = ""
    database = ""
    port =

[emailServiceConfig]
    appName = ""
    leaverNotificationRecipients = [""]
    emailServiceEndpoint = ""
    from = ""

[emailServiceConfig.oauthConfig]
    tokenUrl = ""
    clientId = ""
    clientSecret = ""
```

(Exact table nesting to be finalized against the actual configurable record
shapes written in the plan/implementation — see the implementation plan for
the concrete Ballerina types.)

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
  3. Run `apps/people-app/leaver-sweep`'s `main()` locally (`bal run`) against
     the same local DB, and confirm the employee flips to `Left`, with
     `updated_by = 'system-scheduler'` and an audit trigger entry.
  4. Confirm the summary email call is reached/logged.
  5. Negative: an employee with a future final day is not transitioned.
  6. Negative: a `Marked leaver`/`Left` update missing any of the three
     resignation fields is rejected with `400`, both client-side (Yup) and
     server-side.
- **Webapp:** manually exercise the edit form, toggling status between
  `Active` → `Marked leaver` → `Left`, confirming field enable/disable and
  validation behavior.
