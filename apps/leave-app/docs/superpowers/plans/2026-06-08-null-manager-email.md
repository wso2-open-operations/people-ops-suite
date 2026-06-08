# Null Manager Email — Graceful Degradation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow employees without a manager in HRIS to load and use the leave app for regular leaves, while showing a warning banner in the UI and keeping sabbatical leave blocked with a correct 400 error code.

**Architecture:** Six targeted edits across three files in the Ballerina backend and two files in the React frontend. No new abstractions. Each task is independently buildable and verifiable.

**Tech Stack:** Ballerina (backend), React + MUI + Redux Toolkit (frontend), TypeScript

**Baseline (verify before starting):**
- Backend: `cd apps/leave-app/backend && bal build` — should produce only hints, no errors
- Frontend: `cd apps/leave-app/webapp && npx tsc --noEmit` — should produce exactly these 5 pre-existing errors and no others:
  - `src/slices/userSlice/user.ts(61,45)` — unused `action`
  - `src/utils/apiService.ts(43,30)` — unused `err`
  - `src/view/LeadReport/Report.tsx(26,28)` — missing module `AdminReportTab`
  - `src/view/LeaveHistory/component/LeaveCard.tsx(43,3)` — unused `cancelling`
  - `src/view/SabbaticalLeave/component/ApproveLeaveTable.tsx(35,3)` — unused `State`

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `backend/utils.bal` | Modify lines 137, 444 | Fix two unsafe `<string>` casts that panic when `leadEmail` is null |
| `backend/service.bal` | Modify lines 47–51 | Remove hard 500 block in `GET /user-info` |
| `backend/service.bal` | Modify lines 144–175 | Branch on null `leadEmail` in `GET /app-configs` |
| `backend/service.bal` | Modify lines 480–488 | Sabbatical apply: 500 → 400 |
| `backend/service.bal` | Modify lines 1045–1054 | Sabbatical approve/reject: 500 → 400 |
| `webapp/src/slices/authSlice/auth.ts` | Modify line 70 | Change `leadEmail: string` → `string \| null` |
| `webapp/src/layout/Layout.tsx` | Modify | Add warning banner below header when `leadEmail` is null |

---

## Task 1: Fix unsafe leadEmail casts in utils.bal

**Files:**
- Modify: `backend/utils.bal:137` and `backend/utils.bal:444`

Both `getAllEmailRecipientsForUser` and `getPrivateRecipientsForUser` do `recipientMap[<string>employee.leadEmail] = true` — this panics at runtime when `leadEmail` is null because the cast is not nil-safe in Ballerina.

- [ ] **Step 1: Edit `getAllEmailRecipientsForUser` (utils.bal:137)**

Replace:
```ballerina
    readonly & Employee employee = check employee:getEmployee(email);
    recipientMap[<string>employee.leadEmail] = true;
    recipientMap[emailGroupToNotify] = true;
```
With:
```ballerina
    readonly & Employee employee = check employee:getEmployee(email);
    if employee.leadEmail is string {
        recipientMap[employee.leadEmail] = true;
    }
    recipientMap[emailGroupToNotify] = true;
```

- [ ] **Step 2: Edit `getPrivateRecipientsForUser` (utils.bal:444)**

Replace:
```ballerina
    readonly & Employee employee = check employee:getEmployee(email);
    recipientMap[<string>employee.leadEmail] = true;
    foreach string recipient in userAddedRecipients {
```
With:
```ballerina
    readonly & Employee employee = check employee:getEmployee(email);
    if employee.leadEmail is string {
        recipientMap[employee.leadEmail] = true;
    }
    foreach string recipient in userAddedRecipients {
```

- [ ] **Step 3: Verify backend builds**

```bash
cd apps/leave-app/backend && bal build
```
Expected: Only the two pre-existing hints, no errors, `target/bin/leave_service.jar` generated.

- [ ] **Step 4: Commit**

