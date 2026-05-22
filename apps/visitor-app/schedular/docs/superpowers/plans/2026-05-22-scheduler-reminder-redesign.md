# Scheduler Reminder Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename and reword all email-related code so the scheduler reads as a pure reminder system rather than a force-completion system, and remove the dead `completeVisit` function.

**Architecture:** Five targeted file edits — constants, templates, email functions, visitor module, and main entry point. No new files. No logic changes (trigger conditions were already updated in a prior session). Each task is independently compilable after it is applied together with any tasks it depends on.

**Tech Stack:** Ballerina 2201.12.7, `wso2/scheduler` package

---

## File Map

| File | What changes |
|------|-------------|
| `modules/email/constants.bal` | Rename constants; update subject strings |
| `modules/email/templates.bal` | Rename template variables; update alert banner text |
| `modules/email/email.bal` | Rename public functions; update internal references to templates and subjects |
| `modules/visitor/visitor.bal` | Remove dead `completeVisit` function |
| `main.bal` | Update two call sites to use renamed functions |

---

## Task 1: Update email subject constants

**Files:**
- Modify: `modules/email/constants.bal`

- [ ] **Step 1: Replace the file content**

Replace the entire file with:

```ballerina
// Copyright (c) 2026 WSO2 LLC. (https://www.wso2.com).
//
// WSO2 LLC. licenses this file to you under the Apache License,
// Version 2.0 (the "License"); you may not use this file except
// in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing,
// software distributed under the License is distributed on an
// "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
// KIND, either express or implied.  See the License for the
// specific language governing permissions and limitations
// under the License.

public const DEPARTURE_OVERDUE_SUBJECT = "Visitor Departure Overdue — Immediate Action Required";
public const LONG_RUNNING_VISIT_SUBJECT = "Visit Active for 7+ Days — Immediate Action Required";
```

- [ ] **Step 2: Commit**

```bash
git add modules/email/constants.bal
git commit -m "refactor: rename email subject constants to reflect reminder purpose"
```

---

## Task 2: Update email templates

**Files:**
- Modify: `modules/email/templates.bal`

- [ ] **Step 1: Rename `forceCompleteTemplate` and update its alert banner**

Find this block in `modules/email/templates.bal` (the first template declaration):

```ballerina
# Email template for visits where the scheduled departure time has passed
# without being marked as complete — alerts that action is required.
# Placeholders: VISIT_ID, VISITOR_NAME, COMPANY, VISIT_DATE,
# TIME_OF_ENTRY, TIME_OF_DEPARTURE, WHOM_THEY_MEET,
# PASS_NUMBER, PURPOSE_OF_VISIT, YEAR
public final string forceCompleteTemplate = string `
```

Replace with:

```ballerina
# Email template for visits where the scheduled departure time has passed
# without being marked as complete — reminder that action is required.
# Placeholders: VISIT_ID, VISITOR_NAME, COMPANY, VISIT_DATE,
# TIME_OF_ENTRY, TIME_OF_DEPARTURE, WHOM_THEY_MEET,
# PASS_NUMBER, PURPOSE_OF_VISIT, YEAR
public final string departureOverdueTemplate = string `
```

- [ ] **Step 2: Update the alert banner text inside `departureOverdueTemplate`**

Find:

```html
                              <strong>Action Required</strong> &mdash;
                              This visit's scheduled departure time has passed and it has not been marked as complete.
```

Replace with:

```html
                              <strong>Immediate Action Required</strong> &mdash;
                              The scheduled departure time for this visit has passed and it has not been marked as complete. Please complete this visit immediately.
```

- [ ] **Step 3: Rename `expiredVisitTemplate` and update its alert banner**

Find:

```ballerina
# Email template for visits that have been active for more than one week
# with no departure recorded — alerts that action is required.
# Placeholders: VISIT_ID, VISITOR_NAME, COMPANY, VISIT_DATE,
# TIME_OF_ENTRY, WHOM_THEY_MEET, PASS_NUMBER,
# PURPOSE_OF_VISIT, YEAR
public final string expiredVisitTemplate = string `
```

Replace with:

```ballerina
# Email template for visits that have been active for more than one week
# with no departure recorded — reminder that action is required.
# Placeholders: VISIT_ID, VISITOR_NAME, COMPANY, VISIT_DATE,
# TIME_OF_ENTRY, WHOM_THEY_MEET, PASS_NUMBER,
# PURPOSE_OF_VISIT, YEAR
public final string longRunningVisitTemplate = string `
```

