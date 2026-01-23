// Copyright (c) 2024, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.
import par_app.entity;
import par_app.types;

import ballerina/http;
import ballerina/test;

@test:Config {
    groups: ["TestEmployeeBasicTests"],
    dependsOn: [testGetParCycles]
}
function testParEmployee_GetEmployeesAsAdmin() returns error? {
    types:InvokerDetails invokerDetails = getDefaultInvokerDetails();

    entity:Employee employee = getDefaultEmployees()[0];
    test:when(getEmployeeMockFn).thenReturn(employee);

    http:Response response = check testClient->get(string `/employees/${employee.workEmail}`,
        headers = getDefaultHeaders(invokerDetails));
    json jsonPayload = check response.getJsonPayload();
    types:EmployeeInfo employeeInfo = check jsonPayload.cloneWithType();

    test:assertEquals(employeeInfo.workEmail, employee.workEmail,
        string `Work email mismatch. Expected: ${employee.workEmail}, but found: ${employeeInfo.workEmail}`);
}

@test:Config {
    groups: ["TestEmployeeBasicTests"],
    dependsOn: [testGetParCycles]
}
function testParEmployee_GetEmployeesAsNonAdmin() returns error? {
    types:InvokerDetails invokerDetails = getInvokerDetailsAs("non-admin@wso2.com");
    entity:Employee employee = getDefaultEmployees()[0];

    http:Response response = check testClient->get(string `/employees/${employee.workEmail}`,
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_FORBIDDEN,
        string `Invalid status code received when accessing employee details as non-admin. ` +
        string `Expected: ${http:STATUS_FORBIDDEN}, but found: ${response.statusCode}`);

    json jsonPayload = check response.getJsonPayload();
    test:assertEquals(jsonPayload.message, "You are not authorized to get employee information.");
}

@test:Config {
    groups: ["TestEmployeeBasicTests"],
    dependsOn: [testGetParCycles]
}
function testParEmployee_GetEmployeesAsLead() returns error? {
    entity:Employee employee = getDefaultEmployees()[0];
    types:InvokerDetails invokerDetails = getInvokerDetailsAs(employee.managerEmail ?: "");
    test:when(getEmployeeMockFn).thenReturn(employee);

    http:Response response = check testClient->get(string `/employees/${employee.workEmail}`,
        headers = getDefaultHeaders(invokerDetails));
    json jsonPayload = check response.getJsonPayload();
    types:EmployeeInfo employeeInfo = check jsonPayload.cloneWithType();

    test:assertEquals(employeeInfo.workEmail, employee.workEmail,
        string `Work email mismatch. Expected: ${employee.workEmail}, but found: ${employeeInfo.workEmail}`);
}

@test:Config {
    groups: ["TestEmployeeBasicTests"],
    dependsOn: [testGetParCycles]
}
function testParEmployee_GetEmployeesAsSelf() returns error? {
    entity:Employee employee = getDefaultEmployees()[0];
    types:InvokerDetails invokerDetails = getInvokerDetailsAs(employee.workEmail);
    test:when(getEmployeeMockFn).thenReturn(employee);

    http:Response response = check testClient->get(string `/employees/${employee.workEmail}`,
        headers = getDefaultHeaders(invokerDetails));
    json jsonPayload = check response.getJsonPayload();
    types:EmployeeInfo employeeInfo = check jsonPayload.cloneWithType();

    test:assertEquals(employeeInfo.workEmail, employee.workEmail,
        string `Work email mismatch. Expected: ${employee.workEmail}, but found: ${employeeInfo.workEmail}`);
}

@test:Config
function testParEmployee_GetEmployees() returns error? {
    test:when(getAllActiveEmployeesMockFn).thenReturn(getDefaultEmployees());

    entity:Employee employee = getDefaultEmployees()[0];
    types:InvokerDetails invokerDetails = getInvokerDetailsAs(employee.workEmail);

    // First call will be served via entity service
    http:Response response = check testClient->get(string `/meta/employees`,
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_OK,
        string `Invalid status code received when accessing employees` +
        string `Expected: ${http:STATUS_OK}, Received: ${response.statusCode}`);

    json jsonPayload = check response.getJsonPayload();
    types:BasicEmployeeInfo[] employeeInfoFromEntity = check jsonPayload.cloneWithType();

    // Second call will be served via the cache
    response = check testClient->get(string `/meta/employees`,
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_OK,
        string `Invalid status code received when accessing employees` +
        string `Expected: ${http:STATUS_OK}, Received: ${response.statusCode}`);

    jsonPayload = check response.getJsonPayload();
    types:BasicEmployeeInfo[] employeeInfoFromCache = check jsonPayload.cloneWithType();

    test:assertEquals(employeeInfoFromEntity, employeeInfoFromCache,
        string `Employee info mismatch between entity and cache. ` +
            string `Expected: ${employeeInfoFromEntity.toJsonString()}, ` +
            string `but found: ${employeeInfoFromCache.toJsonString()}`);
}
