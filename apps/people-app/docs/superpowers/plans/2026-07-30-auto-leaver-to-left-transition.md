# Auto-transition Marked Leaver → Left Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let HR record a future-dated departure (`Marked leaver` + `final_day_of_employment`) and have the backend automatically flip the employee to `Left` once that date arrives, with an email summary sent after each run.

**Architecture:** A new `ballerina/task` recurring job in the backend queries `employee`/`resignation` for expired leavers, updates their status in a transaction, and emails a summary via the existing `email` module. The webapp/backend validation is relaxed so HR can (and must) record the three resignation fields while status is `Marked leaver`, not just `Left`.

**Tech Stack:** Ballerina 2201.12.7 (`ballerina/task`, `ballerinax/mysql`), React + Formik/Yup (CRA webapp).

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-30-auto-leaver-to-left-transition-design.md`
- System actor value for automated DB writes: the literal string `"system-scheduler"`.
- Default sweep interval: `24` hours, via a new configurable `leaverSweepIntervalHours`.
- Email notification recipients: a new, separate configurable `leaverNotificationRecipients: string[]` (not the existing onboarding-alert `emailServiceConfig.to`).
- No email is sent when a sweep transitions zero employees.
- Every new `configurable` value must be added to `Config.toml.local` (placeholder) in the same commit — per `CLAUDE.md` backend coding standards.
- Neither `backend/` nor `webapp/` has an existing automated test suite. Verification per task is `bal build` / a manual check — do not introduce new test infrastructure.
- Webapp: use path aliases (`@view/`, `@utils/`, `@/types/`), never relative `../../` imports (already satisfied — no new imports needed in `JobInfo.tsx`).

---

### Task 1: Database layer — expired-leaver query + transition function

**Files:**
- Modify: `backend/modules/database/types.bal` (add `LeaverTransition` record, after the `WorkEmailRow` record at line 658)
- Modify: `backend/modules/database/db_queries.bal` (add two query functions, after `upsertResignationQuery` at line 1861)
- Modify: `backend/modules/database/db_functions.bal` (add `transitionExpiredLeavers`, after `syncResignationRecord` at line 796)

**Interfaces:**
- Produces: `public type LeaverTransition record {| string employeeId; string firstName; string lastName; string workEmail; string finalDayOfEmployment; |};` and `public isolated function transitionExpiredLeavers(string actor) returns LeaverTransition[]|error` — the scheduler (Task 3) calls this.
- Consumes: existing `EMPLOYEE_MARKED_LEAVER`/`EMPLOYEE_LEFT` (`enums.bal:38-40`), `databaseClient` (`client.bal`), `checkAffectedCount` (`utils.bal:149`), `buildSqlUpdateQuery` is NOT needed here (fixed-shape queries, not dynamic).

- [ ] **Step 1: Add the `LeaverTransition` record type**

In `backend/modules/database/types.bal`, immediately after the closing `|};` of `WorkEmailRow` (line 658), insert:

```ballerina

# Row mapping for an employee whose Marked-leaver period has ended and who should transition to Left.
public type LeaverTransition record {|
    # External employee ID
    @sql:Column {name: "employee_id"}
    string employeeId;
    # First name
    @sql:Column {name: "first_name"}
    string firstName;
    # Last name
    @sql:Column {name: "last_name"}
    string lastName;
    # Work email
    @sql:Column {name: "work_email"}
    string workEmail;
    # Final day of employment
    @sql:Column {name: "final_day_of_employment"}
    string finalDayOfEmployment;
|};
```

- [ ] **Step 2: Add the select + update queries**

In `backend/modules/database/db_queries.bal`, immediately after `upsertResignationQuery` (ends line 1861), insert:

```ballerina

# Fetch employees whose Marked-leaver final day of employment has arrived (today or earlier).
#
# + return - Query to select employees pending auto-transition to Left
isolated function getExpiredLeaversQuery() returns sql:ParameterizedQuery =>
    `SELECT
        e.employee_id,
        e.first_name,
        e.last_name,
        e.work_email,
        r.final_day_of_employment
    FROM employee e
    JOIN resignation r ON r.employee_id = e.id
    WHERE e.employee_status = ${EMPLOYEE_MARKED_LEAVER}
        AND r.final_day_of_employment IS NOT NULL
        AND r.final_day_of_employment <= CURDATE();`;

