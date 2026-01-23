// Copyright (c) 2024, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.
import ballerina/http;
import ballerina/test;

@test:Config {
    groups: ["ParCommonTests"]
}
function testParApp_CheckHealth() returns error? {
    http:Response response = check testClient->get(string `/health`);
    test:assertEquals(response.statusCode, http:STATUS_OK,
        "Invalid status code received when invoking the health endpoint. " +
        string `Expected: ${http:STATUS_OK}, Received: ${response.statusCode}`);
}
