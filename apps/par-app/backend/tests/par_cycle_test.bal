// Copyright (c) 2024, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.
import par_app.database;
import par_app.entity;
import par_app.types;

import ballerina/http;
import ballerina/sql;
import ballerina/test;
import ballerinax/h2.driver as _;
import ballerinax/java.jdbc;

final http:Client testClient = check new ("http://localhost:9090");

final int MAX_DELAY = 10;

@test:Mock {
    moduleName: "par_app.database",
    functionName: "initDbClient"
}
function getMockDbClient() returns jdbc:Client|error {
    jdbc:Client dbClient = check new (
        url = "jdbc:h2:mem:testdb;MODE=MYSQL",
        user = "sa",
        password = ""
    );
    return test:mock(jdbc:Client, dbClient);
};

@test:Mock {
    moduleName: "par_app.entity",
    functionName: "getAllActiveEmployees"
}
test:MockFunction getAllActiveEmployeesMockFn = new ();

@test:Mock {
    moduleName: "par_app.entity",
    functionName: "getEmployee"
}
test:MockFunction getEmployeeMockFn = new ();

@test:Mock {
    moduleName: "par_app.database",
    functionName: "insertDefaultParRatingsBulk"
}
test:MockFunction insertDefaultParRatingsBulkMockFn = new ();

@test:BeforeSuite
isolated function beforeSuite() returns error? {

    _ = check database:execute(`DROP TABLE IF EXISTS hris_par_rating`);
    _ = check database:execute(`DROP TABLE IF EXISTS hris_par_cycle`);
    _ = check database:execute(`DROP TABLE IF EXISTS hris_par_special_rating_group`);
    _ = check database:execute(`DROP TABLE IF EXISTS hris_par_team`);
    _ = check database:execute(`DROP TABLE IF EXISTS hris_par_360_review`);
    _ = check database:execute(`DROP TABLE IF EXISTS hris_par_special_rating_quota`);
    _ = check database:execute(`DROP TABLE IF EXISTS hris_par_configs`);
    _ = check database:execute(`DROP TABLE IF EXISTS hris_par_email`);

    _ = check database:execute(`
        CREATE TABLE hris_par_cycle(
            par_cycle_id int NOT NULL AUTO_INCREMENT,
            par_cycle_name varchar(300) NOT NULL,
            par_cycle_start_date date NOT NULL,
            par_cycle_end_date date NOT NULL,
            par_evaluation_start_date date NOT NULL,
            par_evaluation_end_date date NOT NULL,
            par_special_rating_deadline date NOT NULL,
            par_three_sixty_rating_deadline date NOT NULL,
            par_employee_deadline date NOT NULL,
            par_lead_deadline date NOT NULL,
            par_cycle_config mediumtext NOT NULL,
            par_cycle_status varchar(20) NOT NULL,
            par_cycle_created_by varchar(60) NOT NULL,
            par_cycle_created_on timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
            par_cycle_updated_by varchar(60) NOT NULL,
            par_cycle_updated_on timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
            PRIMARY KEY (par_cycle_id),
            KEY par_cycle_id_idx (par_cycle_id),
            KEY par_cycle_status_idx (par_cycle_status)
        )`);

    _ = check database:execute(`
        CREATE TABLE hris_par_rating (
            par_rating_id int NOT NULL AUTO_INCREMENT,
            par_employee_email varchar(60) NOT NULL,
            par_employee_name varchar(200) NOT NULL,
            par_cycle_id int NOT NULL,
            par_company varchar(45) NOT NULL,
            par_location varchar(45) NOT NULL,
            par_team_id int NOT NULL,
            par_rating blob NOT NULL,
            par_special_rating blob NOT NULL,
            par_employee_comment mediumblob,
            par_employee_status varchar(30) DEFAULT NULL,
            par_lead_comment mediumblob,
            par_lead_status varchar(30) DEFAULT NULL,
            par_f2f_status varchar(30) DEFAULT NULL,
            par_f2f_date timestamp(6) NULL DEFAULT NULL,
            par_employee_acceptance_status varchar(30) DEFAULT NULL,
            par_employee_acceptance_comment mediumblob,
            par_admin_comment mediumblob,
            par_rating_created_by varchar(60) NOT NULL,
            par_rating_created_on timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
            par_rating_updated_by varchar(60) NOT NULL,
            par_rating_updated_on timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
            PRIMARY KEY (par_rating_id),
            UNIQUE KEY par_employee_email_cycle_id_UNIQUE (par_employee_email,par_cycle_id),
            KEY fk_par_rating_par_cycle_idx (par_cycle_id),
            CONSTRAINT fk_par_rating_par_cycle FOREIGN KEY (par_cycle_id) REFERENCES hris_par_cycle (par_cycle_id)
        )`);

    _ = check database:execute(`
        CREATE TABLE hris_par_special_rating_group (
            par_special_rating_group_id int NOT NULL AUTO_INCREMENT,
            par_cycle_id int NOT NULL,
            par_business_unit varchar(60) NOT NULL,
            par_department varchar(60) NOT NULL,
            par_special_quota_id int DEFAULT NULL,
            par_sr_group_created_by varchar(60) NOT NULL,
            par_sr_group_created_on timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
            par_sr_group_updated_by varchar(60) NOT NULL,
            par_sr_group_updated_on timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
                ON UPDATE CURRENT_TIMESTAMP(6),
            PRIMARY KEY (par_special_rating_group_id),
            KEY fk_hris_par_special_rating_group_par_cycle_idx (par_cycle_id),
            CONSTRAINT fk_hris_par_special_rating_group_par_cycle FOREIGN KEY (par_cycle_id)
                REFERENCES hris_par_cycle (par_cycle_id)
        )`);

    _ = check database:execute(`
        CREATE TABLE hris_par_team (
            par_team_id int NOT NULL AUTO_INCREMENT,
            par_cycle_id int NOT NULL,
            par_business_unit varchar(100) NOT NULL,
            par_department varchar(100) NOT NULL,
            par_team varchar(100) NOT NULL,
            par_sub_team varchar(100) DEFAULT NULL,
            par_lead_email varchar(100) NOT NULL,
            par_special_rating_group_id int NOT NULL,
            par_team_created_by varchar(60) NOT NULL,
            par_team_created_on timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
            par_team_updated_by varchar(60) NOT NULL,
            par_team_updated_on timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
            PRIMARY KEY (par_team_id),
            KEY fk_par_team_par_cycle_idx (par_cycle_id),
            KEY fk_par_team_par_special_rating_department_idx (par_special_rating_group_id),
            CONSTRAINT fk_par_team_par_cycle FOREIGN KEY (par_cycle_id) REFERENCES hris_par_cycle (par_cycle_id),
            CONSTRAINT fk_par_team_par_special_rating_department FOREIGN KEY (par_special_rating_group_id)
                REFERENCES hris_par_special_rating_group (par_special_rating_group_id)
        )`);

    _ = check database:execute(`
        CREATE TABLE hris_par_360_review (
            par_employee_email varchar(60) NOT NULL,
            par_reviewer_email varchar(60) NOT NULL,
            par_cycle_id int NOT NULL,
            par_360_rating blob NOT NULL,
            par_360_comment mediumblob,
            par_360_status varchar(30) NOT NULL,
            par_360_employee_requested boolean NOT NULL DEFAULT '0',
            par_360_lead_requested boolean NOT NULL DEFAULT '0',
            par_360_created_by varchar(60) NOT NULL,
            par_360_created_on timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
            par_360_updated_by varchar(60) NOT NULL,
            par_360_updated_on timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
            PRIMARY KEY (par_employee_email,par_reviewer_email,par_cycle_id)
        )`);

    _ = check database:execute(`
        CREATE TABLE hris_par_special_rating_quota (
            par_quota_id int NOT NULL AUTO_INCREMENT,
            par_cycle_id int NOT NULL,
            par_special_quota_name varchar(100) DEFAULT NULL,
            par_top5_quota int NOT NULL DEFAULT '0',
            par_top20_quota int NOT NULL DEFAULT '0',
            par_sr_quota_created_by varchar(60) NOT NULL,
            par_sr_quota_created_on timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
            par_sr_quota_updated_by varchar(60) NOT NULL,
            par_sr_quota_updated_on timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
            PRIMARY KEY (par_quota_id),
            KEY fk_par_special_rating_quota_par_cycle_idx (par_cycle_id),
            CONSTRAINT fk_par_special_rating_quota_par_cycle FOREIGN KEY (par_cycle_id) REFERENCES hris_par_cycle (par_cycle_id)
        )`);

    _ = check database:execute(`
        CREATE TABLE hris_par_configs (
            par_config_key varchar(100) NOT NULL,
            par_config_value mediumtext NOT NULL,
            par_config_created_by varchar(60) NOT NULL,
            par_config_created_on timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
            par_config_updated_by varchar(60) NOT NULL,
            par_config_updated_on timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
            PRIMARY KEY (par_config_key)
        )`);

    _ = check database:execute(`
        CREATE TABLE hris_par_email (
            par_email_id int NOT NULL AUTO_INCREMENT,
            par_cycle_id int NOT NULL,
            par_email_recipient_email varchar(100) NOT NULL,
            par_email_recipient_name varchar(100) NOT NULL,
            par_email_type varchar(60) NOT NULL,
            par_email_trigger_details varchar(100) NOT NULL,
            par_email_status varchar(60) NOT NULL,
            par_email_template_data mediumblob NOT NULL,
            PRIMARY KEY (par_email_id)
        )`);

    sql:ParameterizedQuery[] sqlQueries = check getSqlQueries("db_scripts/par_config_default.sql");
    foreach sql:ParameterizedQuery query in sqlQueries {
        _ = check database:execute(query);
    }
}

