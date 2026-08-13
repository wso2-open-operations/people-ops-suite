# Employee History Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give People Ops and employees a timeline of how an employee's record has changed, assembled by diffing the existing audit tables at read time and merged with promotion history from the HRIS database.

**Architecture:** A new `GET /employees/{employeeId}/history` endpoint. Identity resolves through `personal_info_id` so a rehired person yields one history across several employment rows. Audit snapshots are diffed in Ballerina — no new tables, no migration. Promotions come from a second MySQL client in a dedicated `promotion` module. The response is filtered by privilege server-side: employees get their own history without attribution, ADMIN gets anyone's with it.

**Tech Stack:** Ballerina 2201.12.7, MySQL, React 18 (CRA + react-app-rewired), TypeScript, MUI v5, Redux Toolkit.

**Spec:** `docs/specs/2026-08-11-employee-history-design.md`
**Approved mockup:** `docs/specs/assets/2026-08-11-employee-history-mockup.html`

## Global Constraints

- **Identity is `personal_info_id`, never `work_email`.** `work_email` is `NOT NULL` but not unique (`people_app_creation.sql:312`); only `personal_info.nic_or_passport` is unique (`:215`). A rehired employee owns several `employee` rows sharing one email. Building on email silently merges or splits people.
- **Read-only feature.** No new tables, no migration, no backfill, no writes to any audit table.
- **Promotion filter is two conditions, both required:** `promotion_request_status = 'APPROVED'` AND `promotion_cycle_status = 'END'`. `FL_APPROVED` is functional-lead approved — an intermediate state, not a promotion. A `CLOSED` cycle may still have decisions in flight.
- **Never surface `REJECTED`, `FL_REJECTED`, `WITHDRAW`, or `EXPIRED` promotion requests** in either projection.
- **Never write the HRIS password into the repo.** `Config.toml.local` is checked in and gets empty placeholders only. Real values go in `Config.toml`, which is gitignored.
- **Do not read `employee.last_promoted_date`.** The promotion app overrides it because the synced value is known wrong (`promotion-app functions.bal:100`). HRIS is the source of truth.
- Backend: keep resource functions in `service.bal`, business logic in modules. Every new `configurable` gets a placeholder in `Config.toml.local` in the same commit.
- Webapp: path aliases (`@slices/`, `@view/`, `@component/`), never relative `../../`. MUI `sx` + `useTheme()`. Nullable as `field: T | null`.
- Staging: the tree has unrelated modified files. Stage only what each task names, path-scoped. Never `git add -A` / `git add .` / `git commit -am`.
- `bal build` must succeed and `./node_modules/.bin/tsc --noEmit` must stay at zero errors. Use the local tsc binary, not `npx tsc` (npx masks the exit code here).

---

## File Structure

| File | Responsibility |
|---|---|
| `backend/modules/promotion/client.bal` | *(create)* HRIS MySQL client + `promotionDbConfig` |
| `backend/modules/promotion/types.bal` | *(create)* `PromotionRecord`, config type |
| `backend/modules/promotion/queries.bal` | *(create)* The APPROVED + END query |
| `backend/modules/promotion/functions.bal` | *(create)* Fetch + date normalisation |
| `backend/Config.toml.local` | *(modify)* Empty `[people.promotion.promotionDbConfig]` block |
| `backend/modules/database/db_queries.bal` | *(modify)* Person resolution + audit-fetch queries |
| `backend/modules/database/db_functions.bal` | *(modify)* Audit fetch, employment periods |
| `backend/modules/database/history.bal` | *(create)* The diff engine — snapshot pairs → events |
| `backend/modules/database/types.bal` | *(modify)* History event and period types |
| `backend/service.bal` | *(modify)* `GET /employees/[employeeId]/history` + privilege filter |
| `webapp/src/config/config.ts` | *(modify)* Endpoint URL |
| `webapp/src/slices/employeeSlice/employeeHistory.ts` | *(create)* Slice + fetch thunk |
| `webapp/src/component/employeeHistory/EmployeeHistory.tsx` | *(create)* Timeline component |
| `webapp/src/view/me/index.tsx` | *(modify)* Collapsed history section — the only view to change; `EmployeeDetail` already renders this component |

