// Copyright (c) 2024, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.
import par_app.types;

import ballerina/http;
import ballerina/test;

@test:Config
function testParConfigs_AddParConfigs_AsNonAdmin() returns error? {
    types:InvokerDetails invokerDetails = getInvokerDetailsAs("tom@wso2.com");
    types:ParCycleCreate defaultParCycleCreate = getDefaultParCycleCreate();

    http:Response response = check testClient->put(string `/meta/configurations`,
        defaultParCycleCreate.parCycleConfigurations,
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_FORBIDDEN,
        string `Invalid status code received when adding PAR configurations. ` +
        string `Expected: ${http:STATUS_FORBIDDEN}, Received: ${response.statusCode}`);

    json jsonPayload = check response.getJsonPayload();
    test:assertEquals(jsonPayload.message, "You are not authorized to update par cycle configurations.");
}

@test:Config
function testParConfigs_AddParConfigs_AsAdmin() returns error? {
    types:InvokerDetails invokerDetails = getDefaultInvokerDetails();
    types:ParCycleCreate defaultParCycleCreate = getDefaultParCycleCreate();

    http:Response response = check testClient->put(string `/meta/configurations`,
        defaultParCycleCreate.parCycleConfigurations,
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_OK,
        string `Invalid status code received when adding PAR configurations. ` +
        string `Expected: ${http:STATUS_OK}, Received: ${response.statusCode}`);

    response = check testClient->get(string `/meta/configurations`,
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_OK,
        string `Invalid status code received when adding PAR configurations. ` +
        string `Expected: ${http:STATUS_OK}, Received: ${response.statusCode}`);

    json jsonPayload = check response.getJsonPayload();
    types:ParCycleConfigurations parCycleConfigurations = check jsonPayload.cloneWithType();
    test:assertEquals(parCycleConfigurations, defaultParCycleCreate.parCycleConfigurations);
}

@test:Config {
    dependsOn: [testParConfigs_AddParConfigs_AsAdmin]
}
function testParConfigs_GetParConfigs_AsAdmin() returns error? {
    types:InvokerDetails invokerDetails = getDefaultInvokerDetails();
    types:ParCycleCreate defaultParCycleCreate = getDefaultParCycleCreate();

    http:Response response = check testClient->get(string `/meta/configurations`,
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_OK,
        string `Invalid status code received when adding PAR configurations. ` +
        string `Expected: ${http:STATUS_OK}, Received: ${response.statusCode}`);

    json jsonPayload = check response.getJsonPayload();
    types:ParCycleConfigurations parCycleConfigurations = check jsonPayload.cloneWithType();
    test:assertEquals(parCycleConfigurations, defaultParCycleCreate.parCycleConfigurations);
}

@test:Config {
    dependsOn: [testParConfigs_AddParConfigs_AsAdmin]
}
function testParConfigs_GetParConfigs_AsNonAdmin() returns error? {
    types:InvokerDetails invokerDetails = getInvokerDetailsAs("tom@wso2.com");
    types:ParCycleCreate defaultParCycleCreate = getDefaultParCycleCreate();

    http:Response response = check testClient->get(string `/meta/configurations`,
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_OK,
        string `Invalid status code received when adding PAR configurations. ` +
        string `Expected: ${http:STATUS_OK}, Received: ${response.statusCode}`);

    types:ParCycleConfigurationsOptionalizedResponse expectedConfigurations =
    let types:ParCycleConfigurationsOptionalizedResponse {employeeParQuestion, threeSixtyReviewQuestion, parRatings,
        threeSixtyReviewRatings} = defaultParCycleCreate.parCycleConfigurations
        in {
            employeeParQuestion,
            threeSixtyReviewQuestion,
            parRatings,
            threeSixtyReviewRatings
        };

    json jsonPayload = check response.getJsonPayload();
    types:ParCycleConfigurationsOptionalizedResponse parCycleConfigurations = check jsonPayload.cloneWithType();
    test:assertEquals(parCycleConfigurations, expectedConfigurations);
}

@test:Config {
    dependsOn: [testParConfigs_AddParConfigs_AsAdmin]
}
function testParConfigs_UpdateParConfigs_AsAdmin() returns error? {
    types:InvokerDetails invokerDetails = getDefaultInvokerDetails();
    types:ParCycleCreate defaultParCycleCreate = getDefaultParCycleCreate();
    defaultParCycleCreate.parCycleConfigurations.employeeParQuestion =
        "Job Execution, Team Work, Communication, Leadership and more";
    defaultParCycleCreate.parCycleConfigurations.threeSixtyReviewQuestion =
        "What are the strengths of this Individual? and what is your feedback for improvements?";

    http:Response response = check testClient->put(string `/meta/configurations`,
        defaultParCycleCreate.parCycleConfigurations,
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_OK,
        string `Invalid status code received when adding PAR configurations. ` +
        string `Expected: ${http:STATUS_OK}, Received: ${response.statusCode}`);

    response = check testClient->get(string `/meta/configurations`,
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_OK,
        string `Invalid status code received when adding PAR configurations. ` +
        string `Expected: ${http:STATUS_OK}, Received: ${response.statusCode}`);

    json jsonPayload = check response.getJsonPayload();
    types:ParCycleConfigurations parCycleConfigurations = check jsonPayload.cloneWithType();
    test:assertEquals(parCycleConfigurations, defaultParCycleCreate.parCycleConfigurations);
}