@test:Config {
    groups: ["CreateParCycleBasicTests"]
}
function testCreateParCycleWithInvalidDatesForParCycleStartEndDates() returns error? {

    types:InvokerDetails invokerDetails = getDefaultInvokerDetails();
    test:when(getAllActiveEmployeesMockFn).thenReturn(getDefaultEmployees());

    types:ParCycleCreate requestForStartDateOfParCycle = getDefaultParCycleCreate();

    requestForStartDateOfParCycle.parCycleStartDate = "2022-01-03";
    requestForStartDateOfParCycle.parCycleEndDate = "2022-01-03";
    http:Response response = check testClient->post("/par-cycles", requestForStartDateOfParCycle, headers = getDefaultHeaders(invokerDetails));

    test:assertEquals(response.statusCode, http:STATUS_BAD_REQUEST, "An error is not thrown when creating a PAR cycle with same par cycle start and end dates.");
    test:assertEquals(response.getJsonPayload(), {"message": "The 'parCycleStartDate' should be earlier than 'parCycleEndDate'"});

    requestForStartDateOfParCycle.parCycleStartDate = "2022-01-04";
    requestForStartDateOfParCycle.parCycleEndDate = "2022-01-03";
    response = check testClient->post("/par-cycles", requestForStartDateOfParCycle, headers = getDefaultHeaders(invokerDetails));

    test:assertEquals(response.statusCode, http:STATUS_BAD_REQUEST, "An error is not thrown when creating a PAR cycle with par cycle start date after par cycle end date.");
    test:assertEquals(response.getJsonPayload(), {"message": "The 'parCycleStartDate' should be earlier than 'parCycleEndDate'"});
}

@test:Config {
    groups: ["CreateParCycleBasicTests"]
}
function testCreateParCycleWithInvalidDatesForParEvaluationStartEndDate() returns error? {
    types:InvokerDetails invokerDetails = getDefaultInvokerDetails();
    test:when(getAllActiveEmployeesMockFn).thenReturn(getDefaultEmployees());

    types:ParCycleCreate requestForEvaluationDatesParCycle = getDefaultParCycleCreate();

    requestForEvaluationDatesParCycle.parEvaluationStartDate = "2022-01-03";
    requestForEvaluationDatesParCycle.parEvaluationEndDate = "2022-01-03";
    http:Response response = check testClient->post("/par-cycles", requestForEvaluationDatesParCycle,
        headers = getDefaultHeaders(invokerDetails));

    test:assertEquals(response.statusCode, http:STATUS_BAD_REQUEST,
        "An error is not thrown when creating a PAR cycle with same par evaluation start and end dates.");
    test:assertEquals(response.getJsonPayload(), {
        "message": "The 'parEvaluationStartDate' should be earlier than 'parEvaluationEndDate', " +
        "The 'parSpecialRatingDeadline' must be set between 'parEvaluationStartDate' and 'parEvaluationEndDate', " +
        "The 'parThreeSixtyRatingDeadline' must be set between 'parEvaluationStartDate' and 'parEvaluationEndDate', " +
        "The 'parEmployeeDeadline' must be set between 'parEvaluationStartDate' and 'parEvaluationEndDate', " +
        "The 'parLeadDeadline' must be set between 'parEvaluationStartDate' and 'parEvaluationEndDate'"
    });

    requestForEvaluationDatesParCycle.parEvaluationStartDate = "2022-01-04";
    requestForEvaluationDatesParCycle.parEvaluationEndDate = "2022-01-03";
    response = check testClient->post("/par-cycles", requestForEvaluationDatesParCycle,
        headers = getDefaultHeaders(invokerDetails));

    test:assertEquals(response.statusCode, http:STATUS_BAD_REQUEST,
        "An error is not thrown when creating a PAR cycle with par evaluation start date after par evaluation end date.");
    test:assertEquals(response.getJsonPayload(), {
        "message": "The 'parEvaluationStartDate' should be earlier than 'parEvaluationEndDate', " +
        "The 'parSpecialRatingDeadline' must be set between 'parEvaluationStartDate' and 'parEvaluationEndDate', " +
        "The 'parThreeSixtyRatingDeadline' must be set between 'parEvaluationStartDate' and 'parEvaluationEndDate', " +
        "The 'parEmployeeDeadline' must be set between 'parEvaluationStartDate' and 'parEvaluationEndDate', " +
        "The 'parLeadDeadline' must be set between 'parEvaluationStartDate' and 'parEvaluationEndDate'"
    });
}

