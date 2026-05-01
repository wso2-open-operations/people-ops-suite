// Copyright (c) 2024, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.
import par_app.database;
import par_app.email;
import par_app.entity;
import par_app.types;

import ballerina/http;
import ballerina/io;
import ballerina/jwt;
import ballerina/lang.runtime;
import ballerina/sql;
import ballerina/time;
import ballerina/uuid;

email:EmailRecord[] globalEmailRecordArray = [];

function getDefaultParCycleCreate() returns types:ParCycleCreate {
    types:ParCycleCreate requestParCycle = {
        parCycleName: "2022 H1",
        parCycleStartDate: "2022-01-01",
        parCycleEndDate: "2022-06-30",
        parEvaluationStartDate: "2022-06-15",
        parEvaluationEndDate: "2022-07-20",
        parEmployeeDeadline: "2022-07-05",
        parLeadDeadline: "2022-07-15",
        parSpecialRatingDeadline: "2022-07-15",
        parF2FDeadline: "2022-07-15",
        parThreeSixtyRatingDeadline: "2022-07-10",
        parCycleConfigurations: {
            employeeParQuestion: "Sm9iIEV4ZWN1dGlvbiwgVGVhbSBXb3JrLCBDb21tdW5pY2F0aW9uLCBMZWFkZXJzaGlw",
            threeSixtyReviewQuestion: "V2hhdCBhcmUgdGhlIHN0cmVuZ3RocyBvZiB0aGlzIEluZGl2aWR1YWw/IGFuZCB3aGF0IGlzIHlvdXIgZmVlZGJhY2sgZm9yIGltcHJvdmVtZW50cz8=",
            parRatings: ["Exceptional", "Successful", "Needs Improvements"],
            threeSixtyReviewRatings: ["Satisfactory", "Unsatisfactory"]
        }
    };
    return requestParCycle;
}

function getDefaultExpectedParCycle(types:InvokerDetails invokerDetails) returns types:ParCycle {
    types:ParCycle requestParCycle = {
        parCycleId: 1,
        parCycleName: "2022 H1",
        parCycleStartDate: "2022-01-01",
        parCycleEndDate: "2022-06-30",
        parEvaluationStartDate: "2022-06-15",
        parEvaluationEndDate: "2022-07-20",
        parEmployeeDeadline: "2022-07-05",
        parLeadDeadline: "2022-07-15",
        parSpecialRatingDeadline: "2022-07-15",
        parF2FDeadline: "2022-07-15",
        parThreeSixtyRatingDeadline: "2022-07-10",
        parCycleStatus: types:PENDING,
        parCycleConfigurations: {
            employeeParQuestion: "Sm9iIEV4ZWN1dGlvbiwgVGVhbSBXb3JrLCBDb21tdW5pY2F0aW9uLCBMZWFkZXJzaGlw",
            threeSixtyReviewQuestion: "V2hhdCBhcmUgdGhlIHN0cmVuZ3RocyBvZiB0aGlzIEluZGl2aWR1YWw/IGFuZCB3aGF0IGlzIHlvdXIgZmVlZGJhY2sgZm9yIGltcHJvdmVtZW50cz8=",
            parRatings: ["Exceptional", "Successful", "Needs Improvements"],
            threeSixtyReviewRatings: ["Satisfactory", "Unsatisfactory"]
        }
    };
    return requestParCycle;
}

function getDefaultInvokerDetails() returns types:InvokerDetails => {
    email: "admin@wso2.com",
    roles: ["INTERNAL-LDAP/stg-admin.par.all.apps"],
    isAdmin: true
};

function getInvokerDetailsAs(string email) returns types:InvokerDetails => {
    email,
    roles: [],
    isAdmin: false
};

function getInvokerDetailsAsWithAdminPermission(string email) returns types:InvokerDetails => {
    email,
    roles: ["INTERNAL-LDAP/stg-admin.par.all.apps"],
    isAdmin: false
};