Tasks are ordered so each is independently reviewable and nothing renders before its data exists.

---

### Task 1: HRIS promotion module

**Files:**
- Create: `backend/modules/promotion/client.bal`, `types.bal`, `queries.bal`, `functions.bal`
- Modify: `backend/Config.toml.local`

**Interfaces:**
- Consumes: nothing in this repo.
- Produces: `promotion:getApprovedPromotions(string workEmail) returns PromotionRecord[]|error`, where `PromotionRecord` carries `promotedDate`, `currentJobBand`, `nextJobBand`, `jobRole`, `promotionType`, `cycleName`, `businessUnit`, `department`, `team`, `subTeam`.

- [ ] **Step 1: Create the config type and client**

`types.bal` — mirror the shape of `database:DatabaseConfig`:

```ballerina
# HRIS promotion database configuration.
public type PromotionDatabaseConfig record {|
    # Database user
    string user;
    # Database password
    string password;
    # Database name
    string database;
    # Database host
    string host;
    # Connection pool configuration
    sql:ConnectionPool connectionPool?;
|};
```

`client.bal` — follow `modules/database/client.bal` exactly:

```ballerina
import ballerinax/mysql;
import ballerinax/mysql.driver as _;

# HRIS promotion database client configuration.
configurable PromotionDatabaseConfig promotionDbConfig = ?;

function initPromotionDbClient() returns mysql:Client|error => new (...promotionDbConfig);

# HRIS promotion database client.
final mysql:Client promotionDbClient = check initPromotionDbClient();
```

- [ ] **Step 2: Add the config placeholder**

In `Config.toml.local`, after the `[people.database.dbConfig]` block, add **empty placeholders only**:

```toml
[people.promotion.promotionDbConfig]
    host = ""
    user = ""
    password = ""
    database = ""
    [people.promotion.promotionDbConfig.connectionPool]
    maxOpenConnections =
    maxConnectionLifeTime =
    minIdleConnections =
```

**Do not put real credentials here.** This file is checked in.

- [ ] **Step 3: Write the query**

`queries.bal`:

```ballerina
# Approved promotions for an employee, from cycles that have formally ended.
#
# + workEmail - Work email of the employee
# + return - Parameterized query returning approved promotions, newest first
isolated function getApprovedPromotionsQuery(string workEmail) returns sql:ParameterizedQuery =>
    `SELECT
        pr.promotion_request_promoted_date AS promotedDate,
        pr.promotion_request_current_job_band AS currentJobBand,
        pr.promotion_request_requested_job_band AS nextJobBand,
        pr.promotion_request_current_job_role AS jobRole,
        pr.promotion_request_type AS promotionType,
        pr.promotion_request_business_unit AS businessUnit,
        pr.promotion_request_department AS department,
        pr.promotion_request_team AS team,
        pr.promotion_request_sub_team AS subTeam,
        pc.promotion_cycle_name AS cycleName
    FROM hris_promotion_request pr
        JOIN hris_promotion_cycle pc ON pc.promotion_cycle_id = pr.promotion_cycle_id
    WHERE pr.promotion_request_employee_email = ${workEmail}
        AND pr.promotion_request_status = 'APPROVED'
        AND pc.promotion_cycle_status = 'END'
        AND pr.promotion_request_promoted_date IS NOT NULL
    ORDER BY pr.promotion_request_promoted_date DESC`;
```

Both status conditions are load-bearing — see Global Constraints.

- [ ] **Step 4: Fetch with date normalisation**

`functions.bal`:

