# Null Manager Email — Graceful Degradation Design

**Date:** 2026-06-08  
**Status:** Approved

## Problem

Employees at the top of the org tree (e.g. C-suite) structurally have no manager in HRIS. Employees with stale/missing HRIS data also temporarily have no manager. The current backend treats `leadEmail = null` as a fatal condition:

- `GET /user-info` → 500, blocking app load entirely
- `GET /app-configs` → 500, blocking the leave form
- `utils.bal` → unsafe cast `<string>employee.leadEmail` that panics at runtime if null
- Sabbatical apply/approve → 500 (wrong status code for a data precondition)

## Goal

Employees without a manager can still load and use the app for regular leave submission. The UI surfaces a warning banner. Sabbatical leave (which requires a manager for the approval chain) remains blocked but with a correct 400 status.

---

## Section 1 — Backend: Null-safe endpoints

### `GET /user-info` (`service.bal:47-51`)

Remove the `is ()` guard entirely. `UserInfo.leadEmail` is already typed as `string?` — return it as `null` when absent. No other logic in this endpoint depends on `leadEmail`.

### `GET /app-configs` (`service.bal:144-184`)

Replace the hard block with a branch on `empInfo.leadEmail`:

- **`leadEmail is ()`** — skip the lead fetch; return `mandatoryMails` containing only `{ email: emailGroupToNotify, thumbnail: "" }`. No manager slot.
- **`leadEmail is string`** — existing path: fetch lead info, include manager as first entry in `mandatoryMails`.

---

## Section 2 — Backend: Null-safe recipient building

### `getAllEmailRecipientsForUser` (`utils.bal:137`)

Replace unsafe cast:
```ballerina
// before
recipientMap[<string>employee.leadEmail] = true;

// after
if employee.leadEmail is string {
    recipientMap[employee.leadEmail] = true;
}
```

### `getPrivateRecipientsForUser` (`utils.bal:444`)

Same fix. When `leadEmail` is null, the manager is silently omitted from the recipient list. User-added recipients (`userAddedRecipients`) already flow through both functions — a manager-less employee can manually add people to notify.

---

## Section 3 — Backend: Sabbatical leave null handling

Sabbatical leave requires a manager for the approval chain and notification chain. Blocking is correct. The fix is the HTTP status code only.

### `POST /leaves` — sabbatical apply (`service.bal:480-488`)

Change response: `http:InternalServerError` → `http:BadRequest`  
Message: `"A reporting manager is required to apply for sabbatical leave."`

### `POST /leaves/{id}/{action}` — sabbatical approve/reject (`service.bal:1045-1054`)

Change response: `http:InternalServerError` → `http:BadRequest`  
Message: `"Sabbatical leave applicant's reporting manager is not available."`

---

## Section 4 — Frontend: Warning banner

**Type change:** `UserInfoInterface.leadEmail` in `webapp/src/slices/authSlice/auth.ts:70` is currently typed as `string`. Change to `string | null` to match the backend contract.

**Trigger:** `userInfo?.leadEmail == null` from the Redux user slice (`selectUser`).

**Placement:** `webapp/src/layout/Layout.tsx` — rendered just below the fixed Header box, above the main content area. Displayed across all views until the condition clears.

**Non-dismissable.** Resolves automatically on next session when HRIS data is corrected.

**Content:**
> "Your reporting manager is not set in the HR system. You can still submit leaves, but no manager will be notified. Please contact HR to update your profile."

**Behavior:**
- Does not block navigation or regular leave submission.
- Sabbatical leave apply button remains visible. The 400 from the API surfaces as a form-level error at submission time (same pattern as other validation errors).

---

## Touch-point summary

| File | Line(s) | Change |
|------|---------|--------|
| `backend/service.bal` | 47–51 | Remove null guard in `GET /user-info` |
| `backend/service.bal` | 144–148 | Branch on null leadEmail in `GET /app-configs` |
| `backend/service.bal` | 163–175 | Conditionally include manager in `mandatoryMails` |
| `backend/utils.bal` | 137 | Null-guard `leadEmail` cast in `getAllEmailRecipientsForUser` |
| `backend/utils.bal` | 444 | Null-guard `leadEmail` cast in `getPrivateRecipientsForUser` |
| `backend/service.bal` | 480–488 | Sabbatical apply: 500 → 400 |
| `backend/service.bal` | 1045–1054 | Sabbatical approve/reject: 500 → 400 |
| `webapp/src/slices/authSlice/auth.ts` | 70 | `leadEmail: string` → `leadEmail: string \| null` |
| `webapp/src/layout/Layout.tsx` | — | Warning banner below Header, shown when `leadEmail == null` |
