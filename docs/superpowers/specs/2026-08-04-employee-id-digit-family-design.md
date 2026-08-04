# Employee ID Digit-Family Generation — Design

## Problem

`generateEmployeeId` (single onboarding, `backend/utils.bal`) and `generateBulkEmployeeId`
(bulk CSV onboarding, `backend/modules/database/db_functions.bal`) compute the next employee
ID by scanning the `employee` table for the current numeric maximum, scoped by the employee's
**current employment type**:

```sql
SELECT MAX(CAST(SUBSTRING(employee_id, <prefix_len+1>) AS UNSIGNED))
FROM employee e
JOIN employment_type et ON et.id = e.employment_type_id
WHERE employee_id LIKE '<prefix>%'
  AND UPPER(et.name) IN ('PERMANENT', 'PROBATION')   -- (or the relevant type group)
```

This is blind to any employee whose ID falls within the numeric range being scanned but whose
*current* type isn't in that `IN (...)` list — whether because they were bulk-migrated under a
different/legacy type tag (e.g. `FULL TIME`) or because their type was changed after creation via
the job-info edit endpoint. Their `employee_id` is real and already taken, but invisible to the
generator, so it can be handed out again.

This caused a live incident in staging: two legacy `FULL TIME`-tagged records occupy
`LK500163`–`LK500226`. Permanent's type-filtered max had climbed to `LK500219`, so the generator
computed `LK500220` as "next" — already taken by one of the `FULL TIME` records — causing every
subsequent Permanent/Probation onboarding attempt to fail with a duplicate-key error
(`Duplicate entry 'LK500220' for key 'employee.employee_id'`).

Confirmed via read-only queries against both the local dev DB and staging (see investigation in
session transcript, 2026-08-03/04): staging's actual `employee` table, and the local dev DB
independently, both already cluster every `LK`-prefixed ID into exactly two leading-digit
families (`1` and `5`) — nothing else. This isn't coincidence; it reflects an existing informal
convention that the generator itself never enforced.

## Goal

1. Fix the root cause: the sequence query must never be blind to any employee holding an ID in
   its scanned range, regardless of that employee's current type.
