# Employee history

**Date:** 2026-08-11
**App:** people-app (backend + webapp)
**Status:** Approved

## Problem

There is no way to see how an employee's record has changed over time. The data exists —
four audit tables capture every insert and update as a full JSON snapshot — but nothing reads it.
Answering "when did this person move to Digital?" or "when were they last promoted?" means
querying the audit table by hand, which is how the `unit_id` investigation was done.

Two audiences need this: **People Ops**, reviewing an employee's record, and the **employee
themselves**, on their own profile page.

## Design decisions

Settled explicitly; everything below follows from these.

1. **Identity is the person, not the employee row.** Resolve to `personal_info_id` and gather all
   `employee` rows for that person.
2. **Diff at read time in Ballerina.** No new tables, no migration, works retroactively on all
   existing audit data.
3. **Two projections, one engine.** Employees see their own history; HR sees anyone's, with
   attribution.
4. **Attribution is hidden from employees.** `action_by` is HR-only.
5. **Leaver events are shown to employees.** Including status transitions and resignation reason.
6. **Promotions come from the HRIS database**, filtered to approved requests in ended cycles.

## Why identity cannot be work email

`work_email` is `NOT NULL` but **not unique** (`people_app_creation.sql:312`). Only
`personal_info.nic_or_passport` is unique (`:215`). A rehired employee gets a *new* `employee` row,
and the rehire flow requires the submitted work email to *match* the prior record — so one person
legitimately owns several rows sharing one email.

The reliable spine is therefore `personal_info_id`. Given an employee ID:

1. `employee.employee_id` → that row's `personal_info_id`
2. `personal_info_id` → every `employee` row for the person
3. `continuous_service_record` (FK to `employee.id`) links successive employments explicitly

Building on work email would silently merge or split people.

## Design

### 1. Endpoint

`GET /employees/{employeeId}/history`, following the existing `employees/[employeeId]/personal-info`
shape in `service.bal`.

Authorization mirrors the established pattern — extract `userInfo` from `ctx`, check privileges:

- **ADMIN** — any employee's history, full projection.
- **EMPLOYEE** — own history only, filtered projection. The caller's email must resolve to the same
  `personal_info_id` as the requested employee ID; otherwise `403`.

### 2. Deriving change events

The audit tables store whole snapshots, not deltas, so the diff happens at read time:

1. Collect every `employee_pk_id` belonging to the person.
2. Fetch matching rows from `employee_audit`, `personal_info_audit`, and
   `employee_additional_managers_audit`, ordered by `action_on`.
3. For each consecutive pair, compare the JSON field by field.
4. Emit one event per changed field: field name, old value, new value, timestamp, and `action_by`.

**Fields tracked** (from `employee_audit`): `business_unit_id`, `team_id`, `sub_team_id`, `unit_id`,
`designation_id`, `employment_type_id`, `company_id`, `office_id`, `manager_email`,
`employee_status`, `work_location`, `job_role`, `secondary_job_title`, `external_designation`,
`house_id`, `epf`, `probation_end_date`, `agreement_end_date`, `start_date`.

**Fields ignored** as noise: `updated_on`, `updated_by`, `employee_thumbnail`, `created_on`,
`created_by`, and `id`. An audit row whose only differences are ignored fields produces no event.

This matters more than it sounds. The `unit_id` investigation found 5000 audit rows containing
roughly 150 real field changes — the rest were migration re-writes touching only `updated_on` and
`employee_thumbnail`. Without filtering, the timeline is unreadable.

Events where `action_by = 'MIGRATION'` are labelled as system activity rather than shown as a
person editing a record.

### 3. Resolving IDs to names

Audit JSON stores foreign keys (`business_unit_id`, `designation_id`, …). Resolving them means
joining to the current lookup tables, which yields *today's* name. If a team was renamed, an old
event displays the new name.

This is accepted rather than solved: master data is not versioned, and versioning it is a far
larger change than this feature. Documented here so it is a known limitation, not a surprise.

### 4. Employment periods

Each `employee` row is one employment period, with its own employee ID and employment type. The
history groups events under the period they belong to, ordered most recent first, with
`continuous_service_record` shown as an explicit link between successive periods.

```
━━ Permanent · EP1234 · Jan 2024 – present
   12 Jun 2026  Team          Platform → Digital
   03 Mar 2026  Designation   SSE → SSE II        [promotion]
   01 Jan 2024  Joined
━━ Internship · IN0456 · Jun 2023 – Dec 2023   (continuous service)
   01 Dec 2023  Status        Active → Left
```

### 5. Promotion history (HRIS database)

Promotions come from a **second, separate MySQL database** (`hris`) that the People App backend
does not currently connect to. This adds a `promotionDbConfig` configurable and a second SQL client.

> **Credential note:** the HRIS credentials must go in `Config.toml` (gitignored) with empty
> placeholders added to `Config.toml.local` (checked in), per the project's config convention.
> Never commit the real password.

**The query** — an approved request whose cycle has formally ended:

```sql
SELECT pr.promotion_request_promoted_date,
       pr.promotion_request_current_job_band,
       pr.promotion_request_requested_job_band,
       pr.promotion_request_current_job_role,
       pr.promotion_request_type,
       pr.promotion_request_business_unit,
       pr.promotion_request_department,
       pr.promotion_request_team,
       pr.promotion_request_sub_team,
       pc.promotion_cycle_name
FROM hris.hris_promotion_request pr
JOIN hris.hris_promotion_cycle pc ON pc.promotion_cycle_id = pr.promotion_cycle_id
WHERE pr.promotion_request_employee_email = ${workEmail}
  AND pr.promotion_request_status = 'APPROVED'
  AND pc.promotion_cycle_status = 'END'
  AND pr.promotion_request_promoted_date IS NOT NULL
ORDER BY pr.promotion_request_promoted_date DESC
```