```ballerina
# Fetch approved promotions for an employee from the HRIS database.
#
# + workEmail - Work email of the employee
# + return - Approved promotions newest first, or an error
public isolated function getApprovedPromotions(string workEmail) returns PromotionRecord[]|error {
    stream<PromotionRecord, error?> resultStream =
        promotionDbClient->query(getApprovedPromotionsQuery(workEmail));

    PromotionRecord[] promotions = check from PromotionRecord promotion in resultStream
        select promotion;

    // Promoted dates are inconsistently stored; some use slashes. The promotion app
    // normalises the same way (promotion-app functions.bal:132).
    return from PromotionRecord promotion in promotions
        select {
            ...promotion,
            promotedDate: re `/`.replaceAll(promotion.promotedDate, "-")
        };
}
```

- [ ] **Step 5: Build**

Run: `cd apps/people-app/backend && bal build`
Expected: BUILD SUCCESSFUL. The pre-existing `debezium` jar-conflict warning is unrelated and expected.

- [ ] **Step 6: Commit**

```bash
git add apps/people-app/backend/modules/promotion apps/people-app/backend/Config.toml.local
git commit -m "feat(people-app): add HRIS promotion database module"
```

---

### Task 2: Person resolution and audit fetch

**Files:**
- Modify: `backend/modules/database/db_queries.bal`, `db_functions.bal`, `types.bal`

**Interfaces:**
- Consumes: existing `employee`, `personal_info`, `employee_audit`, `personal_info_audit`, `employee_additional_managers_audit` tables.
- Produces:
  - `getEmploymentPeriods(string employeeId) returns EmploymentPeriod[]|error` — every employment row for the person behind that employee ID, newest first.
  - `getAuditSnapshots(int[] employeePkIds) returns AuditSnapshot[]|error` — raw audit rows ordered by `action_on` ascending.

- [ ] **Step 1: Add the types**

In `types.bal`:

```ballerina
# One employment period for a person.
public type EmploymentPeriod record {|
    # Employee table primary key
    int id;
    # Employee ID (e.g. "EP 10006")
    string? employeeId;
    # Employment type name
    string employmentType;
    # Start date
    string startDate;
    # Final day of employment, if the period has ended
    string? endDate;
    # Work email
    string workEmail;
    # Employee ID of the prior linked employment, if any
    string? continuousServiceRecord;
|};

# A raw audit row awaiting diffing.
public type AuditSnapshot record {|
    # Employee table primary key this snapshot belongs to
    int employeePkId;
    # Source table this snapshot came from
    string sourceTable;
    # INSERT or UPDATE
    string actionType;
    # Who performed the action
    string actionBy;
    # When the action occurred
    string actionOn;
    # The full row snapshot as JSON
    json data;
|};
```

- [ ] **Step 2: Resolve the person and their employment periods**

The query resolves employee ID → `personal_info_id` → every employment row for that person:

```ballerina
# All employment periods for the person behind an employee ID.
#
# + employeeId - Employee ID of any one of the person's employment records
# + return - Parameterized query returning every employment period, newest first
isolated function getEmploymentPeriodsQuery(string employeeId) returns sql:ParameterizedQuery =>
    `SELECT
        e.id AS id,
        e.employee_id AS employeeId,
        et.name AS employmentType,
        e.start_date AS startDate,
        r.final_day_of_employment AS endDate,
        e.work_email AS workEmail,
        csr.employee_id AS continuousServiceRecord
    FROM employee e
        JOIN employment_type et ON et.id = e.employment_type_id
        LEFT JOIN resignation r ON r.employee_id = e.id
        LEFT JOIN employee csr ON csr.id = e.continuous_service_record
    WHERE e.personal_info_id = (
        SELECT personal_info_id FROM employee WHERE employee_id = ${employeeId}
    )
    ORDER BY e.start_date DESC`;
```

The subquery is what makes a rehire one history. Do **not** rewrite this to match on `work_email`.