@test:Config {
    groups: ["CreateParCycleBasicTests"]
}
function testCreateParCycleWithInvalidDateForSpecialParRatingDeadline() returns error? {

    types:InvokerDetails invokerDetails = getDefaultInvokerDetails();
    test:when(getAllActiveEmployeesMockFn).thenReturn(getDefaultEmployees());

    types:ParCycleCreate requestForSpecialParRatingsDeadline = getDefaultParCycleCreate();

    requestForSpecialParRatingsDeadline.parSpecialRatingDeadline = check getYesterdayOf(requestForSpecialParRatingsDeadline.parEvaluationStartDate);
    http:Response response = check testClient->post("/par-cycles", requestForSpecialParRatingsDeadline, headers = getDefaultHeaders(invokerDetails));

    test:assertEquals(response.statusCode, http:STATUS_BAD_REQUEST, "An error is not thrown when creating a PAR cycle with par special rating deadline before the par evaluation start date.");
    test:assertEquals(response.getJsonPayload(), {"message": "The 'parSpecialRatingDeadline' must be set between 'parEvaluationStartDate' and 'parEvaluationEndDate'"});

    requestForSpecialParRatingsDeadline.parSpecialRatingDeadline = check getTomorrowOf(requestForSpecialParRatingsDeadline.parEvaluationEndDate);
    response = check testClient->post("/par-cycles", requestForSpecialParRatingsDeadline, headers = getDefaultHeaders(invokerDetails));

    test:assertEquals(response.statusCode, http:STATUS_BAD_REQUEST, "An error is not thrown when creating a PAR cycle with par special rating deadline after the par evaluation end date.");
    test:assertEquals(response.getJsonPayload(), {"message": "The 'parSpecialRatingDeadline' must be set between 'parEvaluationStartDate' and 'parEvaluationEndDate'"});
}

@test:Config {
    groups: ["CreateParCycleBasicTests"]
}
function testCreateParCycleWithInvalidDateForThreeSixtyRatingDeadline() returns error? {

    types:InvokerDetails invokerDetails = getDefaultInvokerDetails();
    test:when(getAllActiveEmployeesMockFn).thenReturn(getDefaultEmployees());

    types:ParCycleCreate requestForThreeSixtyRatingsDeadline = getDefaultParCycleCreate();

    requestForThreeSixtyRatingsDeadline.parThreeSixtyRatingDeadline = check getYesterdayOf(requestForThreeSixtyRatingsDeadline.parEvaluationStartDate);
    http:Response response = check testClient->post("/par-cycles", requestForThreeSixtyRatingsDeadline, headers = getDefaultHeaders(invokerDetails));

    test:assertEquals(response.statusCode, http:STATUS_BAD_REQUEST, "An error is not thrown when creating a PAR cycle with par special rating deadline before the par evaluation start date.");
    test:assertEquals(response.getJsonPayload(), {"message": "The 'parThreeSixtyRatingDeadline' must be set between 'parEvaluationStartDate' and 'parEvaluationEndDate'"});

    requestForThreeSixtyRatingsDeadline.parThreeSixtyRatingDeadline = check getTomorrowOf(requestForThreeSixtyRatingsDeadline.parEvaluationEndDate);
    response = check testClient->post("/par-cycles", requestForThreeSixtyRatingsDeadline, headers = getDefaultHeaders(invokerDetails));

    test:assertEquals(response.statusCode, http:STATUS_BAD_REQUEST, "An error is not thrown when creating a PAR cycle with par special rating deadline after the par evaluation end date.");
    test:assertEquals(response.getJsonPayload(), {"message": "The 'parThreeSixtyRatingDeadline' must be set between 'parEvaluationStartDate' and 'parEvaluationEndDate'"});
}

@test:Config {
    groups: ["CreateParCycleBasicTests"]
}
function testCreateParCycleWithInvalidDateForEmplaoyeeParDeadline() returns error? {

    types:InvokerDetails invokerDetails = getDefaultInvokerDetails();
    test:when(getAllActiveEmployeesMockFn).thenReturn(getDefaultEmployees());

    types:ParCycleCreate requestForEmployeeParDeadline = getDefaultParCycleCreate();

    requestForEmployeeParDeadline.parEmployeeDeadline = check getYesterdayOf(requestForEmployeeParDeadline.parEvaluationStartDate);
    http:Response response = check testClient->post("/par-cycles", requestForEmployeeParDeadline, headers = getDefaultHeaders(invokerDetails));

    test:assertEquals(response.statusCode, http:STATUS_BAD_REQUEST, "An error is not thrown when creating a PAR cycle with employee par deadline before the par evaluation start date.");
    test:assertEquals(response.getJsonPayload(), {"message": "The 'parEmployeeDeadline' must be set between 'parEvaluationStartDate' and 'parEvaluationEndDate'"});

    requestForEmployeeParDeadline.parEmployeeDeadline = check getTomorrowOf(requestForEmployeeParDeadline.parEvaluationEndDate);
    response = check testClient->post("/par-cycles", requestForEmployeeParDeadline, headers = getDefaultHeaders(invokerDetails));

    test:assertEquals(response.statusCode, http:STATUS_BAD_REQUEST, "An error is not thrown when creating a PAR cycle with employee par deadline after the par evaluation end date.");
    test:assertEquals(response.getJsonPayload(), {"message": "The 'parEmployeeDeadline' must be set between 'parEvaluationStartDate' and 'parEvaluationEndDate', The 'parEmployeeDeadline' must be earlier than 'parLeadDeadline'"});
}