**Both conditions are load-bearing:**

- `promotion_request_status` has **ten** values (`DRAFT, SUBMITTED, WITHDRAW, REMOVED, EXPIRED,
  REJECTED, APPROVED, FL_REJECTED, FL_APPROVED, PROCESSING`). Only `APPROVED` is a completed
  promotion — note `FL_APPROVED` is *functional-lead* approved, an intermediate state, and must not
  be treated as a promotion. Surfacing `REJECTED` or `FL_REJECTED` to an employee would disclose
  that a promotion was proposed and declined.
- `promotion_cycle_status` has **three** values (`OPEN, CLOSED, END`). `END` is terminal: HR Admin
  ends a cycle via `/promotion/cycles/{id}/end`, which also expires all pending requests
  (`service.bal:579-610`). A merely `CLOSED` cycle may still have decisions in flight, so only
  `END` counts.

**Date normalisation.** Promoted dates are inconsistently stored, some with slashes. The promotion
app normalises with `regex:replaceAll(re '/', date, "-")` (`functions.bal:132`). Copy this, or dates
render wrong.

**Do not use `employee.last_promoted_date`.** The promotion app deliberately overrides the
People-side value, with the comment *"TODO: Remove this after the fix for the incorrect last
promotion date in people hr sync db"* (`functions.bal:100`). The synced value is known to be wrong;
the HRIS database is the source of truth.

**Attribution to an employment period.** Promotions key on work email only, so for a rehired person
every promotion across all periods returns together. Each is assigned to the period whose date
range contains its `promotion_request_promoted_date`.

**Failure handling.** If the HRIS database is unreachable, the endpoint still returns the People App
history, with a flag indicating promotion history is unavailable. A second database outage must not
break the Me page. The error is logged.

### 6. The two projections

| | Employee (own record) | HR / Admin |
|---|---|---|
| Field change events | ✅ | ✅ |
| Employment periods and rehires | ✅ | ✅ |
| Promotions (APPROVED + cycle END) | ✅ | ✅ |
| Leaver events, resignation reason | ✅ | ✅ |
| `action_by` attribution | ❌ | ✅ |
| Migration/system events | filtered out | included, labelled |

### 7. Frontend

- **Me page** (`view/me/index.tsx`) — a history section showing the employee's own timeline.
- **Employee detail** — the same component with the HR projection, for ADMIN.

Both render from one endpoint; the component takes the event list and groups by employment period.
The projection is decided server-side by privilege, not by a prop — the client never receives
attribution it is not permitted to show.

#### Approved layout

A reviewed mockup exists and was approved. Build to it:
`docs/specs/assets/2026-08-11-employee-history-mockup.html`

Structure, outermost to innermost:

- **Employment periods** as sections, most recent first. Each header carries employment type,
  employee ID, and the date span. A rehired period shows an explicit "Continuous service — linked
  to …" line beneath its header, derived from `continuous_service_record`.
- **A vertical spine** within each period, with one dated event per row hanging off it.
- **Each event row** is a three-column grid: marker, date, content. Content is a small uppercase
  field label above the change itself.
- **Changes render as `old → new`**, with the old value struck through and the new value in medium
  weight. Scanning the right-hand column gives the current state; the struck values give the path.
- **Single-value events** (Joined, Promotion) render one value rather than a transition.

Visual language:

- **Palette is the app's own** (`webapp/src/theme.ts`) — neutral slate, no invented brand hue.
- **The accent (`#f14e23`, WSO2 orange) marks promotions only.** It is not decoration; it is the
  one thing on the timeline sourced from a different system.
- **Semantic colours are separate from the accent** and carry status meaning only: green for an
  active/normal state, amber for *Marked leaver*, red for *Left*.
- **Dates use tabular numerals** so the date column aligns down the page.
- Both light and dark themes are defined at token level.

Two details settled during review:

- **Same-day changes stay as separate rows.** An org move that touches team and sub-team on one
  date reads as two rows sharing a date. Grouping was considered and rejected: the fields change
  independently in the data, and collapsing them would imply an atomicity the audit trail does not
  record.
- **System/migration events are collapsed and counted**, not listed individually — "5 runs
  collapsed" on one row in the HR view, absent entirely in the employee view.

## Accepted trade-offs

- **Leaver events are visible to employees before they may have been told.** HR sets *Marked
  leaver* with a future final day — the scheduler depends on this — so a record can carry that
  status for weeks before the conversation. An employee opening their history in that window sees
  it, including HR's resignation-reason categorisation. This was raised and confirmed as intended.
- **Renamed master data displays under its current name** in historical events (see §3).
- **A promotion approved in a `CLOSED` but not yet `END`ed cycle is hidden** until an admin formally
  ends the cycle, which may lag.

## Out of scope

- No new tables, no migration, no backfill.
- No versioning of master-data names.
- No eligibility logic — job-band thresholds and service-year calculations belong to the promotion
  app.
- No microapp change.
- No write path: history is read-only.

## Files affected

| File | Change |
|---|---|
| `backend/Config.toml.local` | *(modify)* Empty `[people.promotion_db]` placeholder block |
| `backend/modules/database/*` | *(modify)* Audit queries, person resolution, diff engine |
| `backend/modules/promotion/` | *(create)* Second SQL client and the promotion query |
| `backend/types.bal` | *(modify)* History event and response types |
| `backend/service.bal` | *(modify)* `GET /employees/{employeeId}/history` with privilege filtering |
| `webapp/src/slices/employeeSlice/*` | *(modify)* History fetch thunk and state |
| `webapp/src/view/me/index.tsx` | *(modify)* History section |
| `webapp/src/view/employees/...` | *(modify)* History view for ADMIN |