- [ ] **Step 4: Update the alert banner text inside `longRunningVisitTemplate`**

Find:

```html
                              <strong>Action Required</strong> &mdash;
                              This visit has had no scheduled departure time and has been active for <strong>more than one week</strong>
                              without being marked as complete.
```

Replace with:

```html
                              <strong>Immediate Action Required</strong> &mdash;
                              This visit has been active for more than one week with no departure recorded. Please review and complete it immediately.
```

- [ ] **Step 5: Commit**

```bash
git add modules/email/templates.bal
git commit -m "refactor: rename email templates and update alert banners to reminder language"
```

---

## Task 3: Rename email functions and update internal references

**Files:**
- Modify: `modules/email/email.bal`

- [ ] **Step 1: Replace the file content**

Replace the entire file with:

```ballerina
// Copyright (c) 2026 WSO2 LLC. (https://www.wso2.com).
//
// WSO2 LLC. licenses this file to you under the Apache License,
// Version 2.0 (the "License"); you may not use this file except
// in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing,
// software distributed under the License is distributed on an
// "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
// KIND, either express or implied.  See the License for the
// specific language governing permissions and limitations
// under the License.
import ballerina/http;
import ballerina/log;
import ballerina/time;

public configurable string fromEmailAddress = ?;
public configurable string[] adminEmailList = ?;

# Sends a reminder email to the admin/reception group for a visit whose
# scheduled departure time has passed without being marked as complete.
#
# + visit - Details of the visit
# + return - An error if sending fails
public function sendDepartureOverdueReminderEmail(CompletedVisitInfo visit) returns error? {
    string template = check bindKeyValues(
            departureOverdueTemplate,
            {
                "VISIT_ID": visit.id.toString(),
                "VISITOR_NAME": visit.visitorName,
                "COMPANY": visit.companyName ?: "N/A",
                "VISIT_DATE": visit.visitDate,
                "TIME_OF_ENTRY": visit.timeOfEntry ?: "N/A",
                "TIME_OF_DEPARTURE": visit.timeOfDeparture ?: "N/A",
                "WHOM_THEY_MEET": visit.whomTheyMeet ?: "N/A",
                "PASS_NUMBER": visit.passNumber ?: "N/A",
                "PURPOSE_OF_VISIT": visit.purposeOfVisit ?: "N/A",
                "YEAR": time:utcToCivil(time:utcNow()).year.toString()
            });
    return sendEmail(DEPARTURE_OVERDUE_SUBJECT, template, visit.id);
}

# Sends a reminder email to the admin/reception group for a visit that has
# been active for more than one week with no departure recorded.
#
# + visit - Details of the visit
# + return - An error if sending fails
public function sendLongRunningVisitReminderEmail(CompletedVisitInfo visit) returns error? {
    string template = check bindKeyValues(
            longRunningVisitTemplate,
            {
                "VISIT_ID": visit.id.toString(),
                "VISITOR_NAME": visit.visitorName,
                "COMPANY": visit.companyName ?: "N/A",
                "VISIT_DATE": visit.visitDate,
                "TIME_OF_ENTRY": visit.timeOfEntry ?: "N/A",
                "WHOM_THEY_MEET": visit.whomTheyMeet ?: "N/A",
                "PASS_NUMBER": visit.passNumber ?: "N/A",
                "PURPOSE_OF_VISIT": visit.purposeOfVisit ?: "N/A",
                "YEAR": time:utcToCivil(time:utcNow()).year.toString()
            });
    return sendEmail(LONG_RUNNING_VISIT_SUBJECT, template, visit.id);
}

isolated function sendEmail(string subject, string template, int visitId) returns error? {
    http:Response response = check emailClient->/send\-email.post(<EmailPayload>{
        to: adminEmailList,
        'from: fromEmailAddress,
        subject: subject,
        template: template
    });

    if response.statusCode != http:STATUS_OK {
        string msg = string `Email service rejected email for visit ${visitId}, status: ${response.statusCode}`;
        log:printError(msg);
        return error(msg);
    }
}
```