# Transition employees whose Marked-leaver final day of employment has arrived (today or earlier) to Left.
#
# + actor - System actor performing the update
# + return - Query to update matching employees' status to Left
isolated function transitionExpiredLeaversQuery(string actor) returns sql:ParameterizedQuery =>
    `UPDATE employee e
    JOIN resignation r ON r.employee_id = e.id
    SET e.employee_status = ${EMPLOYEE_LEFT}, e.updated_by = ${actor}
    WHERE e.employee_status = ${EMPLOYEE_MARKED_LEAVER}
        AND r.final_day_of_employment IS NOT NULL
        AND r.final_day_of_employment <= CURDATE();`;
```

- [ ] **Step 3: Add the `transitionExpiredLeavers` database function**

In `backend/modules/database/db_functions.bal`, immediately after `syncResignationRecord` (ends line 796), insert:

```ballerina

# Auto-transition employees whose Marked-leaver final day of employment has arrived (today or earlier) to Left.
#
# + actor - System actor performing the update (e.g. the scheduled sweep job)
# + return - The employees that were transitioned (empty if none were due), or an error
public isolated function transitionExpiredLeavers(string actor) returns LeaverTransition[]|error {
    stream<LeaverTransition, error?> expiredLeaversStream = databaseClient->query(getExpiredLeaversQuery());
    LeaverTransition[] transitions = check from LeaverTransition transition in expiredLeaversStream
        select transition;

    if transitions.length() == 0 {
        return transitions;
    }

    transaction {
        sql:ExecutionResult executionResult = check databaseClient->execute(transitionExpiredLeaversQuery(actor));
        check checkAffectedCount(executionResult.affectedRowCount);
        check commit;
    }

    return transitions;
}
```

Note: `checkAffectedCount` is safe here specifically because we only reach the `UPDATE` when `transitions.length() > 0` — i.e., we already know at least one row must match.

- [ ] **Step 4: Compile**

Run: `cd backend && bal build`
Expected: build succeeds with no errors (this code isn't called from anywhere yet, so it just needs to type-check).

- [ ] **Step 5: Commit**

```bash
git add backend/modules/database/types.bal backend/modules/database/db_queries.bal backend/modules/database/db_functions.bal
git commit -m "Add DB layer for auto-transitioning expired Marked-leaver employees to Left"
```

---

### Task 2: Email notification for the auto-transition summary

**Files:**
- Modify: `backend/modules/email/client.bal` (new configurable, after line 20)
- Modify: `backend/modules/email/types.bal` (new `LeaverTransitionNotice` record, at end of file)
- Modify: `backend/modules/email/templates.bal` (new template constant, at end of file)
- Modify: `backend/modules/email/utils.bal` (extend the no-escape exemption to the new list placeholder, line 44)
- Modify: `backend/modules/email/email.bal` (new `notifyLeaverAutoTransition` function, at end of file)

**Interfaces:**
- Produces: `public type LeaverTransitionNotice record {| string employeeId; string firstName; string lastName; string workEmail; string finalDayOfEmployment; |};` and `public isolated function notifyLeaverAutoTransition(LeaverTransitionNotice[] transitions) returns error?` — the scheduler (Task 3) calls this, mapping `database:LeaverTransition[]` to `email:LeaverTransitionNotice[]` itself (kept deliberately decoupled: neither module imports the other).
- Consumes: existing `bindKeyValues`/`htmlEscape` (`utils.bal`), `sendEmail`/`EmailPayload` (`email.bal`/`types.bal`), `emailServiceConfig`/`appName` (`client.bal`).

- [ ] **Step 1: Add the recipient configurable**

In `backend/modules/email/client.bal`, after line 20 (`public configurable string appName = ?;`), insert:

```ballerina
public configurable string[] leaverNotificationRecipients = ?;
```

- [ ] **Step 2: Add the `LeaverTransitionNotice` type**

At the end of `backend/modules/email/types.bal`, append:

```ballerina

# A single employee transitioned from Marked leaver to Left by the auto-transition sweep.
public type LeaverTransitionNotice record {|
    # External employee ID
    string employeeId;
    # First name
    string firstName;
    # Last name
    string lastName;
    # Work email
    string workEmail;
    # Final day of employment
    string finalDayOfEmployment;
|};
```

- [ ] **Step 3: Extend the template-binding no-escape exemption**

In `backend/modules/email/utils.bal`, line 44 currently reads:

```ballerina
        string valueToReplace = keyVal[0] == "FAILED_GROUPS" ? keyVal[1] : htmlEscape(keyVal[1]);
