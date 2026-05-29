// Copyright (c) 2024, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.
import par_app.database;
import par_app.types;

import ballerina/http;
import ballerina/test;

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testGetParCycles]
}
function testParTeams_GetParTeamsAsNonAdmin() returns error? {
    types:InvokerDetails invokerDetails = getInvokerDetailsAs("non-admin@wso2.com");

    int parCycleId = 3;
    http:Response response = check testClient->get(string `/par-cycles/${parCycleId}/teams`,
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_FORBIDDEN,
        string `Invalid status code received when getting par teams as a non-admin. ` +
        string `Expected: ${http:STATUS_FORBIDDEN}, Received: ${response.statusCode}`);
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testGetParCycles]
}
function testParTeams_GetParTeamsAsAdmin() returns error? {
    types:InvokerDetails invokerDetails = getDefaultInvokerDetails();

    int parCycleId = 3;
    http:Response response = check testClient->get(string `/par-cycles/${parCycleId}/teams`,
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_OK,
        string `Invalid status code received when getting par teams as an admin. ` +
        string `Expected: ${http:STATUS_OK}, Received: ${response.statusCode}`);

    json jsonPayload = check response.getJsonPayload();
    types:ParTeamSummary[] result = check jsonPayload.cloneWithType();

    test:assertEquals(result.length(), 4, string `Number of par teams summary mismatched. ` +
        string `Expected: 4, Received: ${result.length().toString()}`);
    test:assertEquals(result[0].parCycleId, parCycleId, string `Par cycle ID mismatched. ` +
        string `Expected: ${parCycleId}, Received: ${result[0].parCycleId}`);
    test:assertEquals(result[1].parCycleId, parCycleId, string `Par cycle ID mismatched. ` +
        string `Expected: ${parCycleId}, Received: ${result[1].parCycleId}`);
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testParTeams_GetParTeamsAsAdmin]
}
function testParTeams_GetParTeamsAsAdminAfterOneUserSharedSelfEvaluation() returns error? {
    int parCycleId = 3;
    database:ParRating[] parRatingsFromDB = check getParRatingsFromDB(parCycleId);
    database:ParRating parRating = parRatingsFromDB[0];

    string parEmployeeEmail = parRating.parEmployeeEmail;
    types:InvokerDetails invokerDetails = getInvokerDetailsAs(parEmployeeEmail);

    test:when(getAesDecryptionFieldQueryMockFn).call("getAesDecryptionFieldQueryForTests");

    invokerDetails = getDefaultInvokerDetails();
    http:Response response = check testClient->get(string `/par-cycles/${parCycleId}/teams`,
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_OK,
        string `Invalid status code received when getting par teams as an admin. ` +
        string `Expected: ${http:STATUS_OK}, Received: ${response.statusCode}`);

    json jsonPayload = check response.getJsonPayload();
    types:ParTeamSummary[] result = check jsonPayload.cloneWithType();

    test:assertEquals(result.length(), 4, string `Number of par teams summary mismatched. ` +
        string `Expected: 4, Received: ${result.length().toString()}`);
    types:ParTeamSummary internalAppTeam = check getParTeamSummaryFromArray(result, "Corporate",
        "DIGITAL TRANSFORMATION", "INTERNAL APPS", "", "carl@wso2.com");
    test:assertEquals(internalAppTeam.parCycleId, parCycleId, string `Par cycle ID mismatched. ` +
        string `Expected: ${parCycleId}, Received: ${internalAppTeam.parCycleId}`);
    test:assertEquals(internalAppTeam.numberOfTeamMembers, 2, "Number of team members mismatched.");
    test:assertEquals(internalAppTeam.summary.employeeParCompletedCount, 1, "Employee PAR completed count mismatched.");

    types:ParTeamSummary salesTeam = check getParTeamSummaryFromArray(result, "Corporate",
        "SALES", "NA", "", "randy@wso2.com");
    test:assertEquals(salesTeam.parCycleId, parCycleId, string `Par cycle ID mismatched. ` +
        string `Expected: ${parCycleId}, Received: ${salesTeam.parCycleId}`);
    test:assertEquals(salesTeam.numberOfTeamMembers, 2, "Number of team members mismatched.");
    test:assertEquals(salesTeam.summary.employeeParCompletedCount, 0, "Employee PAR completed count mismatched.");
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testGetParCycles]
}
function testParTeams_GetParTeamAsNonAdmin() returns error? {
    types:InvokerDetails invokerDetails = getInvokerDetailsAs("non-admin@wso2.com");

    int parCycleId = 3;
    int parTeamId = 3;
    http:Response response = check testClient->get(string `/par-cycles/${parCycleId}/teams/${parTeamId}`,
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_FORBIDDEN,
        string `Invalid status code received when getting par team as a non-admin. ` +
        string `Expected: ${http:STATUS_FORBIDDEN}, Received: ${response.statusCode}`);
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testGetParCycles]
}
function testParTeams_GetParTeamAsAdmin() returns error? {
    types:InvokerDetails invokerDetails = getDefaultInvokerDetails();

    int parCycleId = 3;
    int parTeamId = 3;
    test:when(getAesDecryptionFieldQueryMockFn).call("getAesDecryptionFieldQueryForTests");

    http:Response response = check testClient->get(string `/par-cycles/${parCycleId}/teams/${parTeamId}`,
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_OK,
        string `Invalid status code received when getting par team as an admin. ` +
        string `Expected: ${http:STATUS_OK}, Received: ${response.statusCode}`);

    json jsonPayload = check response.getJsonPayload();
    types:ParTeamDetails result = check jsonPayload.cloneWithType();

    test:assertEquals(result.parTeamId, parTeamId, string `Par team ID mismatched. ` +
        string `Expected: ${parTeamId}, Received: ${result.parTeamId}`);
    test:assertEquals(result.numberOfTeamMembers, 2, string `Number of team members mismatched.` +
        string `Expected: 2, Received: ${result.numberOfTeamMembers}`);
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testGetParCycles]
}
function testParTeams_GetParTeamAsLead() returns error? {

    string leadEmail = check getDefaultEmployees()[0].managerEmail.ensureType();
    types:InvokerDetails invokerDetails = getInvokerDetailsAs(leadEmail);

    int parCycleId = 3;
    int parTeamId = 3;
    test:when(getAesDecryptionFieldQueryMockFn).call("getAesDecryptionFieldQueryForTests");

    http:Response response = check testClient->get(string `/par-cycles/${parCycleId}/teams/${parTeamId}`,
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_OK,
        string `Invalid status code received when getting par team as a lead. ` +
        string `Expected: ${http:STATUS_OK}, Received: ${response.statusCode}`);

    json jsonPayload = check response.getJsonPayload();
    types:ParTeamDetails result = check jsonPayload.cloneWithType();

    test:assertEquals(result.parTeamId, parTeamId, string `Par team ID mismatched. ` +
        string `Expected: ${parTeamId}, Received: ${result.parTeamId}`);
    test:assertEquals(result.numberOfTeamMembers, 2, string `Number of team members mismatched.` +
        string `Expected: 2, Received: ${result.numberOfTeamMembers}`);
}