function getDefaultEmployees() returns entity:Employee[] {
    json|error jsonResult = io:fileReadJson("tests/resources/default_employees.json");
    if jsonResult is error {
        return [];
    }
    entity:Employee[]|error employees = jsonResult.fromJsonWithType();
    if employees is error {
        return [];
    }
    return employees;
}

function getEmployeeByEmail(string email) returns entity:Employee|error {
    entity:Employee[] employees = getDefaultEmployees();
    foreach entity:Employee employee in employees {
        if (employee.workEmail == email) {
            return employee;
        }
    }
    return error(string `Employee not found for the given email: ${email}`);
}

function getDefaultMultipleEmployees(int count) returns entity:Employee[] {
    entity:Employee[] employees = [];
    foreach int i in 1 ... count {
        string randomName = uuid:createType4AsString();
        employees.push({
            firstName: randomName,
            lastName: randomName,
            workEmail: randomName + "@wso2.com",
            company: "WSO2 Lanka",
            location: "Sri Lanka",
            businessUnit: "1",
            department: "1",
            team: "1",
            subTeam: "1",
            managerEmail: "bob@wso2.com",
            startDate: "2021-01-01",
            jobRole: "Software Engineer",
            employeeThumbnail: string `https://localhost/employee/${randomName}/images/thumbnail.png`,
            lead: false,
            employmentType: "Permanent",
            employeeStatus: "Active"
        });
    }

    return employees;
}

function getParRatingsFromDB(int parCycleId) returns database:ParRating[]|sql:Error {
    sql:ParameterizedQuery sqlQuery = `
        SELECT
            par_rating_id,
            par_employee_email,
            par_cycle_id,
            par_company,
            par_location,
            CAST(par_rating AS CLOB) AS par_rating,
            par_team_id,
            CAST(par_special_rating AS CLOB) AS par_special_rating,
            CAST(par_employee_comment AS CLOB) AS par_employee_comment,
            par_employee_status,
            CAST(par_lead_comment AS CLOB) AS par_lead_comment,
            par_lead_status,
            par_f2f_status,
            par_employee_acceptance_status,
            CAST(par_employee_acceptance_comment AS CLOB) AS par_employee_acceptance_comment,
            CAST(par_admin_comment AS CLOB) AS par_admin_comment,
            par_rating_created_by,
            par_rating_updated_by,
        FROM hris_par_rating
        WHERE par_cycle_id = ${parCycleId}`;

    stream<record {}, sql:Error?> resultStream = database:query(sqlQuery, database:ParRating);
    return check from record {} parRating in resultStream
        select <database:ParRating>parRating;
}

function getParSpecialRatingGroupQuota_One() returns types:ParSpecialRatingGroupQuota => {
    parSpecialRatingGroups: [
        {
            parCycleId: 1,
            specialRatingGroupId: 1,
            businessUnit: "1",
            department: "1",
            team: "",
            specialRatingQuotaId: 1
        }
    ],
    specialRatingQuotas: [
        {
            specialRatingQuotaId: 1,
            specialRatingQuotaName: "Special Rating Quota 1",
            top5pQuota: 2,
            top20pQuota: 2,
            allocatedLeads: ["test@wso2.com", "tes2t@wso2.com"]
        }
    ]
};

function getParSpecialRatingGroupQuota_Two() returns types:ParSpecialRatingGroupQuota => {
    parSpecialRatingGroups: [
        {
            parCycleId: 3,
            specialRatingGroupId: 3,
            businessUnit: "Corporate",
            department: "DIGITAL TRANSFORMATION",
            team: "",
            specialRatingQuotaId: 1
        },
        {
            parCycleId: 3,
            specialRatingGroupId: 4,
            businessUnit: "Corporate",
            department: "SALES",
            team: "",
            specialRatingQuotaId: 2
        }
    ],
    specialRatingQuotas: [
        {
            specialRatingQuotaId: 1,
            specialRatingQuotaName: "Special Rating Quota 1",
            top5pQuota: 2,
            top20pQuota: 2,
            allocatedLeads: ["test@wso2.com", "tes2t@wso2.com"]
        },
        {
            specialRatingQuotaId: 2,
            specialRatingQuotaName: "Special Rating Quota 2",
            top5pQuota: 2,
            top20pQuota: 2,
            allocatedLeads: ["test@wso2.com", "tes2t@wso2.com"]
        }
    ]
};