```

Replace with:

```ballerina
        string valueToReplace = (keyVal[0] == "FAILED_GROUPS" || keyVal[0] == "EMPLOYEE_LIST")
            ? keyVal[1] : htmlEscape(keyVal[1]);
```

(`EMPLOYEE_LIST` will hold pre-built, already-escaped `<li>` markup, same as `FAILED_GROUPS` does today.)

- [ ] **Step 4: Add the email template**

At the end of `backend/modules/email/templates.bal`, append:

```ballerina

# Email template for the Marked-leaver auto-transition summary notification.
# Placeholders: APP_NAME, RUN_DATE, COUNT, EMPLOYEE_LIST, YEAR
public final string leaverAutoTransitionSummaryTemplate = string `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <meta content="text/html; charset=utf-8" http-equiv="Content-Type" />
    <meta name="color-scheme" content="light dark" />
    <meta name="supported-color-schemes" content="light dark" />
    <title>WSO2 <!-- [APP_NAME] --></title>
    <style type="text/css">
      @import url("https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700;900&display=swap");
      body {
        margin: 0;
        padding: 0;
        background-color: #f4f4f4;
      }
      table {
        border-collapse: collapse;
      }
      img {
        outline: none;
        text-decoration: none;
        border: 0;
      }
      p {
        margin: 1em 0;
      }
    </style>
  </head>
  <body style="margin:0; padding:0; background-color:#f4f4f4;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4;">
      <tbody>
        <tr>
          <td align="center" valign="top">

            <!-- HEADER -->
            <table
              width="100%"
              cellpadding="0"
              cellspacing="0"
              style="
                max-width:650px;
                background-color:#ff7300;
                background-image:url('https://wso2.cachefly.net/wso2/sites/all/2022-optimized/bg-hr-mailer-new.png');
                background-size:auto;
                background-repeat:no-repeat;
                background-position:top;
              "
            >
              <tbody>
                <tr>
                  <td style="padding:30px 20px;">
                    <a href="https://wso2.com/" style="text-decoration:none;" target="_blank">
                      <img
                        src="https://wso2.cachefly.net/wso2/sites/all/image_resources/logos/WSO2-Logo-White.png"
                        alt="WSO2 Logo"
                        height="40"
                        width="100"
                        style="height:auto; width:150px;"
                      />
                    </a>
                  </td>
                </tr>
              </tbody>
            </table>

            <!-- BODY -->
            <table
              width="100%"
              cellpadding="0"
              cellspacing="0"
              style="
                max-width:650px;
                background-color:#ffffff;
                margin:auto;
                box-shadow:0px 0px 26px 0 rgba(0,0,0,0.15);
              "
            >
              <tbody>
                <tr>
                  <td style="padding:30px 40px;">

                    <!-- Info Banner -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tbody>
                        <tr>
                          <td
                            style="
                              background-color:#e8f4fd;
                              border-left:4px solid #2b7de9;
                              padding:14px 16px;
                              border-radius:4px;
                            "
                          >
                            <p
                              style="
                                margin:0;
                                font-family:'Roboto', Helvetica, sans-serif;
                                font-size:14px;
                                color:#1a4c7a;
                              "
                            >
                              <strong>Automated Offboarding Update</strong> &mdash;
                              <!-- [COUNT] --> employee(s) reached their final day of employment on
                              <!-- [RUN_DATE] --> and were automatically transitioned from
                              <em>Marked leaver</em> to <em>Left</em>.
                            </p>
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    <p
                      style="
                        font-family:'Roboto', Helvetica, sans-serif;
                        font-size:16px;
                        color:#465868;
                        margin-top:24px;
                      "
                    >
                      Hi Admin,<br /><br />
                      The following employees were auto-transitioned to <strong>Left</strong> status. No action is
                      required unless one of these transitions looks incorrect.
                    </p>

                    <!-- Transitioned Employees -->
                    <p
                      style="
                        font-family:'Roboto', Helvetica, sans-serif;
                        font-size:15px;
                        color:#465868;
                        font-weight:bold;
                        margin-bottom:4px;
                        margin-top:20px;
                      "
                    >
                      Transitioned Employees:
                    </p>
                    <table
                      width="100%"
                      cellpadding="0"
                      cellspacing="0"
                      style="
                        border:1px solid #e0e0e0;
                        border-radius:4px;
                        margin-top:8px;
                      "
                    >
                      <tbody>
                        <tr>
                          <td
                            style="
                              padding:12px 16px;
                              font-family:'Roboto', Helvetica, sans-serif;
                              font-size:14px;
                              color:#465868;
                            "
                          >
                            <ul style="margin:0; padding-left:20px;">
                              <!-- [EMPLOYEE_LIST] -->
                            </ul>
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    <p
                      style="
                        font-family:'Roboto', Helvetica, sans-serif;
                        font-size:14px;
                        color:#465868;
                        margin-top:24px;
                      "
                    >
                      Best regards,<br />
                      <!-- [APP_NAME] --> System
                    </p>

                  </td>
                </tr>
              </tbody>
            </table>

            <!-- FOOTER -->
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width:650px; margin:auto;">
              <tbody>
                <tr>
                  <td style="padding:20px 40px; text-align:center;">
                    <p
                      style="
                        font-family:'Roboto', Helvetica, sans-serif;
                        font-size:12px;
                        color:#999999;
                        margin:0;
                      "
                    >
                      &copy; <!-- [YEAR] --> WSO2 LLC. This is an automated notification from the <!-- [APP_NAME] --> System.
                    </p>
                  </td>
                </tr>
              </tbody>
            </table>

          </td>
        </tr>
      </tbody>
    </table>
  </body>
</html>
`;
```

- [ ] **Step 5: Add the `notifyLeaverAutoTransition` function**

At the end of `backend/modules/email/email.bal`, append:

```ballerina

