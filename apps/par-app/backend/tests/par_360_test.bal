// Copyright (c) 2024, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.
import par_app.entity;
import par_app.types;

import ballerina/http;
import ballerina/mime;
import ballerina/test;

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [
        testGetParCycles,
        testGetParCycles_AsEmployeeWithEmployeeEmail,
        testGetParCycles_AsLeadWithValidSubordinateEmployeeEmail
    ]
}
function testPar360Reviews_AddPar360ReviwersAndReviewAsLead_After360Deadline() returns error? {
    entity:Employee employeeTom = check getEmployeeByEmail("tom@wso2.com");
    entity:Employee employeeBrad = check getEmployeeByEmail("brad@wso2.com");
    entity:Employee employeeSam = check getEmployeeByEmail("sam@wso2.com");
    test:when(getEmployeeMockFn).call("getEmployeeByEmail");

    int parCycleId = 3;
    types:InvokerDetails invokerDetails = getInvokerDetailsAs(check employeeTom.managerEmail.ensureType());
    test:when(getAesDecryptionFieldQueryMockFn).call("getAesDecryptionFieldQueryForTests");

    http:Response response = check testClient->post(
        string `/par-cycles/${parCycleId}/employees/${employeeTom.workEmail}/reviewers`,
        {reviewerEmails: [employeeBrad.workEmail, employeeSam.workEmail]},
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_FORBIDDEN,
        string `Invalid status code received when adding PAR 360 reviewers. ` +
        string `Expected: ${http:STATUS_FORBIDDEN}, Received: ${response.statusCode}`);
    json jsonPayload = check response.getJsonPayload();
    test:assertEquals(jsonPayload.message, "The 360 requests cannot be created as the 360 reviews deadline has passed.");

    types:Par360ReviewUpdate par360ReviewUpdate = {
        reviewRating: "Satisfactory",
        reviewComment: check mime:base64Encode("My First 360 Review").ensureType(),
        par360ReviewStatus: types:DRAFT
    };
    response = check testClient->patch(
        string `/par-cycles/${parCycleId}/employees/${employeeTom.workEmail}/review`, par360ReviewUpdate,
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_FORBIDDEN,
        string `Invalid status code received when adding PAR 360 review. ` +
        string `Expected: ${http:STATUS_FORBIDDEN}, Received: ${response.statusCode}`);
    jsonPayload = check response.getJsonPayload();
    test:assertEquals(jsonPayload.message, "The 360 requests cannot be updated as the 360 reviews deadline has passed.");
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testGetParCycles],
    before: clearCache
}
function testPar360Reviews_AddPar360ReviwersAsLead() returns error? {
    entity:Employee employeeTom = check getEmployeeByEmail("tom@wso2.com");
    entity:Employee employeeBrad = check getEmployeeByEmail("brad@wso2.com");
    entity:Employee employeeSam = check getEmployeeByEmail("sam@wso2.com");
    test:when(getEmployeeMockFn).call("getEmployeeByEmail");

    int parCycleId = 3;
    check updateParCycle360ReviewDeadline(parCycleId, check getDateTodayUtc());
    types:InvokerDetails invokerDetails = getInvokerDetailsAs(check employeeTom.managerEmail.ensureType());
    test:when(getAesDecryptionFieldQueryMockFn).call("getAesDecryptionFieldQueryForTests");

    http:Response response = check testClient->post(
        string `/par-cycles/${parCycleId}/employees/${employeeTom.workEmail}/reviewers`,
        {reviewerEmails: [employeeBrad.workEmail, employeeSam.workEmail]},
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_CREATED,
        string `Invalid status code received when adding PAR 360 reviewers. ` +
        string `Expected: ${http:STATUS_CREATED}, Received: ${response.statusCode}`);

    response = check testClient->get(
        string `/par-cycles/${parCycleId}/employees/${employeeTom.workEmail}/reviewers`,
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_OK,
        string `Invalid status code received when getting PAR 360 reviewers. ` +
        string `Expected: ${http:STATUS_OK}, Received: ${response.statusCode}`);

    json jsonPayload = check response.getJsonPayload();
    types:Par360Reviewer[] par360Reviewers = check jsonPayload.cloneWithType();

    types:Par360Reviewer reviwerBrad = getPar360Reviewer(employeeBrad);
    reviwerBrad.isLeadRequested = true;
    test:assertEquals(par360Reviewers[0], reviwerBrad,
        string `Reviewer details are not as expected. Expected: ${reviwerBrad.toJsonString()}, ` +
        string `Received: ${par360Reviewers[0].toJsonString()}`);

    types:Par360Reviewer reviwerSam = getPar360Reviewer(employeeSam);
    reviwerSam.isLeadRequested = true;
    test:assertEquals(par360Reviewers[1], reviwerSam,
        string `Reviewer details are not as expected. Expected: ${reviwerSam.toJsonString()}, ` +
        string `Received: ${par360Reviewers[1].toJsonString()}`);
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testPar360Reviews_AddPar360ReviwersAsLead]
}
function testPar360Reviews_AddPar360ReviwersAsSelf() returns error? {
    entity:Employee employeeTom = check getEmployeeByEmail("tom@wso2.com");
    entity:Employee employeeSam = check getEmployeeByEmail("sam@wso2.com");
    entity:Employee employeeDavid = check getEmployeeByEmail("david@wso2.com");
    test:when(getEmployeeMockFn).call("getEmployeeByEmail");

    types:InvokerDetails invokerDetails = getInvokerDetailsAs(employeeTom.workEmail);

    int parCycleId = 3;
    http:Response response = check testClient->post(
        string `/par-cycles/${parCycleId}/employees/${employeeTom.workEmail}/reviewers`,
        {reviewerEmails: [employeeSam.workEmail, employeeDavid.workEmail]},
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_CREATED,
        string `Invalid status code received when adding PAR 360 reviewers. ` +
        string `Expected: ${http:STATUS_CREATED}, Received: ${response.statusCode}`);

    response = check testClient->get(
        string `/par-cycles/${parCycleId}/employees/${employeeTom.workEmail}/reviewers`,
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_OK,
        string `Invalid status code received when getting PAR 360 reviewers. ` +
        string `Expected: ${http:STATUS_OK}, Received: ${response.statusCode}`);

    json jsonPayload = check response.getJsonPayload();
    types:Par360Reviewer[] par360Reviewers = check jsonPayload.cloneWithType();

    types:Par360Reviewer reviwerDavid = getPar360Reviewer(employeeDavid);
    reviwerDavid.isEmployeeRequested = true;
    test:assertEquals(par360Reviewers[0], reviwerDavid,
        string `Reviewer details are not as expected. Expected: ${reviwerDavid.toJsonString()}, ` +
        string `Received: ${par360Reviewers[0].toJsonString()}`);

    types:Par360Reviewer reviwerSam = getPar360Reviewer(employeeSam);
    reviwerSam.isLeadRequested = true;
    reviwerSam.isEmployeeRequested = true;
    test:assertEquals(par360Reviewers[1], reviwerSam,
        string `Reviewer details are not as expected. Expected: ${reviwerSam.toJsonString()}, ` +
        string `Received: ${par360Reviewers[1].toJsonString()}`);
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testParRating_UpdateParRatingAsLead_Shared],
    before: clearCache
}
function testPar360Reviews_AddPar360ReviwersAsLead_AfterLeadSharePar() returns error? {
    entity:Employee employeeTom = check getEmployeeByEmail("tom@wso2.com");
    entity:Employee employeeBrad = check getEmployeeByEmail("brad@wso2.com");
    entity:Employee employeeSam = check getEmployeeByEmail("sam@wso2.com");
    test:when(getEmployeeMockFn).call("getEmployeeByEmail");

    int parCycleId = 3;
    types:ParCycle parCycle = check getParCycle(parCycleId);
    string original360Deadline = parCycle.parThreeSixtyRatingDeadline;
    check updateParCycle360ReviewDeadline(parCycleId, check getDateTodayUtc());
    types:InvokerDetails invokerDetails = getInvokerDetailsAs(check employeeTom.managerEmail.ensureType());
    test:when(getAesDecryptionFieldQueryMockFn).call("getAesDecryptionFieldQueryForTests");

    http:Response response = check testClient->post(
        string `/par-cycles/${parCycleId}/employees/${employeeTom.workEmail}/reviewers`,
        {reviewerEmails: [employeeBrad.workEmail, employeeSam.workEmail]},
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_FORBIDDEN,
        string `Invalid status code received when adding PAR 360 reviewers. ` +
        string `Expected: ${http:STATUS_FORBIDDEN}, Received: ${response.statusCode}`);
    json jsonPayload = check response.getJsonPayload();
    test:assertEquals(jsonPayload.message,
        "Cannot request 360 reviews for an employee whose PAR rating is shared by the lead.");

    check updateParCycle360ReviewDeadline(parCycleId, check getDateUtc(original360Deadline));
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testPar360Reviews_AddPar360ReviwersAsLead_AfterLeadSharePar]
}
function testPar360Reviews_AddPar360ReviwersAsSelf_AfterLeadSharePar() returns error? {
    entity:Employee employeeTom = check getEmployeeByEmail("tom@wso2.com");
    entity:Employee employeeSam = check getEmployeeByEmail("sam@wso2.com");
    entity:Employee employeeDavid = check getEmployeeByEmail("david@wso2.com");
    test:when(getEmployeeMockFn).call("getEmployeeByEmail");

    types:InvokerDetails invokerDetails = getInvokerDetailsAs(employeeTom.workEmail);

    int parCycleId = 3;
    types:ParCycle parCycle = check getParCycle(parCycleId);
    string original360Deadline = parCycle.parThreeSixtyRatingDeadline;
    check updateParCycle360ReviewDeadline(parCycleId, check getDateTodayUtc());
    http:Response response = check testClient->post(
        string `/par-cycles/${parCycleId}/employees/${employeeTom.workEmail}/reviewers`,
        {reviewerEmails: [employeeSam.workEmail, employeeDavid.workEmail]},
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_FORBIDDEN,
        string `Invalid status code received when adding PAR 360 reviewers. ` +
        string `Expected: ${http:STATUS_FORBIDDEN}, Received: ${response.statusCode}`);
    json jsonPayload = check response.getJsonPayload();
    test:assertEquals(jsonPayload.message,
        "Cannot request 360 reviews for an employee whose PAR rating is shared by the lead.");

    check updateParCycle360ReviewDeadline(parCycleId, check getDateUtc(original360Deadline));
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testPar360Reviews_AddPar360ReviwersAsSelf]
}
function testPar360Reviews_AddPar360ReviwersAsSomeoneElse() returns error? {
    entity:Employee employeeTom = check getEmployeeByEmail("tom@wso2.com");
    entity:Employee employeeSam = check getEmployeeByEmail("sam@wso2.com");
    entity:Employee employeeDavid = check getEmployeeByEmail("david@wso2.com");
    test:when(getEmployeeMockFn).call("getEmployeeByEmail");

    types:InvokerDetails invokerDetails = getInvokerDetailsAs(employeeTom.workEmail);

    int parCycleId = 3;
    http:Response response = check testClient->post(
        string `/par-cycles/${parCycleId}/employees/${employeeSam.workEmail}/reviewers`,
        {reviewerEmails: [employeeDavid.workEmail]},
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_FORBIDDEN,
        string `Invalid status code received when adding PAR 360 reviewers. ` +
        string `Expected: ${http:STATUS_FORBIDDEN}, Received: ${response.statusCode}`);
    json jsonPayload = check response.getJsonPayload();
    test:assertEquals(jsonPayload.message, "You are not authorized to add 360 reviewers for the employee.");
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testPar360Reviews_AddPar360ReviwersAsSelf]
}
function testPar360Reviews_AddPar360Reviwers_NonExistingReviewer() returns error? {
    entity:Employee employeeTom = check getEmployeeByEmail("tom@wso2.com");
    test:when(getEmployeeMockFn).call("getEmployeeByEmail");

    types:InvokerDetails invokerDetails = getInvokerDetailsAs(employeeTom.workEmail);

    int parCycleId = 3;
    http:Response response = check testClient->post(
        string `/par-cycles/${parCycleId}/employees/${employeeTom.workEmail}/reviewers`,
        {reviewerEmails: ["non-existing@wso2.com"]},
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_FORBIDDEN,
        string `Invalid status code received when adding PAR 360 reviewers. ` +
        string `Expected: ${http:STATUS_FORBIDDEN}, Received: ${response.statusCode}`);
    json jsonPayload = check response.getJsonPayload();
    test:assertEquals(jsonPayload.message, "The provided email address 'non-existing@wso2.com' is not a valid " +
        "employee email address.");
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testPar360Reviews_AddPar360ReviwersAsSelf]
}
function testPar360Reviews_GetPar360ReviwersAsSomeoneElse() returns error? {
    entity:Employee employeeTom = check getEmployeeByEmail("tom@wso2.com");
    entity:Employee employeeSam = check getEmployeeByEmail("sam@wso2.com");

    types:InvokerDetails invokerDetails = getInvokerDetailsAs(employeeTom.workEmail);

    int parCycleId = 3;
    http:Response response = check testClient->get(
        string `/par-cycles/${parCycleId}/employees/${employeeSam.workEmail}/reviewers`,
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_FORBIDDEN,
        string `Invalid status code received when getting PAR 360 reviewers. ` +
        string `Expected: ${http:STATUS_FORBIDDEN}, Received: ${response.statusCode}`);
    json jsonPayload = check response.getJsonPayload();
    test:assertEquals(jsonPayload.message, "You are not authorized to get 360 reviewers for the employee.");
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testPar360Reviews_AddPar360ReviwersAsSelf]
}
function testPar360Reviews_GetPar360ReviwersAsAdmin() returns error? {
    entity:Employee employeeTom = check getEmployeeByEmail("tom@wso2.com");
    entity:Employee employeeBrad = check getEmployeeByEmail("brad@wso2.com");
    entity:Employee employeeSam = check getEmployeeByEmail("sam@wso2.com");
    entity:Employee employeeDavid = check getEmployeeByEmail("david@wso2.com");
    test:when(getEmployeeMockFn).call("getEmployeeByEmail");

    types:InvokerDetails invokerDetails = getDefaultInvokerDetails();

    int parCycleId = 3;
    http:Response response = check testClient->get(
        string `/par-cycles/${parCycleId}/employees/${employeeTom.workEmail}/reviewers`,
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_OK,
        string `Invalid status code received when getting PAR 360 reviewers. ` +
        string `Expected: ${http:STATUS_OK}, Received: ${response.statusCode}`);

    json jsonPayload = check response.getJsonPayload();
    types:Par360Reviewer[] par360Reviewers = check jsonPayload.cloneWithType();

    types:Par360Reviewer reviwerBrad = getPar360Reviewer(employeeBrad);
    reviwerBrad.isLeadRequested = true;
    test:assertEquals(par360Reviewers[0], reviwerBrad,
        string `Reviewer details are not as expected. Expected: ${reviwerBrad.toJsonString()}, ` +
        string `Received: ${par360Reviewers[0].toJsonString()}`);

    types:Par360Reviewer reviwerDavid = getPar360Reviewer(employeeDavid);
    reviwerDavid.isEmployeeRequested = true;
    test:assertEquals(par360Reviewers[1], reviwerDavid,
        string `Reviewer details are not as expected. Expected: ${reviwerDavid.toJsonString()}, ` +
        string `Received: ${par360Reviewers[1].toJsonString()}`);

    types:Par360Reviewer reviwerSam = getPar360Reviewer(employeeSam);
    reviwerSam.isLeadRequested = true;
    reviwerSam.isEmployeeRequested = true;
    test:assertEquals(par360Reviewers[2], reviwerSam,
        string `Reviewer details are not as expected. Expected: ${reviwerSam.toJsonString()}, ` +
        string `Received: ${par360Reviewers[2].toJsonString()}`);
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testPar360Reviews_AddPar360ReviwersAsSelf]
}
function testPar360Reviews_GetPar360ReviwersAsLead() returns error? {
    entity:Employee employeeTom = check getEmployeeByEmail("tom@wso2.com");
    entity:Employee employeeBrad = check getEmployeeByEmail("brad@wso2.com");
    entity:Employee employeeSam = check getEmployeeByEmail("sam@wso2.com");
    entity:Employee employeeDavid = check getEmployeeByEmail("david@wso2.com");
    test:when(getEmployeeMockFn).call("getEmployeeByEmail");

    types:InvokerDetails invokerDetails = getInvokerDetailsAs(check employeeTom.managerEmail.ensureType());

    int parCycleId = 3;
    http:Response response = check testClient->get(
        string `/par-cycles/${parCycleId}/employees/${employeeTom.workEmail}/reviewers`,
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_OK,
        string `Invalid status code received when getting PAR 360 reviewers. ` +
        string `Expected: ${http:STATUS_OK}, Received: ${response.statusCode}`);

    json jsonPayload = check response.getJsonPayload();
    types:Par360Reviewer[] par360Reviewers = check jsonPayload.cloneWithType();

    types:Par360Reviewer reviwerBrad = getPar360Reviewer(employeeBrad);
    reviwerBrad.isLeadRequested = true;
    test:assertEquals(par360Reviewers[0], reviwerBrad,
        string `Reviewer details are not as expected. Expected: ${reviwerBrad.toJsonString()}, ` +
        string `Received: ${par360Reviewers[0].toJsonString()}`);

    types:Par360Reviewer reviwerDavid = getPar360Reviewer(employeeDavid);
    reviwerDavid.isEmployeeRequested = true;
    test:assertEquals(par360Reviewers[1], reviwerDavid,
        string `Reviewer details are not as expected. Expected: ${reviwerDavid.toJsonString()}, ` +
        string `Received: ${par360Reviewers[1].toJsonString()}`);

    types:Par360Reviewer reviwerSam = getPar360Reviewer(employeeSam);
    reviwerSam.isLeadRequested = true;
    reviwerSam.isEmployeeRequested = true;
    test:assertEquals(par360Reviewers[2], reviwerSam,
        string `Reviewer details are not as expected. Expected: ${reviwerSam.toJsonString()}, ` +
        string `Received: ${par360Reviewers[2].toJsonString()}`);
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testPar360Reviews_AddPar360ReviwersAsSelf]
}
function testPar360Reviews_AddPar360Reviwers_SamePeron() returns error? {
    entity:Employee employeeTom = check getEmployeeByEmail("tom@wso2.com");
    test:when(getEmployeeMockFn).call("getEmployeeByEmail");

    types:InvokerDetails invokerDetails = getInvokerDetailsAs(check employeeTom.managerEmail.ensureType());

    int parCycleId = 3;
    http:Response response = check testClient->post(
        string `/par-cycles/${parCycleId}/employees/${employeeTom.workEmail}/reviewers`,
        {reviewerEmails: [employeeTom.workEmail]},
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_FORBIDDEN,
        string `Invalid status code received when adding PAR 360 reviewers. ` +
        string `Expected: ${http:STATUS_FORBIDDEN}, Received: ${response.statusCode}`);
    json jsonPayload = check response.getJsonPayload();
    test:assertEquals(jsonPayload.message, "A reviewer cannot be the employee or the invoker of the request.");
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testPar360Reviews_AddPar360ReviwersAsSelf]
}
function testPar360Reviews_AddPar360Reviwers_LeadAddHimself() returns error? {
    entity:Employee employeeTom = check getEmployeeByEmail("tom@wso2.com");
    test:when(getEmployeeMockFn).call("getEmployeeByEmail");

    string leadEmail = check employeeTom.managerEmail.ensureType();
    types:InvokerDetails invokerDetails = getInvokerDetailsAs(leadEmail);

    int parCycleId = 3;
    http:Response response = check testClient->post(
        string `/par-cycles/${parCycleId}/employees/${employeeTom.workEmail}/reviewers`,
        {reviewerEmails: [leadEmail]},
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_FORBIDDEN,
        string `Invalid status code received when adding PAR 360 reviewers. ` +
        string `Expected: ${http:STATUS_FORBIDDEN}, Received: ${response.statusCode}`);
    json jsonPayload = check response.getJsonPayload();
    test:assertEquals(jsonPayload.message, "A reviewer cannot be the employee or the invoker of the request.");
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testPar360Reviews_AddPar360ReviwersAsSelf]
}
function testPar360Reviews_AddPar360Reviwers_EmployeeAddLead() returns error? {
    string employeeEmail = "tom@wso2.com";
    entity:Employee employeeTom = check getEmployeeByEmail(employeeEmail);
    test:when(getEmployeeMockFn).call("getEmployeeByEmail");

    string leadEmail = check employeeTom.managerEmail.ensureType();
    types:InvokerDetails invokerDetails = getInvokerDetailsAs(employeeEmail);

    int parCycleId = 3;
    http:Response response = check testClient->post(
        string `/par-cycles/${parCycleId}/employees/${employeeTom.workEmail}/reviewers`,
        {reviewerEmails: [leadEmail]},
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_FORBIDDEN,
        string `Invalid status code received when adding PAR 360 reviewers. ` +
        string `Expected: ${http:STATUS_FORBIDDEN}, Received: ${response.statusCode}`);
    json jsonPayload = check response.getJsonPayload();
    test:assertEquals(jsonPayload.message, "Cannot request 360 reviews from the lead of the employee.");
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testPar360Reviews_AddPar360ReviwersAsSelf]
}
function testPar360Reviews_GetPar360ReviwersReviewRequests() returns error? {
    entity:Employee employeeTom = check getEmployeeByEmail("tom@wso2.com");
    entity:Employee employeeBrad = check getEmployeeByEmail("brad@wso2.com");
    test:when(getEmployeeMockFn).call("getEmployeeByEmail");

    int parCycleId = 3;
    types:InvokerDetails invokerDetails = getInvokerDetailsAs(employeeBrad.workEmail);
    test:when(getAesDecryptionFieldQueryMockFn).call("getAesDecryptionFieldQueryForTests");

    http:Response response = check testClient->get(
        string `/par-cycles/${parCycleId}/employees/${employeeBrad.workEmail}/review-requests`,
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_OK,
        string `Invalid status code received when getting PAR 360 reviewers. ` +
        string `Expected: ${http:STATUS_OK}, Received: ${response.statusCode}`);

    json jsonPayload = check response.getJsonPayload();
    types:Par360ReviewRequest[] par360ReviewRequests = check jsonPayload.cloneWithType();

    test:assertEquals(par360ReviewRequests.length(), 1, string `Invalid number of review requests received. ` +
        string `Expected: 1, Received: ${par360ReviewRequests.length()}`);

    types:Par360ReviewRequest par360ReviewRequest = getPar360ReviewRequestForEmplpoyee(employeeTom);
    test:assertEquals(par360ReviewRequests[0], par360ReviewRequest,
        string `Reviewer requests are not as expected. Expected: ${par360ReviewRequest.toJsonString()}, ` +
        string `Received: ${par360ReviewRequests[0].toJsonString()}`);
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testPar360Reviews_AddPar360ReviwersAsSelf]
}
function testPar360Reviews_GetPar360ReviwersReviewRequests_NonExistingUser() returns error? {
    int parCycleId = 3;
    string nonExistingUserEmail = "non-existing@wso2.com";
    types:InvokerDetails invokerDetails = getInvokerDetailsAs(nonExistingUserEmail);
    test:when(getAesDecryptionFieldQueryMockFn).call("getAesDecryptionFieldQueryForTests");

    http:Response response = check testClient->get(
        string `/par-cycles/${parCycleId}/employees/${nonExistingUserEmail}/review-requests`,
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_OK,
        string `Invalid status code received when getting PAR 360 reviewers. ` +
        string `Expected: ${http:STATUS_OK}, Received: ${response.statusCode}`);

    json jsonPayload = check response.getJsonPayload();
    types:Par360ReviewRequest[] par360ReviewRequests = check jsonPayload.cloneWithType();

    test:assertEquals(par360ReviewRequests.length(), 0, string `Invalid number of review requests received. ` +
        string `Expected: 0, Received: ${par360ReviewRequests.length()}`);
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testPar360Reviews_AddPar360ReviwersAsSelf]
}
function testPar360Reviews_Par360Review_ShareWithoutRating() returns error? {
    entity:Employee employeeTom = check getEmployeeByEmail("tom@wso2.com");
    entity:Employee employeeBrad = check getEmployeeByEmail("brad@wso2.com");
    test:when(getEmployeeMockFn).call("getEmployeeByEmail");

    int parCycleId = 3;
    types:InvokerDetails invokerDetails = getInvokerDetailsAs(employeeBrad.workEmail);
    test:when(getAesDecryptionFieldQueryMockFn).call("getAesDecryptionFieldQueryForTests");

    types:Par360ReviewUpdate par360ReviewUpdate = {
        reviewComment: check mime:base64Encode("My First 360 Review").ensureType(),
        par360ReviewStatus: types:SHARED
    };

    test:when(getAesEncryptionValueQueryMockFn).call("getAesEncryptionValueQueryForTests");

    http:Response response = check testClient->patch(
        string `/par-cycles/${parCycleId}/employees/${employeeTom.workEmail}/review`, par360ReviewUpdate,
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_FORBIDDEN,
        string `Invalid status code received when adding PAR 360 review. ` +
        string `Expected: ${http:STATUS_FORBIDDEN}, Received: ${response.statusCode}`);
    json jsonPayload = check response.getJsonPayload();
    test:assertEquals(jsonPayload.message, "The 360 review rating is required before sharing the 360 review.");
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testPar360Reviews_AddPar360ReviwersAsSelf]
}
function testPar360Reviews_AddPar360Review() returns error? {
    entity:Employee employeeTom = check getEmployeeByEmail("tom@wso2.com");
    entity:Employee employeeBrad = check getEmployeeByEmail("brad@wso2.com");
    test:when(getEmployeeMockFn).call("getEmployeeByEmail");

    int parCycleId = 3;
    types:InvokerDetails invokerDetails = getInvokerDetailsAs(employeeBrad.workEmail);
    test:when(getAesDecryptionFieldQueryMockFn).call("getAesDecryptionFieldQueryForTests");

    types:Par360ReviewUpdate par360ReviewUpdate = {
        reviewRating: "Satisfactory",
        reviewComment: check mime:base64Encode("My First 360 Review").ensureType(),
        par360ReviewStatus: types:DRAFT
    };

    test:when(getAesEncryptionValueQueryMockFn).call("getAesEncryptionValueQueryForTests");

    http:Response response = check testClient->patch(
        string `/par-cycles/${parCycleId}/employees/${employeeTom.workEmail}/review`, par360ReviewUpdate,
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_OK,
        string `Invalid status code received when adding PAR 360 review. ` +
        string `Expected: ${http:STATUS_OK}, Received: ${response.statusCode}`);
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testPar360Reviews_AddPar360Review]
}
function testPar360Reviews_RejectPar360Review() returns error? {
    entity:Employee employeeTom = check getEmployeeByEmail("tom@wso2.com");
    entity:Employee employeeBrad = check getEmployeeByEmail("sam@wso2.com");
    test:when(getEmployeeMockFn).call("getEmployeeByEmail");

    int parCycleId = 3;
    types:InvokerDetails invokerDetails = getInvokerDetailsAs(employeeBrad.workEmail);
    test:when(getAesDecryptionFieldQueryMockFn).call("getAesDecryptionFieldQueryForTests");

    types:Par360ReviewUpdate par360ReviewUpdate = {
        par360ReviewStatus: types:REJECTED,
        reviewComment: check (check mime:base64Encode("I don't know much about Tom's work")).ensureType()
    };

    test:when(getAesEncryptionValueQueryMockFn).call("getAesEncryptionValueQueryForTests");

    http:Response response = check testClient->patch(
        string `/par-cycles/${parCycleId}/employees/${employeeTom.workEmail}/review`, par360ReviewUpdate,
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_OK,
        string `Invalid status code received when rejecting PAR 360 review. ` +
        string `Expected: ${http:STATUS_OK}, Received: ${response.statusCode}`);
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testPar360Reviews_AddPar360ReviwersAsSelf]
}
function testPar360Reviews_AddPar360Review_Invalid360Rating() returns error? {
    entity:Employee employeeTom = check getEmployeeByEmail("tom@wso2.com");
    entity:Employee employeeBrad = check getEmployeeByEmail("brad@wso2.com");
    test:when(getEmployeeMockFn).call("getEmployeeByEmail");

    int parCycleId = 3;
    types:InvokerDetails invokerDetails = getInvokerDetailsAs(employeeBrad.workEmail);
    test:when(getAesDecryptionFieldQueryMockFn).call("getAesDecryptionFieldQueryForTests");

    types:Par360ReviewUpdate par360ReviewUpdate = {
        reviewRating: "InvalidRating",
        reviewComment: check mime:base64Encode("My First 360 Review").ensureType(),
        par360ReviewStatus: types:DRAFT
    };

    http:Response response = check testClient->patch(
        string `/par-cycles/${parCycleId}/employees/${employeeTom.workEmail}/review`, par360ReviewUpdate,
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_BAD_REQUEST,
        string `Invalid status code received when adding PAR 360 review. ` +
        string `Expected: ${http:STATUS_BAD_REQUEST}, Received: ${response.statusCode}`);

    json jsonPayload = check response.getJsonPayload();
    test:assertEquals(jsonPayload.message, "The provided 360 review rating is not valid. Rating: InvalidRating");
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testPar360Reviews_AddPar360Review]
}
function testPar360Reviews_AddPar360Review_WithoutStatus() returns error? {
    entity:Employee employeeTom = check getEmployeeByEmail("tom@wso2.com");
    entity:Employee employeeBrad = check getEmployeeByEmail("brad@wso2.com");
    test:when(getEmployeeMockFn).call("getEmployeeByEmail");

    int parCycleId = 3;
    types:InvokerDetails invokerDetails = getInvokerDetailsAs(employeeBrad.workEmail);
    test:when(getAesDecryptionFieldQueryMockFn).call("getAesDecryptionFieldQueryForTests");

    types:Par360ReviewUpdate par360ReviewUpdate = {
        reviewRating: "Satisfactory",
        reviewComment: check (check mime:base64Encode("This is Brad's 360 review for Tom")).ensureType()
    };

    test:when(getAesEncryptionValueQueryMockFn).call("getAesEncryptionValueQueryForTests");

    http:Response response = check testClient->patch(
        string `/par-cycles/${parCycleId}/employees/${employeeTom.workEmail}/review`, par360ReviewUpdate,
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_OK,
        string `Invalid status code received when adding PAR 360 review. ` +
        string `Expected: ${http:STATUS_OK}, Received: ${response.statusCode}`);
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testPar360Reviews_AddPar360Review_WithoutStatus]
}
function testPar360Reviews_AddPar360Review_WithStatusShareReview() returns error? {
    entity:Employee employeeTom = check getEmployeeByEmail("tom@wso2.com");
    entity:Employee employeeBrad = check getEmployeeByEmail("brad@wso2.com");
    test:when(getEmployeeMockFn).call("getEmployeeByEmail");

    int parCycleId = 3;
    types:InvokerDetails invokerDetails = getInvokerDetailsAs(employeeBrad.workEmail);
    test:when(getAesDecryptionFieldQueryMockFn).call("getAesDecryptionFieldQueryForTests");

    types:Par360ReviewUpdate par360ReviewUpdate = {
        par360ReviewStatus: types:SHARED,
        reviewRating: "Satisfactory",
        reviewComment: check (check mime:base64Encode("This is Brad's 360 review for Tom. Updated comment.")).ensureType()
    };

    test:when(getAesEncryptionValueQueryMockFn).call("getAesEncryptionValueQueryForTests");

    http:Response response = check testClient->patch(
        string `/par-cycles/${parCycleId}/employees/${employeeTom.workEmail}/review`, par360ReviewUpdate,
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_OK,
        string `Invalid status code received when adding PAR 360 review. ` +
        string `Expected: ${http:STATUS_OK}, Received: ${response.statusCode}`);
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testPar360Reviews_AddPar360Review_WithStatusShareReview]
}
function testPar360Reviews_AddPar360Review_ForAnAlreadySharedReview() returns error? {
    entity:Employee employeeTom = check getEmployeeByEmail("tom@wso2.com");
    entity:Employee employeeBrad = check getEmployeeByEmail("brad@wso2.com");
    test:when(getEmployeeMockFn).call("getEmployeeByEmail");

    int parCycleId = 3;
    types:InvokerDetails invokerDetails = getInvokerDetailsAs(employeeBrad.workEmail);
    test:when(getAesDecryptionFieldQueryMockFn).call("getAesDecryptionFieldQueryForTests");

    types:Par360ReviewUpdate par360ReviewUpdate = {
        par360ReviewStatus: types:SHARED,
        reviewRating: "Satisfactory",
        reviewComment: check (check mime:base64Encode("This is Brad's 360 review for Tom. Another comment.")).ensureType()
    };

    test:when(getAesEncryptionValueQueryMockFn).call("getAesEncryptionValueQueryForTests");

    http:Response response = check testClient->patch(
        string `/par-cycles/${parCycleId}/employees/${employeeTom.workEmail}/review`, par360ReviewUpdate,
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_FORBIDDEN,
        string `Invalid status code received when adding PAR 360 review. ` +
        string `Expected: ${http:STATUS_FORBIDDEN}, Received: ${response.statusCode}`);
    json jsonPayload = check response.getJsonPayload();
    test:assertEquals(jsonPayload.message, "Shared or declined 360 reviews cannot be modified.");
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testPar360Reviews_AddPar360Review_ForAnAlreadySharedReview]
}
function testPar360Reviews_AddPar360Review_NonExistingUser() returns error? {
    entity:Employee employeeBrad = check getEmployeeByEmail("brad@wso2.com");
    test:when(getEmployeeMockFn).call("getEmployeeByEmail");

    int parCycleId = 3;
    string nonExistingUserEmail = "non-existing@wso2.com";
    types:InvokerDetails invokerDetails = getInvokerDetailsAs(employeeBrad.workEmail);
    test:when(getAesDecryptionFieldQueryMockFn).call("getAesDecryptionFieldQueryForTests");

    types:Par360ReviewUpdate par360ReviewUpdate = {
        reviewRating: "Satisfactory",
        reviewComment: check mime:base64Encode("My First 360 Review").ensureType()
    };

    http:Response response = check testClient->patch(
        string `/par-cycles/${parCycleId}/employees/${nonExistingUserEmail}/review`, par360ReviewUpdate,
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_INTERNAL_SERVER_ERROR,
        string `Invalid status code received when adding PAR 360 review. ` +
        string `Expected: ${http:STATUS_INTERNAL_SERVER_ERROR}, Received: ${response.statusCode}`);
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testPar360Reviews_AddPar360Review_WithoutStatus]
}
function testPar360Reviews_GetPar360ReviewRequestsAsLead() returns error? {
    entity:Employee employeeTom = check getEmployeeByEmail("tom@wso2.com");
    entity:Employee employeeBrad = check getEmployeeByEmail("brad@wso2.com");
    entity:Employee employeeSam = check getEmployeeByEmail("sam@wso2.com");
    test:when(getEmployeeMockFn).call("getEmployeeByEmail");

    int parCycleId = 3;
    types:InvokerDetails invokerDetails = getInvokerDetailsAs(check employeeTom.managerEmail.ensureType());
    test:when(getAesDecryptionFieldQueryMockFn).call("getAesDecryptionFieldQueryForTests");

    http:Response response = check testClient->get(
        string `/par-cycles/${parCycleId}/employees/${employeeTom.workEmail}/reviews`,
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_OK,
        string `Invalid status code received when getting PAR 360 reviews. ` +
        string `Expected: ${http:STATUS_OK}, Received: ${response.statusCode}`);

    json jsonPayload = check response.getJsonPayload();
    types:Par360Review[] par360Reviews = check jsonPayload.cloneWithType();

    test:assertEquals(par360Reviews.length(), 2, string `Invalid number of reviews received. ` +
        string `Expected: 2, Received: ${par360Reviews.length()}`);

    types:Par360Review par360ReviewExpected1 = check createPar360Review(employeeBrad.workEmail, "Satisfactory",
        "This is Brad's 360 review for Tom. Updated comment.", types:SHARED);
    test:assertEquals(par360Reviews[0], par360ReviewExpected1,
        string `Reviews are not as expected. Expected: ${par360ReviewExpected1.toJsonString()}, ` +
        string `Received: ${par360Reviews[0].toJsonString()}`);
    types:Par360Review par360ReviewExpected2 = check createPar360Review(employeeSam.workEmail, "NOT_ASSIGNED",
        "I don't know much about Tom's work", types:REJECTED);
    test:assertEquals(par360Reviews[1], par360ReviewExpected2,
        string `Reviews are not as expected. Expected: ${par360ReviewExpected2.toJsonString()}, ` +
        string `Received: ${par360Reviews[1].toJsonString()}`);
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testPar360Reviews_AddPar360Review_WithoutStatus]
}
function testPar360Reviews_GetPar360ReviewRequestsAsAdmin() returns error? {
    entity:Employee employeeTom = check getEmployeeByEmail("tom@wso2.com");
    entity:Employee employeeBrad = check getEmployeeByEmail("brad@wso2.com");
    entity:Employee employeeSam = check getEmployeeByEmail("sam@wso2.com");
    test:when(getEmployeeMockFn).call("getEmployeeByEmail");

    int parCycleId = 3;
    types:InvokerDetails invokerDetails = getDefaultInvokerDetails();
    test:when(getAesDecryptionFieldQueryMockFn).call("getAesDecryptionFieldQueryForTests");

    http:Response response = check testClient->get(
        string `/par-cycles/${parCycleId}/employees/${employeeTom.workEmail}/reviews`,
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_OK,
        string `Invalid status code received when getting PAR 360 reviews. ` +
        string `Expected: ${http:STATUS_OK}, Received: ${response.statusCode}`);

    json jsonPayload = check response.getJsonPayload();
    types:Par360Review[] par360Reviews = check jsonPayload.cloneWithType();

    test:assertEquals(par360Reviews.length(), 2, string `Invalid number of reviews received. ` +
        string `Expected: 2, Received: ${par360Reviews.length()}`);

    types:Par360Review par360ReviewExpected1 = check createPar360Review(employeeBrad.workEmail, "Satisfactory",
        "This is Brad's 360 review for Tom. Updated comment.", types:SHARED);
    test:assertEquals(par360Reviews[0], par360ReviewExpected1,
        string `Reviews are not as expected. Expected: ${par360ReviewExpected1.toJsonString()}, ` +
        string `Received: ${par360Reviews[0].toJsonString()}`);
    types:Par360Review par360ReviewExpected2 = check createPar360Review(employeeSam.workEmail, "NOT_ASSIGNED",
        "I don't know much about Tom's work", types:REJECTED);
    test:assertEquals(par360Reviews[1], par360ReviewExpected2,
        string `Reviews are not as expected. Expected: ${par360ReviewExpected2.toJsonString()}, ` +
        string `Received: ${par360Reviews[1].toJsonString()}`);
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testPar360Reviews_AddPar360Review_WithoutStatus]
}
function testPar360Reviews_GetPar360ReviewRequestsAsSelf() returns error? {
    entity:Employee employeeTom = check getEmployeeByEmail("tom@wso2.com");
    test:when(getEmployeeMockFn).call("getEmployeeByEmail");

    int parCycleId = 3;
    types:InvokerDetails invokerDetails = getInvokerDetailsAs(employeeTom.workEmail);
    test:when(getAesDecryptionFieldQueryMockFn).call("getAesDecryptionFieldQueryForTests");

    http:Response response = check testClient->get(
        string `/par-cycles/${parCycleId}/employees/${employeeTom.workEmail}/reviews`,
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_FORBIDDEN,
        string `Invalid status code received when getting PAR 360 reviews. ` +
        string `Expected: ${http:STATUS_FORBIDDEN}, Received: ${response.statusCode}`);
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testPar360Reviews_GetPar360ReviewRequestsAsSelf]
}
function testPar360Reviews_GetParTeamAsAdminToCheck360Status() returns error? {
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
    types:ParRatingMinimal[] details = check result.details.ensureType();
    test:assertEquals(details[0].par360ReviewCounts.requestedReviewCount, 3,
        string `Number of requested reviews mismatched. Expected: 3, ` +
            string `Received: ${details[0].par360ReviewCounts.requestedReviewCount}`);
    test:assertEquals(details[0].par360ReviewCounts.sharedReviewCount, 1,
        string `Number of shared reviews mismatched. Expected: 1, ` +
            string `Received: ${details[0].par360ReviewCounts.sharedReviewCount}`);
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testPar360Reviews_GetParTeamAsAdminToCheck360Status]
}
function testPar360Reviews_GetPar360Review_NonExistingReviewEntry() returns error? {
    entity:Employee employeeTom = check getEmployeeByEmail("tom@wso2.com");
    entity:Employee employeeBrad = check getEmployeeByEmail("brad@wso2.com");
    test:when(getEmployeeMockFn).call("getEmployeeByEmail");

    int parCycleId = 3;
    types:InvokerDetails invokerDetails = getInvokerDetailsAs(employeeTom.workEmail);
    test:when(getAesDecryptionFieldQueryMockFn).call("getAesDecryptionFieldQueryForTests");

    http:Response response = check testClient->get(
        string `/par-cycles/${parCycleId}/employees/${employeeBrad.workEmail}/review`,
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_INTERNAL_SERVER_ERROR,
        string `Invalid status code received when getting PAR 360 review. ` +
        string `Expected: ${http:STATUS_INTERNAL_SERVER_ERROR}, Received: ${response.statusCode}`);
    json jsonPayload = check response.getJsonPayload();
    test:assertEquals(jsonPayload.message, "An error occurred while retrieving 360 review.");
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testPar360Reviews_GetPar360Review_NonExistingReviewEntry]
}
function testPar360Reviews_GetPar360Review() returns error? {
    entity:Employee employeeTom = check getEmployeeByEmail("tom@wso2.com");
    entity:Employee employeeBrad = check getEmployeeByEmail("brad@wso2.com");
    test:when(getEmployeeMockFn).call("getEmployeeByEmail");

    int parCycleId = 3;
    types:InvokerDetails invokerDetails = getInvokerDetailsAs(employeeBrad.workEmail);
    test:when(getAesDecryptionFieldQueryMockFn).call("getAesDecryptionFieldQueryForTests");

    http:Response response = check testClient->get(
        string `/par-cycles/${parCycleId}/employees/${employeeTom.workEmail}/review`,
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_OK,
        string `Invalid status code received when adding PAR 360 review. ` +
        string `Expected: ${http:STATUS_OK}, Received: ${response.statusCode}`);
    json jsonPayload = check response.getJsonPayload();
    types:Par360Review par360Review = check jsonPayload.cloneWithType();

    types:Par360Review par360ReviewExpected = check createPar360Review(employeeBrad.workEmail, "Satisfactory",
        "This is Brad's 360 review for Tom. Updated comment.", types:SHARED);
    test:assertEquals(par360Review, par360ReviewExpected,
        string `Reviews are not as expected. Expected: ${par360ReviewExpected.toJsonString()}, ` +
        string `Received: ${par360Review.toJsonString()}`);
}

function getPar360Reviewer(entity:Employee employee) returns types:Par360Reviewer =>
    let entity:Employee {workEmail} = employee
    in {
        reviewerEmail: workEmail,
        reviewStatus: types:PENDING,
        isLeadRequested: false,
        isEmployeeRequested: false
    };

function getPar360ReviewRequestForEmplpoyee(entity:Employee employee) returns types:Par360ReviewRequest =>
    let entity:Employee {workEmail} = employee
    in {
        employeeEmail: workEmail,
        reviewStatus: types:PENDING,
        isLeadRequested: false,
        isEmployeeRequested: true
    };

function createPar360Review(string workEmail, string reviewRating, string reviewComment,
        types:Par360ReviewStatus reviewStatus) returns types:Par360Review|error => {
    reviewerEmail: workEmail,
    reviewRating,
    reviewComment: check (check mime:base64Encode(reviewComment)).ensureType(),
    reviewStatus: reviewStatus
};