function getParSpecialRatingGroupQuota() returns types:ParSpecialRatingGroupQuota => {
    parSpecialRatingGroups: [
        {
            parCycleId: 11,
            specialRatingGroupId: 1,
            businessUnit: "Corporate",
            department: "ADMINISTRATION",
            team: "",
            specialRatingQuotaId: 1
        },
        {
            parCycleId: 11,
            specialRatingGroupId: 2,
            businessUnit: "Corporate",
            department: "DIGITAL TRANSFORMATION",
            team: "",
            specialRatingQuotaId: 1
        },
        {
            parCycleId: 11,
            specialRatingGroupId: 2,
            businessUnit: "Corporate",
            department: "LEGAL",
            team: "",
            specialRatingQuotaId: 2
        }
    ],
    specialRatingQuotas: [
        {
            specialRatingQuotaId: 1,
            specialRatingQuotaName: "Special Rating Quota 1",
            top5pQuota: 2,
            top20pQuota: 2,
            allocatedLeads: ["test@wso2.com", "test1@wso2.com"]
        },
        {
            specialRatingQuotaId: 2,
            specialRatingQuotaName: "Special Rating Quota 2",
            top5pQuota: 2,
            top20pQuota: 2,
            allocatedLeads: ["test@wso2.com", "tes2t@wso2.com"]
        }
    ]
};

function getParSpecialRatingGroupQuotaInvalid_NoQuotaForAllGroups() returns types:ParSpecialRatingGroupQuota => {
    parSpecialRatingGroups: [
        {
            parCycleId: 11,
            specialRatingGroupId: 1,
            businessUnit: "Corporate",
            department: "ADMINISTRATION",
            team: "",
            specialRatingQuotaId: 1
        },
        {
            parCycleId: 11,
            specialRatingGroupId: 2,
            businessUnit: "Corporate",
            department: "DIGITAL TRANSFORMATION",
            team: "",
            specialRatingQuotaId: 1
        },
        {
            parCycleId: 11,
            specialRatingGroupId: 2,
            businessUnit: "Corporate",
            department: "LEGAL",
            team: "",
            specialRatingQuotaId: 2
        }
    ],
    specialRatingQuotas: [
        {
            specialRatingQuotaId: 2,
            specialRatingQuotaName: "Special Rating Quota 2",
            top5pQuota: 2,
            top20pQuota: 2,
            allocatedLeads: ["test@wso2.com"]
        }
    ]
};

function waitUntilParCycleStatusIsUpdated(int parCycleId, types:ParCycleStatus status, int maxDelay) returns error? {
    int i = 0;
    while i < maxDelay {
        types:ParCycle parCycle = check getParCycle(parCycleId);
        if (parCycle.parCycleStatus == status) {
            return ();
        }
        runtime:sleep(1);
        i += 1;
    }
    return error(string `PAR cycle state is not yet updated to '${status}'`);
}

function modifyAllModifiableFieldsInParCycle(types:ParCycle parCycle) returns types:ParCycle {
    types:ParCycleModify optionalParCycle = getModifiedParCycleWthAllModifiableFields();
    parCycle.parCycleName = <string>optionalParCycle.parCycleName;
    parCycle.parCycleStartDate = <string>optionalParCycle.parCycleStartDate;
    parCycle.parCycleEndDate = <string>optionalParCycle.parCycleEndDate;
    parCycle.parEvaluationStartDate = <string>optionalParCycle.parEvaluationStartDate;
    parCycle.parEvaluationEndDate = <string>optionalParCycle.parEvaluationEndDate;
    parCycle.parEmployeeDeadline = <string>optionalParCycle.parEmployeeDeadline;
    parCycle.parLeadDeadline = <string>optionalParCycle.parLeadDeadline;
    parCycle.parSpecialRatingDeadline = <string>optionalParCycle.parSpecialRatingDeadline;
    parCycle.parThreeSixtyRatingDeadline = <string>optionalParCycle.parThreeSixtyRatingDeadline;

    types:ParCycleConfigurationsOptionalized optinalParCycleConfigurations = <types:ParCycleConfigurationsOptionalized>optionalParCycle.parCycleConfigurations;

    parCycle.parCycleConfigurations.employeeParQuestion = <string>optinalParCycleConfigurations.employeeParQuestion;
    parCycle.parCycleConfigurations.threeSixtyReviewQuestion = <string>optinalParCycleConfigurations.threeSixtyReviewQuestion;
    return parCycle;
}