# Send a summary email listing employees auto-transitioned from Marked leaver to Left.
#
# + transitions - Employees that were transitioned during this sweep (must be non-empty)
# + return - Error if the email notification fails to send
public isolated function notifyLeaverAutoTransition(LeaverTransitionNotice[] transitions) returns error? {
    string employeeListHtml = string:'join("",
    ...from LeaverTransitionNotice t in transitions
       select string `<li>${htmlEscape(t.firstName)} ${htmlEscape(t.lastName)} (${htmlEscape(t.employeeId)})
            &mdash; ${htmlEscape(t.workEmail)} &mdash; final day: ${htmlEscape(t.finalDayOfEmployment)}</li>`);

    map<string> keyValues = {
        APP_NAME: appName,
        RUN_DATE: time:utcToString(time:utcNow()).substring(0, 10),
        COUNT: transitions.length().toString(),
        EMPLOYEE_LIST: employeeListHtml,
        YEAR: time:utcToCivil(time:utcNow()).year.toString()
    };

    string|error boundTemplate = bindKeyValues(leaverAutoTransitionSummaryTemplate, keyValues);
    if boundTemplate is error {
        log:printError("Failed to bind email template for leaver auto-transition summary notification",
                boundTemplate);
        return boundTemplate;
    }

    EmailPayload emailPayload = {
        to: leaverNotificationRecipients,
        'from: emailServiceConfig.'from,
        subject: string `Employee Offboarding Alert: ${transitions.length()} employee(s) transitioned to Left`,
        template: boundTemplate
    };

    error? emailResult = sendEmail(emailPayload);
    if emailResult is error {
        log:printError("Failed to send leaver auto-transition summary notification email", emailResult);
        return emailResult;
    }
}
```

(No new imports needed — `log` and `time` are already imported at the top of `email.bal`.)

- [ ] **Step 6: Compile**

Run: `cd backend && bal build`
Expected: build succeeds. Note this will now require `emailServiceConfig`/`appName`/`leaverNotificationRecipients` to be resolvable at run time once anything imports `people.email` — that's wired up in Task 4 (Config) before Task 3's job actually runs.

- [ ] **Step 7: Commit**

```bash
git add backend/modules/email/client.bal backend/modules/email/types.bal backend/modules/email/templates.bal backend/modules/email/utils.bal backend/modules/email/email.bal
git commit -m "Add leaver auto-transition summary email notification"
```

---

### Task 3: Scheduled job + wiring into service startup

**Files:**
- Create: `backend/leaver_scheduler.bal`
- Modify: `backend/service.bal:57-59` (call the new start function from `init()`)

**Interfaces:**
- Consumes: `database:transitionExpiredLeavers(string actor) returns database:LeaverTransition[]|error` (Task 1), `email:notifyLeaverAutoTransition(email:LeaverTransitionNotice[]) returns error?` (Task 2).
- Produces: `function startLeaverSweepJob() returns error?` — called once from `service.bal`'s `init()`.

- [ ] **Step 1: Write the scheduler file**

Create `backend/leaver_scheduler.bal`:

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

import people.database;
import people.email;

import ballerina/log;
import ballerina/task;

const string LEAVER_SWEEP_ACTOR = "system-scheduler";

# Interval, in hours, at which the Marked-leaver auto-transition sweep runs.
configurable decimal leaverSweepIntervalHours = 24;

class LeaverSweepJob {
    *task:Job;

    public function execute() {
        database:LeaverTransition[]|error transitions = database:transitionExpiredLeavers(LEAVER_SWEEP_ACTOR);
        if transitions is error {
            log:printError("Failed to run leaver auto-transition sweep", transitions);
            return;
        }

        if transitions.length() == 0 {
            return;
        }

        log:printInfo("Auto-transitioned leavers to Left", count = transitions.length());

        email:LeaverTransitionNotice[] notices = from database:LeaverTransition t in transitions
            select {
                employeeId: t.employeeId,
                firstName: t.firstName,
                lastName: t.lastName,
                workEmail: t.workEmail,
                finalDayOfEmployment: t.finalDayOfEmployment
            };

        error? notifyResult = email:notifyLeaverAutoTransition(notices);
        if notifyResult is error {
            log:printError("Failed to send leaver auto-transition summary email", notifyResult);
        }
    }
}

# Start the recurring Marked-leaver auto-transition sweep job.
#
# + return - Error if the job could not be scheduled
function startLeaverSweepJob() returns error? {
    _ = check task:scheduleJobRecurByFrequency(new LeaverSweepJob(), leaverSweepIntervalHours * 3600);
}
```