@test:Config {
    groups: ["CreateParCycleBasicTests"]
}
function testCreateParCycleWithInvalidDateForLeadParDeadline() returns error? {

    types:InvokerDetails invokerDetails = getDefaultInvokerDetails();
    test:when(getAllActiveEmployeesMockFn).thenReturn(getDefaultEmployees());

    types:ParCycleCreate requestForLeadParDeadline = getDefaultParCycleCreate();

    requestForLeadParDeadline.parLeadDeadline = check getYesterdayOf(requestForLeadParDeadline.parEvaluationStartDate);
    http:Response response = check testClient->post("/par-cycles", requestForLeadParDeadline, headers = getDefaultHeaders(invokerDetails));

    test:assertEquals(response.statusCode, http:STATUS_BAD_REQUEST, "An error is not thrown when creating a PAR cycle with lead par deadline before the par evaluation start date.");
    test:assertEquals(response.getJsonPayload(), {"message": "The 'parLeadDeadline' must be set between 'parEvaluationStartDate' and 'parEvaluationEndDate', The 'parEmployeeDeadline' must be earlier than 'parLeadDeadline'"});

    requestForLeadParDeadline.parLeadDeadline = check getTomorrowOf(requestForLeadParDeadline.parEvaluationEndDate);
    response = check testClient->post("/par-cycles", requestForLeadParDeadline, headers = getDefaultHeaders(invokerDetails));

    test:assertEquals(response.statusCode, http:STATUS_BAD_REQUEST, "An error is not thrown when creating a PAR cycle with lead par deadline after the par evaluation end date.");
    test:assertEquals(response.getJsonPayload(), {"message": "The 'parLeadDeadline' must be set between 'parEvaluationStartDate' and 'parEvaluationEndDate'"});
}

@test:Config {
    groups: ["CreateParCycleBasicTests"]
}
function testCreateParCycle() returns error? {

    types:InvokerDetails invokerDetails = getDefaultInvokerDetails();
    types:ParCycleCreate requestParCycle = getDefaultParCycleCreate();
    types:ParCycle expectedParCycle = getDefaultExpectedParCycle(invokerDetails);

    test:when(insertDefaultParRatingsBulkMockFn).callOriginal();
    test:when(getAesEncryptionValueQueryMockFn).call("getAesEncryptionValueQueryForTests");
    test:when(getAesDecryptionFieldQueryMockFn).call("getAesDecryptionFieldQueryForTests");
    test:when(getEmployeeMockFn).call("getEmployeeByEmail");

    entity:Employee[] employees = getDefaultMultipleEmployees(250);
    test:when(getAllActiveEmployeesMockFn).thenReturn(employees);

    http:Response response = check testClient->post("/par-cycles", requestParCycle,
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_CREATED,
        string `Invalid status code received when creating a PAR cycle. ` +
        string `Expected: ${http:STATUS_CREATED}, but found: ${response.statusCode}`);

    json jsonPayload = check response.getJsonPayload();
    types:ParCycle result = check jsonPayload.cloneWithType();
    test:assertEquals(result, expectedParCycle);

    check waitUntilParCycleStatusIsUpdated(<int>result.parCycleId, types:PENDING_QUOTA, MAX_DELAY);

    response = check testClient->post(string `/par-cycles/${<int>result.parCycleId}/special-rating-groups-quota`,
        getParSpecialRatingGroupQuota_One(), headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_OK,
        string `Invalid status code received when creating par special rating quota. ` +
        string `Expected: ${http:STATUS_OK}, but found: ${response.statusCode}`);

    types:ParCycleModify parCycle = check getParCycleModifyById(1);
    parCycle.parCycleStatus = types:OPEN;
    response = check testClient->patch(string `/par-cycles/${<int>result.parCycleId}`, parCycle,
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_OK,
        string `Invalid status code received when modifying the PAR cycle status. ` +
        string `Expected: ${http:STATUS_OK}, but found: ${response.statusCode}`);

    database:ParRating[] parRatingsFromDB = check getParRatingsFromDB(1);
    test:assertEquals(parRatingsFromDB.length(), 250);
    test:assertEquals(parRatingsFromDB[0].parCycleId, result.parCycleId);
    test:assertEquals(parRatingsFromDB[0].parRatingId, 1);
    test:assertEquals(parRatingsFromDB[0].parEmployeeEmail, employees[0].workEmail);
    test:assertEquals((check database:getParTeam(parRatingsFromDB[0].parTeamId)).parLeadEmail,
        employees[0].managerEmail);
    test:assertEquals(parRatingsFromDB[99].parCycleId, result.parCycleId);
    test:assertEquals(parRatingsFromDB[99].parRatingId, 100);
    test:assertEquals(parRatingsFromDB[99].parEmployeeEmail, employees[99].workEmail);
    test:assertEquals((check database:getParTeam(parRatingsFromDB[99].parTeamId)).parLeadEmail,
        employees[99].managerEmail);
    test:assertEquals(parRatingsFromDB[249].parCycleId, result.parCycleId);
    test:assertEquals(parRatingsFromDB[249].parRatingId, 250);
    test:assertEquals(parRatingsFromDB[249].parEmployeeEmail, employees[249].workEmail);
    test:assertEquals((check database:getParTeam(parRatingsFromDB[249].parTeamId)).parLeadEmail,
        employees[249].managerEmail);
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testCreateParCycle]
}
function testCreateParCycleWhileHavingAnActiveParCycle() returns error? {

    types:InvokerDetails invokerDetails = getDefaultInvokerDetails();
    types:ParCycleCreate requestParCycle = getDefaultParCycleCreate();

    http:Response response = check testClient->post("/par-cycles", requestParCycle, headers = getDefaultHeaders(invokerDetails));

    test:assertEquals(response.statusCode, http:STATUS_CONFLICT, "An error is not thrown when creating a PAR cycle while having an active PAR cycle.");

    json jsonPayload = check response.getJsonPayload();

    test:assertEquals(jsonPayload, {"message": "There is already an active PAR cycle. Please close the active PAR cycle before creating a new one."});
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testCreateParCycle]
}
function testGetParCycle() returns error? {

    types:InvokerDetails invokerDetails = getDefaultInvokerDetails();
    types:ParCycle expectedParCycle = getDefaultExpectedParCycle(invokerDetails);
    expectedParCycle.parCycleStatus = types:OPEN;

    http:Response response = check testClient->get("/par-cycles/1", headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_OK);

    json jsonPayload = check response.getJsonPayload();
    types:ParCycle parCycle = check jsonPayload.cloneWithType();
    test:assertEquals(parCycle, expectedParCycle);
}

