# Employee ID Digit-Family Generation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the employee-ID generation bug that broke Permanent/Probation onboarding in staging (duplicate-key collision on `LK500220`), by scoping the "next number" query by the ID string's own leading digit instead of the employee's current employment type, and formalize that digit convention (Permanent/Probation → `1`, Internship → `5`, Consultancy family → `0`, zero-padded).

**Architecture:** Two pure, DB-free helper functions (`nextNumberInFamily`, `padZero`/`pow10`) compute the next number given a known current max; one query function (`getNextIdInFamilyQuery`) and one thin wrapper (`getFamilyMax`) fetch that max, scoped purely by `employee_id LIKE '<prefix><digit>%'` — no `JOIN employment_type` at all. A new public function `getNextIdInFamily` composes these for the single-onboarding path (`utils.bal`); the bulk-onboarding path (`generateBulkEmployeeId`) calls the same pure/query pieces directly so it can keep threading its in-batch cache across CSV rows. The old type-filtered query and function (`getAndLockLastEmployeeNumericSuffixQuery`, `getLastEmployeeNumericSuffix`) are deleted once both call sites migrate.

**Tech Stack:** Ballerina 2201.12.7, MySQL 8.0, `wso2_open_operations/people` package (backend module `people.database`).

## Global Constraints