- [ ] **Step 3: Fetch audit snapshots**

One query per audit table, each filtered by the person's `employee_pk_id` set and ordered by `action_on` ascending, so consecutive rows can be diffed. Use `sql:queryConcat` with an IN clause built from the ID array, following the existing `buildInClause` pattern (`people-scheduler/modules/database/queries.bal:39`).

Note that helper takes `string[]`, while these IDs are `int[]` — either convert with `.toString()` or write an int variant in the `database` module. Do not interpolate the array directly into the query.

Tables to read: `employee_audit`, `personal_info_audit`, `employee_additional_managers_audit`. Tag each row with its `sourceTable` so the diff engine knows which field map to use.

- [ ] **Step 4: Add the DB functions**

In `db_functions.bal`, add `getEmploymentPeriods` and `getAuditSnapshots` following the existing function style — `databaseClient->query(...)`, collect the stream, `check` on error.

- [ ] **Step 5: Build**

Run: `cd apps/people-app/backend && bal build`
Expected: BUILD SUCCESSFUL.

- [ ] **Step 6: Commit**

```bash
git add apps/people-app/backend/modules/database/db_queries.bal apps/people-app/backend/modules/database/db_functions.bal apps/people-app/backend/modules/database/types.bal
git commit -m "feat(people-app): resolve employment periods and fetch audit snapshots"
```

---

### Task 3: The diff engine

**Files:**
- Create: `backend/modules/database/history.bal`
- Modify: `backend/modules/database/types.bal`

**Interfaces:**
- Consumes: `AuditSnapshot[]` (Task 2).
- Produces: `buildHistoryEvents(AuditSnapshot[] snapshots) returns HistoryEvent[]` — one event per changed field, newest first.

This is the heart of the feature. The audit tables store whole snapshots, not deltas, so events are derived by comparing consecutive snapshots for the same `employee_pk_id`.

- [ ] **Step 1: Add the event type**

```ballerina
# One field-level change derived from consecutive audit snapshots.
public type HistoryEvent record {|
    # Employee table primary key this event belongs to
    int employeePkId;
    # Canonical field key (e.g. "team_id")
    string 'field;
    # Value before the change, if any
    string? previousValue;
    # Value after the change
    string? currentValue;
    # When the change occurred
    string occurredOn;
    # Who made the change
    string actionBy;
    # True when actionBy is a system actor rather than a person
    boolean isSystem;
|};
```

- [ ] **Step 2: Define which fields are tracked**

```ballerina
# Employee fields surfaced in the history. Everything else in the audit
# snapshot is either noise or not meaningful to a reader.
final readonly & string[] TRACKED_EMPLOYEE_FIELDS = [
    "business_unit_id", "team_id", "sub_team_id", "unit_id",
    "designation_id", "employment_type_id", "company_id", "office_id",
    "manager_email", "employee_status", "work_location",
    "job_role", "secondary_job_title", "external_designation",
    "house_id", "epf", "probation_end_date", "agreement_end_date", "start_date"
];
```

Deliberately excluded as noise: `updated_on`, `updated_by`, `created_on`, `created_by`, `employee_thumbnail`, `id`.

This exclusion is not cosmetic. The `unit_id` investigation found 5000 audit rows containing roughly 150 real field changes — the remainder were migration re-writes touching only `updated_on` and `employee_thumbnail`. Without filtering, the timeline is unusable.

- [ ] **Step 3: Implement the diff**