function getModifiedParCycleWthAllModifiableFields() returns types:ParCycleModify {
    types:ParCycleModify parCycle = {
        parCycleName: "2023",
        parCycleStartDate: "2023-01-01",
        parCycleEndDate: "2023-12-31",
        parEvaluationStartDate: "2023-12-05",
        parEvaluationEndDate: "2023-12-31",
        parEmployeeDeadline: "2023-12-30",
        parLeadDeadline: "2023-12-31",
        parSpecialRatingDeadline: "2023-12-31",
        parThreeSixtyRatingDeadline: "2023-12-30",
        parCycleStatus: types:OPEN,
        parCycleConfigurations: {
            employeeParQuestion: "Sm9iIEV4ZWN1dGlvbiwgVGVhbSBXb3JrLCBDb21tdW5pY2F0aW9uLCBMZWFkZXJzaGlwLCBBbmQgTW9yZQ==",
            threeSixtyReviewQuestion: "V2hhdCBhcmUgdGhlIHN0cmVuZ3RocyBvZiB0aGlzIEluZGl2aWR1YWw/IGFuZCB3aGF0IGlzIHlvdXIgZmVlZGJhY2sgZm9yIGltcHJvdmVtZW50cyBhbmQgbW9yZT8="
        }
    };
    return parCycle;
}

function getDefaultHeaders(types:InvokerDetails invokerDetails) returns map<string|string[]>? {
    jwt:IssuerConfig issuerConfig = {
        username: "ballerina",
        issuer: "wso2",
        audience: "vEwzbcasJVQm1jVYHUHCjhxZ4tYa",
        expTime: 3600,
        customClaims: {
            email: invokerDetails.email,
            groups: invokerDetails.roles
        },
        signatureConfig: {
            config: {
                keyStore: {
                    path: "tests/resources/test-keystore.jks",
                    password: "testpassword"
                },
                keyAlias: "testing",
                keyPassword: "testpassword"
            }
        }
    };
    string jwt = "Invalid JWT";
    string|error jwtResponse = jwt:issue(issuerConfig);
    if jwtResponse is string {
        jwt = jwtResponse;
    }
    map<string> headers = {"x-jwt-assertion": jwt};

    return headers;
}

function getParCycleById(int parCycleId) returns types:ParCycle|error {
    types:InvokerDetails invokerDetails = getDefaultInvokerDetails();
    http:Response response = check testClient->get("/par-cycles/" + parCycleId.toString(), headers = getDefaultHeaders(invokerDetails));
    json jsonPayload = check response.getJsonPayload();
    types:ParCycle parCycle = check jsonPayload.cloneWithType();
    return parCycle;
}

function getParCycleModifyById(int parCycleId) returns types:ParCycleModify|error {
    types:ParCycle {parCycleName, parCycleStartDate, parCycleEndDate, parEvaluationStartDate,
        parEvaluationEndDate, parEmployeeDeadline, parLeadDeadline, parSpecialRatingDeadline,
        parThreeSixtyRatingDeadline, parCycleStatus} = check getParCycleById(parCycleId);

    types:ParCycleModify optionalParCycle = {
        parCycleName,
        parCycleStartDate,
        parCycleEndDate,
        parEvaluationStartDate,
        parEvaluationEndDate,
        parEmployeeDeadline,
        parLeadDeadline,
        parSpecialRatingDeadline,
        parThreeSixtyRatingDeadline,
        parCycleStatus
    };
    return optionalParCycle;
}