- No project-wide test framework exists (`bal test` is not set up in this repo — confirmed via search, no `tests/` directory or `[test]`-annotated functions anywhere in `backend/`). Verification in this plan uses `bal build` (compile correctness) plus direct API calls against a running local backend and direct SQL queries against the local dev DB — this matches the verification approach already used and proven earlier in this project's history for the rehire/Probation onboarding work.
- Every new `configurable` value must be added to `Config.toml.local` in the same commit (per project convention) — **not applicable to this plan**, no new configurable values are introduced.
- Keep resource functions in `service.bal`; business logic in the appropriate module — **not applicable**, this plan touches no resource functions, only `utils.bal` and `backend/modules/database/*.bal`.
- Digit assignment (from the approved design spec, `docs/superpowers/specs/2026-08-04-employee-id-digit-family-design.md`): `PERMANENT`/`PROBATION` → digit `1`; `INTERNSHIP` → digit `5`; `CONSULTANCY`/`ADVISORY_CONSULTANCY`/`PART_TIME_CONSULTANCY` → digit `0`, zero-padded to width 6. `FIXED_TERM` and the inactive-type/unsupported-type rejection guards are unchanged.
- Out of scope (per spec's Non-goals): the separate check-then-act concurrency race, retroactive correction of existing out-of-family legacy data, and extending Consultancy's zero-padded capacity beyond its current hard ceiling.

---

### Task 1: Add the digit-family query and pure computation helpers

**Files:**
- Modify: `apps/people-app/backend/modules/database/db_queries.bal` (add new query function near the existing `getAndLockLastEmployeeNumericSuffixQuery` at line 1394, don't remove it yet)
- Modify: `apps/people-app/backend/modules/database/db_functions.bal` (add new functions near the existing `getLastEmployeeNumericSuffix` at line 576, don't remove it yet)

**Interfaces:**
- Produces: `getNextIdInFamilyQuery(string prefix, string digit) -> sql:ParameterizedQuery` (db_queries.bal)
- Produces: `getFamilyMax(string prefix, int digit) -> EmployeeIdSequence|error` (db_functions.bal, module-private)
- Produces: `nextNumberInFamily(int maxNum, int digit, int minWidth) -> int` (db_functions.bal, module-private, pure — no DB access)
- Produces: `padZero(int n, int width) -> string` (db_functions.bal, module-private, pure)
- Produces: `pow10(int exponent) -> int` (db_functions.bal, module-private, pure)
- Produces: `public isolated function getNextIdInFamily(string prefix, int digit, int minWidth = 6, boolean zeroPadded = false) -> string|error` (db_functions.bal — this is the one `utils.bal` will call in Task 2)
- Consumes: `EmployeeIdSequence` record type (already exists, `types.bal:118`, field `lastNumericId` of type `decimal`) — unchanged, reused as-is.

- [ ] **Step 1: Add the new query function to `db_queries.bal`**

Open `apps/people-app/backend/modules/database/db_queries.bal`. Find the existing `getAndLockLastEmployeeNumericSuffixQuery` function (starts at line 1394, ends at line 1424 with the closing `}`). Immediately **after** its closing `}` (before the blank line and the next function `# Add employee query.` at what is currently line 1426), insert:

```ballerina

# Fetch and lock the current numeric maximum within a digit-family sequence, scoped purely by the
# ID string pattern (prefix + leading digit) rather than by employment type. This means an
# employee tagged with any type — including inactive/legacy ones the caller never listed — can
# never be invisible to this count, which is what a type-filtered scan allowed to happen.
#
# + prefix - The ID prefix (company prefix or CONSULTANCY_ID_PREFIX)
# + digit - The required leading digit for this family, as a single character ("0", "1", or "5")
# + return - Query returning the current numeric maximum for this family (0 if none exist yet)
isolated function getNextIdInFamilyQuery(string prefix, string digit) returns sql:ParameterizedQuery =>
    `SELECT
        COALESCE(
            MAX(CAST(SUBSTRING(employee_id, ${prefix.length() + 1}) AS UNSIGNED)),
            0
        ) AS lastNumericId
    FROM employee
    WHERE
        employee_id LIKE ${prefix + digit + "%"}
        AND employee_id NOT LIKE ${prefix + "_%-%"}
    ORDER BY CAST(SUBSTRING(employee_id, ${prefix.length() + 1}) AS UNSIGNED) DESC
    LIMIT 1
    FOR UPDATE`;
```

- [ ] **Step 2: Add the pure computation helpers and query wrapper to `db_functions.bal`**

Open `apps/people-app/backend/modules/database/db_functions.bal`. Find the existing `getLastEmployeeNumericSuffix` function (lines 571-580, ending with its closing `}`). Immediately **after** its closing `}`, insert:

```ballerina

# Fetch the current numeric maximum for a digit-family sequence.
#
# + prefix - The ID prefix (company prefix or CONSULTANCY_ID_PREFIX)
# + digit - The required leading digit for this family (0, 1, or 5)
# + return - EmployeeIdSequence (lastNumericId is 0 if the family has no members yet) or error
isolated function getFamilyMax(string prefix, int digit) returns EmployeeIdSequence|error {
    return databaseClient->queryRow(getNextIdInFamilyQuery(prefix, digit.toString()));
}

# Compute 10 raised to the given exponent, for small non-negative exponents (ID-width arithmetic
# only — not a general-purpose power function).
#
# + exponent - Non-negative exponent
# + return - 10^exponent
isolated function pow10(int exponent) returns int {
    int result = 1;
    foreach int i in 0 ..< exponent {
        result *= 10;
    }
    return result;
}

# Zero-pad `n` to exactly `width` characters. If `n` already has `width` or more digits, it is
# returned unpadded (the caller is responsible for rejecting values that don't fit; see the
# zero-padded capacity check in `getNextIdInFamily` and `generateBulkEmployeeId`).
#
# + n - The number to pad
# + width - Target string width
# + return - `n` as a string, left-padded with zeros to `width` characters
isolated function padZero(int n, int width) returns string {
    string s = n.toString();
    int padCount = width - s.length();
    if padCount <= 0 {
        return s;
    }
    string zerosStr = "";
    foreach int i in 0 ..< padCount {
        zerosStr += "0";
    }
    return zerosStr + s;
}

# Pure computation: given the current max numeric value observed for a digit-family, compute the
# next number in that family. This is a plain increment, unless incrementing would flip the
# leading digit, in which case it rolls over to the next order of magnitude that still starts
# with the required digit (e.g. maxNum=199999, digit=1 -> next=1000000, not 200000). This mirrors
# a rollover that already happened once in this system's real data, rather than inventing new
# behavior.
#
# + maxNum - Current max numeric value in the family (0 if none exist yet)
# + digit - The required leading digit for this family (0, 1, or 5)
# + minWidth - Minimum digit width for a cold-start value (e.g. 6 means the family starts at
#   100000 for digit 1)
# + return - The next numeric value in this family
isolated function nextNumberInFamily(int maxNum, int digit, int minWidth) returns int {
    if maxNum == 0 {
        return digit * pow10(minWidth - 1);
    }
    int candidate = maxNum + 1;
    int candidateWidth = candidate.toString().length();
    int candidateLeadingDigit = candidate / pow10(candidateWidth - 1);
    if candidateLeadingDigit == digit {
        return candidate;
    }
    return digit * pow10(candidateWidth);
}

# Generate the next employee ID within a digit-family sequence (single-onboarding path).
#
# + prefix - The ID prefix (company prefix or CONSULTANCY_ID_PREFIX)
# + digit - The required leading digit for this family (0, 1, or 5)
# + minWidth - Minimum digit width (default 6)
# + zeroPadded - True for the digit-0 (Consultancy) family, which must be zero-padded to
#   `minWidth` since a plain integer can never have a leading zero. Once that padded space is
#   exhausted there is no valid next value, so this returns an error rather than overflowing.
# + return - The next employee ID string, or an error on DB failure or exhausted zero-padded capacity
public isolated function getNextIdInFamily(string prefix, int digit, int minWidth = 6, boolean zeroPadded = false)
        returns string|error {

    EmployeeIdSequence row = check getFamilyMax(prefix, digit);
    int maxNum = <int>row.lastNumericId;

    if zeroPadded {
        int candidate = maxNum + 1;
        string candidateStr = candidate.toString();
        if candidateStr.length() > minWidth {
            return error(string `Zero-padded ID family (digit '${digit}', prefix '${prefix}') is exhausted ` +
                string `at width ${minWidth}; cannot generate the next ID.`);
        }
        return prefix + padZero(candidate, minWidth);
    }

    int nextNum = nextNumberInFamily(maxNum, digit, minWidth);
    return prefix + nextNum.toString();
}
```

- [ ] **Step 3: Verify it compiles**

Run: `cd apps/people-app/backend && bal build`
Expected: `Generating executable` with no errors. This step only adds new, unused-by-callers code — it must not change any existing behavior yet.

- [ ] **Step 4: Commit**

```bash
git add apps/people-app/backend/modules/database/db_queries.bal apps/people-app/backend/modules/database/db_functions.bal
git commit -m "feat(employee-id): add digit-family sequence query and pure computation helpers

Additive only — no call sites migrated yet. Scopes the next-number query
by the ID string's own leading digit instead of employment_type, so an
employee tagged with any type (including inactive/legacy ones) can never
be invisible to the count."
```

---

### Task 2: Migrate single-onboarding (`generateEmployeeId`) to the new helper

**Files:**
- Modify: `apps/people-app/backend/utils.bal:61-110` (the `PERMANENT|INTERNSHIP|PROBATION` and `CONSULTANCY|ADVISORY_CONSULTANCY|PART_TIME_CONSULTANCY` match arms)

**Interfaces:**
- Consumes: `database:getNextIdInFamily(string prefix, int digit, int minWidth = 6, boolean zeroPadded = false) -> string|error` (from Task 1)
- Consumes: `database:CONSULTANCY_ID_PREFIX` (existing constant, `constants.bal:36`, value `"CON"`) — unchanged
- Produces: no new public interface; `generateEmployeeId`'s own signature (`(database:CreateEmployeePayload) returns string|http:BadRequest|http:InternalServerError`) is unchanged

- [ ] **Step 1: Replace the two match arms**

In `apps/people-app/backend/utils.bal`, replace this block (current lines 61-110):

```ballerina
    match ctx.employmentType {
        database:PERMANENT|database:INTERNSHIP|database:PROBATION => {
            if companyPrefix.length() == 0 {
                string customErr = string `The selected company (ID: ${payload.companyId}) has no employee ` +
                    "ID prefix configured. Set the company prefix before onboarding.";
                log:printWarn(customErr, companyId = payload.companyId, employmentType = ctx.employmentType);
                return <http:BadRequest>{
                    body: {
                        message: customErr
                    }
                };
            }
            // PERMANENT and PROBATION share one number line (an employee keeps the same ID across
            // probation -> permanent); INTERNSHIP runs a separate line.
            database:EmploymentTypeName[] sequenceTypes = ctx.employmentType == database:INTERNSHIP
                ? [database:INTERNSHIP]
                : [database:PERMANENT, database:PROBATION];
            database:EmployeeIdSequence|error row = database:getLastEmployeeNumericSuffix(
                    companyPrefix, sequenceTypes
            );
            if row is error {
                string customErr = "Error occurred while fetching last employee numeric suffix";
                log:printError(customErr, row, employmentType = ctx.employmentType, companyPrefix = companyPrefix);
                return <http:InternalServerError>{
                    body: {
                        message: customErr
                    }
                };
            }
            return string `${companyPrefix}${<int>row.lastNumericId + 1}`;
        }
        database:CONSULTANCY|database:ADVISORY_CONSULTANCY|database:PART_TIME_CONSULTANCY => {
            database:EmployeeIdSequence|error row = database:getLastEmployeeNumericSuffix(
                    database:CONSULTANCY_ID_PREFIX, [
                        database:CONSULTANCY,
                        database:ADVISORY_CONSULTANCY,
                        database:PART_TIME_CONSULTANCY
                    ]
            );
            if row is error {
                string customErr = "Error occurred while fetching last employee numeric suffix";
                log:printError(customErr, row, employmentType = ctx.employmentType);
                return <http:InternalServerError>{
                    body: {
                        message: customErr
                    }
                };
            }
            return string `${database:CONSULTANCY_ID_PREFIX}${<int>row.lastNumericId + 1}`;
        }
```

with:

```ballerina
    match ctx.employmentType {
        database:PERMANENT|database:INTERNSHIP|database:PROBATION => {
            if companyPrefix.length() == 0 {
                string customErr = string `The selected company (ID: ${payload.companyId}) has no employee ` +
                    "ID prefix configured. Set the company prefix before onboarding.";
                log:printWarn(customErr, companyId = payload.companyId, employmentType = ctx.employmentType);
                return <http:BadRequest>{
                    body: {
                        message: customErr
                    }
                };
            }
            // PERMANENT and PROBATION share the "1" digit family (an employee keeps the same ID
            // across probation -> permanent); INTERNSHIP uses "5". Scoping by this digit directly
            // on the ID string (not by employment_type) means an employee tagged with any other
            // or legacy type can never be invisible to this count.
            int digit = ctx.employmentType == database:INTERNSHIP ? 5 : 1;
            string|error nextId = database:getNextIdInFamily(companyPrefix, digit);
            if nextId is error {
                string customErr = "Error occurred while generating the next employee ID";
                log:printError(customErr, nextId, employmentType = ctx.employmentType, companyPrefix = companyPrefix);
                return <http:InternalServerError>{
                    body: {
                        message: customErr
                    }
                };
            }
            return nextId;
        }
        database:CONSULTANCY|database:ADVISORY_CONSULTANCY|database:PART_TIME_CONSULTANCY => {
            string|error nextId = database:getNextIdInFamily(database:CONSULTANCY_ID_PREFIX, 0, zeroPadded = true);
            if nextId is error {
                string customErr = "Error occurred while generating the next employee ID";
                log:printError(customErr, nextId, employmentType = ctx.employmentType);
                return <http:InternalServerError>{
                    body: {
                        message: customErr
                    }
                };
            }
            return nextId;
        }
```

Leave the `database:FIXED_TERM => { ... }` arm (lines 111-155) and the `_ => { ... }` fallback arm (lines 156-164) exactly as they are — untouched.

- [ ] **Step 2: Verify it compiles**

Run: `cd apps/people-app/backend && bal build`
Expected: `Generating executable` with no errors.

- [ ] **Step 3: Verify against local dev DB — Permanent/Probation**

Start the backend if not already running (`bal run` from `apps/people-app/backend`, or restart if already running so it picks up this build). Confirm the true current max first:

```bash
mysql -h localhost -P 3306 -u root -proot people_ops_suite -e "
SELECT MAX(CAST(SUBSTRING(employee_id,3) AS UNSIGNED)) AS current_max
FROM employee WHERE employee_id LIKE 'LK1%' AND employee_id NOT LIKE 'LK_%-%';"
```

Then submit a real onboarding request for a Permanent employee at company 6 (companyId=6, employmentTypeId=8 in this local DB — confirm these still hold with `SELECT id, name FROM company WHERE id=6; SELECT id, name FROM employment_type WHERE id=8;` if unsure) via the same curl pattern used throughout this project's onboarding work, e.g.:

```bash
curl -s -w '\nHTTP_STATUS:%{http_code}\n' 'http://localhost:9090/employees' \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer <valid JWT>" -H "x-jwt-assertion: <same JWT>" \
  --data-raw '{"firstName":"DigitFamily","lastName":"Test","workLocation":"Sri Lanka","workEmail":"digitfamilytest@wso2.com","startDate":"2026-08-05","managerEmail":"chanuka@wso2.com","additionalManagerEmails":[],"employmentTypeId":8,"designationId":890,"companyId":6,"officeId":7,"teamId":16,"subTeamId":34,"businessUnitId":13,"houseId":1,"personalInfo":{"nicOrPassport":"DIGITFAM-TEST-1","fullName":"DigitFamily Test","firstName":"DigitFamily","lastName":"Test","title":"Mr","dob":"1990-01-01","gender":"Male","nationality":"sl","emergencyContacts":[]}}'
```

Expected: `HTTP_STATUS:201`, and the returned `employeeId` equals `LK<current_max + 1>` from the query above, with a leading digit of `1`. Confirm it doesn't collide:

```bash
mysql -h localhost -P 3306 -u root -proot people_ops_suite -e "
SELECT employee_id FROM employee WHERE employee_id = '<the returned employeeId>';"
```

Expected: exactly one row (the one just created).

- [ ] **Step 4: Verify against local dev DB — Internship**

Repeat Step 3's pattern with an Internship `employmentTypeId` (query `SELECT id FROM employment_type WHERE name='INTERNSHIP';` if unsure of the ID) and confirm the returned `employeeId` starts with `5` and matches `current_max + 1` for the `LK5%` family:

```bash
mysql -h localhost -P 3306 -u root -proot people_ops_suite -e "
SELECT MAX(CAST(SUBSTRING(employee_id,3) AS UNSIGNED)) AS current_max
FROM employee WHERE employee_id LIKE 'LK5%' AND employee_id NOT LIKE 'LK_%-%';"
```

- [ ] **Step 5: Verify against local dev DB — Consultancy (zero-padded)**

```bash
mysql -h localhost -P 3306 -u root -proot people_ops_suite -e "
SELECT MAX(CAST(SUBSTRING(employee_id,4) AS UNSIGNED)) AS current_max
FROM employee WHERE employee_id LIKE 'CON0%';"
```

Submit an onboarding request with a Consultancy `employmentTypeId` (query `SELECT id FROM employment_type WHERE name='CONSULTANCY';` if unsure). Expected: returned `employeeId` is `CON` followed by `current_max + 1` zero-padded to 6 digits (e.g. `current_max=154` → `CON000155`).

- [ ] **Step 6: Commit**

```bash
git add apps/people-app/backend/utils.bal
git commit -m "fix(employee-id): scope single-onboarding ID generation by digit family, not type

Replaces the type-filtered MAX+1 query (blind to employees tagged with
any type outside its filter list — the cause of the LK500220 staging
collision) with the digit-family-scoped getNextIdInFamily."
```

---

### Task 3: Migrate bulk-onboarding (`generateBulkEmployeeId`) to the same helpers

**Files:**
- Modify: `apps/people-app/backend/modules/database/db_functions.bal:500-558` (the `generateBulkEmployeeId` function body)

**Interfaces:**
- Consumes: `getFamilyMax(string prefix, int digit) -> EmployeeIdSequence|error` and `nextNumberInFamily(int maxNum, int digit, int minWidth) -> int` and `padZero(int n, int width) -> string` (all from Task 1, module-private, same module as this function)
- Produces: no interface change; `generateBulkEmployeeId`'s own signature is unchanged

- [ ] **Step 1: Replace the match block inside `generateBulkEmployeeId`**

In `apps/people-app/backend/modules/database/db_functions.bal`, replace this block (current lines 514-557, the `match context.employmentType { ... }` inside `generateBulkEmployeeId`):

```ballerina
    match context.employmentType {
        PERMANENT|INTERNSHIP|PROBATION => {
            // Normalize the prefix once so a value like " SG " can't pass the guard, leak spaces
            // into the ID, or fork a separate sequence from "SG".
            string companyPrefix = context.companyPrefix.trim();
            if companyPrefix.length() == 0 {
                return error(string `Company (ID: ${payload.companyId}) has no employee ID prefix configured`);
            }
            // PERMANENT and PROBATION share one number line; INTERNSHIP runs a separate one.
            // Scope both the MAX query and the in-batch cache key to the matching group — using
            // employmentType.toString() directly here would give PERMANENT and PROBATION rows
            // separate cache entries and let interleaved batch rows collide on the same ID.
            EmploymentTypeName[] sequenceTypes = context.employmentType == INTERNSHIP
                ? [INTERNSHIP]
                : [PERMANENT, PROBATION];
            string sequenceGroup = context.employmentType == INTERNSHIP
                ? INTERNSHIP.toString()
                : "PERMANENT_PROBATION";
            string seqKey = companyPrefix + ":" + sequenceGroup;
            if !sequenceCache.hasKey(seqKey) {
                EmployeeIdSequence seq = check getLastEmployeeNumericSuffix(
                        companyPrefix, sequenceTypes);
                sequenceCache[seqKey] = <int>seq.lastNumericId;
            }
            int next = (sequenceCache[seqKey] ?: 0) + 1;
            sequenceCache[seqKey] = next;
            return string `${companyPrefix}${next}`;
        }
        CONSULTANCY|ADVISORY_CONSULTANCY|PART_TIME_CONSULTANCY => {
            string seqKey = CONSULTANCY_ID_PREFIX;
            if !sequenceCache.hasKey(seqKey) {
                EmployeeIdSequence seq = check getLastEmployeeNumericSuffix(
                        CONSULTANCY_ID_PREFIX,
                        [CONSULTANCY, ADVISORY_CONSULTANCY, PART_TIME_CONSULTANCY]);
                sequenceCache[seqKey] = <int>seq.lastNumericId;
            }
            int next = (sequenceCache[seqKey] ?: 0) + 1;
            sequenceCache[seqKey] = next;
            return string `${CONSULTANCY_ID_PREFIX}${next}`;
        }
        _ => {
            return error("Unsupported employment type: " + context.employmentType.toString());
        }
    }
```

with:

```ballerina
    match context.employmentType {
        PERMANENT|INTERNSHIP|PROBATION => {
            // Normalize the prefix once so a value like " SG " can't pass the guard, leak spaces
            // into the ID, or fork a separate sequence from "SG".
            string companyPrefix = context.companyPrefix.trim();
            if companyPrefix.length() == 0 {
                return error(string `Company (ID: ${payload.companyId}) has no employee ID prefix configured`);
            }
            // PERMANENT and PROBATION share the "1" digit family; INTERNSHIP uses "5". Scoping by
            // this digit directly on the ID string (not by employment_type) means an employee
            // tagged with any other or legacy type can never be invisible to this count, and the
            // in-batch cache key stays shared for interleaved Permanent/Probation batch rows.
            int digit = context.employmentType == INTERNSHIP ? 5 : 1;
            string seqKey = companyPrefix + ":" + digit.toString();
            if !sequenceCache.hasKey(seqKey) {
                EmployeeIdSequence seq = check getFamilyMax(companyPrefix, digit);
                sequenceCache[seqKey] = <int>seq.lastNumericId;
            }
            int next = nextNumberInFamily(sequenceCache[seqKey] ?: 0, digit, 6);
            sequenceCache[seqKey] = next;
            return companyPrefix + next.toString();
        }
        CONSULTANCY|ADVISORY_CONSULTANCY|PART_TIME_CONSULTANCY => {
            string seqKey = CONSULTANCY_ID_PREFIX + ":0";
            if !sequenceCache.hasKey(seqKey) {
                EmployeeIdSequence seq = check getFamilyMax(CONSULTANCY_ID_PREFIX, 0);
                sequenceCache[seqKey] = <int>seq.lastNumericId;
            }
            int next = (sequenceCache[seqKey] ?: 0) + 1;
            string nextStr = next.toString();
            if nextStr.length() > 6 {
                return error("Zero-padded ID family (digit '0', prefix '" + CONSULTANCY_ID_PREFIX +
                    "') is exhausted at width 6; cannot generate the next ID.");
            }
            sequenceCache[seqKey] = next;
            return CONSULTANCY_ID_PREFIX + padZero(next, 6);
        }
        _ => {
            return error("Unsupported employment type: " + context.employmentType.toString());
        }
    }
```

- [ ] **Step 2: Verify it compiles**

Run: `cd apps/people-app/backend && bal build`
Expected: `Generating executable` with no errors.

- [ ] **Step 3: Look up real reference data names for a bulk CSV test row**

The bulk endpoint (`POST /employees/bulk`) takes CSV rows with human-readable names (company, designation, team, etc.), not IDs. Look up valid names for company 6 first:

```bash
mysql -h localhost -P 3306 -u root -proot people_ops_suite -e "
SELECT c.name AS company, d.designation, t.name AS team, bu.name AS business_unit
FROM company c
JOIN team t ON t.business_unit_id IN (SELECT id FROM business_unit WHERE company_id = c.id OR TRUE)
JOIN business_unit bu ON bu.id = t.business_unit_id
JOIN designation d ON TRUE
WHERE c.id = 6
LIMIT 1;"
```

If that join doesn't resolve cleanly given the actual schema relationships, instead separately query `SELECT name FROM company WHERE id=6;`, `SELECT designation FROM designation LIMIT 1;`, `SELECT name FROM team WHERE business_unit_id IN (SELECT id FROM business_unit LIMIT 1) LIMIT 1;`, `SELECT name FROM business_unit LIMIT 1;` and assemble the names from those.

- [ ] **Step 4: Build and submit a 2-row CSV (one Permanent, one Probation) for the same company**

Using the real names found in Step 3, create a CSV with the headers from `backend/constants.bal` (`CSV_FIELD_*` constants) and two data rows — one `employmentType=PERMANENT`, one `employmentType=PROBATION` — same `company` value for both, distinct `workEmail`/`nicOrPassport` per row. Submit it:

```bash
curl -s -w '\nHTTP_STATUS:%{http_code}\n' 'http://localhost:9090/employees/bulk' \
  -H "Authorization: Bearer <valid JWT>" -H "x-jwt-assertion: <same JWT>" \
  -F "file=@/path/to/two_row_test.csv"
```

Expected: `HTTP_STATUS:200` (or the endpoint's documented success status), both rows created successfully, and the two returned/created `employee_id`s are **consecutive** numbers in the `1` family (e.g. `LK101852` and `LK101853`) — confirming the shared in-batch cache correctly threads Permanent and Probation rows through one counter, not two separate ones (this also re-confirms the earlier `sequenceGroup` bulk-cache-key fix from this session's code review still holds under the new digit-based keying).

- [ ] **Step 5: Commit**

```bash
git add apps/people-app/backend/modules/database/db_functions.bal
git commit -m "fix(employee-id): scope bulk-onboarding ID generation by digit family, not type

Same fix as the single-onboarding path, applied to generateBulkEmployeeId.
The in-batch sequence cache stays keyed per digit-family so interleaved
Permanent/Probation CSV rows still correctly share one counter."
```

---

### Task 4: Remove the now-dead type-filtered query and function

**Files:**
- Modify: `apps/people-app/backend/modules/database/db_queries.bal` (remove `getAndLockLastEmployeeNumericSuffixQuery`, lines 1394-1424)
- Modify: `apps/people-app/backend/modules/database/db_functions.bal` (remove `getLastEmployeeNumericSuffix`, lines 571-580)

**Interfaces:**
- Consumes: nothing (this task only deletes code)
- Produces: nothing — confirms via compile that nothing outside this task's scope still depends on the removed functions

- [ ] **Step 1: Confirm no remaining callers**

Run: `grep -rn "getLastEmployeeNumericSuffix\|getAndLockLastEmployeeNumericSuffixQuery" apps/people-app/backend/`
Expected: no matches (Tasks 2 and 3 already migrated the only two call sites).

- [ ] **Step 2: Delete `getAndLockLastEmployeeNumericSuffixQuery` from `db_queries.bal`**

Remove the entire function (its doc comment and body, lines 1394-1424):

```ballerina
isolated function getAndLockLastEmployeeNumericSuffixQuery(string prefix, EmploymentTypeName[] employmentTypes)
    returns sql:ParameterizedQuery {

    sql:ParameterizedQuery inClause = ``;
    foreach int i in 0 ..< employmentTypes.length() {
        if i == 0 {
            inClause = sql:queryConcat(inClause, `${employmentTypes[i]}`);
        } else {
            inClause = sql:queryConcat(inClause, `, `, `${employmentTypes[i]}`);
        }
    }

    return sql:queryConcat(
            `SELECT
            COALESCE(
                MAX(CAST(SUBSTRING(e.employee_id, ${prefix.length() + 1}) AS UNSIGNED)),
                0
            ) AS lastNumericId
        FROM employee e
        JOIN employment_type et ON et.id = e.employment_type_id
        WHERE
            e.employee_id LIKE ${prefix + "%"}
            AND e.employee_id NOT LIKE ${prefix + "_%-%"}
            AND UPPER(et.name) IN (`,
            inClause,
            `)
        ORDER BY CAST(SUBSTRING(e.employee_id, ${prefix.length() + 1}) AS UNSIGNED) DESC
        LIMIT 1
        FOR UPDATE`
    );
}
```

- [ ] **Step 3: Delete `getLastEmployeeNumericSuffix` from `db_functions.bal`**

Remove the entire function (its doc comment and body, lines 571-580):

```ballerina
# Fetch and lock the last numeric suffix for the given prefix and employment types.
#
# + prefix - The ID prefix to lock on (company prefix or consultancy prefix)
# + employmentTypes - Employment type names that share this sequence
# + return - EmployeeIdSequence or error
public isolated function getLastEmployeeNumericSuffix(string prefix, EmploymentTypeName[] employmentTypes)
        returns EmployeeIdSequence|error {

    return databaseClient->queryRow(getAndLockLastEmployeeNumericSuffixQuery(prefix, employmentTypes));
}
```

- [ ] **Step 4: Verify it compiles**

Run: `cd apps/people-app/backend && bal build`
Expected: `Generating executable` with no errors. If this fails with an "unused import" or similar warning-as-error for `sql:queryConcat` no longer being used in a context that needed it, check whether `sql:queryConcat` is still used elsewhere in `db_queries.bal` (it is — e.g. in `getAndLockLastEmployeeNumericSuffixQuery`'s neighbors and other filter-building functions) before assuming an import needs removing.

- [ ] **Step 5: Commit**

```bash
git add apps/people-app/backend/modules/database/db_queries.bal apps/people-app/backend/modules/database/db_functions.bal
git commit -m "refactor(employee-id): remove dead type-filtered sequence query and function

getAndLockLastEmployeeNumericSuffixQuery and getLastEmployeeNumericSuffix
are fully replaced by the digit-family-scoped equivalents from the two
prior commits; no remaining callers."
```

---

### Task 5: End-to-end regression check against the exact staging scenario

**Files:** none modified — verification only.

**Interfaces:** none.

- [ ] **Step 1: Reproduce the staging blind-spot scenario locally**

Insert a synthetic legacy row mimicking staging's `FULL TIME` landmine, positioned just past the local dev DB's current `1`-family max (so the old code's bug — if it were still present — would immediately manifest):

```bash
mysql -h localhost -P 3306 -u root -proot people_ops_suite -e "
SELECT MAX(CAST(SUBSTRING(employee_id,3) AS UNSIGNED)) AS current_1_family_max
FROM employee WHERE employee_id LIKE 'LK1%' AND employee_id NOT LIKE 'LK_%-%';"
```

Note the returned value (call it `N`). Confirm no employee already has `employee_id = 'LK<N+1>'`, then insert a synthetic row with that ID under an employment type NOT in `{PERMANENT, PROBATION}` (e.g. `INTERNSHIP`'s id, or any other existing type id — the point is it must be a type the Permanent/Probation family previously filtered out):

```bash
mysql -h localhost -P 3306 -u root -proot people_ops_suite -e "
INSERT INTO employee
(employee_id, first_name, last_name, work_location, work_email, start_date, manager_email,
 employee_status, employment_type_id, designation_id, company_id, team_id, business_unit_id,
 personal_info_id, created_by, updated_by)
VALUES
('LK<N+1>', 'Landmine', 'Test', 'Sri Lanka', 'landminetest@wso2.com', '2020-01-01',
 'chanuka@wso2.com', 'Left', (SELECT id FROM employment_type WHERE name='INTERNSHIP'),
 890, 6, 16, 13, 1, 'test-setup@wso2.com', 'test-setup@wso2.com');"
```

(Adjust `designation_id`/`team_id`/`business_unit_id`/`personal_info_id` values to any valid existing IDs in the local DB if `890`/`16`/`13`/`1` don't hold — check with `SELECT id FROM designation LIMIT 1;` etc. if needed.)

- [ ] **Step 2: Onboard a real Permanent employee and confirm no collision**

Submit an onboarding request exactly as in Task 2 Step 3 (Permanent, companyId=6), with a fresh unique `nicOrPassport`/`workEmail`. Expected: `HTTP_STATUS:201`, and the returned `employeeId` is **not** `LK<N+1>` (the synthetic landmine's ID) — it must have skipped past it correctly using the true `1`-family max, which now correctly includes the synthetic row regardless of its `INTERNSHIP` type tag, since the new query scopes by ID pattern, not type.

- [ ] **Step 3: Clean up the synthetic row**

```bash
mysql -h localhost -P 3306 -u root -proot people_ops_suite -e "
DELETE FROM employee WHERE employee_id = 'LK<N+1>' AND work_email = 'landminetest@wso2.com';"
```

- [ ] **Step 4: Verify the rollover boundary directly**

This exercises the "leading digit would flip" branch of `nextNumberInFamily` (Task 1), which none
of the earlier steps trigger under normal data. Insert a synthetic row that puts the `1`-family's
max exactly at the boundary before a rollover — `199999` — using a **temporary, otherwise-unused
prefix** so this doesn't interact with real company data:

```bash
mysql -h localhost -P 3306 -u root -proot people_ops_suite -e "
INSERT INTO employee
(employee_id, first_name, last_name, work_location, work_email, start_date, manager_email,
 employee_status, employment_type_id, designation_id, company_id, team_id, business_unit_id,
 personal_info_id, created_by, updated_by)
VALUES
('ZZ199999', 'Rollover', 'Boundary', 'Sri Lanka', 'rolloverboundary@wso2.com', '2020-01-01',
 'chanuka@wso2.com', 'Active', (SELECT id FROM employment_type WHERE name='PERMANENT'),
 890, 6, 16, 13, 1, 'test-setup@wso2.com', 'test-setup@wso2.com');"
```

(Adjust `designation_id`/`team_id`/`business_unit_id`/`personal_info_id` to any valid existing IDs
if `890`/`16`/`13`/`1` don't hold locally.) Then call `generateEmployeeId`'s underlying logic
directly for prefix `ZZ`, digit `1` — either by adding a temporary company row with prefix `ZZ`
and onboarding through the real API against it, or, more directly, by checking the computed value
against the query alone:

```bash
mysql -h localhost -P 3306 -u root -proot people_ops_suite -e "
SELECT COALESCE(MAX(CAST(SUBSTRING(employee_id, 3) AS UNSIGNED)), 0) AS lastNumericId
FROM employee
WHERE employee_id LIKE 'ZZ1%' AND employee_id NOT LIKE 'ZZ_%-%';"
```

Expected: `lastNumericId = 199999`. Per `nextNumberInFamily(199999, 1, 6)`: `candidate = 200000`,
`candidateWidth = 6`, `candidateLeadingDigit = 200000 / 100000 = 2`, which does not equal `digit=1`
— so the function must return `1 * pow10(6) = 1000000`, i.e. the next ID for prefix `ZZ` must be
`ZZ1000000`, **not** `ZZ200000`. If a temporary company with prefix `ZZ` was onboarded through
the real API, confirm the returned `employeeId` is exactly `ZZ1000000`.

Clean up:

```bash
mysql -h localhost -P 3306 -u root -proot people_ops_suite -e "
DELETE FROM employee WHERE employee_id IN ('ZZ199999', 'ZZ1000000');"
```

(Also remove the temporary `ZZ`-prefix company row if one was created for this step.)

- [ ] **Step 5: No commit needed for this task** (verification only, no code changes). If Step 2 or Step 4 reveals a bug, fix it in the relevant Task 1-3 file, re-run that task's build/verification steps, and commit the fix with a message describing what regression check caught it.
