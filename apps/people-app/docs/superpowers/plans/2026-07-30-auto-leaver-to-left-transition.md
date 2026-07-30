# Auto-transition Marked Leaver → Left Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let HR record a future-dated departure (`Marked leaver` + `final_day_of_employment`) and have a standalone scheduled component automatically flip the employee to `Left` once that date arrives, with an email summary sent after each run.

**Architecture:** A new, independently-deployable Ballerina package, `apps/people-app/leaver-sweep/`, with a `public function main()` entry point — no in-process scheduling code. It connects to the `people_ops_suite` MySQL database directly (its own `mysql:Client`), transitions expired `Marked leaver` employees to `Left`, and (if any were transitioned) emails a summary via its own `http:Client` to the email-alerting-service. This is deployed as a WSO2 Choreo **Scheduled Task** component — Choreo's own cron config controls run frequency, not anything in this repo. This follows the existing precedent of `apps/visitor-app/active-visit-reminder/` (a sibling standalone scheduled package), except this component talks to the database directly rather than through an HTTP API, per explicit direction.

Separately, the `apps/people-app/backend` HTTP service and `webapp` need their own, unrelated change: HR must be able to (and required to) fill in the three resignation fields when setting an employee's status to `Marked leaver`, not just `Left` — this is what the sweep depends on for data, and stands on its own regardless of where the sweep runs.

**Tech Stack:** Ballerina 2201.12.7 (`ballerinax/mysql`, `ballerina/http`), React + Formik/Yup (CRA webapp).

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-30-auto-leaver-to-left-transition-design.md`
- System actor value for automated DB writes: the literal string `"system-scheduler"`.
- No scheduling/interval configuration in code anywhere — Choreo's Scheduled Task cron config is external to this repo.
- Email notification recipients: a configurable `leaverNotificationRecipients: string[]` in the new package, independent of anything in `apps/people-app/backend`.
- No email is sent when a sweep transitions zero employees.
- Every new `configurable` value must be added to the new package's `Config.toml.local` (placeholder) in the same commit — per `CLAUDE.md` backend coding standards, applied to this new package too.
- `apps/people-app/backend/modules/database` and `apps/people-app/backend/modules/email` are **not** modified by this feature — the sweep does not import or depend on the backend package.
- Neither `apps/people-app/backend/` nor `apps/people-app/webapp/` has an existing automated test suite, and the new `leaver-sweep` package won't get one either (matching sibling `active-visit-reminder`, which also has none). Verification per task is `bal build` / `yarn build` / a manual check.
- Webapp: use path aliases (`@view/`, `@utils/`, `@/types/`), never relative `../../` imports (already satisfied — no new imports needed in `JobInfo.tsx`).

---

### Task 1: `leaver-sweep` package scaffolding + database layer

**Files:**
- Create: `apps/people-app/leaver-sweep/Ballerina.toml`
- Create: `apps/people-app/leaver-sweep/.gitignore`
- Create: `apps/people-app/leaver-sweep/modules/database/client.bal`
- Create: `apps/people-app/leaver-sweep/modules/database/types.bal`
- Create: `apps/people-app/leaver-sweep/modules/database/queries.bal`
- Create: `apps/people-app/leaver-sweep/modules/database/functions.bal`

**Interfaces:**
- Produces: `public type LeaverTransition record {| string employeeId; string firstName; string lastName; string workEmail; string finalDayOfEmployment; |};` and `public isolated function transitionExpiredLeavers(string actor) returns LeaverTransition[]|error` in the `database` module — Task 2's `main.bal` calls this as `database:transitionExpiredLeavers("system-scheduler")`.

- [ ] **Step 1: Create the package manifest**

Create `apps/people-app/leaver-sweep/Ballerina.toml`:

```toml
[package]
org = "wso2_open_operations"
name = "leaver_sweep"
version = "1.0.0"
distribution = "2201.12.7"

[build-options]
observabilityIncluded = true
```

- [ ] **Step 2: Create the gitignore**

Create `apps/people-app/leaver-sweep/.gitignore`:

```
# Ballerina generates this directory during the compilation of a package.
# It contains compiler-generated artifacts and the final executable if this is an application package.
target/