```bash
git add apps/leave-app/backend/utils.bal
git commit -m "fix: null-safe leadEmail cast in recipient builder utils"
```

---

## Task 2: Remove null guard in GET /user-info

**Files:**
- Modify: `backend/service.bal:47–51`

Currently returns 500 if `leadEmail` is null, blocking app load. `UserInfo.leadEmail` is already typed as `string?` so the response contract already allows null — just remove the guard.

- [ ] **Step 1: Delete the null guard block (service.bal:47–51)**

Remove these four lines entirely:
```ballerina
            if empInfo.leadEmail is () {
                string errMsg = "Employee lead email not available";
                log:printError(errMsg);
                return <http:InternalServerError>{body: {message: errMsg}};
            }
```

After the deletion, line 47 should read `// Fetch the user's privileges based on the roles.` (or equivalent — the privilege check block that follows).

- [ ] **Step 2: Verify backend builds**

```bash
cd apps/leave-app/backend && bal build
```
Expected: Only the two pre-existing hints, no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/leave-app/backend/service.bal
git commit -m "fix: allow null leadEmail in GET /user-info response"
```

---

## Task 3: Branch on null leadEmail in GET /app-configs

**Files:**
- Modify: `backend/service.bal:144–175`

Currently returns 500 if `leadEmail` is null. New behaviour: skip the lead fetch and return `mandatoryMails` with only the email group. When `leadEmail` is present, existing behaviour is preserved.

- [ ] **Step 1: Replace the app-configs email block (service.bal:144–175)**

Replace the entire block from `// Add optional mails for the form` through the closing `};` of `cachedEmails`:

**Old code (lines 144–175):**
```ballerina
        // Add optional mails for the form
        if empInfo.leadEmail is () {
            return <http:InternalServerError>{body: {message: "Employee lead email not available"}};
        }
        employee:Employee & readonly|error empLead = employee:getEmployee(empInfo.leadEmail);
        if empLead is error {
            string errorMsg = "Error occurred while fetching employee lead info";
            log:printError(errorMsg, empLead);
            return <http:InternalServerError>{
                body: {
                    message: errorMsg
                }
            };
        }
        employee:DefaultMail[]|error optionalMailsToNotify = getOptionalMailsToNotify(userInfo.email);
        if optionalMailsToNotify is error {
            string errorMsg = "Error occurred while fetching optional mails to notify";
            log:printError(errorMsg, optionalMailsToNotify);
        }
        employee:DefaultMailResponse cachedEmails = {
            mandatoryMails: [
                {
                    email: empLead.workEmail,
                    thumbnail: empLead.employeeThumbnail ?: ""
                },
                {
                    email: emailGroupToNotify,
                    thumbnail: ""
                }
            ],
            optionalMails: optionalMailsToNotify is employee:DefaultMail[] ? optionalMailsToNotify : []
        };
```

**New code:**
```ballerina
        // Add optional mails for the form
        employee:DefaultMail[]|error optionalMailsToNotify = getOptionalMailsToNotify(userInfo.email);
        if optionalMailsToNotify is error {
            string errorMsg = "Error occurred while fetching optional mails to notify";
            log:printError(errorMsg, optionalMailsToNotify);
        }
        employee:DefaultMail[] mandatoryMails = [{email: emailGroupToNotify, thumbnail: ""}];
        if empInfo.leadEmail is string {
            employee:Employee & readonly|error empLead = employee:getEmployee(empInfo.leadEmail);
            if empLead is error {
                string errorMsg = "Error occurred while fetching employee lead info";
                log:printError(errorMsg, empLead);
                return <http:InternalServerError>{
                    body: {
                        message: errorMsg
                    }
                };
            }
            mandatoryMails = [
                {email: empLead.workEmail, thumbnail: empLead.employeeThumbnail ?: ""},
                {email: emailGroupToNotify, thumbnail: ""}
            ];
        }
        employee:DefaultMailResponse cachedEmails = {
            mandatoryMails,
            optionalMails: optionalMailsToNotify is employee:DefaultMail[] ? optionalMailsToNotify : []
        };
```