```ballerina
# Derive field-level change events by comparing consecutive audit snapshots.
#
# Snapshots must arrive ordered by action_on ascending, grouped per employee_pk_id.
# An INSERT yields no change events — it is the baseline the first UPDATE is compared against.
#
# + snapshots - Audit snapshots ordered oldest first
# + return - One event per changed tracked field, newest first
public isolated function buildHistoryEvents(AuditSnapshot[] snapshots) returns HistoryEvent[] {
    HistoryEvent[] events = [];
    map<json> previousByEmployee = {};

    foreach AuditSnapshot snapshot in snapshots {
        string key = snapshot.employeePkId.toString();
        json? previous = previousByEmployee[key];

        if previous is json {
            foreach string 'field in TRACKED_EMPLOYEE_FIELDS {
                json previousValue = getField(previous, 'field);
                json currentValue = getField(snapshot.data, 'field);

                if previousValue != currentValue {
                    events.push({
                        employeePkId: snapshot.employeePkId,
                        'field: 'field,
                        previousValue: toDisplayValue(previousValue),
                        currentValue: toDisplayValue(currentValue),
                        occurredOn: snapshot.actionOn,
                        actionBy: snapshot.actionBy,
                        isSystem: isSystemActor(snapshot.actionBy)
                    });
                }
            }
        }

        previousByEmployee[key] = snapshot.data;
    }

    return events.reverse();
}
```

Helpers in the same file: `getField` (safe JSON member access returning `()` when absent), `toDisplayValue` (JSON scalar → `string?`), and `isSystemActor` (true for `MIGRATION` and `system-scheduler`).

- [ ] **Step 4: Build**

Run: `cd apps/people-app/backend && bal build`
Expected: BUILD SUCCESSFUL.

- [ ] **Step 5: Commit**

```bash
git add apps/people-app/backend/modules/database/history.bal apps/people-app/backend/modules/database/types.bal
git commit -m "feat(people-app): derive history events by diffing audit snapshots"
```

---

### Task 4: The endpoint

**Files:**
- Modify: `backend/service.bal`, `backend/types.bal`

**Interfaces:**
- Consumes: `getEmploymentPeriods`, `getAuditSnapshots`, `buildHistoryEvents` (Tasks 2-3); `promotion:getApprovedPromotions` (Task 1).
- Produces: `GET /employees/{employeeId}/history` returning periods, events, promotions, and a `promotionsUnavailable` flag.

- [ ] **Step 1: Add the resource function**

Follow the shape of the existing `get employees/[string employeeId]` at `service.bal:182`: extract `userInfo` from `ctx`, check privileges, call the module, map errors to the standard error responses.

**Authorization, and it must be exactly this:**

- ADMIN → any employee's history, full projection.
- Otherwise → the caller may only read their own. Resolve the caller's email to a `personal_info_id` and compare with the requested employee's. **Compare on `personal_info_id`, not on email or employee ID** — a rehired person has several employee IDs, and comparing IDs would wrongly deny access to their own earlier employment. Mismatch returns `403`.

- [ ] **Step 2: Assemble the response**

1. Resolve employment periods.
2. Fetch audit snapshots for every `employee_pk_id` in those periods.
3. Build history events.
4. Fetch promotions using the work email from the periods.
5. Assign each promotion to the period whose `startDate`–`endDate` range contains its `promotedDate`. A promotion outside every range attaches to the nearest earlier period.
6. Apply the projection filter (Step 3).

**Promotion failure must not fail the request.** Wrap the `promotion:getApprovedPromotions` call so an error logs and sets `promotionsUnavailable: true` while the rest of the response returns normally. A second-database outage must not break the Me page.

- [ ] **Step 3: Apply the projection filter**

Filter server-side, never client-side — the client must not receive data it is not permitted to show.

For a non-ADMIN caller:
- Strip `actionBy` from every event.
- Drop events where `isSystem` is true.

For ADMIN: return everything, with `isSystem` intact so the UI can label and collapse system rows.

Leaver events (status transitions, resignation reason) are returned in **both** projections — see the spec's accepted trade-offs.

- [ ] **Step 4: Build**

Run: `cd apps/people-app/backend && bal build`
Expected: BUILD SUCCESSFUL.

- [ ] **Step 5: Commit**

```bash
git add apps/people-app/backend/service.bal apps/people-app/backend/types.bal
git commit -m "feat(people-app): add employee history endpoint"
```