# Ballerina maintains the compiler-generated source code here.
# Remove this if you want to commit generated sources.
generated/

# Contains configuration values used during development time.
# See https://ballerina.io/learn/provide-values-to-configurable-variables/ for more details.
Config.toml
```

- [ ] **Step 3: Add the database client**

Create `apps/people-app/leaver-sweep/modules/database/client.bal`:

```ballerina
import ballerinax/mysql;
import ballerinax/mysql.driver as _;

# Database Client Configuration.
public type DatabaseConfig record {|
    # If the MySQL server is secured, the username
    string user;
    # The password of the MySQL server for the provided username
    string password;
    # The name of the database
    string database;
    # Hostname of the MySQL server
    string host;
    # Port number of the MySQL server
    int port;
|};

configurable DatabaseConfig dbConfig = ?;

function initLeaverSweepDbClient() returns mysql:Client|error => new (...dbConfig);

# Database Client.
final mysql:Client databaseClient = check initLeaverSweepDbClient();
```

- [ ] **Step 4: Add the `LeaverTransition` type**

Create `apps/people-app/leaver-sweep/modules/database/types.bal`:

```ballerina
import ballerina/sql;

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

- [ ] **Step 5: Add the select + update queries**

Create `apps/people-app/leaver-sweep/modules/database/queries.bal`:

```ballerina
import ballerina/sql;

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
    WHERE e.employee_status = 'Marked leaver'
        AND r.final_day_of_employment IS NOT NULL
        AND r.final_day_of_employment <= CURDATE();`;

# Transition employees whose Marked-leaver final day of employment has arrived (today or earlier) to Left.
#
# + actor - System actor performing the update
# + return - Query to update matching employees' status to Left
isolated function transitionExpiredLeaversQuery(string actor) returns sql:ParameterizedQuery =>
    `UPDATE employee e
    JOIN resignation r ON r.employee_id = e.id
    SET e.employee_status = 'Left', e.updated_by = ${actor}
    WHERE e.employee_status = 'Marked leaver'
        AND r.final_day_of_employment IS NOT NULL
        AND r.final_day_of_employment <= CURDATE();`;
```

Note: unlike the original (reverted) backend implementation, this package has no `EmployeeStatus` enum of its own — the status literals `'Marked leaver'`/`'Left'` are written directly in the query, since duplicating the whole enum for two string literals isn't worth it in this small, single-purpose package.

- [ ] **Step 6: Add the `transitionExpiredLeavers` function**

Create `apps/people-app/leaver-sweep/modules/database/functions.bal`:

```ballerina
import ballerina/sql;

# Check the affected row count after an update operation.
#
# + affectedRowCount - Number of rows affected by the update operation
# + return - Error if no rows are updated
isolated function checkAffectedCount(int? affectedRowCount) returns error? {
    if affectedRowCount == 0 || affectedRowCount is () {
        return error("No rows were updated");
    }
    return;
}

# Auto-transition employees whose Marked-leaver final day of employment has arrived (today or earlier) to Left.
#
# + actor - System actor performing the update (e.g. "system-scheduler")
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

- [ ] **Step 7: Compile**

Run: `cd apps/people-app/leaver-sweep && bal build`
Expected: build succeeds. Note this package has no `Config.toml` yet (added in Task 3) — `bal build` type-checks without needing configurable values to be resolvable; only `bal run` needs those.

- [ ] **Step 8: Commit**

```bash
git add apps/people-app/leaver-sweep/Ballerina.toml apps/people-app/leaver-sweep/.gitignore apps/people-app/leaver-sweep/modules/database
git commit -m "Scaffold leaver-sweep package with database layer"
```

---

### Task 2: Email notification + `main()` entry point

**Files:**
- Create: `apps/people-app/leaver-sweep/modules/email/client.bal`
- Create: `apps/people-app/leaver-sweep/modules/email/types.bal`
- Create: `apps/people-app/leaver-sweep/modules/email/templates.bal`
- Create: `apps/people-app/leaver-sweep/modules/email/util.bal`
- Create: `apps/people-app/leaver-sweep/modules/email/email.bal`
- Create: `apps/people-app/leaver-sweep/main.bal`