- [ ] **Step 2: Verify backend builds**

```bash
cd apps/leave-app/backend && bal build
```
Expected: Only the two pre-existing hints, no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/leave-app/backend/service.bal
git commit -m "fix: gracefully handle null leadEmail in GET /app-configs"
```

---

## Task 4: Change sabbatical 500 errors to 400

**Files:**
- Modify: `backend/service.bal:480–488` and `backend/service.bal:1045–1054`

A missing manager is a data precondition failure, not a server fault. Change the response type accordingly.

- [ ] **Step 1: Fix sabbatical apply (service.bal:480–488)**

Replace:
```ballerina
                string? leadMail = employeeDetails.leadEmail;
                if leadMail is () {
                    string errMsg = "Employee lead email not found.";
                    return <http:InternalServerError>{
                        body: {
                            message: errMsg
                        }
                    };
                }
```
With:
```ballerina
                string? leadMail = employeeDetails.leadEmail;
                if leadMail is () {
                    return <http:BadRequest>{
                        body: {
                            message: "A reporting manager is required to apply for sabbatical leave."
                        }
                    };
                }
```

- [ ] **Step 2: Fix sabbatical approve/reject (service.bal:1045–1054)**

Replace:
```ballerina
        string? applicantLeadEmail = applicantInfo.leadEmail;
        if applicantLeadEmail is () {
            string errMsg = "Sabbatical leave applicant's manager email is not available.";
            log:printError(errMsg);
            return <http:InternalServerError>{
                body: {
                    message: errMsg
                }
            };
        }
```
With:
```ballerina
        string? applicantLeadEmail = applicantInfo.leadEmail;
        if applicantLeadEmail is () {
            string errMsg = "Sabbatical leave applicant's reporting manager is not available.";
            log:printError(errMsg);
            return <http:BadRequest>{
                body: {
                    message: errMsg
                }
            };
        }
```

- [ ] **Step 3: Verify backend builds**

```bash
cd apps/leave-app/backend && bal build
```
Expected: Only the two pre-existing hints, no errors.

- [ ] **Step 4: Commit**

```bash
git add apps/leave-app/backend/service.bal
git commit -m "fix: return 400 instead of 500 when sabbatical applicant has no manager"
```

---

## Task 5: Make leadEmail nullable in the frontend type

**Files:**
- Modify: `webapp/src/slices/authSlice/auth.ts:70`

`UserInfoInterface.leadEmail` is `string` but the backend now returns `string | null`. TypeScript needs to know this so downstream code can safely handle null.

- [ ] **Step 1: Update the type (auth.ts:70)**

Replace:
```typescript
  leadEmail: string;
```
With:
```typescript
  leadEmail: string | null;
```

- [ ] **Step 2: Check for type errors introduced by this change**

```bash
cd apps/leave-app/webapp && npx tsc --noEmit 2>&1
```
Expected: The same 5 pre-existing errors. No new errors about `leadEmail`. If you see new errors about `leadEmail` being possibly null somewhere, the fix is to add a null guard (`if (userInfo.leadEmail)`) at that call site.

- [ ] **Step 3: Commit**

```bash
git add apps/leave-app/webapp/src/slices/authSlice/auth.ts
git commit -m "fix: type leadEmail as string | null in UserInfoInterface"
```

---

## Task 6: Add warning banner in Layout.tsx

**Files:**
- Modify: `webapp/src/layout/Layout.tsx`

When `userInfo.leadEmail` is null (after user info has loaded), show a non-dismissable warning banner fixed below the app header. Adjust the layout offsets so sidebar and content don't overlap the banner.

The header is `64px` tall. The MUI `Alert` with `py: 0.5` is approximately `40px` tall. Define a `bannerHeight` constant and derive all offsets from it.

- [ ] **Step 1: Add imports (Layout.tsx:17–30)**

Add `Alert` to the MUI import and `selectUser` from the user slice:

Replace:
```tsx
import { Box, useTheme } from "@mui/material";
```
With:
```tsx
import { Alert, Box, useTheme } from "@mui/material";
```

Add after the existing slice imports (after line 30):
```tsx
import { selectUser } from "@slices/userSlice/user";
```

- [ ] **Step 2: Add user selector and banner height calculation (Layout.tsx:32–40)**

Add these two lines immediately after the existing `const mainContentRef = useRef...` line:
```tsx
  const userInfo = useAppSelector(selectUser);
  const hasNoManager = userInfo !== null && userInfo.leadEmail == null;
  const topOffset = 64 + (hasNoManager ? 40 : 0);
