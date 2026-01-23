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
import ballerina/mime;
import ballerina/test;

@test:Mock {
    moduleName: "par_app.database",
    functionName: "getAesEncryptionValueQuery"
}
test:MockFunction getAesEncryptionValueQueryMockFn = new ();

@test:Mock {
    moduleName: "par_app.database",
    functionName: "getAesDecryptionFieldQuery"
}
test:MockFunction getAesDecryptionFieldQueryMockFn = new ();

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testGetParCycles]
}
function testParRating_GetParRatingOfAnEmployeeAsAdmin() returns error? {
    types:InvokerDetails invokerDetails = getDefaultInvokerDetails();

    int parCycleId = 3;
    database:ParRating[] parRatingsFromDB = check getParRatingsFromDB(parCycleId);
    database:ParRating parRating = parRatingsFromDB[0];
    database:ParTeam parTeam = check database:getParTeam(parRating.parTeamId);
    string employeeEmail = parRating.parEmployeeEmail;

    test:when(getAesEncryptionValueQueryMockFn).call("getAesEncryptionValueQueryForTests");

    http:Response response = check testClient->get(
        string `/par-cycles/${parCycleId}/employees/${employeeEmail}/par-ratings`,
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_OK,
        string `Invalid status code received when getting par ratings of an employee as an admin. ` +
        string `Expected: ${http:STATUS_OK}, Received: ${response.statusCode}`);

    json jsonPayload = check response.getJsonPayload();
    types:ParRating parRatingResponse = check jsonPayload.cloneWithType();

    verifyParRatingResponse(parRatingResponse, check getParRatingFrom(parRating, parTeam));
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testGetParCycles]
}
function testParRating_GetParRatingOfAnEmployeeAsLead_BeforeEmployeeSubmit() returns error? {
    int parCycleId = 3;
    database:ParRating[] parRatingsFromDB = check getParRatingsFromDB(parCycleId);
    database:ParRating parRating = parRatingsFromDB[0];
    database:ParTeam parTeam = check database:getParTeam(parRating.parTeamId);

    string employeeEmail = parRating.parEmployeeEmail;
    types:InvokerDetails invokerDetails = getInvokerDetailsAs(parTeam.parLeadEmail ?: "");

    test:when(getAesEncryptionValueQueryMockFn).call("getAesEncryptionValueQueryForTests");
    test:when(getAesDecryptionFieldQueryMockFn).call("getAesDecryptionFieldQueryForTests");

    http:Response response = check testClient->get(
        string `/par-cycles/${parCycleId}/employees/${employeeEmail}/par-ratings`,
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_OK,
        string `Invalid status code received when getting par ratings of an employee as an admin. ` +
        string `Expected: ${http:STATUS_OK}, Received: ${response.statusCode}`);

    json jsonPayload = check response.getJsonPayload();
    types:ParRating parRatingResponse = check jsonPayload.cloneWithType();

    verifyParRatingResponse(parRatingResponse, check getParRatingFrom(parRating, parTeam));
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testParRating_GetParRatingOfAnEmployeeAsLead_BeforeEmployeeSubmit]
}
function testParRating_UpdateParRatingAsEmployee_Draft_AfterEmployeeDeadline_StatusOnly() returns error? {
    int parCycleId = 3;
    database:ParRating[] parRatingsFromDB = check getParRatingsFromDB(parCycleId);
    database:ParRating parRating = parRatingsFromDB[0];

    string employeeEmail = parRating.parEmployeeEmail;
    types:InvokerDetails invokerDetails = getInvokerDetailsAs(employeeEmail);

    // string parEmployeeCommentB64Encoded = check (check mime:base64Encode("My First Comment")).ensureType();
    test:when(getAesEncryptionValueQueryMockFn).call("getAesEncryptionValueQueryForTests");

    int parRatingId = check parRating.parRatingId.ensureType();
    http:Response response = check testClient->patch(
        string `/par-cycles/${parCycleId}/employees/${employeeEmail}/par-ratings/${parRatingId}`,
        {parEmployeeStatus: types:DRAFT},
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_FORBIDDEN,
        string `Invalid status code received when updating employee PAR employee status. ` +
        string `Expected: ${http:STATUS_FORBIDDEN}, Received: ${response.statusCode}`);
    json jsonPayload = check response.getJsonPayload();
    test:assertEquals(jsonPayload.message, "Employees are not allowed to modify the PAR rating after the deadline.");
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testParRating_UpdateParRatingAsEmployee_Draft_AfterEmployeeDeadline_StatusOnly]
}
function testParRating_UpdateParRatingAsEmployee_Draft_AfterEmployeeDeadline_CommentOnly() returns error? {
    int parCycleId = 3;
    database:ParRating[] parRatingsFromDB = check getParRatingsFromDB(parCycleId);
    database:ParRating parRating = parRatingsFromDB[0];

    string employeeEmail = parRating.parEmployeeEmail;
    types:InvokerDetails invokerDetails = getInvokerDetailsAs(employeeEmail);

    string parEmployeeCommentB64Encoded = check (check mime:base64Encode("My First Comment")).ensureType();
    test:when(getAesEncryptionValueQueryMockFn).call("getAesEncryptionValueQueryForTests");

    int parRatingId = check parRating.parRatingId.ensureType();
    http:Response response = check testClient->patch(
        string `/par-cycles/${parCycleId}/employees/${employeeEmail}/par-ratings/${parRatingId}`,
        {parEmployeeComment: parEmployeeCommentB64Encoded},
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_FORBIDDEN,
        string `Invalid status code received when updating employee PAR employee status. ` +
        string `Expected: ${http:STATUS_FORBIDDEN}, Received: ${response.statusCode}`);
    json jsonPayload = check response.getJsonPayload();
    test:assertEquals(jsonPayload.message, "Employees are not allowed to modify the PAR rating after the deadline.");
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testParRating_UpdateParRatingAsEmployee_Draft_AfterEmployeeDeadline_CommentOnly]
}
function testParRating_UpdateParRatingAsEmployee_Draft_AfterEmployeeDeadline() returns error? {
    int parCycleId = 3;
    database:ParRating[] parRatingsFromDB = check getParRatingsFromDB(parCycleId);
    database:ParRating parRating = parRatingsFromDB[0];

    string employeeEmail = parRating.parEmployeeEmail;
    types:InvokerDetails invokerDetails = getInvokerDetailsAs(employeeEmail);

    string parEmployeeCommentB64Encoded = check (check mime:base64Encode("My First Comment")).ensureType();
    test:when(getAesEncryptionValueQueryMockFn).call("getAesEncryptionValueQueryForTests");

    int parRatingId = check parRating.parRatingId.ensureType();
    http:Response response = check testClient->patch(
        string `/par-cycles/${parCycleId}/employees/${employeeEmail}/par-ratings/${parRatingId}`,
        {parEmployeeStatus: types:DRAFT, parEmployeeComment: parEmployeeCommentB64Encoded},
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_FORBIDDEN,
        string `Invalid status code received when updating employee PAR employee status. ` +
        string `Expected: ${http:STATUS_FORBIDDEN}, Received: ${response.statusCode}`);
    json jsonPayload = check response.getJsonPayload();
    test:assertEquals(jsonPayload.message, "Employees are not allowed to modify the PAR rating after the deadline.");
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testParRating_UpdateParRatingAsEmployee_Draft_AfterEmployeeDeadline]
}
function testParRating_UpdateParRatingAsEmployee_ShareWithoutEmployeeComment() returns error? {
    int parCycleId = 3;
    check updateParCycleEmployeeDeadline(parCycleId, check getDateTodayUtc());
    database:ParRating[] parRatingsFromDB = check getParRatingsFromDB(parCycleId);
    database:ParRating parRating = parRatingsFromDB[0];

    string employeeEmail = parRating.parEmployeeEmail;
    types:InvokerDetails invokerDetails = getInvokerDetailsAs(employeeEmail);

    int parRatingId = check parRating.parRatingId.ensureType();
    http:Response response = check testClient->patch(
        string `/par-cycles/${parCycleId}/employees/${employeeEmail}/par-ratings/${parRatingId}`,
        {parEmployeeStatus: types:SHARED},
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_FORBIDDEN,
        string `Invalid status code received when updating employee PAR employee status. ` +
        string `Expected: ${http:STATUS_FORBIDDEN}, Received: ${response.statusCode}`);
    json jsonPayload = check response.getJsonPayload();
    test:assertEquals(jsonPayload.message, "Employee comment is required before sharing the PAR.");
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testParRating_UpdateParRatingAsEmployee_ShareWithoutEmployeeComment]
}
function testParRating_UpdateParRatingAsEmployee_Draft() returns error? {
    int parCycleId = 3;
    check updateParCycleEmployeeDeadline(parCycleId, check getDateTodayUtc());
    database:ParRating[] parRatingsFromDB = check getParRatingsFromDB(parCycleId);
    database:ParRating parRating = parRatingsFromDB[0];

    string employeeEmail = parRating.parEmployeeEmail;
    types:InvokerDetails invokerDetails = getInvokerDetailsAs(employeeEmail);

    string parEmployeeCommentB64Encoded = check (check mime:base64Encode("My First Comment")).ensureType();
    test:when(getAesEncryptionValueQueryMockFn).call("getAesEncryptionValueQueryForTests");

    int parRatingId = check parRating.parRatingId.ensureType();
    http:Response response = check testClient->patch(
        string `/par-cycles/${parCycleId}/employees/${employeeEmail}/par-ratings/${parRatingId}`,
        {parEmployeeStatus: types:DRAFT, parEmployeeComment: parEmployeeCommentB64Encoded},
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_OK,
        string `Invalid status code received when updating employee PAR employee status. ` +
        string `Expected: ${http:STATUS_OK}, Received: ${response.statusCode}`);
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testParRating_UpdateParRatingAsEmployee_Draft]
}
function testParRating_GetParRatingOfAnEmployeeAsLead_AfterEmployeeSubmitAsDraft() returns error? {
    int parCycleId = 3;
    database:ParRating[] parRatingsFromDB = check getParRatingsFromDB(parCycleId);
    database:ParRating parRating = parRatingsFromDB[0];
    database:ParTeam parTeam = check database:getParTeam(parRating.parTeamId);

    string employeeEmail = parRating.parEmployeeEmail;
    types:InvokerDetails invokerDetails = getInvokerDetailsAs(parTeam.parLeadEmail ?: "");

    test:when(getAesEncryptionValueQueryMockFn).call("getAesEncryptionValueQueryForTests");

    http:Response response = check testClient->get(
        string `/par-cycles/${parCycleId}/employees/${employeeEmail}/par-ratings`,
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_OK,
        string `Invalid status code received when getting par ratings of an employee as an admin. ` +
        string `Expected: ${http:STATUS_OK}, Received: ${response.statusCode}`);

    json jsonPayload = check response.getJsonPayload();
    types:ParRating parRatingResponse = check jsonPayload.cloneWithType();

    parRating.parEmployeeComment = ();
    verifyParRatingResponse(parRatingResponse, check getParRatingFrom(parRating, parTeam));
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testParRating_GetParRatingOfAnEmployeeAsLead_AfterEmployeeSubmitAsDraft]
}
function testParRating_UpdateParRatingAsLead_TryToShareWhileEmployeeStatusIsDraft() returns error? {
    int parCycleId = 3;
    database:ParRating[] parRatingsFromDB = check getParRatingsFromDB(parCycleId);
    database:ParRating parRating = parRatingsFromDB[0];

    string employeeEmail = parRating.parEmployeeEmail;
    entity:Employee employee = check getEmployeeByEmail(employeeEmail);
    types:InvokerDetails invokerDetails = getInvokerDetailsAs(employee.managerEmail ?: "");

    test:when(getAesEncryptionValueQueryMockFn).call("getAesEncryptionValueQueryForTests");

    types:ParCycle parCycle = check getParCycle(parCycleId);
    string originalLeadDeadline = parCycle.parLeadDeadline;

    check updateParCycleLeadDeadline(parCycleId, check getDateTodayUtc());

    int parRatingId = check parRating.parRatingId.ensureType();
    http:Response response = check testClient->patch(
        string `/par-cycles/${parCycleId}/employees/${employeeEmail}/par-ratings/${parRatingId}`,
        {parLeadStatus: types:SHARED},
        headers = getDefaultHeaders(invokerDetails));

    check updateParCycleLeadDeadline(parCycleId, check getDateUtc(originalLeadDeadline));

    test:assertEquals(response.statusCode, http:STATUS_FORBIDDEN,
        string `Invalid status code received when updating employee PAR employee status. ` +
        string `Expected: ${http:STATUS_FORBIDDEN}, Received: ${response.statusCode}`);
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testParRating_UpdateParRatingAsLead_TryToShareWhileEmployeeStatusIsDraft]
}
function testParRating_UpdateParRatingAsEmployee_Shared() returns error? {
    int parCycleId = 3;
    database:ParRating[] parRatingsFromDB = check getParRatingsFromDB(parCycleId);
    database:ParRating parRating = parRatingsFromDB[0];

    string employeeEmail = parRating.parEmployeeEmail;
    types:InvokerDetails invokerDetails = getInvokerDetailsAs(employeeEmail);

    test:when(getAesEncryptionValueQueryMockFn).call("getAesEncryptionValueQueryForTests");

    int parRatingId = check parRating.parRatingId.ensureType();
    http:Response response = check testClient->patch(
        string `/par-cycles/${parCycleId}/employees/${employeeEmail}/par-ratings/${parRatingId}`,
        {parEmployeeStatus: types:SHARED},
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_OK,
        string `Invalid status code received when updating employee PAR employee status. ` +
        string `Expected: ${http:STATUS_OK}, Received: ${response.statusCode}`);
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testParRating_UpdateParRatingAsEmployee_Shared]
}
function testParRating_GetParRatingOfAnEmployeeAsLead_AfterEmployeeSubmitAsShared() returns error? {
    int parCycleId = 3;
    database:ParRating[] parRatingsFromDB = check getParRatingsFromDB(parCycleId);
    database:ParRating parRating = parRatingsFromDB[0];
    database:ParTeam parTeam = check database:getParTeam(parRating.parTeamId);

    string employeeEmail = parRating.parEmployeeEmail;
    types:InvokerDetails invokerDetails = getInvokerDetailsAs(parTeam.parLeadEmail ?: "");

    test:when(getAesEncryptionValueQueryMockFn).call("getAesEncryptionValueQueryForTests");

    http:Response response = check testClient->get(
        string `/par-cycles/${parCycleId}/employees/${employeeEmail}/par-ratings`,
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_OK,
        string `Invalid status code received when getting par ratings of an employee as an admin. ` +
        string `Expected: ${http:STATUS_OK}, Received: ${response.statusCode}`);

    json jsonPayload = check response.getJsonPayload();
    types:ParRating parRatingResponse = check jsonPayload.cloneWithType();

    verifyParRatingResponse(parRatingResponse, check getParRatingFrom(parRating, parTeam));
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testParRating_GetParRatingOfAnEmployeeAsLead_AfterEmployeeSubmitAsShared]
}
function testParRating_GetParRatingOfAnEmployeeAsEmployee_AfterEmployeeSubmit() returns error? {
    int parCycleId = 3;
    database:ParRating[] parRatingsFromDB = check getParRatingsFromDB(parCycleId);
    database:ParRating parRating = parRatingsFromDB[0];
    database:ParTeam parTeam = check database:getParTeam(parRating.parTeamId);

    string employeeEmail = parRating.parEmployeeEmail;
    types:InvokerDetails invokerDetails = getInvokerDetailsAs(employeeEmail);

    test:when(getAesEncryptionValueQueryMockFn).call("getAesEncryptionValueQueryForTests");

    http:Response response = check testClient->get(
        string `/par-cycles/${parCycleId}/employees/${employeeEmail}/par-ratings`,
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_OK,
        string `Invalid status code received when getting par ratings of an employee as an admin. ` +
        string `Expected: ${http:STATUS_OK}, Received: ${response.statusCode}`);

    json jsonPayload = check response.getJsonPayload();
    types:ParRating parRatingResponse = check jsonPayload.cloneWithType();

    types:ParRating expectedParRating = check getParRatingFrom(parRating, parTeam);
    expectedParRating.parRating = ();
    expectedParRating.parSpecialRating = ();
    verifyParRatingResponse(parRatingResponse, expectedParRating);
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testParRating_GetParRatingOfAnEmployeeAsEmployee_AfterEmployeeSubmit]
}
function testParTeam_GetParTeamSumaryAsLead_AfterEmployeeSubmit() returns error? {
    int parCycleId = 3;
    database:ParRating[] parRatingsFromDB = check getParRatingsFromDB(parCycleId);
    database:ParRating parRating = parRatingsFromDB[0];
    int parTeamId = parRating.parTeamId;

    string employeeEmail = parRating.parEmployeeEmail;
    entity:Employee employee = check getEmployeeByEmail(employeeEmail);
    types:InvokerDetails invokerDetails = getInvokerDetailsAs(employee.managerEmail ?: "");

    http:Response response = check testClient->get(string `/par-cycles/${parCycleId}/teams/${parTeamId}`,
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_OK,
        string `Invalid status code received when getting par team as lead. ` +
        string `Expected: ${http:STATUS_OK}, Received: ${response.statusCode}`);

    json jsonPayload = check response.getJsonPayload();
    types:ParTeamDetails result = check jsonPayload.cloneWithType();

    test:assertEquals(result.parTeamId, parTeamId, string `Par team ID mismatched. ` +
        string `Expected: ${parTeamId}, Received: ${result.parTeamId}`);
    test:assertEquals(result.numberOfTeamMembers, 2, string `Number of team members mismatched.` +
        string `Expected: 2, Received: ${result.numberOfTeamMembers}`);
    test:assertEquals(result.summary.employeeParCompletedCount, 1,
        string `Number of employee completed count mismatched.` +
        string `Expected: 1, Received: ${result.summary.employeeParCompletedCount}`);
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testParTeam_GetParTeamSumaryAsLead_AfterEmployeeSubmit]
}
function testParRating_UpdateParRatingAsEmployee_AfterShared() returns error? {
    int parCycleId = 3;
    database:ParRating[] parRatingsFromDB = check getParRatingsFromDB(parCycleId);
    database:ParRating parRating = parRatingsFromDB[0];

    string employeeEmail = parRating.parEmployeeEmail;
    types:InvokerDetails invokerDetails = getInvokerDetailsAs(employeeEmail);

    string parEmployeeCommentB64Encoded = check (check mime:base64Encode("Employee comment after sharing")).ensureType();
    test:when(getAesEncryptionValueQueryMockFn).call("getAesEncryptionValueQueryForTests");

    int parRatingId = check parRating.parRatingId.ensureType();
    http:Response response = check testClient->patch(
        string `/par-cycles/${parCycleId}/employees/${employeeEmail}/par-ratings/${parRatingId}`,
        {parEmployeeStatus: types:SHARED, parEmployeeComment: parEmployeeCommentB64Encoded},
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_FORBIDDEN,
        string `Invalid status code received when updating employee PAR. ` +
        string `Expected: ${http:STATUS_OK}, Received: ${response.statusCode}`);
    json jsonPayload = check response.getJsonPayload();
    test:assertEquals(jsonPayload.message,
        "Employees are only allowed to unshare their PAR while it is in the shared state.");
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testParRating_UpdateParRatingAsEmployee_Shared]
}
function testParRating_UpdateParRatingAsEmployee_UnshareAndShare() returns error? {
    int parCycleId = 3;
    database:ParRating[] parRatingsFromDB = check getParRatingsFromDB(parCycleId);
    database:ParRating parRating = parRatingsFromDB[0];

    string employeeEmail = parRating.parEmployeeEmail;
    types:InvokerDetails invokerDetails = getInvokerDetailsAs(employeeEmail);

    test:when(getAesEncryptionValueQueryMockFn).call("getAesEncryptionValueQueryForTests");

    int parRatingId = check parRating.parRatingId.ensureType();
    http:Response response = check testClient->patch(
        string `/par-cycles/${parCycleId}/employees/${employeeEmail}/par-ratings/${parRatingId}`,
        {parEmployeeStatus: types:DRAFT},
        headers = getDefaultHeaders(invokerDetails));

    test:assertEquals(response.statusCode, http:STATUS_OK,
        string `Invalid status code received when updating employee PAR. ` +
        string `Expected: ${http:STATUS_OK}, Received: ${response.statusCode}`);

    response = check testClient->patch(
        string `/par-cycles/${parCycleId}/employees/${employeeEmail}/par-ratings/${parRatingId}`,
        {parEmployeeStatus: types:SHARED},
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_OK,
        string `Invalid status code received when updating employee PAR. ` +
        string `Expected: ${http:STATUS_OK}, Received: ${response.statusCode}`);
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [
        testParRating_GetParRatingOfAnEmployeeAsEmployee_AfterEmployeeSubmit,
        testParRating_UpdateParRatingAsEmployee_AfterShared,
        testParRating_UpdateParRatingAsEmployee_UnshareAndShare
    ]
}
function testParRating_UpdateParRatingAsLead_Draft_ButAfterLeadDeadline() returns error? {
    int parCycleId = 3;
    database:ParRating[] parRatingsFromDB = check getParRatingsFromDB(parCycleId);
    database:ParRating parRating = parRatingsFromDB[0];

    string employeeEmail = parRating.parEmployeeEmail;
    entity:Employee employee = check getEmployeeByEmail(employeeEmail);
    types:InvokerDetails invokerDetails = getInvokerDetailsAs(employee.managerEmail ?: "");

    string parLeadCommentB64Encoded = check (check mime:base64Encode("Leads First Comment")).ensureType();
    test:when(getAesEncryptionValueQueryMockFn).call("getAesEncryptionValueQueryForTests");

    int parRatingId = check parRating.parRatingId.ensureType();
    http:Response response = check testClient->patch(
        string `/par-cycles/${parCycleId}/employees/${employeeEmail}/par-ratings/${parRatingId}`,
        {parLeadStatus: types:DRAFT, parLeadComment: parLeadCommentB64Encoded, parRating: "Successful"},
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_FORBIDDEN,
        string `Invalid status code received when updating PAR lead status. ` +
        string `Expected: ${http:STATUS_FORBIDDEN}, Received: ${response.statusCode}`);
    json jsonPayload = check response.getJsonPayload();
    test:assertEquals(jsonPayload.message, "Leads are not allowed to modify the PAR rating after the deadline.");
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testParRating_UpdateParRatingAsLead_Draft_ButAfterLeadDeadline]
}
function testParRating_UpdateParRatingAsLead_ShareWithoutLeadsCommment() returns error? {
    int parCycleId = 3;
    check updateParCycleLeadDeadline(parCycleId, check getDateTodayUtc());
    database:ParRating[] parRatingsFromDB = check getParRatingsFromDB(parCycleId);
    database:ParRating parRating = parRatingsFromDB[0];

    string employeeEmail = parRating.parEmployeeEmail;
    entity:Employee employee = check getEmployeeByEmail(employeeEmail);
    types:InvokerDetails invokerDetails = getInvokerDetailsAs(employee.managerEmail ?: "");

    int parRatingId = check parRating.parRatingId.ensureType();
    http:Response response = check testClient->patch(
        string `/par-cycles/${parCycleId}/employees/${employeeEmail}/par-ratings/${parRatingId}`,
        {parLeadStatus: types:SHARED, parRating: "Successful"},
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_FORBIDDEN,
        string `Invalid status code received when updating PAR lead status. ` +
        string `Expected: ${http:STATUS_FORBIDDEN}, Received: ${response.statusCode}`);
    json jsonPayload = check response.getJsonPayload();
    test:assertEquals(jsonPayload.message, "Lead comment and par rating are required before sharing the PAR.");
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testParRating_UpdateParRatingAsLead_ShareWithoutLeadsCommment]
}
function testParRating_UpdateParRatingAsLead_ShareWithoutParRating() returns error? {
    int parCycleId = 3;
    check updateParCycleLeadDeadline(parCycleId, check getDateTodayUtc());
    database:ParRating[] parRatingsFromDB = check getParRatingsFromDB(parCycleId);
    database:ParRating parRating = parRatingsFromDB[0];

    string employeeEmail = parRating.parEmployeeEmail;
    entity:Employee employee = check getEmployeeByEmail(employeeEmail);
    types:InvokerDetails invokerDetails = getInvokerDetailsAs(employee.managerEmail ?: "");

    string parLeadCommentB64Encoded = check (check mime:base64Encode("Leads First Comment")).ensureType();
    test:when(getAesEncryptionValueQueryMockFn).call("getAesEncryptionValueQueryForTests");

    int parRatingId = check parRating.parRatingId.ensureType();
    http:Response response = check testClient->patch(
        string `/par-cycles/${parCycleId}/employees/${employeeEmail}/par-ratings/${parRatingId}`,
        {parLeadStatus: types:SHARED, parLeadComment: parLeadCommentB64Encoded},
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_FORBIDDEN,
        string `Invalid status code received when updating PAR lead status. ` +
        string `Expected: ${http:STATUS_FORBIDDEN}, Received: ${response.statusCode}`);
    json jsonPayload = check response.getJsonPayload();
    test:assertEquals(jsonPayload.message, "Lead comment and par rating are required before sharing the PAR.");
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testParRating_UpdateParRatingAsLead_ShareWithoutParRating]
}
function testParRating_UpdateParRating_UpdateF2fStatus_WhileLeadStatusIsDraft() returns error? {
    int parCycleId = 3;
    database:ParRating[] parRatingsFromDB = check getParRatingsFromDB(parCycleId);
    database:ParRating parRating = parRatingsFromDB[0];

    string employeeEmail = parRating.parEmployeeEmail;
    entity:Employee employee = check getEmployeeByEmail(employeeEmail);
    types:InvokerDetails invokerDetails = getInvokerDetailsAs(employee.managerEmail ?: "");

    int parRatingId = check parRating.parRatingId.ensureType();
    http:Response response = check testClient->patch(
        string `/par-cycles/${parCycleId}/employees/${employeeEmail}/par-ratings/${parRatingId}`,
        {parF2fStatus: types:COMPLETED},
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_FORBIDDEN,
        string `Invalid status code received when updating F2F status. ` +
        string `Expected: ${http:STATUS_FORBIDDEN}, Received: ${response.statusCode}`);
    json jsonPayload = check response.getJsonPayload();
    test:assertEquals(jsonPayload.message,
        "Cannot modify the F2F status before lead shares the PAR rating with the employee.");
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testParRating_UpdateParRating_UpdateF2fStatus_WhileLeadStatusIsDraft]
}
function testParRating_UpdateParRatingAsLead_Draft() returns error? {
    int parCycleId = 3;
    check updateParCycleLeadDeadline(parCycleId, check getDateTodayUtc());

    database:ParRating[] parRatingsFromDB = check getParRatingsFromDB(parCycleId);
    database:ParRating parRating = parRatingsFromDB[0];

    string employeeEmail = parRating.parEmployeeEmail;
    entity:Employee employee = check getEmployeeByEmail(employeeEmail);
    types:InvokerDetails invokerDetails = getInvokerDetailsAs(employee.managerEmail ?: "");

    string parLeadCommentB64Encoded = check (check mime:base64Encode("Leads First Comment")).ensureType();
    test:when(getAesEncryptionValueQueryMockFn).call("getAesEncryptionValueQueryForTests");

    int parRatingId = check parRating.parRatingId.ensureType();
    http:Response response = check testClient->patch(
        string `/par-cycles/${parCycleId}/employees/${employeeEmail}/par-ratings/${parRatingId}`,
        {parLeadStatus: types:DRAFT, parLeadComment: parLeadCommentB64Encoded, parRating: "Successful"},
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_OK,
        string `Invalid status code received when updating employee PAR employee status. ` +
        string `Expected: ${http:STATUS_OK}, Received: ${response.statusCode}`);

    response = check testClient->get(
        string `/par-cycles/${parCycleId}/employees/${employeeEmail}/par-ratings`,
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_OK,
        string `Invalid status code received when getting par ratings of an employee as an admin. ` +
        string `Expected: ${http:STATUS_OK}, Received: ${response.statusCode}`);

    json jsonPayload = check response.getJsonPayload();
    types:ParRating parRatingResponse = check jsonPayload.cloneWithType();
    parRatingsFromDB = check getParRatingsFromDB(parCycleId);
    parRating = parRatingsFromDB[0];
    database:ParTeam parTeam = check database:getParTeam(parRating.parTeamId);
    verifyParRatingResponse(parRatingResponse, check getParRatingFrom(parRating, parTeam));
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testParRating_UpdateParRatingAsLead_Draft]
}
function testParTeam_GetParTeamSumaryAsLead_AfterLeadDraft() returns error? {
    int parCycleId = 3;
    database:ParRating[] parRatingsFromDB = check getParRatingsFromDB(parCycleId);
    database:ParRating parRating = parRatingsFromDB[0];
    int parTeamId = parRating.parTeamId;

    string employeeEmail = parRating.parEmployeeEmail;
    entity:Employee employee = check getEmployeeByEmail(employeeEmail);
    types:InvokerDetails invokerDetails = getInvokerDetailsAs(employee.managerEmail ?: "");

    http:Response response = check testClient->get(string `/par-cycles/${parCycleId}/teams/${parTeamId}`,
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_OK,
        string `Invalid status code received when getting par team as lead. ` +
        string `Expected: ${http:STATUS_OK}, Received: ${response.statusCode}`);

    json jsonPayload = check response.getJsonPayload();
    types:ParTeamDetails result = check jsonPayload.cloneWithType();

    test:assertEquals(result.parTeamId, parTeamId, string `Par team ID mismatched. ` +
        string `Expected: ${parTeamId}, Received: ${result.parTeamId}`);
    test:assertEquals(result.numberOfTeamMembers, 2, string `Number of team members mismatched.` +
        string `Expected: 2, Received: ${result.numberOfTeamMembers}`);
    test:assertEquals(result.summary.employeeParCompletedCount, 1,
        string `Number of employee completed count mismatched.` +
        string `Expected: 1, Received: ${result.summary.employeeParCompletedCount}`);
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testParTeam_GetParTeamSumaryAsLead_AfterLeadDraft]
}
function testParRating_UpdateParRatingAsEmployee_AfterLeadDraft() returns error? {
    int parCycleId = 3;
    database:ParRating[] parRatingsFromDB = check getParRatingsFromDB(parCycleId);
    database:ParRating parRating = parRatingsFromDB[0];

    string employeeEmail = parRating.parEmployeeEmail;
    types:InvokerDetails invokerDetails = getInvokerDetailsAs(employeeEmail);

    string parEmployeeCommentB64Encoded = check (check mime:base64Encode("Employee comment after sharing")).ensureType();
    test:when(getAesEncryptionValueQueryMockFn).call("getAesEncryptionValueQueryForTests");

    int parRatingId = check parRating.parRatingId.ensureType();
    http:Response response = check testClient->patch(
        string `/par-cycles/${parCycleId}/employees/${employeeEmail}/par-ratings/${parRatingId}`,
        {parEmployeeStatus: types:SHARED, parEmployeeComment: parEmployeeCommentB64Encoded},
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_FORBIDDEN,
        string `Invalid status code received when updating employee PAR. ` +
        string `Expected: ${http:STATUS_OK}, Received: ${response.statusCode}`);
    json jsonPayload = check response.getJsonPayload();
    test:assertEquals(jsonPayload.message, "Employees are not allowed to modify their PAR after the lead has reviewed it.");
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testParRating_UpdateParRatingAsLead_Draft]
}
function testParRating_GetParRatingOfAnEmployeeAsEmployee_AfterLeadSubmitAsDraft() returns error? {
    int parCycleId = 3;
    database:ParRating[] parRatingsFromDB = check getParRatingsFromDB(parCycleId);
    database:ParRating parRating = parRatingsFromDB[0];
    database:ParTeam parTeam = check database:getParTeam(parRating.parTeamId);

    string employeeEmail = parRating.parEmployeeEmail;
    types:InvokerDetails invokerDetails = getInvokerDetailsAs(employeeEmail);

    test:when(getAesEncryptionValueQueryMockFn).call("getAesEncryptionValueQueryForTests");

    http:Response response = check testClient->get(
        string `/par-cycles/${parCycleId}/employees/${employeeEmail}/par-ratings`,
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_OK,
        string `Invalid status code received when getting par ratings of an employee as an admin. ` +
        string `Expected: ${http:STATUS_OK}, Received: ${response.statusCode}`);

    json jsonPayload = check response.getJsonPayload();
    types:ParRating parRatingResponse = check jsonPayload.cloneWithType();

    types:ParRating expectedParRating = check getParRatingFrom(parRating, parTeam);
    expectedParRating.parRating = ();
    expectedParRating.parSpecialRating = ();
    expectedParRating.parLeadComment = ();
    verifyParRatingResponse(parRatingResponse, expectedParRating);
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [
        testParRating_GetParRatingOfAnEmployeeAsEmployee_AfterLeadSubmitAsDraft,
        testParRating_UpdateParRatingAsLead_SpecialRatingTop5,
        testParRating_UpdateParRatingAsLead_SpecialRatingTop20,
        testParRating_UpdateParRatingAsEmployee_UpdateEmployeeAcceptanceRejected_BeforeLeadShare
    ]
}
function testParRating_UpdateParRatingAsLead_Shared() returns error? {
    int parCycleId = 3;
    database:ParRating[] parRatingsFromDB = check getParRatingsFromDB(parCycleId);
    database:ParRating parRating = parRatingsFromDB[0];

    string employeeEmail = parRating.parEmployeeEmail;
    entity:Employee employee = check getEmployeeByEmail(employeeEmail);
    types:InvokerDetails invokerDetails = getInvokerDetailsAs(employee.managerEmail ?: "");

    test:when(getAesEncryptionValueQueryMockFn).call("getAesEncryptionValueQueryForTests");

    int parRatingId = check parRating.parRatingId.ensureType();
    http:Response response = check testClient->patch(
        string `/par-cycles/${parCycleId}/employees/${employeeEmail}/par-ratings/${parRatingId}`,
        {parLeadStatus: types:SHARED},
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_OK,
        string `Invalid status code received when updating employee PAR employee status. ` +
        string `Expected: ${http:STATUS_OK}, Received: ${response.statusCode}`);

    response = check testClient->get(
        string `/par-cycles/${parCycleId}/employees/${employeeEmail}/par-ratings`,
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_OK,
        string `Invalid status code received when getting par ratings of an employee as an admin. ` +
        string `Expected: ${http:STATUS_OK}, Received: ${response.statusCode}`);

    json jsonPayload = check response.getJsonPayload();
    types:ParRating parRatingResponse = check jsonPayload.cloneWithType();
    parRatingsFromDB = check getParRatingsFromDB(parCycleId);
    parRating = parRatingsFromDB[0];
    database:ParTeam parTeam = check database:getParTeam(parRating.parTeamId);
    verifyParRatingResponse(parRatingResponse, check getParRatingFrom(parRating, parTeam));
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [
        testParRating_UpdateParRatingAsLead_Shared
    ]
}
function testParRating_UpdateParRatingAsLead_SharedWhileEmployStatusIsShared() returns error? {
    int parCycleId = 3;

    database:ParRating[] parRatingsFromDB = check getParRatingsFromDB(parCycleId);
    database:ParRating parRating = parRatingsFromDB[0];

    check updateParRatingEmployeeStatus(parCycleId, check parRating.parRatingId.ensureType(), types:SHARED);
    check updateParRatingLeadStatus(parCycleId, check parRating.parRatingId.ensureType(), types:PENDING);

    string employeeEmail = parRating.parEmployeeEmail;
    entity:Employee employee = check getEmployeeByEmail(employeeEmail);
    types:InvokerDetails invokerDetails = getInvokerDetailsAs(employee.managerEmail ?: "");

    test:when(getAesEncryptionValueQueryMockFn).call("getAesEncryptionValueQueryForTests");

    int parRatingId = check parRating.parRatingId.ensureType();
    http:Response response = check testClient->patch(
        string `/par-cycles/${parCycleId}/employees/${employeeEmail}/par-ratings/${parRatingId}`,
        {parLeadStatus: types:SHARED},
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_OK,
        string `Invalid status code received when updating employee PAR employee status. ` +
        string `Expected: ${http:STATUS_OK}, Received: ${response.statusCode}`);

    response = check testClient->get(
        string `/par-cycles/${parCycleId}/employees/${employeeEmail}/par-ratings`,
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_OK,
        string `Invalid status code received when getting par ratings of an employee as an admin. ` +
        string `Expected: ${http:STATUS_OK}, Received: ${response.statusCode}`);

    json jsonPayload = check response.getJsonPayload();
    types:ParRating parRatingResponse = check jsonPayload.cloneWithType();
    parRatingsFromDB = check getParRatingsFromDB(parCycleId);
    parRating = parRatingsFromDB[0];
    database:ParTeam parTeam = check database:getParTeam(parRating.parTeamId);
    verifyParRatingResponse(parRatingResponse, check getParRatingFrom(parRating, parTeam));
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testParRating_UpdateParRatingAsLead_SharedWhileEmployStatusIsShared]
}
function testParRating_UpdateParRatingAsLead_AfterLeadShared() returns error? {
    int parCycleId = 3;
    database:ParRating[] parRatingsFromDB = check getParRatingsFromDB(parCycleId);
    database:ParRating parRating = parRatingsFromDB[0];

    string employeeEmail = parRating.parEmployeeEmail;
    entity:Employee employee = check getEmployeeByEmail(employeeEmail);
    types:InvokerDetails invokerDetails = getInvokerDetailsAs(employee.managerEmail ?: "");

    string parLeadCommentB64Encoded = check (check mime:base64Encode("Lead change comment after sharing")).ensureType();
    test:when(getAesEncryptionValueQueryMockFn).call("getAesEncryptionValueQueryForTests");

    int parRatingId = check parRating.parRatingId.ensureType();
    http:Response response = check testClient->patch(
        string `/par-cycles/${parCycleId}/employees/${employeeEmail}/par-ratings/${parRatingId}`,
        {parLeadComment: parLeadCommentB64Encoded},
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_FORBIDDEN,
        string `Invalid status code received when updating employee PAR employee status. ` +
        string `Expected: ${http:STATUS_FORBIDDEN}, Received: ${response.statusCode}`);
    json jsonPayload = check response.getJsonPayload();
    test:assertEquals(jsonPayload.message,
        "Leads are not allowed to modify the PAR rating, special rating, or lead comment after sharing.");
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testParRating_UpdateParRatingAsLead_AfterLeadShared]
}
function testParRating_UpdateParRatingAsLead_AfterLeadShared_WithF2fStatus() returns error? {
    int parCycleId = 3;
    database:ParRating[] parRatingsFromDB = check getParRatingsFromDB(parCycleId);
    database:ParRating parRating = parRatingsFromDB[0];

    string employeeEmail = parRating.parEmployeeEmail;
    entity:Employee employee = check getEmployeeByEmail(employeeEmail);
    types:InvokerDetails invokerDetails = getInvokerDetailsAs(employee.managerEmail ?: "");

    string parLeadCommentB64Encoded = check (check mime:base64Encode("Lead change comment after sharing")).ensureType();
    test:when(getAesEncryptionValueQueryMockFn).call("getAesEncryptionValueQueryForTests");

    int parRatingId = check parRating.parRatingId.ensureType();
    http:Response response = check testClient->patch(
        string `/par-cycles/${parCycleId}/employees/${employeeEmail}/par-ratings/${parRatingId}`,
        {parLeadComment: parLeadCommentB64Encoded, parF2fStatus: types:COMPLETED},
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_FORBIDDEN,
        string `Invalid status code received when updating employee PAR employee status. ` +
        string `Expected: ${http:STATUS_FORBIDDEN}, Received: ${response.statusCode}`);
    json jsonPayload = check response.getJsonPayload();
    test:assertEquals(jsonPayload.message,
        "Leads are not allowed to modify the PAR rating, special rating, or lead comment after sharing.");

    response = check testClient->patch(
        string `/par-cycles/${parCycleId}/employees/${employeeEmail}/par-ratings/${parRatingId}`,
        {parRating: "Successful", parF2fStatus: types:COMPLETED},
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_FORBIDDEN,
        string `Invalid status code received when updating employee PAR employee status. ` +
        string `Expected: ${http:STATUS_FORBIDDEN}, Received: ${response.statusCode}`);
    jsonPayload = check response.getJsonPayload();
    test:assertEquals(jsonPayload.message,
        "Leads are not allowed to modify the PAR rating, special rating, or lead comment after sharing.");

    response = check testClient->patch(
        string `/par-cycles/${parCycleId}/employees/${employeeEmail}/par-ratings/${parRatingId}`,
        {parSpecialRating: types:TOP20P, parF2fStatus: types:COMPLETED},
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_FORBIDDEN,
        string `Invalid status code received when updating employee PAR employee status. ` +
        string `Expected: ${http:STATUS_FORBIDDEN}, Received: ${response.statusCode}`);
    jsonPayload = check response.getJsonPayload();
    test:assertEquals(jsonPayload.message,
        "Leads are not allowed to modify the PAR rating, special rating, or lead comment after sharing.");
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testParRating_UpdateParRatingAsLead_AfterLeadShared_WithF2fStatus]
}
function testParRating_UpdateParRatingAsEmployee_AfterLeadShared_UpdateEmployeeAcceptance() returns error? {
    int parCycleId = 3;
    database:ParRating[] parRatingsFromDB = check getParRatingsFromDB(parCycleId);
    database:ParRating parRating = parRatingsFromDB[0];

    string employeeEmail = parRating.parEmployeeEmail;
    entity:Employee employee = check getEmployeeByEmail(employeeEmail);
    types:InvokerDetails invokerDetails = getInvokerDetailsAs(employee.workEmail);

    string parEmployeeAcceptanceCommentB64Encoded = check (check mime:base64Encode("Employee Acceptance")).ensureType();
    test:when(getAesEncryptionValueQueryMockFn).call("getAesEncryptionValueQueryForTests");

    int parRatingId = check parRating.parRatingId.ensureType();
    http:Response response = check testClient->patch(
        string `/par-cycles/${parCycleId}/employees/${employeeEmail}/par-ratings/${parRatingId}`,
        {
        parEmployeeAcceptanceStatus: types:ACCEPTED,
        parEmployeeAcceptanceComment: parEmployeeAcceptanceCommentB64Encoded
    },
        headers = getDefaultHeaders(invokerDetails));

    test:assertEquals(response.statusCode, http:STATUS_OK,
        string `Invalid status code received when updating employee PAR rating as an admin after lead shared. ` +
        string `Expected: ${http:STATUS_OK}, Received: ${response.statusCode}`);
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testParRating_GetParRatingOfAnEmployeeAsEmployee_AfterLeadSubmitAsDraft]
}
function testParRating_UpdateParRatingAsEmployee_UpdateEmployeeAcceptanceRejected_BeforeLeadShare() returns error? {
    int parCycleId = 3;
    database:ParRating[] parRatingsFromDB = check getParRatingsFromDB(parCycleId);
    database:ParRating parRating = parRatingsFromDB[0];

    string employeeEmail = parRating.parEmployeeEmail;
    entity:Employee employee = check getEmployeeByEmail(employeeEmail);
    types:InvokerDetails invokerDetails = getInvokerDetailsAs(employee.workEmail);

    string parEmployeeAcceptanceCommentB64Encoded = check (check mime:base64Encode("Employee Rejecttion")).ensureType();
    test:when(getAesEncryptionValueQueryMockFn).call("getAesEncryptionValueQueryForTests");

    int parRatingId = check parRating.parRatingId.ensureType();
    http:Response response = check testClient->patch(
        string `/par-cycles/${parCycleId}/employees/${employeeEmail}/par-ratings/${parRatingId}`,
        {
        parEmployeeAcceptanceStatus: types:REJECTED,
        parEmployeeAcceptanceComment: parEmployeeAcceptanceCommentB64Encoded
    },
        headers = getDefaultHeaders(invokerDetails));

    test:assertEquals(response.statusCode, http:STATUS_FORBIDDEN,
        string `Invalid status code received when updating employee acceptance status. ` +
        string `Expected: ${http:STATUS_FORBIDDEN}, Received: ${response.statusCode}`);
    json jsonPayload = check response.getJsonPayload();
    test:assertEquals(jsonPayload.message,
        "Cannot modify the employee acceptance status before lead shares the PAR rating.");
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testParRating_UpdateParRatingAsLead_AfterLeadShared]
}
function testParRating_UpdateParRatingAsEmployee_UpdateEmployeeAcceptanceRejected_WithoutComment() returns error? {
    int parCycleId = 3;
    database:ParRating[] parRatingsFromDB = check getParRatingsFromDB(parCycleId);
    database:ParRating parRating = parRatingsFromDB[0];

    string employeeEmail = parRating.parEmployeeEmail;
    entity:Employee employee = check getEmployeeByEmail(employeeEmail);
    types:InvokerDetails invokerDetails = getInvokerDetailsAs(employee.workEmail);

    int parRatingId = check parRating.parRatingId.ensureType();
    http:Response response = check testClient->patch(
        string `/par-cycles/${parCycleId}/employees/${employeeEmail}/par-ratings/${parRatingId}`,
        {parEmployeeAcceptanceStatus: types:REJECTED},
        headers = getDefaultHeaders(invokerDetails));

    test:assertEquals(response.statusCode, http:STATUS_FORBIDDEN,
        string `Invalid status code received when updating employee PAR rating as an admin after lead shared. ` +
        string `Expected: ${http:STATUS_FORBIDDEN}, Received: ${response.statusCode}`);
    json jsonPayload = check response.getJsonPayload();
    test:assertEquals(jsonPayload.message,
        "Employee acceptance comment is required when updating the employee acceptance status.");
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testParRating_UpdateParRatingAsEmployee_UpdateEmployeeAcceptanceRejected_WithoutComment]
}
function testParRating_UpdateParRatingAsEmployee_UpdateEmployeeAcceptanceRejected() returns error? {
    int parCycleId = 3;
    database:ParRating[] parRatingsFromDB = check getParRatingsFromDB(parCycleId);
    database:ParRating parRating = parRatingsFromDB[0];

    string employeeEmail = parRating.parEmployeeEmail;
    entity:Employee employee = check getEmployeeByEmail(employeeEmail);
    types:InvokerDetails invokerDetails = getInvokerDetailsAs(employee.workEmail);

    string parEmployeeAcceptanceCommentB64Encoded = check (check mime:base64Encode("Employee Rejecttion")).ensureType();
    test:when(getAesEncryptionValueQueryMockFn).call("getAesEncryptionValueQueryForTests");

    int parRatingId = check parRating.parRatingId.ensureType();
    http:Response response = check testClient->patch(
        string `/par-cycles/${parCycleId}/employees/${employeeEmail}/par-ratings/${parRatingId}`,
        {
        parEmployeeAcceptanceStatus: types:REJECTED,
        parEmployeeAcceptanceComment: parEmployeeAcceptanceCommentB64Encoded
    },
        headers = getDefaultHeaders(invokerDetails));

    test:assertEquals(response.statusCode, http:STATUS_OK,
        string `Invalid status code received when updating employee PAR rating as an admin after lead shared. ` +
        string `Expected: ${http:STATUS_OK}, Received: ${response.statusCode}`);
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testParRating_UpdateParRatingAsEmployee_UpdateEmployeeAcceptanceRejected]
}
function testParRating_UpdateParRatingAsEmployee_UpdateEmployeeAcceptanceRejected_Again() returns error? {
    int parCycleId = 3;
    database:ParRating[] parRatingsFromDB = check getParRatingsFromDB(parCycleId);
    database:ParRating parRating = parRatingsFromDB[0];

    string employeeEmail = parRating.parEmployeeEmail;
    entity:Employee employee = check getEmployeeByEmail(employeeEmail);
    types:InvokerDetails invokerDetails = getInvokerDetailsAs(employee.workEmail);

    string parEmployeeAcceptanceCommentB64Encoded = check (check mime:base64Encode("Employee Rejecttion")).ensureType();
    test:when(getAesEncryptionValueQueryMockFn).call("getAesEncryptionValueQueryForTests");

    int parRatingId = check parRating.parRatingId.ensureType();
    http:Response response = check testClient->patch(
        string `/par-cycles/${parCycleId}/employees/${employeeEmail}/par-ratings/${parRatingId}`,
        {
        parEmployeeAcceptanceStatus: types:REJECTED,
        parEmployeeAcceptanceComment: parEmployeeAcceptanceCommentB64Encoded
    },
        headers = getDefaultHeaders(invokerDetails));

    test:assertEquals(response.statusCode, http:STATUS_FORBIDDEN,
        string `Invalid status code received when updating employee PAR rating as an admin after lead shared. ` +
        string `Expected: ${http:STATUS_FORBIDDEN}, Received: ${response.statusCode}`);
    json jsonPayload = check response.getJsonPayload();
    test:assertEquals(jsonPayload.message, "Cannot modify the employee acceptance status after it is rejected.");
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testParRating_UpdateParRatingAsEmployee_AfterLeadShared_UpdateEmployeeAcceptance]
}
function testParRating_UpdateParRating_UpdateF2fStatus_WithoutF2fDate() returns error? {
    int parCycleId = 3;
    database:ParRating[] parRatingsFromDB = check getParRatingsFromDB(parCycleId);
    database:ParRating parRating = parRatingsFromDB[0];

    string employeeEmail = parRating.parEmployeeEmail;
    entity:Employee employee = check getEmployeeByEmail(employeeEmail);
    types:InvokerDetails invokerDetails = getInvokerDetailsAs(employee.managerEmail ?: "");

    int parRatingId = check parRating.parRatingId.ensureType();
    http:Response response = check testClient->patch(
        string `/par-cycles/${parCycleId}/employees/${employeeEmail}/par-ratings/${parRatingId}`,
        {parF2fStatus: types:COMPLETED},
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_FORBIDDEN,
        string `Invalid status code received when updating F2F status. ` +
        string `Expected: ${http:STATUS_FORBIDDEN}, Received: ${response.statusCode}`);
    json jsonPayload = check response.getJsonPayload();
    test:assertEquals(jsonPayload.message, "F2F date is required when updating the F2F status.");
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testParRating_UpdateParRatingAsEmployee_AfterLeadShared_UpdateEmployeeAcceptance]
}
function testParRating_UpdateParRating_UpdateF2fStatus_WithInvalidF2fDate() returns error? {
    int parCycleId = 3;
    database:ParRating[] parRatingsFromDB = check getParRatingsFromDB(parCycleId);
    database:ParRating parRating = parRatingsFromDB[0];

    string employeeEmail = parRating.parEmployeeEmail;
    entity:Employee employee = check getEmployeeByEmail(employeeEmail);
    types:InvokerDetails invokerDetails = getInvokerDetailsAs(employee.managerEmail ?: "");

    int parRatingId = check parRating.parRatingId.ensureType();
    http:Response response = check testClient->patch(
        string `/par-cycles/${parCycleId}/employees/${employeeEmail}/par-ratings/${parRatingId}`,
        {parF2fStatus: types:COMPLETED, parF2fDate: check getTomorrow()},
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_FORBIDDEN,
        string `Invalid status code received when updating F2F status. ` +
        string `Expected: ${http:STATUS_FORBIDDEN}, Received: ${response.statusCode}`);
    json jsonPayload = check response.getJsonPayload();
    test:assertEquals(jsonPayload.message, "F2F date should be today or a past date.");
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testParRating_UpdateParRatingAsEmployee_AfterLeadShared_UpdateEmployeeAcceptance]
}
function testParRating_UpdateParRating_UpdateF2fStatus_AfterLeadShared() returns error? {
    int parCycleId = 3;
    database:ParRating[] parRatingsFromDB = check getParRatingsFromDB(parCycleId);
    database:ParRating parRating = parRatingsFromDB[0];

    string employeeEmail = parRating.parEmployeeEmail;
    entity:Employee employee = check getEmployeeByEmail(employeeEmail);
    types:InvokerDetails invokerDetails = getInvokerDetailsAs(employee.managerEmail ?: "");

    int parRatingId = check parRating.parRatingId.ensureType();
    http:Response response = check testClient->patch(
        string `/par-cycles/${parCycleId}/employees/${employeeEmail}/par-ratings/${parRatingId}`,
        {parF2fStatus: types:COMPLETED, parF2fDate: check getToday()},
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_OK,
        string `Invalid status code received when updating F2F status. ` +
        string `Expected: ${http:STATUS_OK}, Received: ${response.statusCode}`);
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testParRating_UpdateParRating_UpdateF2fStatus_AfterLeadShared]
}
function testParRating_UpdateParRating_UpdateF2fStatus_BackToPending() returns error? {
    int parCycleId = 3;
    database:ParRating[] parRatingsFromDB = check getParRatingsFromDB(parCycleId);
    database:ParRating parRating = parRatingsFromDB[0];

    string employeeEmail = parRating.parEmployeeEmail;
    entity:Employee employee = check getEmployeeByEmail(employeeEmail);
    types:InvokerDetails invokerDetails = getInvokerDetailsAs(employee.managerEmail ?: "");

    int parRatingId = check parRating.parRatingId.ensureType();
    http:Response response = check testClient->patch(
        string `/par-cycles/${parCycleId}/employees/${employeeEmail}/par-ratings/${parRatingId}`,
        {parF2fStatus: types:PENDING},
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_FORBIDDEN,
        string `Invalid status code received when updating F2F status. ` +
        string `Expected: ${http:STATUS_FORBIDDEN}, Received: ${response.statusCode}`);
    json jsonPayload = check response.getJsonPayload();
    test:assertEquals(jsonPayload.message, "Cannot modify the F2F status after it is completed.");

    invokerDetails = getInvokerDetailsAs(employeeEmail);
    response = check testClient->patch(
        string `/par-cycles/${parCycleId}/employees/${employeeEmail}/par-ratings/${parRatingId}`,
        {parF2fStatus: types:PENDING},
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_FORBIDDEN,
        string `Invalid status code received when updating F2F status. ` +
        string `Expected: ${http:STATUS_FORBIDDEN}, Received: ${response.statusCode}`);
    jsonPayload = check response.getJsonPayload();
    test:assertEquals(jsonPayload.message, "Cannot modify the F2F status after it is completed.");
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testParRating_UpdateParRating_UpdateF2fStatus_BackToPending]
}
function testParRating_UpdateParRating_UpdateF2fStatus_AfterF2fIsCompleted() returns error? {
    int parCycleId = 3;
    database:ParRating[] parRatingsFromDB = check getParRatingsFromDB(parCycleId);
    database:ParRating parRating = parRatingsFromDB[0];

    string employeeEmail = parRating.parEmployeeEmail;
    entity:Employee employee = check getEmployeeByEmail(employeeEmail);
    types:InvokerDetails invokerDetails = getInvokerDetailsAs(employee.managerEmail ?: "");

    int parRatingId = check parRating.parRatingId.ensureType();
    http:Response response = check testClient->patch(
        string `/par-cycles/${parCycleId}/employees/${employeeEmail}/par-ratings/${parRatingId}`,
        {parF2fStatus: types:COMPLETED, parF2fDate: check getYesterdayOf(check getToday())},
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_FORBIDDEN,
        string `Invalid status code received when updating F2F status. ` +
        string `Expected: ${http:STATUS_FORBIDDEN}, Received: ${response.statusCode}`);
    json jsonPayload = check response.getJsonPayload();
    test:assertEquals(jsonPayload.message, "Cannot modify the F2F status or date as it is already marked as completed.");

    invokerDetails = getInvokerDetailsAs(employeeEmail);
    response = check testClient->patch(
        string `/par-cycles/${parCycleId}/employees/${employeeEmail}/par-ratings/${parRatingId}`,
        {parF2fStatus: types:COMPLETED, parF2fDate: check getYesterdayOf(check getToday())},
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_FORBIDDEN,
        string `Invalid status code received when updating F2F status. ` +
        string `Expected: ${http:STATUS_FORBIDDEN}, Received: ${response.statusCode}`);
    jsonPayload = check response.getJsonPayload();
    test:assertEquals(jsonPayload.message, "Cannot modify the F2F status or date as it is already marked as completed.");
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testParRating_UpdateParRating_UpdateF2fStatus_AfterF2fIsCompleted]
}
function testParRating_UpdateParRatingAsAdminLead_AfterLeadShared() returns error? {
    int parCycleId = 3;
    database:ParRating[] parRatingsFromDB = check getParRatingsFromDB(parCycleId);
    database:ParRating parRating = parRatingsFromDB[0];

    string employeeEmail = parRating.parEmployeeEmail;
    entity:Employee employee = check getEmployeeByEmail(employeeEmail);
    types:InvokerDetails invokerDetails = getInvokerDetailsAsWithAdminPermission(employee.managerEmail ?: "");

    test:when(getAesEncryptionValueQueryMockFn).call("getAesEncryptionValueQueryForTests");

    int parRatingId = check parRating.parRatingId.ensureType();
    http:Response response = check testClient->patch(
        string `/par-cycles/${parCycleId}/employees/${employeeEmail}/par-ratings/${parRatingId}`,
        {parRating: "Successful"},
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_FORBIDDEN,
        string `Invalid status code received when updating employee PAR rating as an admin after lead shared. ` +
        string `Expected: ${http:STATUS_FORBIDDEN}, Received: ${response.statusCode}`);
    json jsonPayload = check response.getJsonPayload();
    test:assertEquals(jsonPayload.message, "Leads are not allowed to modify the PAR rating, special rating, " +
        "or lead comment after sharing.");
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testParRating_UpdateParRatingAsAdminLead_AfterLeadShared]
}
function testParRating_UpdateParRatingAsAdmin_AfterLeadShared() returns error? {
    int parCycleId = 3;
    database:ParRating[] parRatingsFromDB = check getParRatingsFromDB(parCycleId);
    database:ParRating parRating = parRatingsFromDB[0];

    string employeeEmail = parRating.parEmployeeEmail;
    types:InvokerDetails invokerDetails = getInvokerDetailsAsWithAdminPermission("admin@wso2.com");

    test:when(getAesEncryptionValueQueryMockFn).call("getAesEncryptionValueQueryForTests");

    int parRatingId = check parRating.parRatingId.ensureType();
    http:Response response = check testClient->patch(
        string `/par-cycles/${parCycleId}/employees/${employeeEmail}/par-ratings/${parRatingId}`,
        {parRating: "Successful"},
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_OK,
        string `Invalid status code received when updating employee PAR rating as an admin after lead shared. ` +
        string `Expected: ${http:STATUS_OK}, Received: ${response.statusCode}`);
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testParRating_UpdateParRatingAsLead_Shared]
}
function testParRating_GetParRatingOfAnEmployeeAsEmployee_AfterLeadSubmitAsShared() returns error? {
    int parCycleId = 3;
    database:ParRating[] parRatingsFromDB = check getParRatingsFromDB(parCycleId);
    database:ParRating parRating = parRatingsFromDB[0];
    database:ParTeam parTeam = check database:getParTeam(parRating.parTeamId);

    string employeeEmail = parRating.parEmployeeEmail;
    types:InvokerDetails invokerDetails = getInvokerDetailsAs(employeeEmail);

    test:when(getAesEncryptionValueQueryMockFn).call("getAesEncryptionValueQueryForTests");

    http:Response response = check testClient->get(
        string `/par-cycles/${parCycleId}/employees/${employeeEmail}/par-ratings`,
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_OK,
        string `Invalid status code received when getting par ratings of an employee as an admin. ` +
        string `Expected: ${http:STATUS_OK}, Received: ${response.statusCode}`);

    json jsonPayload = check response.getJsonPayload();
    types:ParRating parRatingResponse = check jsonPayload.cloneWithType();

    types:ParRating expectedParRating = check getParRatingFrom(parRating, parTeam);
    expectedParRating.parAdminComment = ();
    verifyParRatingResponse(parRatingResponse, expectedParRating);
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testParRating_GetParRatingOfAnEmployeeAsEmployee_AfterLeadSubmitAsDraft]
}
function testParRating_UpdateParRatingAsLead_InvalidRating() returns error? {
    int parCycleId = 3;
    database:ParRating[] parRatingsFromDB = check getParRatingsFromDB(parCycleId);
    database:ParRating parRating = parRatingsFromDB[0];

    string employeeEmail = parRating.parEmployeeEmail;
    entity:Employee employee = check getEmployeeByEmail(employeeEmail);
    types:InvokerDetails invokerDetails = getInvokerDetailsAs(employee.managerEmail ?: "");

    http:Response response = check testClient->get(
        string `/par-cycles/${parCycleId}/employees/${employeeEmail}/par-ratings`,
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_OK,
        string `Invalid status code received when getting par ratings of an employee as an admin. ` +
        string `Expected: ${http:STATUS_OK}, Received: ${response.statusCode}`);

    json jsonPayload = check response.getJsonPayload();
    types:ParRating parRatingResponse = check jsonPayload.cloneWithType();

    string parLeadCommentB64Encoded = check (check mime:base64Encode("Leads First Comment")).ensureType();
    test:when(getAesEncryptionValueQueryMockFn).call("getAesEncryptionValueQueryForTests");

    response = check testClient->patch(
        string `/par-cycles/${parCycleId}/employees/${employeeEmail}/par-ratings/${parRatingResponse.parRatingId}`,
        {parLeadStatus: types:DRAFT, parLeadComment: parLeadCommentB64Encoded, parRating: "InvalidRating"},
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_BAD_REQUEST,
        string `Invalid status code received when updating employee PAR employee status. ` +
        string `Expected: ${http:STATUS_BAD_REQUEST}, Received: ${response.statusCode}`);

    jsonPayload = check response.getJsonPayload();
    test:assertEquals(jsonPayload.message, string `The provided PAR rating is not valid. ` +
        string `Valid ratings: [Exceptional, Successful, Needs Improvements]`);
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testParRating_UpdateParRatingAsLead_Draft]
}
function testParRating_UpdateParRatingAsLead_SpecialRatingTop5_AfterSpecialRatingDeadline() returns error? {
    int parCycleId = 3;
    string employeeEmail = "tom@wso2.com";
    entity:Employee employee = check getEmployeeByEmail(employeeEmail);
    types:InvokerDetails invokerDetails = getInvokerDetailsAs(employee.managerEmail ?: "");

    test:when(getAesEncryptionValueQueryMockFn).call("getAesEncryptionValueQueryForTests");

    database:ParRating parRating = check database:getParRating(parCycleId, employeeEmail);
    database:ParTeam parTeam = check database:getParTeam(parRating.parTeamId);
    int specialRatingGroupId = check parTeam.parSpecialRatingGroupId.ensureType();
    int specialRatingQuotaId = check addParSpecialRatingQuota(parCycleId, "QN1", 1, 1, specialRatingGroupId);
    check updateSpecialRatingGroupWithQuota(specialRatingQuotaId, specialRatingGroupId);

    int parRatingId = check parRating.parRatingId.ensureType();
    http:Response response = check testClient->patch(
        string `/par-cycles/${parCycleId}/employees/${employeeEmail}/par-ratings/${parRatingId}`,
        {parSpecialRating: types:TOP5P},
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_FORBIDDEN,
        string `Invalid status code received when updating special rating of an employee. ` +
        string `Expected: ${http:STATUS_FORBIDDEN}, Received: ${response.statusCode}`);
    json jsonPayload = check response.getJsonPayload();
    test:assertEquals(jsonPayload.message, "Special ratings are not allowed to be modified after the deadline.");
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testParRating_UpdateParRatingAsLead_SpecialRatingTop5_AfterSpecialRatingDeadline]
}
function testParRating_UpdateParRatingAsLead_SpecialRatingTop5() returns error? {
    int parCycleId = 3;
    check updateParCycleSpecialRatingDeadline(parCycleId, check getDateTodayUtc());

    string employeeEmail = "tom@wso2.com";
    entity:Employee employee = check getEmployeeByEmail(employeeEmail);
    types:InvokerDetails invokerDetails = getInvokerDetailsAs(employee.managerEmail ?: "");

    test:when(getAesEncryptionValueQueryMockFn).call("getAesEncryptionValueQueryForTests");

    database:ParRating parRating = check database:getParRating(parCycleId, employeeEmail);
    database:ParTeam parTeam = check database:getParTeam(parRating.parTeamId);
    int specialRatingGroupId = check parTeam.parSpecialRatingGroupId.ensureType();
    int specialRatingQuotaId = check addParSpecialRatingQuota(parCycleId, "QN1", 1, 1, specialRatingGroupId);
    check updateSpecialRatingGroupWithQuota(specialRatingQuotaId, specialRatingGroupId);

    int parRatingId = check parRating.parRatingId.ensureType();
    http:Response response = check testClient->patch(
        string `/par-cycles/${parCycleId}/employees/${employeeEmail}/par-ratings/${parRatingId}`,
        {parSpecialRating: types:TOP5P},
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_OK,
        string `Invalid status code received when updating special rating of an employee. ` +
        string `Expected: ${http:STATUS_OK}, Received: ${response.statusCode}`);

    employeeEmail = "brad@wso2.com";
    parRating = check database:getParRating(parCycleId, employeeEmail);

    parRatingId = check parRating.parRatingId.ensureType();
    response = check testClient->patch(
        string `/par-cycles/${parCycleId}/employees/${employeeEmail}/par-ratings/${parRatingId}`,
        {parSpecialRating: types:TOP5P},
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_FORBIDDEN,
        string `Invalid status code received when updating special rating of an employee. ` +
        string `Expected: ${http:STATUS_FORBIDDEN}, Received: ${response.statusCode}`);
    json jsonPayload = check response.getJsonPayload();
    test:assertEquals(jsonPayload.message, "The quota for the top 5% special rating has been exceeded.");
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testParRating_UpdateParRatingAsLead_SpecialRatingTop5]
}
function testParRating_UpdateParRatingAsLead_SpecialRatingTop5_ForCommonRatingGroups() returns error? {
    int parCycleId = 3;
    string employeeEmail = "tom@wso2.com";
    entity:Employee employee = check getEmployeeByEmail(employeeEmail);
    types:InvokerDetails invokerDetails1 = getInvokerDetailsAs(employee.managerEmail ?: "");

    test:when(getAesEncryptionValueQueryMockFn).call("getAesEncryptionValueQueryForTests");

    database:ParRating parRating1 = check database:getParRating(parCycleId, employeeEmail);
    database:ParTeam parTeam1 = check database:getParTeam(parRating1.parTeamId);
    int specialRatingGroupId = check parTeam1.parSpecialRatingGroupId.ensureType();
    int specialRatingQuotaId = check addParSpecialRatingQuota(parCycleId, "QN1", 2, 1, specialRatingGroupId);
    check updateSpecialRatingGroupWithQuota(specialRatingQuotaId, specialRatingGroupId);

    int parRatingId = check parRating1.parRatingId.ensureType();
    http:Response response = check testClient->patch(
        string `/par-cycles/${parCycleId}/employees/${employeeEmail}/par-ratings/${parRatingId}`,
        {parSpecialRating: types:TOP5P},
        headers = getDefaultHeaders(invokerDetails1));
    test:assertEquals(response.statusCode, http:STATUS_OK,
        string `Invalid status code received when updating special rating of an employee. ` +
        string `Expected: ${http:STATUS_OK}, Received: ${response.statusCode}`);

    employeeEmail = "sam@wso2.com";
    employee = check getEmployeeByEmail(employeeEmail);
    types:InvokerDetails invokerDetails2 = getInvokerDetailsAs(employee.managerEmail ?: "");

    database:ParRating parRating2 = check database:getParRating(parCycleId, employeeEmail);
    database:ParTeam parTeam2 = check database:getParTeam(parRating2.parTeamId);
    specialRatingGroupId = check parTeam2.parSpecialRatingGroupId.ensureType();
    check updateSpecialRatingGroupWithQuota(specialRatingQuotaId, specialRatingGroupId);

    parRatingId = check parRating2.parRatingId.ensureType();
    response = check testClient->patch(
        string `/par-cycles/${parCycleId}/employees/${employeeEmail}/par-ratings/${parRatingId}`,
        {parSpecialRating: types:TOP5P},
        headers = getDefaultHeaders(invokerDetails2));
    test:assertEquals(response.statusCode, http:STATUS_OK,
        string `Invalid status code received when updating special rating of an employee. ` +
        string `Expected: ${http:STATUS_OK}, Received: ${response.statusCode}`);

    response = check testClient->get(string `/par-cycles/${parCycleId}/teams/${parRating1.parTeamId}`,
        headers = getDefaultHeaders(invokerDetails1));
    test:assertEquals(response.statusCode, http:STATUS_OK,
        string `Invalid status code received when getting par team as lead. ` +
        string `Expected: ${http:STATUS_OK}, Received: ${response.statusCode}`);
    json jsonPayload = check response.getJsonPayload();
    types:ParTeamDetails parTeamDetails1 = check jsonPayload.cloneWithType();

    response = check testClient->get(string `/par-cycles/${parCycleId}/teams/${parRating2.parTeamId}`,
        headers = getDefaultHeaders(invokerDetails2));
    test:assertEquals(response.statusCode, http:STATUS_OK,
        string `Invalid status code received when getting par team as lead. ` +
        string `Expected: ${http:STATUS_OK}, Received: ${response.statusCode}`);
    jsonPayload = check response.getJsonPayload();
    types:ParTeamDetails parTeamDetails2 = check jsonPayload.cloneWithType();

    test:assertEquals(parTeamDetails1.available5pSlots, 0,
        string `Number of employee available 5p slots mismatched.` +
        string `Expected: 0, Received: ${parTeamDetails1.available5pSlots}`);

    test:assertEquals(parTeamDetails2.available5pSlots, 0,
        string `Number of employee available 5p slots mismatched.` +
        string `Expected: 0, Received: ${parTeamDetails2.available5pSlots}`);
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testParRating_UpdateParRatingAsLead_SpecialRatingTop5_ForCommonRatingGroups]
}
function testParRating_UpdateParRatingAsLead_SpecialRatingTop20() returns error? {
    int parCycleId = 3;
    string employeeEmail = "tom@wso2.com";
    entity:Employee employee = check getEmployeeByEmail(employeeEmail);
    types:InvokerDetails invokerDetails = getInvokerDetailsAs(employee.managerEmail ?: "");

    test:when(getAesEncryptionValueQueryMockFn).call("getAesEncryptionValueQueryForTests");

    database:ParRating parRating = check database:getParRating(parCycleId, employeeEmail);
    database:ParTeam parTeam = check database:getParTeam(parRating.parTeamId);
    int specialRatingGroupId = check parTeam.parSpecialRatingGroupId.ensureType();
    int specialRatingQuotaId = check addParSpecialRatingQuota(parCycleId, "QN1", 1, 1, specialRatingGroupId);
    check updateSpecialRatingGroupWithQuota(specialRatingQuotaId, specialRatingGroupId);

    int parRatingId = check parRating.parRatingId.ensureType();
    http:Response response = check testClient->patch(
        string `/par-cycles/${parCycleId}/employees/${employeeEmail}/par-ratings/${parRatingId}`,
        {parSpecialRating: types:TOP20P},
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_OK,
        string `Invalid status code received when updating special rating of an employee. ` +
        string `Expected: ${http:STATUS_OK}, Received: ${response.statusCode}`);

    employeeEmail = "brad@wso2.com";
    parRating = check database:getParRating(parCycleId, employeeEmail);

    parRatingId = check parRating.parRatingId.ensureType();
    response = check testClient->patch(
        string `/par-cycles/${parCycleId}/employees/${employeeEmail}/par-ratings/${parRatingId}`,
        {parSpecialRating: types:TOP20P},
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_FORBIDDEN,
        string `Invalid status code received when updating special rating of an employee. ` +
        string `Expected: ${http:STATUS_FORBIDDEN}, Received: ${response.statusCode}`);
    json jsonPayload = check response.getJsonPayload();
    test:assertEquals(jsonPayload.message, "The quota for the top 20% special rating has been exceeded.");
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testParRating_UpdateParRatingAsLead_SpecialRatingTop20]
}
function testParRating_UpdateParRatingAsLead_InvalidSpecialRating() returns error? {
    int parCycleId = 3;
    string employeeEmail = "tom@wso2.com";
    entity:Employee employee = check getEmployeeByEmail(employeeEmail);
    types:InvokerDetails invokerDetails = getInvokerDetailsAs(employee.managerEmail ?: "");

    test:when(getAesEncryptionValueQueryMockFn).call("getAesEncryptionValueQueryForTests");

    database:ParRating parRating = check database:getParRating(parCycleId, employeeEmail);
    int parRatingId = check parRating.parRatingId.ensureType();
    http:Response response = check testClient->patch(
        string `/par-cycles/${parCycleId}/employees/${employeeEmail}/par-ratings/${parRatingId}`,
        {parSpecialRating: "TOP30P"},
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_BAD_REQUEST,
        string `Invalid status code received when updating special rating of an employee. ` +
        string `Expected: ${http:STATUS_BAD_REQUEST}, Received: ${response.statusCode}`);
    json jsonPayload = check response.getJsonPayload();
    test:assertEquals(jsonPayload, {"message": "The provided special rating is not valid. Valid ratings: [TOP5P, TOP20P]"});
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testParRating_UpdateParRatingAsLead_AfterLeadShared]
}
function testParRating_UpdateParRatingAsAdmin() returns error? {
    int parCycleId = 3;
    string employeeEmail = "tom@wso2.com";
    test:when(getAesEncryptionValueQueryMockFn).call("getAesEncryptionValueQueryForTests");
    database:ParRating[] parRatingsFromDB = check getParRatingsFromDB(parCycleId);
    database:ParRating parRating = parRatingsFromDB[0];

    types:InvokerDetails invokerDetails = getDefaultInvokerDetails();
    string parLeadCommentB64Encoded = check (check mime:base64Encode("Admins First Comment")).ensureType();

    int parRatingId = check parRating.parRatingId.ensureType();
    http:Response response = check testClient->patch(
        string `/par-cycles/${parCycleId}/employees/${employeeEmail}/par-ratings/${parRatingId}`,
        {parAdminComment: parLeadCommentB64Encoded},
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_OK,
        string `Invalid status code received when updating employee PAR employee status. ` +
        string `Expected: ${http:STATUS_OK}, Received: ${response.statusCode}`);

    invokerDetails = getDefaultInvokerDetails();
    response = check testClient->get(
        string `/par-cycles/${parCycleId}/employees/${employeeEmail}/par-ratings`,
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_OK,
        string `Invalid status code received when getting par ratings of an employee as an admin. ` +
        string `Expected: ${http:STATUS_OK}, Received: ${response.statusCode}`);

    json jsonPayload = check response.getJsonPayload();
    types:ParRating parRatingResponse = check jsonPayload.cloneWithType();
    parRatingsFromDB = check getParRatingsFromDB(parCycleId);
    parRating = parRatingsFromDB[0];
    database:ParTeam parTeam = check database:getParTeam(parRating.parTeamId);
    verifyParRatingResponse(parRatingResponse, check getParRatingFrom(parRating, parTeam));
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testParRating_UpdateParRatingAsAdmin]
}
function testParRating_UpdateParRatingAsAdminLead() returns error? {
    int parCycleId = 3;
    string employeeEmail = "tom@wso2.com";
    test:when(getAesEncryptionValueQueryMockFn).call("getAesEncryptionValueQueryForTests");
    database:ParRating[] parRatingsFromDB = check getParRatingsFromDB(parCycleId);
    database:ParRating parRating = parRatingsFromDB[0];

    entity:Employee employee = check getEmployeeByEmail(employeeEmail);
    types:InvokerDetails invokerDetails = getInvokerDetailsAsWithAdminPermission(employee.managerEmail ?: "");
    string parLeadCommentB64Encoded = check (check mime:base64Encode("Admin-Lead First Comment")).ensureType();

    int parRatingId = check parRating.parRatingId.ensureType();
    http:Response response = check testClient->patch(
        string `/par-cycles/${parCycleId}/employees/${employeeEmail}/par-ratings/${parRatingId}`,
        {parAdminComment: parLeadCommentB64Encoded},
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_FORBIDDEN,
        string `Invalid status code received when updating admin comment of an employee PAR. ` +
        string `Expected: ${http:STATUS_FORBIDDEN}, Received: ${response.statusCode}`);
    json jsonPayload = check response.getJsonPayload();
    test:assertEquals(jsonPayload.message, "Leads are not allowed to modify the admin comment.");
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testParRating_UpdateParRatingAsAdminLead]
}
function testParRating_GetAllParRatingAsAdmin() returns error? {
    int parCycleId = 3;
    types:InvokerDetails invokerDetails = getDefaultInvokerDetails();
    http:Response response = check testClient->get(string `/par-cycles/${parCycleId}/par-ratings`,
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_OK,
        string `Invalid status code received when getting par ratings as an admin. ` +
        string `Expected: ${http:STATUS_OK}, Received: ${response.statusCode}`);

    json jsonPayload = check response.getJsonPayload();
    types:ParRating[] parRatingsResponse = check jsonPayload.cloneWithType();
    database:ParRating[] parRatingsFromDB = check getParRatingsFromDB(parCycleId);

    foreach int i in 0 ... parRatingsFromDB.length() - 1 {
        database:ParRating parRatingFromDB = parRatingsFromDB[i];
        parRatingFromDB.parEmployeeComment = ();
        parRatingFromDB.parLeadComment = ();
        parRatingFromDB.parAdminComment = ();
        parRatingFromDB.parEmployeeAcceptanceComment = ();
        database:ParTeam parTeam = check database:getParTeam(parRatingFromDB.parTeamId);
        verifyParRatingResponse(parRatingsResponse[i], check getParRatingFrom(parRatingFromDB, parTeam));
    }
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testParRating_UpdateParRatingAsAdmin]
}
function testParRating_GetAllParRatingAsNonAdmin() returns error? {
    int parCycleId = 3;
    types:InvokerDetails invokerDetails = getInvokerDetailsAs("tom@wso2.com");
    http:Response response = check testClient->get(string `/par-cycles/${parCycleId}/par-ratings`,
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_FORBIDDEN,
        string `Invalid status code received when getting par ratings as non-admin. ` +
        string `Expected: ${http:STATUS_FORBIDDEN}, Received: ${response.statusCode}`);
    json jsonPayload = check response.getJsonPayload();
    test:assertEquals(jsonPayload, {"message": "You are not authorized to get par ratings for the par cycle."});
}