- [ ] **Step 2: Wire the job into service startup**

In `backend/service.bal`, replace lines 57-59:

```ballerina
    # Service initialization.
    function init() {
        log:printInfo("People App backend started...");
    }
```

with:

```ballerina
    # Service initialization.
    function init() {
        log:printInfo("People App backend started...");
        error? schedulingResult = startLeaverSweepJob();
        if schedulingResult is error {
            log:printError("Failed to start leaver auto-transition sweep job", schedulingResult);
        }
    }
```

(No new import needed in `service.bal` — `startLeaverSweepJob` lives in the same root package.)

- [ ] **Step 3: Compile**

Run: `cd backend && bal build`
Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add backend/leaver_scheduler.bal backend/service.bal
git commit -m "Schedule recurring job to auto-transition expired Marked-leaver employees"
```

---

### Task 4: Config — new configurables + reactivate the email section

**Files:**
- Modify: `backend/Config.toml`
- Modify: `backend/Config.toml.local`

**Interfaces:**
- Consumes: nothing new (this task supplies values for configurables already declared in Tasks 1-3: `leaverSweepIntervalHours`, `leaverNotificationRecipients`, plus the pre-existing `emailServiceConfig`/`appName`).

**Context:** Task 3 makes `people.email` a live dependency again (via `leaver_scheduler.bal`'s `import people.email;`). Today `[people.email]` is commented out in `Config.toml`, so without this task the backend will fail at startup once Task 3 lands (the module's `emailClient` is built from `emailServiceConfig.emailServiceEndpoint` at module-init time).

- [ ] **Step 1: Update `backend/Config.toml`**

Add `leaverSweepIntervalHours` near the top-level settings (after the `[people.authorization.authorizedRoles]` block, before the database section):

```toml
leaverSweepIntervalHours = 24
```

Then replace the commented email block (lines 57-68):

```toml
# [people.email]
  #   appName = "People App (Staging)"

# [people.email.emailServiceConfig]
  #   emailServiceEndpoint = "https://apis-stg.wso2.com/hyht/email-alerting-service/v1.0"
  #   to = ["shayan@wso2.com"]
  #   from = "no-reply@wso2.com"

# [people.email.emailServiceConfig.oauthConfig]
  #   tokenUrl = "https://api.asgardeo.io/t/wso2/oauth2/token"
  #   clientId = "bEoJ0VAT7TVOpt_f5Kh_ksGN6TQa"
  #   clientSecret = "NSpVthEilzePrOokPDCFrbtXnyYx_8EeKzcsLC1M9u4a"
```

with the uncommented, active version (same values, plus the new recipient list):

```toml
[people.email]
    appName = "People App (Staging)"
    leaverNotificationRecipients = ["shayan@wso2.com"]