**Interfaces:**
- Consumes: `database:transitionExpiredLeavers(string actor) returns database:LeaverTransition[]|error` (Task 1).
- Produces: `public isolated function notifyLeaverAutoTransition(LeaverTransition[] transitions) returns error?` in the `email` module, and `public function main() returns error?` in `main.bal` (the package's entry point — this is what Choreo's Scheduled Task invokes on each cron trigger).

- [ ] **Step 1: Add the email client**

Create `apps/people-app/leaver-sweep/modules/email/client.bal`:

```ballerina
import ballerina/http;

public configurable EmailServiceConfig emailServiceConfig = ?;
public configurable string appName = ?;
public configurable string[] leaverNotificationRecipients = ?;

final http:Client emailClient = check new (emailServiceConfig.emailServiceEndpoint, {
    auth: {
        ...emailServiceConfig.oauthConfig
    },
    timeout: 15.0,
    httpVersion: http:HTTP_1_1,
    http1Settings: {
        keepAlive: http:KEEPALIVE_NEVER
    },
    retryConfig: {
        count: 3,
        interval: 3.0,
        statusCodes: [
            http:STATUS_BAD_GATEWAY,
            http:STATUS_SERVICE_UNAVAILABLE,
            http:STATUS_GATEWAY_TIMEOUT
        ]
    }
});
```

- [ ] **Step 2: Add the email config types**

Create `apps/people-app/leaver-sweep/modules/email/types.bal`:

```ballerina
# OAuth2 application configuration.
public type Oauth2Config record {|
    # The URL of the token endpoint
    string tokenUrl;
    # The client ID of the application
    string clientId;
    # The client secret of the application
    string clientSecret;
    # OAuth2 scopes
    string[] scopes = [];
|};

# Email Service Configuration.
public type EmailServiceConfig record {|
    # Email Service Endpoint
    string emailServiceEndpoint;
    # Auth Configurations
    Oauth2Config oauthConfig;
    # Sender email
    string 'from;
|};

# Payload of the email alerting service.
public type EmailPayload record {|
    # Recipient email(s) as string array
    string[] to;
    # Sender email
    string 'from;
    # Email subject
    string subject;
    # Email template
    string template;
|};
```

- [ ] **Step 3: Add the template-binding helper**

Create `apps/people-app/leaver-sweep/modules/email/util.bal`:

```ballerina
import ballerina/lang.regexp;
import ballerina/mime;

# HTML-escape a string to prevent injection/XSS.
# Escapes &, <, >, ", and ' (& first to prevent double-escaping).
#
# + str - String to escape
# + return - HTML-escaped string
isolated function htmlEscape(string str) returns string {
    string escaped = str;
    escaped = re `&`.replaceAll(escaped, "&amp;");
    escaped = re `<`.replaceAll(escaped, "&lt;");
    escaped = re `>`.replaceAll(escaped, "&gt;");
    escaped = re `"`.replaceAll(escaped, "&quot;");
    escaped = re `'`.replaceAll(escaped, "&#39;");
    return escaped;
}

# Bind values to the email template and encode.
#
# + content - Email content
# + keyValPairs - Key value pairs
# + return - Email content
isolated function bindKeyValues(string content, map<string> keyValPairs) returns string|error {
    string bindContent = keyValPairs.entries().reduce(
        isolated function(string accumulation, [string, string] keyVal) returns string {
        regexp:RegExp r = re `<!-- \[${keyVal[0].toUpperAscii()}\] -->`;
        string valueToReplace = keyVal[0] == "EMPLOYEE_LIST" ? keyVal[1] : htmlEscape(keyVal[1]);
        return r.replaceAll(accumulation, valueToReplace);
    },
    content);
    return mime:base64Encode(bindContent).ensureType();
}
```

- [ ] **Step 4: Add the email template**

Create `apps/people-app/leaver-sweep/modules/email/templates.bal`:

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

- [ ] **Step 5: Add the notify function**

Create `apps/people-app/leaver-sweep/modules/email/email.bal`:

```ballerina
import leaver_sweep.database;

