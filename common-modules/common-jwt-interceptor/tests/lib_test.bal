// Copyright (c) 2025 WSO2 LLC. (https://www.wso2.com).
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
import ballerina/http;
import ballerina/test;

@test:Config {}
function testSimpleInterceptor_SimpleEndpointWithJwt() returns error? {
    InvokerDetails invokerDetails = getDefaultInvokerDetails();
    http:Response response = check testClient->get("/simpleInterceptor/simple-endpoint",
        headers = getHeadersWithJwt(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_OK);
    json jsonPayload = check response.getJsonPayload();

    InvokerDetails invokerDetailsResponse = check jsonPayload.cloneWithType();
    test:assertEquals(invokerDetailsResponse.email, "someone@wso2.com");
    test:assertEquals(invokerDetailsResponse.groups, ["INTERNAL-LDAP/admin.someapp.all.apps"]);
}

@test:Config {}
function testSimpleInterceptor_SimpleEndpointWithoutJwt() returns error? {
    http:Response response = check testClient->get("/simpleInterceptor/simple-endpoint",
        headers = getHeadersWithoutJwt());
    test:assertEquals(response.statusCode, http:STATUS_FORBIDDEN,
            string `Invalid status code received when accessing the endpoint without JWT ` +
            string `Expected: ${http:STATUS_FORBIDDEN}, Received: ${response.statusCode}`);
    json jsonPayload = check response.getJsonPayload();
    test:assertEquals(jsonPayload.message, "JWT header not found in the request. Header: 'x-jwt-assertion'");
}

@test:Config {}
function testSimpleInterceptor_SimpleEndpointWithInvalidJwt() returns error? {
    http:Response response = check testClient->get("/simpleInterceptor/simple-endpoint",
        headers = getHeadersWithInvalidtJwt());
    test:assertEquals(response.statusCode, http:STATUS_FORBIDDEN,
            string `Invalid status code received when accessing the endpoint without JWT ` +
            string `Expected: ${http:STATUS_FORBIDDEN}, Received: ${response.statusCode}`);
    json jsonPayload = check response.getJsonPayload();
    test:assertEquals(jsonPayload.message, "Unable to decode the JWT token.");
}

@test:Config {}
function testInterceptorWithSkipPaths_SimpleEndpointWithJwt() returns error? {
    InvokerDetails invokerDetails = getDefaultInvokerDetails();
    http:Response response = check testClient->get("/interceptorWithSkipPaths/simple-endpoint",
        headers = getHeadersWithJwt(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_OK);
}

@test:Config {}
function testInterceptorWithSkipPaths_SimpleEndpointWithoutJwt() returns error? {
    http:Response response = check testClient->get("/interceptorWithSkipPaths/simple-endpoint",
        headers = getHeadersWithoutJwt());
    test:assertEquals(response.statusCode, http:STATUS_FORBIDDEN,
            string `Invalid status code received when accessing the endpoint without JWT ` +
            string `Expected: ${http:STATUS_FORBIDDEN}, Received: ${response.statusCode}`);
    json jsonPayload = check response.getJsonPayload();
    test:assertEquals(jsonPayload.message, "JWT header not found in the request. Header: 'x-jwt-assertion'");
}

@test:Config {}
function testInterceptorWithSkipPaths_HealthEndpointWithJwt() returns error? {
    InvokerDetails invokerDetails = getDefaultInvokerDetails();
    http:Response response = check testClient->get("/interceptorWithSkipPaths/health",
        headers = getHeadersWithJwt(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_OK);
}

@test:Config {}
function testInterceptorWithSkipPaths_HealthEndpointWithoutJwt() returns error? {
    http:Response response = check testClient->get("/interceptorWithSkipPaths/health",
        headers = getHeadersWithoutJwt());
    test:assertEquals(response.statusCode, http:STATUS_OK);
}

@test:Config {}
function testInterceptorWithSkipPaths_C1_I_C2_S_EndpointWithoutJwt() returns error? {
    http:Response response = check testClient->get("/interceptorWithSkipPaths/collection1/1/collection2/A",
        headers = getHeadersWithoutJwt());
    test:assertEquals(response.statusCode, http:STATUS_OK);
}

@test:Config {}
function testInterceptorWithSkipPaths_C1_I_C2_S_EndpointWithoutJwt_FailureCase() returns error? {
    http:Response response = check testClient->get("/interceptorWithSkipPaths/collection1/A/collection2/A",
        headers = getHeadersWithoutJwt());
    test:assertEquals(response.statusCode, http:STATUS_FORBIDDEN,
            string `Invalid status code received when accessing the endpoint with unskipped path ` +
            string `Expected: ${http:STATUS_FORBIDDEN}, Received: ${response.statusCode}`);
    json jsonPayload = check response.getJsonPayload();
    test:assertEquals(jsonPayload.message, "JWT header not found in the request. Header: 'x-jwt-assertion'");
}

@test:Config {}
function testInterceptorWithExtractFields_SimpleEndpointWithJwt() returns error? {
    InvokerDetails invokerDetails = getDefaultInvokerDetails();
    http:Response response = check testClient->get("/interceptorWithExtractFields/simple-endpoint",
        headers = getHeadersWithJwt(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_OK);
    json jsonPayload = check response.getJsonPayload();
    InvokerDetailsWithSub invokerDetailsWithSub = check jsonPayload.cloneWithType();
    test:assertEquals(invokerDetailsWithSub.email, "someone@wso2.com");
    test:assertEquals(invokerDetailsWithSub.sub, "someone@wso2.com");
}

@test:Config {}
function testInterceptorWithExtractFieldsNonExisting_SimpleEndpointWithJwt() returns error? {
    InvokerDetails invokerDetails = getDefaultInvokerDetails();
    http:Response response = check testClient->get("/interceptorWithExtractFieldsNonExisting/simple-endpoint",
        headers = getHeadersWithJwt(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_FORBIDDEN,
            string `Invalid status code received when accessing the endpoint with non existing extract field ` +
            string `Expected: ${http:STATUS_FORBIDDEN}, Received: ${response.statusCode}`);
    json jsonPayload = check response.getJsonPayload();
    test:assertEquals(jsonPayload.message, "Field not found in the JWT payload. Required field: 'org_id'");
}