---

### Task 5: Webapp data layer

**Files:**
- Modify: `webapp/src/config/config.ts`
- Create: `webapp/src/slices/employeeSlice/employeeHistory.ts`

**Interfaces:**
- Consumes: the endpoint from Task 4.
- Produces: `fetchEmployeeHistory` thunk and `employeeHistory` slice state, consumed by Task 6.

- [ ] **Step 1: Add the endpoint URL**

In `config.ts`, add to `AppConfig.serviceUrls` following the existing entries. Never hard-code URLs in components or thunks.

- [ ] **Step 2: Create the slice**

Follow the existing slice pattern exactly — `createAsyncThunk`, the `State` enum (`idle | loading | success | failed`), `isCancel(error)` checked first, `enqueueSnackbarMessage` on error, `rejectWithValue`. Use `APIService.getInstance()`; never import raw axios.

Types mirror the API response: `HistoryEvent`, `EmploymentPeriod`, `PromotionRecord`, and the wrapper carrying `promotionsUnavailable`. Nullable fields as `T | null`.

- [ ] **Step 3: Type-check**

Run: `cd apps/people-app/webapp && ./node_modules/.bin/tsc --noEmit -p tsconfig.json`
Expected: exit 0, zero output.

- [ ] **Step 4: Commit**

```bash
git add apps/people-app/webapp/src/config/config.ts apps/people-app/webapp/src/slices/employeeSlice/employeeHistory.ts
git commit -m "feat(people-app): add employee history slice and endpoint config"
```

---

### Task 6: The timeline component

**Files:**
- Create: `webapp/src/component/employeeHistory/EmployeeHistory.tsx`
- Modify: `webapp/src/view/me/index.tsx`, and the employee detail view

**Interfaces:**
- Consumes: the slice from Task 5.
- Produces: a rendered timeline on the Me page and the employee detail view.

**Build to the approved mockup:** `docs/specs/assets/2026-08-11-employee-history-mockup.html`. Open it before starting — it is the reference for structure and visual language, not a suggestion.

- [ ] **Step 1: Build the component**

Structure, outermost to innermost:

- **Employment periods** as sections, newest first. Header carries employment type, employee ID, and date span. A period with a `continuousServiceRecord` shows the "Continuous service — linked to …" line beneath its header.
- **A vertical spine** per period, one dated event row hanging off it.
- **Event rows** as a three-column grid: marker, date, content. Content is an uppercase field label above the change.
- **Changes render `old → new`**, old struck through, new in medium weight. Single-value events (Joined, Promotion) render one value.
- **Promotions** carry the accent marker and a detail strip with cycle, type, and role.

Visual language, per the mockup:

- Palette from `theme.ts` via `useTheme()` — no invented colours.
- The accent marks promotions only.
- Semantic colours carry status meaning: normal, `Marked leaver`, `Left`.
- `fontVariantNumeric: "tabular-nums"` on dates so the column aligns.
- System/migration rows collapsed with a count, shown only when present (ADMIN only — the API omits them otherwise).

Field keys arrive as raw column names (`team_id`, `sub_team_id`). Map them to readable labels ("Team", "Sub-team") in the component.

- [ ] **Step 2: Render it in one place — `view/me/index.tsx`**

**There is only one page to modify.** `EmployeeDetail` (`view/employees/employeeDetail/employeeDetail.tsx`) is a 23-line wrapper that renders `<Me employeeId={...} readOnly />`. So the employee's own profile (`/`) and an admin viewing someone (`/employees/:employeeId`) are the *same* component with different props. Add the section once and it appears in both.

Placement, per the approved decision: a **collapsed `Paper` section at the bottom** of the page, below the existing detail grids, following the page's existing Paper-section rhythm. Header reads "History" with an expand control; collapsed by default so the default page length is unchanged — a long-tenured employee's timeline can run to dozens of events.