[people.email.emailServiceConfig]
    emailServiceEndpoint = "https://apis-stg.wso2.com/hyht/email-alerting-service/v1.0"
    to = ["shayan@wso2.com"]
    from = "no-reply@wso2.com"

[people.email.emailServiceConfig.oauthConfig]
    tokenUrl = "https://api.asgardeo.io/t/wso2/oauth2/token"
    clientId = "bEoJ0VAT7TVOpt_f5Kh_ksGN6TQa"
    clientSecret = "NSpVthEilzePrOokPDCFrbtXnyYx_8EeKzcsLC1M9u4a"
```

- [ ] **Step 2: Update `backend/Config.toml.local`**

Add the new root-level placeholder (after the `[people.authorization.authorizedRoles]` block, before the database section):

```toml
leaverSweepIntervalHours =
```

Then, in the existing `[people.email]` block, add the new recipient placeholder:

```toml
[people.email]
    appName = ""
    leaverNotificationRecipients = [""]
```

- [ ] **Step 3: Verify the backend starts locally**

Run: `cd backend && bal run`
Expected: log line `People App backend started...` appears and the process keeps running (no startup crash from the email client). Stop it with Ctrl+C once confirmed.

- [ ] **Step 4: Commit**

```bash
git add backend/Config.toml backend/Config.toml.local
git commit -m "Configure leaver sweep interval and reactivate email module config"
```

---

### Task 5: Backend validation — require resignation fields for Marked leaver / Left

**Files:**
- Modify: `backend/service.bal:1536-1545`

**Interfaces:**
- Consumes: `employeeInfo` (already fetched at `service.bal:1493`, type `database:Employee`, includes `finalDayInOffice`/`finalDayOfEmployment`/`resignationReason`/`employeeStatus`), `payload` (`database:UpdateEmployeeJobInfoPayload`), `database:EMPLOYEE_MARKED_LEAVER`/`database:EMPLOYEE_LEFT`.

- [ ] **Step 1: Replace the guard**

In `backend/service.bal`, replace lines 1536-1545:

```ballerina
        if database:hasLeaverFields(payload) && payload.employeeStatus != database:EMPLOYEE_LEFT
                && employeeInfo.employeeStatus != database:EMPLOYEE_LEFT {
            log:printWarn("Attempt to set resignation fields on a non-Left employee",
                    employeeId = employeeId);
            return <http:BadRequest>{
                body: {
                    message: "Resignation details can only be set when employee status is 'Left'"
                }
            };
        }
```

with:

```ballerina
        string resultingStatus = payload.employeeStatus ?: employeeInfo.employeeStatus;
        if resultingStatus == database:EMPLOYEE_MARKED_LEAVER || resultingStatus == database:EMPLOYEE_LEFT {
            string? resultingFinalDayInOffice = payload.finalDayInOffice ?: employeeInfo.finalDayInOffice;
            string? resultingFinalDayOfEmployment = payload.finalDayOfEmployment ?: employeeInfo.finalDayOfEmployment;
            string? resultingResignationReason = payload.resignationReason ?: employeeInfo.resignationReason;

            if resultingFinalDayInOffice is () || resultingFinalDayOfEmployment is () || resultingResignationReason is () {
                log:printWarn("Attempt to set status to Marked leaver/Left without all resignation details",
                        employeeId = employeeId);
                return <http:BadRequest>{
                    body: {
                        message: "Final day in office, final day of employment, and resignation reason are all required when status is 'Marked leaver' or 'Left'"
                    }
                };
            }
        }