import ballerina/http;
import ballerina/log;
import ballerina/time;

# Send a summary email listing employees auto-transitioned from Marked leaver to Left.
#
# + transitions - Employees that were transitioned during this sweep (must be non-empty)
# + return - Error if the email notification fails to send
public isolated function notifyLeaverAutoTransition(database:LeaverTransition[] transitions) returns error? {
    string employeeListHtml = string:'join("",
    ...from database:LeaverTransition t in transitions
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

    http:Response|http:ClientError response = emailClient->/send\-email.post(emailPayload);
    if response is http:ClientError {
        string customError = "Client Error occurred while sending the leaver auto-transition summary email!";
        log:printError(customError, response);
        return error(customError);
    }
    if response.statusCode != http:STATUS_OK {
        string customError = string `Error occurred while sending the leaver auto-transition summary email! - HTTP ${response.statusCode}`;
        log:printError(customError);
        return error(customError);
    }
    log:printInfo(string `Leaver auto-transition summary email sent successfully to ${emailPayload.to.toString()}`);
}
```

(`import leaver_sweep.database;` — the package name is `leaver_sweep` per Task 1's `Ballerina.toml`, and `database` is the submodule directory name, matching Ballerina's `<org>/<package>.<module>` internal-import convention already used the same way in `apps/people-app/backend`.)

- [ ] **Step 6: Add the entry point**

Create `apps/people-app/leaver-sweep/main.bal`:

```ballerina
import leaver_sweep.database;
import leaver_sweep.email;

import ballerina/log;

const string LEAVER_SWEEP_ACTOR = "system-scheduler";

public function main() returns error? {
    log:printInfo("Leaver auto-transition sweep started");

    database:LeaverTransition[] transitions = check database:transitionExpiredLeavers(LEAVER_SWEEP_ACTOR);

    if transitions.length() == 0 {
        log:printInfo("Leaver auto-transition sweep completed — no employees due for transition");
        return;
    }

    log:printInfo("Auto-transitioned leavers to Left", count = transitions.length());

    error? notifyResult = email:notifyLeaverAutoTransition(transitions);
    if notifyResult is error {
        log:printError("Failed to send leaver auto-transition summary email", notifyResult);
    }

    log:printInfo("Leaver auto-transition sweep completed");
}
```

- [ ] **Step 7: Add the local config placeholder**

Create `apps/people-app/leaver-sweep/Config.toml.local`:

```toml
[leaver_sweep.database.dbConfig]
    host = ""
    user = ""
    password = ""
    database = ""
    port =

[leaver_sweep.email]
    appName = ""
    leaverNotificationRecipients = [""]

[leaver_sweep.email.emailServiceConfig]
    emailServiceEndpoint = ""
    from = ""

[leaver_sweep.email.emailServiceConfig.oauthConfig]
    tokenUrl = ""
    clientId = ""
    clientSecret = ""