Fetch **lazily, on first expand**, not on mount. There is no reason to query the audit tables and a second database for a section the user has not opened.

Handle all four states inside the expanded section: loading, empty (no events recorded yet), success, failed.

When `promotionsUnavailable` is true, show an inline note that promotion history is temporarily unavailable — the rest of the timeline still renders.

**Which projection renders is decided by the API, not the component.** The component displays whatever it receives; attribution and system rows are present for ADMIN and absent otherwise. Do not branch on `readOnly` to decide what to show — that would put an authorization decision in the client.

- [ ] **Step 3: Type-check**

Run: `cd apps/people-app/webapp && ./node_modules/.bin/tsc --noEmit -p tsconfig.json`
Expected: exit 0, zero output.

- [ ] **Step 4: Manual verification**

Requires a running backend with HRIS connectivity. If unavailable, report that plainly — do not claim these were performed.

1. The Me page shows a collapsed **History** section at the bottom; expanding it loads the timeline, and nothing is fetched before the first expand.
2. A rehired employee shows multiple employment periods, linked by continuous service.
3. Changes render `old → new` with readable field labels, not raw column names.
4. Dates align in their column.
5. An employee's own view shows **no** attribution and **no** system/migration rows.
6. An ADMIN viewing the same employee sees attribution and collapsed system rows.
7. A promotion renders with the accent marker, correct job bands, and cycle name.
8. Stopping the HRIS database still renders the timeline, with the unavailable note.
9. An employee requesting another employee's history receives 403.
10. The same section appears on `/employees/:employeeId` for an admin, since `EmployeeDetail` renders the same component.

- [ ] **Step 5: Commit**

```bash
git add apps/people-app/webapp/src/component/employeeHistory apps/people-app/webapp/src/view/me/index.tsx
git commit -m "feat(people-app): render employee history timeline"
```

---

## Self-Review

**Spec coverage:**

| Spec requirement | Task |
|---|---|
| Identity via `personal_info_id` | Task 2 Step 2, Task 4 Step 1 |
| Read-time diffing, no migration | Task 3 |
| Noise filtering (`updated_on`, thumbnails) | Task 3 Step 2 |
| System actors labelled | Task 3 Step 3, Task 4 Step 3 |
| Employment periods + continuous service | Task 2 Step 2, Task 6 Step 1 |
| Promotions: APPROVED + cycle END | Task 1 Step 3 |
| Promotion date normalisation | Task 1 Step 4 |
| Promotions attributed to a period | Task 4 Step 2 |
| HRIS failure degrades gracefully | Task 4 Step 2, Task 6 Step 2 |
| Attribution hidden from employees | Task 4 Step 3 |
| Leaver events shown to employees | Task 4 Step 3 (explicit) |
| Approved UI built to the mockup | Task 6 |
| Credentials never committed | Global Constraints, Task 1 Step 2 |
| No new tables / migration / backfill | Global Constraints |

**Type consistency:** `HistoryEvent`, `EmploymentPeriod`, and `PromotionRecord` are declared once in Ballerina (Tasks 1-3) and mirrored in TypeScript (Task 5). Field names match across the boundary.

**Placeholder scan:** no TBDs. Task 2 Step 3 and Task 6 Step 1 describe patterns rather than quoting full code — both point at a concrete existing example to follow (`buildInClause`, the mockup file).

**Known risks:**
- **Task 3 is the correctness-critical task.** A wrong diff silently produces a plausible but false history. The INSERT-is-baseline rule matters: treating an INSERT as a change would show every field "changing" at hire.
- **Task 4's authorization check** must compare `personal_info_id`, not employee ID. Comparing IDs would deny a rehired person access to their own earlier employment.
- **Task 1 cannot be verified without HRIS connectivity.** `bal build` proves it compiles, nothing more.
- No automated tests exist in this backend; every task's verification is a build plus manual checks.