```

Note: `employeeInfo.employeeStatus` is typed as plain `string` on the `Employee` record (`types.bal:150`), while `payload.employeeStatus` is `database:EmployeeStatus?`. Since every `EmployeeStatus` member is itself a string singleton type, `payload.employeeStatus ?: employeeInfo.employeeStatus` widens cleanly to `string` — no cast needed, and no risk of a runtime panic from a bad cast.

- [ ] **Step 2: Compile**

Run: `cd backend && bal build`
Expected: build succeeds.

- [ ] **Step 3: Manual verification against a local DB**

With the backend running (`bal run`) against your local MySQL:
1. `PATCH /employees/{employeeId}/job-info` with `{"employeeStatus": "Marked leaver"}` and no resignation fields → expect `400` with the new message.
2. Same request plus `finalDayInOffice`, `finalDayOfEmployment`, `resignationReason` all set → expect `200`.
3. A follow-up `PATCH` on that same employee changing an unrelated field (e.g. `managerEmail`), status omitted → expect `200` (existing resignation values already satisfy the check).

- [ ] **Step 4: Commit**

```bash
git add backend/service.bal
git commit -m "Require resignation details when employee status is Marked leaver or Left"
```

---

### Task 6: Webapp — enable and require resignation fields for Marked leaver

**Files:**
- Modify: `webapp/src/view/employees/onboarding/singleOnboarding/steps/JobInfo.tsx`

**Interfaces:**
- Consumes: `EmployeeStatus` enum (`@/types/types`, `Active | Left | MarkedLeaver`).

- [ ] **Step 1: Only clear resignation fields when status becomes Active**

Replace the `onChange` handler at lines 1432-1440:

```tsx
                onChange={(e) => {
                  const newStatus = e.target.value;
                  setFieldValue("employeeStatus", newStatus);
                  if (newStatus !== EmployeeStatus.Left) {
                    setFieldValue("finalDayInOffice", null);
                    setFieldValue("finalDayOfEmployment", null);
                    setFieldValue("resignationReason", null);
                  }
                }}
```

with:

```tsx
                onChange={(e) => {
                  const newStatus = e.target.value;
                  setFieldValue("employeeStatus", newStatus);
                  if (newStatus === EmployeeStatus.Active) {
                    setFieldValue("finalDayInOffice", null);
                    setFieldValue("finalDayOfEmployment", null);
                    setFieldValue("resignationReason", null);
                  }
                }}
```

- [ ] **Step 2: Enable the three resignation fields for Marked leaver too**

At line 1769 (`Final Day in Office`), line 1794 (`Final Day of Employment`), and line 1821 (`Reason for Leaving`), replace each:

```tsx
                disabled={values.employeeStatus !== EmployeeStatus.Left}
```

with:

```tsx
                disabled={
                  values.employeeStatus !== EmployeeStatus.MarkedLeaver &&
                  values.employeeStatus !== EmployeeStatus.Left
                }