- [ ] **Step 2: Verify it compiles**

```bash
bal build
```

Expected: build succeeds with no errors. If it fails, the most likely cause is that `main.bal` still references the old function names — Task 4 fixes that.

- [ ] **Step 3: Commit**

```bash
git add modules/email/email.bal
git commit -m "refactor: rename email functions to sendDepartureOverdueReminderEmail and sendLongRunningVisitReminderEmail"
```

---

## Task 4: Update call sites in main.bal

**Files:**
- Modify: `main.bal`

- [ ] **Step 1: Replace `sendForceCompleteEmail` call**

Find in `main.bal`:

```ballerina
                error? emailError = email:sendForceCompleteEmail({
```

Replace with:

```ballerina
                error? emailError = email:sendDepartureOverdueReminderEmail({
```

- [ ] **Step 2: Replace `sendExpiredVisitEmail` call**

Find in `main.bal`:

```ballerina
                error? emailError = email:sendExpiredVisitEmail({
```

Replace with:

```ballerina
                error? emailError = email:sendLongRunningVisitReminderEmail({
```

- [ ] **Step 3: Update log messages to match**

Find:

```ballerina
                if emailError is error {
                    log:printError("Failed to send force-complete email", emailError, id = visit.id);
                } else {
                    log:printInfo("Force-complete email sent successfully", id = visit.id);
                }
```

Replace with:

```ballerina
                if emailError is error {
                    log:printError("Failed to send departure-overdue reminder email", emailError, id = visit.id);
                } else {
                    log:printInfo("Departure-overdue reminder email sent successfully", id = visit.id);
                }
```

Find:

```ballerina
                if emailError is error {
                    log:printError("Failed to send expired-visit email", emailError, id = visit.id);
                } else {
                    log:printInfo("Expired-visit email sent successfully", id = visit.id);
                }
```

Replace with:

```ballerina
                if emailError is error {
                    log:printError("Failed to send long-running visit reminder email", emailError, id = visit.id);
                } else {
                    log:printInfo("Long-running visit reminder email sent successfully", id = visit.id);
                }
```

- [ ] **Step 4: Verify full build passes**

```bash
bal build
```

Expected: build succeeds with no errors or warnings about undefined symbols.

- [ ] **Step 5: Commit**

```bash
git add main.bal
git commit -m "refactor: update main.bal call sites to use renamed reminder email functions"
```

---

## Task 5: Remove dead completeVisit function

**Files:**
- Modify: `modules/visitor/visitor.bal`

- [ ] **Step 1: Remove the `completeVisit` function**

Delete everything from the comment above `completeVisit` through the closing `}`:

```ballerina
# Calls the backend COMPLETE action for the given visit ID.
#
# + visitId - ID of the visit to complete
# + return - An error if the request fails
public function completeVisit(int visitId) returns error? {
    map<string|string[]>|error headers = getJwtHeader();
    if headers is error {
        log:printError("Failed to get access token", headers);
        return headers;
    }

    http:Response response = check visitorClient->post(
        string `/visits/${visitId}/COMPLETE`, {}, headers
    );

    if response.statusCode != http:STATUS_OK {
        string|error body = response.getTextPayload();
        string bodyText = body is string ? body : "unable to read response body";
        string msg = string `Backend rejected COMPLETE for visit ${visitId} — status: ${response.statusCode}, body: ${bodyText}`;
        log:printError(msg);
        return error(msg);
    }
}
```

Also remove the `import ballerina/http;` line if `http` is no longer used anywhere else in `visitor.bal` after the deletion. Check: the remaining `fetchActiveVisits` function uses `visitorClient->get` which is an HTTP call — `http` is still needed for `http:STATUS_OK` equivalent checks there. However, looking at `fetchActiveVisits`, it does not check `http:STATUS_OK` directly (it uses `check` and the response type). Verify after deletion: if `http` is still referenced anywhere in the file, keep the import; otherwise remove it.

- [ ] **Step 2: Verify full build passes**

```bash
bal build
```

Expected: build succeeds. If `http` import is now unused, Ballerina will warn — remove the import if so.

- [ ] **Step 3: Commit**

```bash
git add modules/visitor/visitor.bal
git commit -m "refactor: remove dead completeVisit function from visitor module"
```