@test:Config {
    groups: ["CreateParCycleBasicTests"]
}
function testGetParCycleUnavailableParCycleId() returns error? {

    types:InvokerDetails invokerDetails = getDefaultInvokerDetails();
    http:Response response = check testClient->get("/par-cycles/100", headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_NOT_FOUND);

    json jsonPayload = check response.getJsonPayload();
    test:assertEquals(jsonPayload, {"message": "ParCycle not found for the given parCycleId: 100"});
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testGetParCycle]
}
function testModifyParCycles() returns error? {

    types:ParCycleModify parCycle = check getParCycleModifyById(1);
    parCycle.parCycleStatus = types:OPEN;

    types:InvokerDetails invokerDetails = getDefaultInvokerDetails();
    types:ParCycle expectedParCycle = getDefaultExpectedParCycle(invokerDetails);
    expectedParCycle.parCycleStatus = types:OPEN;

    http:Response response = check testClient->patch("/par-cycles/1", parCycle, headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_OK);
    json jsonPayload = check response.getJsonPayload();
    types:ParCycle modifyParCycleResult = check jsonPayload.cloneWithType();
    test:assertEquals(modifyParCycleResult, expectedParCycle);

    // Test modifying all modifiable fields
    types:ParCycle expectedParCycle2 = modifyAllModifiableFieldsInParCycle(getDefaultExpectedParCycle(invokerDetails));
    expectedParCycle2.parCycleStatus = types:OPEN;
    types:ParCycleModify parCycle2 = getModifiedParCycleWthAllModifiableFields();

    http:Response response2 = check testClient->patch("/par-cycles/1", parCycle2, headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response2.statusCode, http:STATUS_OK);
    json jsonPayload2 = check response2.getJsonPayload();
    types:ParCycle modifyParCycleResult2 = check jsonPayload2.cloneWithType();
    test:assertEquals(modifyParCycleResult2, expectedParCycle2);
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testModifyParCycles]
}
function testModifyParCyclesWithAFewFieldsInBody() returns error? {

    types:InvokerDetails invokerDetails = getDefaultInvokerDetails();

    string modifiedEmployeeParQuestion = "Sm9iIEV4ZWN1dGlvbiwgVGVhbSBXb3JrLCBDb21tdW5pY2F0aW9uLCBMZWFkZXJzaGlwLCBFeHRlcm5hbCBBY3Rpdml0aWVz";
    types:ParCycleModify parCycle = {
        parCycleStartDate: "2022-01-05",
        parEmployeeDeadline: "2023-12-28",
        parLeadDeadline: "2023-12-29",
        parCycleConfigurations: {
            employeeParQuestion: modifiedEmployeeParQuestion
        }
    };

    http:Response response = check testClient->patch("/par-cycles/1", parCycle, headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_OK, "Invalid status code received when modifying a PAR cycle with a few fields in the request body. Expected: 200, but found: " + response.statusCode.toString());

    json jsonPayload = check response.getJsonPayload();
    types:ParCycle modifyParCycleResult = check jsonPayload.cloneWithType();

    test:assertEquals(modifyParCycleResult.parCycleStartDate, parCycle.parCycleStartDate, "The parCycleStartDate is not modified as expected");
    test:assertEquals(modifyParCycleResult.parEmployeeDeadline, parCycle.parEmployeeDeadline, "The parEmployeeDeadline is not modified as expected");
    test:assertEquals(modifyParCycleResult.parLeadDeadline, parCycle.parLeadDeadline, "The parLeadDeadline is not modified as expected");
    test:assertEquals(modifyParCycleResult.parCycleConfigurations.employeeParQuestion, modifiedEmployeeParQuestion, "The parCycleConfigurations.employeeParQuestion is not modified as expected");
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testModifyParCycles]
}
function testModifyParCycles_InvalidParEmployeeDeadline() returns error? {

    types:InvokerDetails invokerDetails = getDefaultInvokerDetails();

    types:ParCycleModify parCycle = {
        parEmployeeDeadline: "2022-12-500"
    };

    http:Response response = check testClient->patch("/par-cycles/1", parCycle, headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_BAD_REQUEST, "Invalid status code received when modifying a PAR cycle with invalid parEmployeeDeadline. Expected: 400, but found: " + response.statusCode.toString());

    json jsonPayload = check response.getJsonPayload();
    test:assertEquals(jsonPayload.message, "payload validation failed: Validation failed for '$.parEmployeeDeadline:pattern' constraint(s).");
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testModifyParCycles]
}
function testModifyParCycles_InvalidParCycleConfigurationsEmployeeParQuestion() returns error? {

    types:InvokerDetails invokerDetails = getDefaultInvokerDetails();

    types:ParCycleModify parCycle = {
        parCycleConfigurations: {
            employeeParQuestion: "This text contains non printable charanters \n. Hense validation should fail."
        }
    };

    http:Response response = check testClient->patch("/par-cycles/1", parCycle, headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_BAD_REQUEST, "Invalid status code received when modifying a PAR cycle with invalid parCycleConfigurations.employeeParQuestion. Expected: 400, but found: " + response.statusCode.toString());

    json jsonPayload = check response.getJsonPayload();
    test:assertEquals(jsonPayload.message, "payload validation failed: Validation failed for '$.parCycleConfigurations.employeeParQuestion:pattern' constraint(s).");
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testModifyParCyclesWithAFewFieldsInBody]
}
function testModifyUnmodifieableFieldInParCycle() returns error? {

    types:InvokerDetails invokerDetails = getDefaultInvokerDetails();

    types:ParCycleModify parCycle = check getParCycleModifyById(1);
    parCycle.parCycleConfigurations.parRatings = ["successful"];

    http:Response response = check testClient->patch("/par-cycles/1", parCycle, headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_UNPROCESSABLE_ENTITY, "An unprocessable entity status code is not thrown when modifying PAR ratings in the PAR cycle. Expected: 422, but found: " + response.statusCode.toString());

    json jsonPayload = check response.getJsonPayload();
    test:assertEquals(jsonPayload, {"message": "Cannot modify PAR ratings after the PAR Cycle is created."});

    types:ParCycleModify parCycle2 = check getParCycleModifyById(1);
    parCycle2.parCycleConfigurations.threeSixtyReviewRatings = ["successful"];

    http:Response response2 = check testClient->patch("/par-cycles/1", parCycle2, headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response2.statusCode, http:STATUS_UNPROCESSABLE_ENTITY, "An unprocessable entity status code is not thrown when modifying 360 ratings in the PAR cycle. Expected: 422, but found: " + response2.statusCode.toString());

    json jsonPayload2 = check response2.getJsonPayload();
    test:assertEquals(jsonPayload2, {"message": "Cannot modify Threesixty ratings after the PAR Cycle is created."});
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testModifyUnmodifieableFieldInParCycle]
}
function testCloseParCycle_WithUnsharedParRatings() returns error? {

    types:InvokerDetails invokerDetails = getDefaultInvokerDetails();
    types:ParCycleModify parCycle = {
        parCycleStatus: types:CLOSED
    };
    http:Response response = check testClient->patch("/par-cycles/1", parCycle,
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_UNPROCESSABLE_ENTITY,
        string `Invalid status code received when closing a PAR cycle. ` +
            string `Expected: ${http:STATUS_UNPROCESSABLE_ENTITY}, but found: ${response.statusCode.toString()}`);
    json jsonPayload = check response.getJsonPayload();
    test:assertEquals(jsonPayload, {"message": "Cannot close the PAR cycle as there are '250' unshared PAR ratings."});
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testCloseParCycle_WithUnsharedParRatings]
}
function testCloseParCycle() returns error? {
    types:InvokerDetails invokerDetails = getDefaultInvokerDetails();
    types:ParCycleModify parCycle = {
        parCycleStatus: types:CLOSED
    };
    check updateAllParRatings(1, types:SHARED);

    types:ParCycle expectedParCycle = check getParCycleById(1);
    expectedParCycle.parCycleStatus = types:CLOSED;

    http:Response response = check testClient->patch("/par-cycles/1", parCycle, headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_OK,
        string `Invalid status code received when closing a PAR cycle. ` +
            string `Expected: ${http:STATUS_OK}, but found: ${response.statusCode.toString()}`);

    json jsonPayload = check response.getJsonPayload();
    types:ParCycle modifyParCycleResult = check jsonPayload.cloneWithType();
    test:assertEquals(modifyParCycleResult, expectedParCycle);
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testCloseParCycle]
}
function testCloseAlreadyClosedParCycle() returns error? {

    types:InvokerDetails invokerDetails = getDefaultInvokerDetails();
    types:ParCycleModify parCycle = {
        parCycleStatus: types:CLOSED
    };

    http:Response response = check testClient->patch("/par-cycles/1", parCycle, headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_UNPROCESSABLE_ENTITY, "An unprocessable entity status code is not thrown when closing an already closed PAR cycle. Expected: 422, but found: " + response.statusCode.toString());

    json jsonPayload = check response.getJsonPayload();
    test:assertEquals(jsonPayload, {"message": "PAR cycle is closed. Cannot modify a closed PAR cycle."});
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testGetParCycle]
}
function testModifyParCyclesWithNonExistingParCycleId() returns error? {

    types:InvokerDetails invokerDetails = getDefaultInvokerDetails();
    types:ParCycleModify parCycle = {
        parCycleStartDate: "2021-01-05",
        parLeadDeadline: "2021-12-29"
    };

    http:Response response = check testClient->patch("/par-cycles/100", parCycle, headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_NOT_FOUND, "An error is not thrown when modifying a non-existing PAR cycle. Expected: 404, but found: " + response.statusCode.toString());

    json jsonPayload = check response.getJsonPayload();
    test:assertEquals(jsonPayload, {"message": "ParCycle not found for the given parCycleId: 100"});
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testCloseParCycle]
}
function testModifyOfAlreadyClosedParCycle() returns error? {

    types:InvokerDetails invokerDetails = getDefaultInvokerDetails();
    types:ParCycleModify parCycle = {
        parCycleStartDate: "2021-01-05",
        parLeadDeadline: "2021-12-29"
    };

    http:Response response = check testClient->patch("/par-cycles/1", parCycle, headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_UNPROCESSABLE_ENTITY, "An unprocessable entity status code is not thrown when modifying a non-existing PAR cycle. Expected: 422, but found: " + response.statusCode.toString());

    json jsonPayload = check response.getJsonPayload();
    test:assertEquals(jsonPayload, {"message": "PAR cycle is closed. Cannot modify a closed PAR cycle."});
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testModifyOfAlreadyClosedParCycle]
}
function testCreateParCycle_ReturnErrorWhenPreparingTheParCycle() returns error? {

    types:InvokerDetails invokerDetails = getDefaultInvokerDetails();
    types:ParCycleCreate requestParCycle = getDefaultParCycleCreate();
    types:ParCycle expectedParCycle = getDefaultExpectedParCycle(invokerDetails);
    expectedParCycle.parCycleId = 2;

    test:when(insertDefaultParRatingsBulkMockFn).thenReturn(error("Error occurred while updating the PAR cycle state."));

    entity:Employee[] employees = getDefaultMultipleEmployees(250);
    test:when(getAllActiveEmployeesMockFn).thenReturn(employees);

    http:Response response = check testClient->post("/par-cycles", requestParCycle, headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_CREATED, "Invalid status code received when creating a PAR cycle. Expected: 201, but found: " + response.statusCode.toString());

    json jsonPayload = check response.getJsonPayload();
    types:ParCycle result = check jsonPayload.cloneWithType();
    test:assertEquals(result, expectedParCycle);

    check waitUntilParCycleStatusIsUpdated(result.parCycleId, types:FAILED, MAX_DELAY);

    types:ParCycle parCycle = check getParCycleById(result.parCycleId);
    test:assertEquals(parCycle.parCycleStatus, types:FAILED);
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testCreateParCycle_ReturnErrorWhenPreparingTheParCycle]
}
function testCreateParCycle_CreateQuotaForNonExistingParCycle() returns error? {
    int parCycleId = 2999999;
    types:ParSpecialRatingGroupQuota parSpecialRatingGroupQuotaOne = getParSpecialRatingGroupQuota_One();
    parSpecialRatingGroupQuotaOne.parSpecialRatingGroups[0].parCycleId = parCycleId;
    parSpecialRatingGroupQuotaOne.parSpecialRatingGroups[0].specialRatingGroupId = 2;
    types:InvokerDetails invokerDetails = getDefaultInvokerDetails();
    http:Response response = check testClient->post(string `/par-cycles/${parCycleId}/special-rating-groups-quota`,
        parSpecialRatingGroupQuotaOne, headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_BAD_REQUEST,
        string `Invalid status code received when creating par special rating group quota. ` +
        string `Expected: ${http:STATUS_BAD_REQUEST}, but found: ${response.statusCode}`);
    json jsonPayload = check response.getJsonPayload();
    test:assertEquals(jsonPayload, {"message": "The given PAR cycle does not exist to create special rating quotas."});
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testCreateParCycle_CreateQuotaForNonExistingParCycle]
}
function testCreateParCycle_CreateQuotaForFailedParCycle() returns error? {
    int parCycleId = 2;
    types:ParSpecialRatingGroupQuota parSpecialRatingGroupQuotaOne = getParSpecialRatingGroupQuota_One();
    parSpecialRatingGroupQuotaOne.parSpecialRatingGroups[0].parCycleId = parCycleId;
    parSpecialRatingGroupQuotaOne.parSpecialRatingGroups[0].specialRatingGroupId = 2;
    types:InvokerDetails invokerDetails = getDefaultInvokerDetails();
    http:Response response = check testClient->post(string `/par-cycles/${parCycleId}/special-rating-groups-quota`,
        parSpecialRatingGroupQuotaOne, headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_BAD_REQUEST,
        string `Invalid status code received when creating par special rating group quota. ` +
        string `Expected: ${http:STATUS_BAD_REQUEST}, but found: ${response.statusCode}`);
    json jsonPayload = check response.getJsonPayload();
    test:assertEquals(jsonPayload, {
        "message": "Cannot create special rating quotas when the PAR cycle is not in the " +
        "PENDING_QUOTA state."
    });
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testCreateParCycle_CreateQuotaForFailedParCycle]
}
function testCreateParCycle_CreateQuotaWithInvalidQuotaList() returns error? {
    int parCycleId = 2;
    types:InvokerDetails invokerDetails = getDefaultInvokerDetails();
    http:Response response = check testClient->post(string `/par-cycles/${parCycleId}/special-rating-groups-quota`,
        getParSpecialRatingGroupQuota_Two(), headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_BAD_REQUEST,
        string `Invalid status code received when creating par special rating group quota. ` +
        string `Expected: ${http:STATUS_BAD_REQUEST}, but found: ${response.statusCode}`);
    json jsonPayload = check response.getJsonPayload();
    test:assertEquals(jsonPayload, {
        "message": "Cannot create special rating quotas when the PAR cycle is not in the " +
        "PENDING_QUOTA state."
    });
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testCreateParCycle_ReturnErrorWhenPreparingTheParCycle]
}
function testCreateParCycleWhileNotHavingActiveParCycles() returns error? {

    types:InvokerDetails invokerDetails = getDefaultInvokerDetails();
    types:ParCycleCreate requestParCycle = getDefaultParCycleCreate();
    types:ParCycle expectedParCycle = getDefaultExpectedParCycle(invokerDetails);
    int parCycleId = 3;
    expectedParCycle.parCycleId = parCycleId;

    test:when(getAllActiveEmployeesMockFn).thenReturn(getDefaultEmployees());
    test:when(insertDefaultParRatingsBulkMockFn).callOriginal();

    http:Response response = check testClient->post("/par-cycles", requestParCycle, headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_CREATED, "Invalid status code received when creating a PAR cycle. Expected: 201, but found: " + response.statusCode.toString());

    json jsonPayload = check response.getJsonPayload();
    types:ParCycle result = check jsonPayload.cloneWithType();
    test:assertEquals(result, expectedParCycle);

    check waitUntilParCycleStatusIsUpdated(<int>expectedParCycle.parCycleId, types:PENDING_QUOTA, MAX_DELAY);

    // With less number of groups than in the par cycle
    response = check testClient->post(string `/par-cycles/${parCycleId}/special-rating-groups-quota`,
        getParSpecialRatingGroupQuota_One(), headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_BAD_REQUEST,
        string `Invalid status code received when creating par special rating group quota. ` +
        string `Expected: ${http:STATUS_BAD_REQUEST}, but found: ${response.statusCode}`);
    jsonPayload = check response.getJsonPayload();
    test:assertEquals(jsonPayload, {
        "message": "Invalid special rating group quota request."
    });

    // With some groups missing quota
    response = check testClient->post(string `/par-cycles/${parCycleId}/special-rating-groups-quota`,
        getParSpecialRatingGroupQuotaInvalid_NoQuotaForAllGroups(), headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_BAD_REQUEST,
        string `Invalid status code received when creating par special rating group quota. ` +
        string `Expected: ${http:STATUS_BAD_REQUEST}, but found: ${response.statusCode}`);
    jsonPayload = check response.getJsonPayload();
    test:assertEquals(jsonPayload, {
        "message": "Invalid special rating group quota request."
    });

    // With correct special rating group quota request
    response = check testClient->post(string `/par-cycles/${<int>result.parCycleId}/special-rating-groups-quota`,
        getParSpecialRatingGroupQuota_Two(), headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_OK,
        string `Invalid status code received when creating par special rating quota. ` +
        string `Expected: ${http:STATUS_OK}, but found: ${response.statusCode}`);

    types:ParCycleModify parCycle = check getParCycleModifyById(parCycleId);
    parCycle.parCycleStatus = types:OPEN;
    response = check testClient->patch(string `/par-cycles/${parCycleId}`, parCycle,
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_OK,
        string `Invalid status code received when modifying the PAR cycle status. ` +
        string `Expected: ${http:STATUS_OK}, but found: ${response.statusCode}`);
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testCreateParCycleWhileNotHavingActiveParCycles]
}
function testGetParCycles() returns error? {

    types:InvokerDetails invokerDetails = getDefaultInvokerDetails();
    types:ParCycle parCycle1 = check getParCycleById(1);
    types:ParCycle parCycle2 = check getParCycleById(2);
    types:ParCycle parCycle3 = check getParCycleById(3);

    // All PAR cycles
    http:Response response = check testClient->get("/par-cycles/", headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_OK, "Invalid status code received when getting all PAR cycles. Expected: 200, but found: " + response.statusCode.toString());

    json jsonPayload = check response.getJsonPayload();
    types:ParCycle[] parCycles = check jsonPayload.cloneWithType();

    test:assertEquals(parCycles.length(), 3);
    test:assertEquals(parCycles[0], parCycle1); // CLOSED
    test:assertEquals(parCycles[1], parCycle2); // FAILED
    test:assertEquals(parCycles[2], parCycle3); // OPEN

    // Closed PAR cycles
    http:Response response2 = check testClient->get("/par-cycles?status=CLOSED", headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response2.statusCode, http:STATUS_OK, "Invalid status code received when getting all closed PAR cycles. Expected: 200, but found: " + response2.statusCode.toString());

    json jsonPayload2 = check response2.getJsonPayload();
    types:ParCycle[] closedParCycles = check jsonPayload2.cloneWithType();

    test:assertEquals(closedParCycles.length(), 1);
    test:assertEquals(closedParCycles[0], parCycle1);

    // Open PAR cycles
    http:Response response3 = check testClient->get("/par-cycles?status=OPEN", headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response3.statusCode, http:STATUS_OK, "Invalid status code received when getting all open PAR cycles. Expected: 200, but found: " + response3.statusCode.toString());

    json jsonPayload3 = check response3.getJsonPayload();
    types:ParCycle[] openParCycles = check jsonPayload3.cloneWithType();

    test:assertEquals(openParCycles.length(), 1);
    test:assertEquals(openParCycles[0], parCycle3);
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testCreateParCycleWhileNotHavingActiveParCycles]
}
function testGetSpecialRatingGroups() returns error? {
    types:InvokerDetails invokerDetails = getDefaultInvokerDetails();
    int parCycleId = 3;
    http:Response response = check testClient->get(string `/par-cycles/${parCycleId}/special-rating-groups`,
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_OK,
        "Invalid status code received when getting special rating groups.");

    json jsonPayload = check response.getJsonPayload();
    types:ParSpecialRatingGroupWithHeadCount[] parSpecialRatingGroupWithHeadCounts = check jsonPayload.cloneWithType();
    test:assertEquals(parSpecialRatingGroupWithHeadCounts.length(), 2);
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testGetParCycles]
}
function testGetParCycles_AsNonAdminUserWithoutEmployeeEmail() returns error? {
    types:InvokerDetails invokerDetails = getInvokerDetailsAs("nonadmin@wso2.com");

    http:Response response = check testClient->get("/par-cycles?status=OPEN",
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_FORBIDDEN,
        string `Invalid status code received when getting PAR Cycle as a lead without employee email. ` +
        string `Expected: ${http:STATUS_FORBIDDEN}, but found: ${response.statusCode}`);

    json jsonPayload = check response.getJsonPayload();
    test:assertEquals(jsonPayload, {"message": "You are not authorized to get par cycles."});
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testGetParCycles]
}
function testGetParCycles_AsLeadWithInvalidEmployeeEmail() returns error? {
    types:InvokerDetails invokerDetails = getInvokerDetailsAs("carl@wso2.com");

    http:Response response = check testClient->get("/par-cycles?status=OPEN&email=someone@wso2.com",
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_FORBIDDEN,
        string `Invalid status code received when getting PAR Cycle as a lead with invalid employee email. ` +
        string `Expected: ${http:STATUS_FORBIDDEN}, but found: ${response.statusCode}`);

    json jsonPayload = check response.getJsonPayload();
    test:assertEquals(jsonPayload, {"message": "You are not authorized to get par cycles."});
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testGetParCycles]
}
function testGetParCycles_AsLeadWithValidSubordinateEmployeeEmail() returns error? {
    database:ParRating[] parRatingsFromDB = check getParRatingsFromDB(3);
    database:ParRating parRating = parRatingsFromDB[0];
    database:ParTeam parTeam = check database:getParTeam(parRating.parTeamId);

    types:InvokerDetails invokerDetails = getInvokerDetailsAs(parTeam.parLeadEmail ?: "");
    types:ParCycle expectedParCycle = getDefaultExpectedParCycle(invokerDetails);
    expectedParCycle.parCycleId = 3;
    expectedParCycle.parCycleStatus = types:OPEN;

    http:Response response = check testClient->get(string `/par-cycles?status=OPEN&email=${parRating.parEmployeeEmail}`,
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_OK,
        string `Invalid status code received when getting PAR Cycle as a lead with valid subordinate employee email. ` +
        string `Expected: ${http:STATUS_OK}, but found: ${response.statusCode}`);

    json jsonPayload = check response.getJsonPayload();
    types:ParCycle[] parCycles = check jsonPayload.cloneWithType();
    test:assertEquals(parCycles.length(), 1);
    test:assertEquals(parCycles[0], expectedParCycle);
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testGetParCycles_AsLeadWithInvalidEmployeeEmail]
}
function testGetParCycles_AsEmployeeWithEmployeeEmail() returns error? {
    database:ParRating[] parRatingsFromDB = check getParRatingsFromDB(3);
    database:ParRating parRating = parRatingsFromDB[0];

    types:InvokerDetails invokerDetails = getInvokerDetailsAs(parRating.parEmployeeEmail);
    types:ParCycle expectedParCycle = getDefaultExpectedParCycle(invokerDetails);
    expectedParCycle.parCycleId = 3;
    expectedParCycle.parCycleStatus = types:OPEN;

    http:Response response = check testClient->get(string `/par-cycles?status=OPEN&email=${parRating.parEmployeeEmail}`,
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_OK,
        string `Invalid status code received when getting PAR Cycle as a lead with valid subordinate employee email. ` +
        string `Expected: ${http:STATUS_OK}, but found: ${response.statusCode}`);

    json jsonPayload = check response.getJsonPayload();
    types:ParCycle[] parCycles = check jsonPayload.cloneWithType();
    test:assertEquals(parCycles.length(), 1);
    test:assertEquals(parCycles[0], expectedParCycle);
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testGetParCycles]
}
function testUpdateEmployeeParStatus_WithInvalidStatus() returns error? {
    types:InvokerDetails invokerDetails = getDefaultInvokerDetails();
    http:Response response = check testClient->patch("/par-cycles/3/employees/user1@wso2.com/par-ratings/1",
        {parEmployeeStatus: "INVALID_STATUS"}, headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_BAD_REQUEST,
        string `Invalid status code received when updating employee PAR status with invalid status. ` +
        string `Expected: ${http:STATUS_BAD_REQUEST}, but found: ${response.statusCode}`);

    json jsonPayload = check response.getJsonPayload();
    test:assertTrue(jsonPayload.toString()
        .indexOf("'map<json>' value cannot be converted to 'par_app.types:ParRatingModify'") > 0, "");
}