```

(Three occurrences — one per field, each keeps its own surrounding JSX unchanged.)

- [ ] **Step 3: Require the three fields when status is Marked leaver or Left**

Replace the Yup schema fields at lines 152-163:

```tsx
    finalDayInOffice: Yup.string()
      .matches(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format")
      .transform((value) => (value === "" ? null : value))
      .nullable(),
    finalDayOfEmployment: Yup.string()
      .matches(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format")
      .transform((value) => (value === "" ? null : value))
      .nullable(),
    resignationReason: Yup.string()
      .max(300, "Resignation reason must be at most 300 characters")
      .transform((value) => (value === "" ? null : value))
      .nullable(),
```

with:

```tsx
    finalDayInOffice: Yup.string()
      .matches(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format")
      .transform((value) => (value === "" ? null : value))
      .nullable()
      .when("employeeStatus", {
        is: (status: string) =>
          status === EmployeeStatus.MarkedLeaver || status === EmployeeStatus.Left,
        then: (schema) =>
          schema.required("Required when status is Marked leaver or Left"),
      }),
    finalDayOfEmployment: Yup.string()
      .matches(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format")
      .transform((value) => (value === "" ? null : value))
      .nullable()
      .when("employeeStatus", {
        is: (status: string) =>
          status === EmployeeStatus.MarkedLeaver || status === EmployeeStatus.Left,
        then: (schema) =>
          schema.required("Required when status is Marked leaver or Left"),
      }),
    resignationReason: Yup.string()
      .max(300, "Resignation reason must be at most 300 characters")
      .transform((value) => (value === "" ? null : value))
      .nullable()
      .when("employeeStatus", {
        is: (status: string) =>
          status === EmployeeStatus.MarkedLeaver || status === EmployeeStatus.Left,
        then: (schema) =>
          schema.required("Required when status is Marked leaver or Left"),
      }),
```

- [ ] **Step 4: Show the validation errors under each field**

The three `DatePicker`/`TextField` components (lines 1766-1834) don't currently surface Formik errors, and `setFieldTouched` isn't destructured from Formik in this file yet. First, add it to the existing destructure at lines 372-380:

```tsx
  const {
    values,
    handleChange,
    handleBlur,
    touched,
    errors,
    setFieldValue,
    setFieldError,
  } = useFormikContext<CreateEmployeeFormValues>();
```

becomes:

```tsx
  const {
    values,
    handleChange,
    handleBlur,
    touched,
    errors,
    setFieldValue,
    setFieldError,
    setFieldTouched,
  } = useFormikContext<CreateEmployeeFormValues>();
```

Then add `error`/`helperText` wiring consistent with other fields in this form (e.g. the `employmentTypeId` field at lines 1401-1405). For the `Final Day in Office` field (lines 1766-1790), change the `slotProps.textField` block:

```tsx
                slotProps={{
                  field: { clearable: true },
                  textField: {
                    fullWidth: true,
                    helperText: "Last day the employee was in office",
                    sx: textFieldSx,
                  },
                }}
```

to:

```tsx
                slotProps={{
                  field: { clearable: true },
                  textField: {
                    fullWidth: true,
                    error: Boolean(touched.finalDayInOffice && errors.finalDayInOffice),
                    helperText:
                      touched.finalDayInOffice && errors.finalDayInOffice
                        ? errors.finalDayInOffice
                        : "Last day the employee was in office",
                    sx: textFieldSx,
                  },
                }}
```

Apply the same pattern to `Final Day of Employment` (lines 1791-1815, using `finalDayOfEmployment`/helper text "Official last day of employment") and to the `Reason for Leaving` `TextField` (lines 1816-1833, which already accepts standard `error`/`helperText` props directly — add `error={Boolean(touched.resignationReason && errors.resignationReason)}` and `helperText={touched.resignationReason && errors.resignationReason ? errors.resignationReason : undefined}` alongside its existing props).

Each `DatePicker`'s `onChange` should also mark the field touched so the error can show without requiring a blur first. For `Final Day in Office` (lines 1775-1780), change:

```tsx
                onChange={(val) =>
                  setFieldValue(
                    "finalDayInOffice",
                    val ? val.format("YYYY-MM-DD") : null,
                  )
                }
```

to:

```tsx
                onChange={(val) => {
                  setFieldTouched("finalDayInOffice", true);
                  setFieldValue(
                    "finalDayInOffice",
                    val ? val.format("YYYY-MM-DD") : null,
                  );
                }}
```

And for `Final Day of Employment` (lines 1800-1805), change:

```tsx
                onChange={(val) =>
                  setFieldValue(
                    "finalDayOfEmployment",
                    val ? val.format("YYYY-MM-DD") : null,
                  )
                }
```

to:

```tsx
                onChange={(val) => {
                  setFieldTouched("finalDayOfEmployment", true);
                  setFieldValue(
                    "finalDayOfEmployment",
                    val ? val.format("YYYY-MM-DD") : null,
                  );
                }}
```

- [ ] **Step 5: Verify the build**

Run: `cd webapp && yarn build`
Expected: build succeeds with no new TypeScript errors.

- [ ] **Step 6: Manual browser verification**

Run: `cd webapp && yarn start`, then, on an employee's edit screen:
1. Set status to `Marked leaver` — confirm the three resignation fields become editable (not greyed out).
2. Leave them empty and try to submit — confirm inline validation errors appear and submission is blocked.
3. Fill all three and submit — confirm it succeeds (assumes Task 5's backend change is deployed/running locally too).
4. Set status back to `Active` — confirm the three fields clear and become disabled again.

- [ ] **Step 7: Commit**

```bash
git add webapp/src/view/employees/onboarding/singleOnboarding/steps/JobInfo.tsx
git commit -m "Allow and require resignation details when employee status is Marked leaver"
```

---

## Manual end-to-end verification (after all tasks)

With backend (`bal run`) and webapp (`yarn start`) both running locally against the same DB:

1. Set an employee to `Marked leaver` with `finalDayOfEmployment` = today's date, via the webapp form.
2. Confirm `employee.employee_status = 'Marked leaver'` and the `resignation` row is populated (query the local DB directly).
3. Wait for (or manually trigger, e.g. by temporarily lowering `leaverSweepIntervalHours` and restarting) the sweep job.
4. Confirm the employee's status flips to `Left`, `updated_by = 'system-scheduler'`, and an audit-trigger row was recorded.
5. Confirm a summary email attempt was logged (`log:printInfo`/`log:printError` from `notifyLeaverAutoTransition`).
6. Repeat with a future-dated `finalDayOfEmployment` and confirm that employee is **not** transitioned by the next sweep.