function getYesterdayOf(string date) returns string|error {
    time:Utc utcDate = check types:getUtcDate(date, "test");
    time:Utc yesterday = time:utcAddSeconds(utcDate, -86400);
    time:Civil civilYesterday = time:utcToCivil(yesterday);
    return string `${civilYesterday.year}-${civilYesterday.month.toString().padZero(2)}-${civilYesterday.day.toString().padZero(2)}`;
}

function getTomorrowOf(string date) returns string|error {
    time:Utc utcDate = check types:getUtcDate(date, "test");
    time:Utc tomorrow = time:utcAddSeconds(utcDate, 86400);
    time:Civil civilTomorrow = time:utcToCivil(tomorrow);
    return string `${civilTomorrow.year}-${civilTomorrow.month.toString().padZero(2)}-${civilTomorrow.day.toString().padZero(2)}`;
}

public function getToday() returns string|error =>
    time:utcToString(check getDateTodayUtc()).substring(0, 10);

public function getTomorrow() returns string|error =>
    check getTomorrowOf(check getToday());

public function getTomorrowUtc() returns time:Utc|error =>
    check types:getUtcDate(check getTomorrowOf(check getToday()), "test");

public function getYesterdayUtc() returns time:Utc|error =>
    check types:getUtcDate(check getYesterdayOf(check getToday()), "test");

isolated function getAesEncryptionValueQueryForTests(string value) returns sql:ParameterizedQuery => `
    ${value}
`;

isolated function getAesDecryptionFieldQueryForTests(sql:ParameterizedQuery fieldName)
        returns sql:ParameterizedQuery =>
    sql:queryConcat(`CAST(`, fieldName, ` AS CLOB)`);

isolated function getBlobFieldQueryForTests(sql:ParameterizedQuery fieldName)
        returns sql:ParameterizedQuery =>
    sql:queryConcat(`CAST(`, fieldName, ` AS CLOB)`);

isolated function getParTeamSummaryFromArray(types:ParTeamSummary[] parTeamSummaries, string businessUnit,
        string department, string team, string subTeam, string leadEmail) returns types:ParTeamSummary|error {
    foreach types:ParTeamSummary parTeamSummary in parTeamSummaries {
        if parTeamSummary.parBusinessUnit == businessUnit && parTeamSummary.parDepartment == department &&
                parTeamSummary.parTeam == team && parTeamSummary.parSubTeam == subTeam &&
                parTeamSummary.parLeadEmail == leadEmail {
            return parTeamSummary;
        }
    }
    return error(string `Par team summary not found for the given details. Business unit: ${businessUnit}, ` +
        string `Department: ${department}, Team: ${team}, Sub team: ${subTeam}, Lead email: ${leadEmail}`);
}

function addParSpecialRatingQuota(int parCycleId, string quotaName, int top5Quota, int top20Quota,
        int specialRatingGroupId) returns int|error {
    string createdAndUpdatedBy = "test@wso2.com";
    sql:ParameterizedQuery sqlQuery = `
        INSERT INTO hris_par_special_rating_quota
            (
                par_cycle_id,
                par_special_quota_name,
                par_top5_quota,
                par_top20_quota,
                par_sr_quota_created_by,
                par_sr_quota_updated_by
            )
        VALUES
            (
                ${parCycleId},
                ${quotaName},
                ${top5Quota},
                ${top20Quota},
                ${createdAndUpdatedBy},
                ${createdAndUpdatedBy}
            )
    `;
    sql:ExecutionResult result = check database:execute(sqlQuery);
    return check result.lastInsertId.ensureType();
}

function updateSpecialRatingGroupWithQuota(int specialRatingQuotaId, int specialRatingGroupId) returns error? {
    sql:ParameterizedQuery updateQuery = `
        UPDATE
            hris_par_special_rating_group
        SET
            par_special_quota_id = ${specialRatingQuotaId}
        WHERE
            par_special_rating_group_id = ${specialRatingGroupId}
    `;
    _ = check database:execute(updateQuery);
}