function verifyParRatingResponse(types:ParRating actualParRating, types:ParRating expectedParRating) {
    test:assertEquals(actualParRating.parRatingId, expectedParRating.parRatingId,
        string `Invalid par rating id received in the response. Actual: ${actualParRating.parRatingId}, ` +
        string `Expected: ${expectedParRating.parRatingId}`);
    test:assertEquals(actualParRating.parCycleId, expectedParRating.parCycleId,
        string `Invalid par cycle id received in the response. Actual: ${actualParRating.parCycleId}, ` +
        string `Expected: ${expectedParRating.parCycleId}`);
    test:assertEquals(actualParRating.parEmployeeEmail, expectedParRating.parEmployeeEmail,
        string `Invalid par employee email received in the response. Actual: ${actualParRating.parEmployeeEmail}, ` +
        string `Expected: ${expectedParRating.parEmployeeEmail}`);
    test:assertEquals(actualParRating.parCompany, expectedParRating.parCompany,
        string `Invalid par company received in the response. Actual: ${actualParRating.parCompany}, ` +
        string `Expected: ${expectedParRating.parCompany}`);
    test:assertEquals(actualParRating.parLocation, expectedParRating.parLocation,
        string `Invalid par location received in the response. Actual: ${actualParRating.parLocation}, ` +
        string `Expected: ${expectedParRating.parLocation}`);
    test:assertEquals(actualParRating.parBusinessUnit, expectedParRating.parBusinessUnit,
        string `Invalid par business unit received in the response. Actual: ${actualParRating.parBusinessUnit}, ` +
        string `Expected: ${expectedParRating.parBusinessUnit}`);
    test:assertEquals(actualParRating.parDepartment, expectedParRating.parDepartment,
        string `Invalid par department received in the response. Actual: ${actualParRating.parDepartment}, ` +
        string `Expected: ${expectedParRating.parDepartment}`);
    test:assertEquals(actualParRating.parTeam, expectedParRating.parTeam,
        string `Invalid par team received in the response. Actual: '${actualParRating.parTeam ?: ""}', ` +
        string `Expected: '${expectedParRating.parTeam ?: ""}'`);
    test:assertEquals(actualParRating.parSubTeam, expectedParRating.parSubTeam,
        string `Invalid par sub team received in the response. Actual: '${actualParRating.parSubTeam ?: ""}', ` +
        string `Expected: '${expectedParRating.parSubTeam ?: ""}'`);
    test:assertEquals(actualParRating.parLeadEmail, expectedParRating.parLeadEmail,
        string `Invalid par lead email received in the response. Actual: '${actualParRating.parLeadEmail ?: ""}', ` +
        string `Expected: '${expectedParRating.parLeadEmail ?: ""}'`);
    test:assertEquals(actualParRating.parRating, expectedParRating.parRating,
        string `Invalid par rating received in the response. Actual: '${actualParRating.parRating ?: ""}', ` +
        string `Expected: '${expectedParRating.parRating ?: ""}'`);
    test:assertEquals(actualParRating.parSpecialRating, expectedParRating.parSpecialRating,
        string `Invalid par special rating received in the response. Actual: '${actualParRating.parSpecialRating ?: ""}', ` +
        string `Expected: '${expectedParRating.parSpecialRating ?: ""}'`);
    test:assertEquals(actualParRating.parEmployeeComment, expectedParRating.parEmployeeComment,
        string `Invalid par employee comment received in the response. Actual: '${actualParRating.parEmployeeComment ?: ""}', ` +
        string `Expected: '${expectedParRating.parEmployeeComment ?: ""}'`);
    test:assertEquals(actualParRating.parEmployeeStatus, expectedParRating.parEmployeeStatus,
        string `Invalid par employee status received in the response. Actual: ${actualParRating.parEmployeeStatus}, ` +
        string `Expected: ${expectedParRating.parEmployeeStatus}`);
    test:assertEquals(actualParRating.parLeadComment, expectedParRating.parLeadComment,
        string `Invalid par lead comment received in the response. Actual: '${actualParRating.parLeadComment ?: ""}', ` +
        string `Expected: '${expectedParRating.parLeadComment ?: ""}'`);
    test:assertEquals(actualParRating.parLeadStatus, expectedParRating.parLeadStatus,
        string `Invalid par lead status received in the response. Actual: ${actualParRating.parLeadStatus}, ` +
        string `Expected: ${expectedParRating.parLeadStatus}`);
    test:assertEquals(actualParRating.parF2fStatus, expectedParRating.parF2fStatus,
        string `Invalid par F2F status received in the response. Actual: ${actualParRating.parF2fStatus}, ` +
        string `Expected: ${expectedParRating.parF2fStatus}`);
    test:assertEquals(actualParRating.parEmployeeAcceptanceStatus, expectedParRating.parEmployeeAcceptanceStatus,
        string `Invalid par employee acceptance status received in the response. ` +
        string `Actual: ${actualParRating.parEmployeeAcceptanceStatus}, ` +
        string `Expected: ${expectedParRating.parEmployeeAcceptanceStatus}`);
    test:assertEquals(actualParRating.parEmployeeAcceptanceComment, expectedParRating.parEmployeeAcceptanceComment,
        string `Invalid par employee acceptance comment received in the response. ` +
        string `Actual: '${actualParRating.parEmployeeAcceptanceComment ?: ""}', ` +
        string `Expected: '${expectedParRating.parEmployeeAcceptanceComment ?: ""}'`);
    test:assertEquals(actualParRating.parAdminComment, expectedParRating.parAdminComment,
        string `Invalid par admin comment received in the response. Actual: '${actualParRating.parAdminComment ?: ""}', ` +
        string `Expected: '${expectedParRating.parAdminComment ?: ""}'`);
}