```

This follows the exact same `[<package>.<module>.<variable>]` nesting Ballerina uses in `apps/people-app/backend/Config.toml` today (e.g. `[people.database.dbConfig]`, `[people.email.emailServiceConfig]`, with scalar/array configurables like `appName` sitting directly under the bare `[people.email]` module table) — here the root package name is `leaver_sweep` in place of `people`, and the module names are `database`/`email`, same as the backend's own submodule names.

- [ ] **Step 8: Compile**

Run: `cd apps/people-app/leaver-sweep && bal build`
Expected: build succeeds.

- [ ] **Step 9: Verify it runs locally**

Fill in `apps/people-app/leaver-sweep/Config.toml.local`'s values into a local `Config.toml` (gitignored, same pattern as `backend/Config.toml`) pointing at your local MySQL instance and a real or dummy email-alerting-service endpoint, then:

Run: `cd apps/people-app/leaver-sweep && bal run`
Expected: logs "Leaver auto-transition sweep started", then either "no employees due for transition" or the transition count, then "sweep completed". The process exits (no listener, no infinite loop) — this matches the "one run, then exit" design that Choreo's Scheduled Task re-invokes on its own cron schedule.

- [ ] **Step 10: Commit**

```bash
git add apps/people-app/leaver-sweep/modules/email apps/people-app/leaver-sweep/main.bal apps/people-app/leaver-sweep/Config.toml.local
git commit -m "Add email notification and entry point to leaver-sweep package"
```

---

### Task 3: Backend validation — require resignation fields for Marked leaver / Left

**Files:**
- Modify: `apps/people-app/backend/service.bal:1536-1545`

**Interfaces:**
- Consumes: `employeeInfo` (already fetched at `service.bal:1493`, type `database:Employee`, includes `finalDayInOffice`/`finalDayOfEmployment`/`resignationReason`/`employeeStatus`), `payload` (`database:UpdateEmployeeJobInfoPayload`), `database:EMPLOYEE_MARKED_LEAVER`/`database:EMPLOYEE_LEFT`.

This task is independent of Tasks 1-2 — it does not touch or depend on the `leaver-sweep` package at all.

- [ ] **Step 1: Replace the guard**

In `apps/people-app/backend/service.bal`, replace lines 1536-1545:

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

Run: `cd apps/people-app/backend && bal build`
Expected: build succeeds.

- [ ] **Step 3: Manual verification against a local DB**

With the backend running (`bal run`) against your local MySQL:
1. `PATCH /employees/{employeeId}/job-info` with `{"employeeStatus": "Marked leaver"}` and no resignation fields → expect `400` with the new message.
2. Same request plus `finalDayInOffice`, `finalDayOfEmployment`, `resignationReason` all set → expect `200`.
3. A follow-up `PATCH` on that same employee changing an unrelated field (e.g. `managerEmail`), status omitted → expect `200` (existing resignation values already satisfy the check).

- [ ] **Step 4: Commit**

```bash
git add apps/people-app/backend/service.bal
git commit -m "Require resignation details when employee status is Marked leaver or Left"
```

---

### Task 4: Webapp — enable and require resignation fields for Marked leaver

**Files:**
- Modify: `apps/people-app/webapp/src/view/employees/onboarding/singleOnboarding/steps/JobInfo.tsx`

**Interfaces:**
- Consumes: `EmployeeStatus` enum (`@/types/types`, `Active | Left | MarkedLeaver`).

This task is independent of Tasks 1-3 — it does not touch or depend on the `leaver-sweep` package or `service.bal` at all (though its end-to-end behavior assumes Task 3's backend validation is also deployed).

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

Run: `cd apps/people-app/webapp && yarn build`
Expected: build succeeds with no new TypeScript errors.

- [ ] **Step 6: Manual browser verification**

Run: `cd apps/people-app/webapp && yarn start`, then, on an employee's edit screen:
1. Set status to `Marked leaver` — confirm the three resignation fields become editable (not greyed out).
2. Leave them empty and try to submit — confirm inline validation errors appear and submission is blocked.
3. Fill all three and submit — confirm it succeeds (assumes Task 3's backend change is deployed/running locally too).
4. Set status back to `Active` — confirm the three fields clear and become disabled again.

- [ ] **Step 7: Commit**

```bash
git add apps/people-app/webapp/src/view/employees/onboarding/singleOnboarding/steps/JobInfo.tsx
git commit -m "Allow and require resignation details when employee status is Marked leaver"
```

---

## Manual end-to-end verification (after all tasks)

With the backend (`bal run` in `apps/people-app/backend`) and webapp (`yarn start`) both running locally against the same DB:

1. Set an employee to `Marked leaver` with `finalDayOfEmployment` = today's date, via the webapp form.
2. Confirm `employee.employee_status = 'Marked leaver'` and the `resignation` row is populated (query the local DB directly).
3. Run `apps/people-app/leaver-sweep`'s `main()` locally (`bal run`, with its own `Config.toml` pointed at the same local DB).
4. Confirm the employee's status flips to `Left`, `updated_by = 'system-scheduler'`, and an audit-trigger row was recorded.
5. Confirm a summary email attempt was logged (`log:printInfo`/`log:printError` from `notifyLeaverAutoTransition`).
6. Repeat with a future-dated `finalDayOfEmployment` and confirm that employee is **not** transitioned by the sweep.