2. Formalize the digit convention as an explicit rule, enforced by the same mechanism that fixes
   (1) — not a separate check bolted on afterward:
   - `PERMANENT`, `PROBATION` → employee number's leading digit must be `1`
   - `INTERNSHIP` → leading digit must be `5`
   - `CONSULTANCY`, `ADVISORY_CONSULTANCY`, `PART_TIME_CONSULTANCY` → leading digit must be `0`
     (zero-padded, fixed width — a plain integer can't have a leading zero)

## Non-goals

- The separate check-then-act concurrency race (two simultaneous onboarding requests computing
  the same "next" number before either commits) is a different, pre-existing bug. It is not
  addressed by this design. Flagged as a follow-up (would need a real atomic sequence
  counter/table, a larger change).
- No change to `FIXED_TERM` (manually-provided employee ID, no generation) or to the
  inactive-type / unsupported-type rejection guards in `generateEmployeeId`.
- No retroactive correction of existing out-of-family data (e.g. the 3 `PERMANENT`-tagged
  employees in staging currently sitting at `LK500154`–`LK500219`, inside the `5` family). They
  become permanent legacy exceptions — never counted again, which is fine, since the fix only
  changes how *future* IDs get generated.

## Design

### Core mechanism

One shared helper replaces the duplicated MAX+1 logic in both call sites:

```
nextIdInFamily(prefix, digit, minWidth = 6, zeroPadded = false) -> string

    pattern = prefix + digit + "%"

    maxNum = SELECT MAX(CAST(SUBSTRING(employee_id, LENGTH(prefix)+1) AS UNSIGNED))
             FROM employee
             WHERE employee_id LIKE pattern
               AND employee_id NOT LIKE prefix + "_%-%"
             -- no JOIN employment_type, no type filter at all

    if maxNum is NULL:
        nextNum = digit * 10^(minWidth - 1)          # family's starting value, e.g. digit=1 -> 100000
    else:
        candidate = maxNum + 1
        if firstDigit(candidate) == digit:
            nextNum = candidate                       # normal case, still in-family
        else:
            # rollover: incrementing flipped the leading digit — jump to the next
            # order of magnitude that still starts with the required digit
            nextNum = digit * 10^(digitCount(candidate))

    return prefix + (zeroPadded ? zeroPad(nextNum, minWidth) : nextNum.toString())
```

Scoping by `employee_id LIKE '<prefix><digit>%'` instead of by current employment type means any
employee whose ID falls in that numeric family is counted, regardless of their type tag —
eliminating the blind spot entirely, not just patching today's specific instance of it
(`FULL TIME`).

### Rollover example (verified against real data)

The `1` family in the local dev DB already jumps from the ~199999 range straight to
`1000000`+ — skipping `200000`–`999999` entirely. This is exactly the rollover behavior this
design formalizes; it isn't a new/invented behavior, it's what already happened once in this
data.

### Digit assignment per employment type

| Type(s) | Prefix | Digit | Zero-padded? | Example |
|---|---|---|---|---|
| `PERMANENT`, `PROBATION` | company prefix (e.g. `LK`) | `1` | no | `LK1014231` |
| `INTERNSHIP` | company prefix | `5` | no | `LK501485` |
| `CONSULTANCY`, `ADVISORY_CONSULTANCY`, `PART_TIME_CONSULTANCY` | `CON` (fixed global prefix, unchanged) | `0` | yes, width 6 | `CON000155` |

### Call sites

- **`backend/utils.bal`, `generateEmployeeId`** — the `match ctx.employmentType` arms for
  `PERMANENT|PROBATION`, `INTERNSHIP`, and the consultancy group each resolve their own
  `(prefix, digit)` pair and call `nextIdInFamily`. `FIXED_TERM` and the unsupported-type /
  inactive-type guards are unchanged.
- **`backend/modules/database/db_functions.bal`, `generateBulkEmployeeId`** — same digit mapping,
  same helper. The existing in-batch `sequenceCache` (used to avoid re-querying the DB for every
  row in a CSV batch) stays keyed per digit-family rather than per exact type name, so
  interleaved Permanent/Probation rows in one batch still correctly share one counter (this also
  fixes a related bug found during review: the cache was previously keyed by
  `employmentType.toString()`, giving `PERMANENT` and `PROBATION` separate cache entries within
  one batch despite sharing a sequence).
- **`backend/modules/database/db_queries.bal`** — `getAndLockLastEmployeeNumericSuffixQuery`
  (type-filtered) is replaced by a new `getNextIdInFamilyQuery(prefix, digit)` (pattern-scoped,
  no join).

### Consultancy's zero-padding limitation

A plain integer can't have a leading zero — `012345` cast as a number is `12345`. So the `0`
family only works as a fixed-width, zero-padded string (`CON000001` .. `CON099999`, ~100,000
slots at width 6). Unlike the `1`/`5` families, there is no valid rollover once this space is
exhausted (there's no such thing as "the next order of magnitude that still starts with a literal
zero"). Given Consultancy has 5 total records today, this ceiling is far off, but it is a hard
ceiling — not a self-extending one. Out of scope to solve now; noted for awareness.

## Error handling

No new failure modes. Same `http:BadRequest` (inactive type, missing company prefix) /
`http:InternalServerError` (query failure) responses as today, from the same guard clauses
in `generateEmployeeId`, which are unchanged. This design removes a silent-corruption path — it
does not add new ways for a request to fail.

## Testing

Manual verification (already performed this session, prior to implementation) against:
- Local dev DB: confirmed the `1`/`5` leading-digit clustering exists organically in current
  data; computed and cross-checked next-ID values per family.
- Staging (read-only queries only): confirmed the same clustering, confirmed the exact mechanism
  of the live incident (`FULL TIME` legacy records inside Permanent's blind spot), and computed
  what the new logic would generate next for each type group — verified it does not collide with
  any existing ID in staging.

Post-implementation: re-run `bal build`; re-verify via direct API calls (as done throughout this
session for the rehire/Probation work) that onboarding Permanent, Probation, Internship, and
Consultancy employees each produce IDs in their correct family and don't collide with existing
data, in both the single-onboarding and bulk-CSV paths.