function updateAllParRatings(int parCycleId, types:ParLeadStatus parLeadStatus) returns error? {
    _ = check database:execute(`
        UPDATE
            hris_par_rating
        SET
            par_lead_status = ${parLeadStatus}
        WHERE
            par_cycle_id = ${parCycleId}
    `);
}

function updateParCycleLeadDeadline(int parCycleId, time:Utc date) returns error? {
    string deadline = time:utcToString(date).substring(0, 10);
    _ = check database:execute(`
        UPDATE
            hris_par_cycle
        SET
            par_lead_deadline = ${deadline}
        WHERE
            par_cycle_id = ${parCycleId}
    `);
}

function updateParCycleSpecialRatingDeadline(int parCycleId, time:Utc date) returns error? {
    string deadline = time:utcToString(date).substring(0, 10);
    _ = check database:execute(`
        UPDATE
            hris_par_cycle
        SET
            par_special_rating_deadline = ${deadline}
        WHERE
            par_cycle_id = ${parCycleId}
    `);
}

function updateParCycleEmployeeDeadline(int parCycleId, time:Utc date) returns error? {
    string deadline = time:utcToString(date).substring(0, 10);
    _ = check database:execute(`
        UPDATE
            hris_par_cycle
        SET
            par_employee_deadline = ${deadline}
        WHERE
            par_cycle_id = ${parCycleId}
    `);
}

function updateParCycle360ReviewDeadline(int parCycleId, time:Utc date) returns error? {
    string deadline = time:utcToString(date).substring(0, 10);
    _ = check database:execute(`
        UPDATE
            hris_par_cycle
        SET
            par_three_sixty_rating_deadline = ${deadline}
        WHERE
            par_cycle_id = ${parCycleId}
    `);
}

function updateParRatingEmployeeStatus(int parCycleId, int parRatingId, types:ParEmployeeStatus parEmployeeStatus)
        returns error? {
    _ = check database:execute(`
        UPDATE
            hris_par_rating
        SET
            par_employee_status = ${parEmployeeStatus}
        WHERE
            par_cycle_id = ${parCycleId} AND
            par_rating_id = ${parRatingId}
    `);
}

function updateParRatingLeadStatus(int parCycleId, int parRatingId, types:ParLeadStatus parLeadStatus)
        returns error? {
    _ = check database:execute(`
        UPDATE
            hris_par_rating
        SET
            par_lead_status = ${parLeadStatus}
        WHERE
            par_cycle_id = ${parCycleId} AND
            par_rating_id = ${parRatingId}
    `);
}

function getEmailNotificationsFromDB(int parCycleId) returns database:EmailNotification[]|sql:Error {
    sql:ParameterizedQuery sqlQuery = `
        SELECT
            par_email_id,
            par_cycle_id,
            par_email_recipient_email,
            par_email_recipient_name,
            par_email_type,
            par_email_status,
            CAST(par_email_template_data AS CLOB) AS par_email_template_data
        FROM hris_par_email
        WHERE par_cycle_id = ${parCycleId}`;

    stream<record {}, sql:Error?> resultStream = database:query(sqlQuery, database:EmailNotification);
    return check from record {} emailNotification in resultStream
        select <database:EmailNotification>emailNotification;
}

function sendEmail(email:EmailRecord emailRecord) returns error? {
    globalEmailRecordArray.push(emailRecord.cloneReadOnly());
}

function clearCache() returns error? {
    lock {
        _ = check entity:clearCache();
    }
}

isolated function getSqlQueries(string path) returns sql:ParameterizedQuery[]|error {
    string[]|error lines = io:fileReadLines(path);
    if lines is error {
        return [];
    }

    sql:ParameterizedQuery[] sqlQueries = [];
    foreach string line in lines {
        if line.startsWith("SELECT") || line.startsWith("UPDATE") || line.startsWith("INSERT") || line.startsWith("DELETE") {
            sql:ParameterizedQuery sqlQuery = ``;
            sqlQuery.strings = [re `\\'`.replaceAll(line, "\\''")];
            sqlQueries.push(sqlQuery);
        }
    }
    return sqlQueries;
}