```

- [ ] **Step 3: Add the banner inside the fixed header box (Layout.tsx:97–100)**

Replace:
```tsx
        {/* Header */}
        <Box sx={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 1300 }}>
          <Header sidebarOpen={open} />
        </Box>
```
With:
```tsx
        {/* Header */}
        <Box sx={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 1300 }}>
          <Header sidebarOpen={open} />
          {hasNoManager && (
            <Alert severity="warning" sx={{ borderRadius: 0, py: 0.5 }}>
              Your reporting manager is not set in the HR system. You can still submit
              leaves, but no manager will be notified. Please contact HR to update your
              profile.
            </Alert>
          )}
        </Box>
```

- [ ] **Step 4: Update layout offsets to account for the banner (Layout.tsx:102–131)**

Replace:
```tsx
        {/* Main content container */}
        <Box sx={{ display: "flex", flex: 1, position: "relative", marginTop: "64px" }}>
          {/* Sidebar */}
          <Box
            sx={{
              position: "fixed",
              top: "64px",
              left: 0,
              width: "fit-content",
              height: "calc(100vh - 64px)",
              zIndex: 1200,
              backgroundColor: theme.palette.surface.secondary.active,
            }}
          >
```
With:
```tsx
        {/* Main content container */}
        <Box sx={{ display: "flex", flex: 1, position: "relative", marginTop: `${topOffset}px` }}>
          {/* Sidebar */}
          <Box
            sx={{
              position: "fixed",
              top: `${topOffset}px`,
              left: 0,
              width: "fit-content",
              height: `calc(100vh - ${topOffset}px)`,
              zIndex: 1200,
              backgroundColor: theme.palette.surface.secondary.active,
            }}
          >
```

Also update the main content area's `minHeight` (a few lines further down):

Replace:
```tsx
              minHeight: "calc(100vh - 64px)",
```
With:
```tsx
              minHeight: `calc(100vh - ${topOffset}px)`,
```

- [ ] **Step 5: Verify TypeScript compilation**

```bash
cd apps/leave-app/webapp && npx tsc --noEmit 2>&1
```
Expected: Same 5 pre-existing errors only. No new errors.

- [ ] **Step 6: Commit**

```bash
git add apps/leave-app/webapp/src/layout/Layout.tsx
git commit -m "feat: show warning banner when employee has no reporting manager"
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Task |
|-----------------|------|
| `utils.bal:137` unsafe cast fixed | Task 1 |
| `utils.bal:444` unsafe cast fixed | Task 1 |
| `GET /user-info` no longer blocks on null leadEmail | Task 2 |
| `GET /app-configs` branches on null — returns mandatoryMails without manager | Task 3 |
| Sabbatical apply: 500 → 400 with clear message | Task 4 |
| Sabbatical approve/reject: 500 → 400 with clear message | Task 4 |
| `leadEmail: string \| null` in frontend type | Task 5 |
| Warning banner in Layout.tsx, non-dismissable, driven by null leadEmail | Task 6 |

All spec requirements covered. ✓
