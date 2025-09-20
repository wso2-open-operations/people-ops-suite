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
import ballerina/jwt;

listener http:Listener testListernerEp1 = new (9090);
final http:Client testClient = check new ("http://localhost:9090");

service http:InterceptableService /simpleInterceptor on testListernerEp1 {
    public function createInterceptors() returns [CommonJwtInterceptor] {
        return [new CommonJwtInterceptor()];
    }

    resource function get simple\-endpoint(http:RequestContext ctx) returns InvokerDetails|error {
        return getInvokerDetailsFromCtx(ctx);
    }
}

service http:InterceptableService /interceptorWithSkipPaths on testListernerEp1 {
    public function createInterceptors() returns [CommonJwtInterceptor] {
        return [new CommonJwtInterceptor(pathsToSkip = ["health", string `collection1/\d+/collection2/\S+`])];
    }

    resource function get simple\-endpoint(http:RequestContext ctx) returns InvokerDetails|error {
        return getInvokerDetailsFromCtx(ctx);
    }

    resource function get health(http:RequestContext ctx) returns string {
        return "Healthy!";
    }

    resource function get collection1/[int c1Id]/collection2/[string c2Id](http:RequestContext ctx) returns string {
        return "Collection1/INT/Collection2/STRING";
    }
}

service http:InterceptableService /interceptorWithExtractFields on testListernerEp1 {
    public function createInterceptors() returns [CommonJwtInterceptor] {
        return [new CommonJwtInterceptor(extractFields = ["email", "sub"])];
    }

    resource function get simple\-endpoint(http:RequestContext ctx) returns InvokerDetailsWithSub|error {
        return getInvokerDetailsWithSubFromCtx(ctx);
    }
}

service http:InterceptableService /interceptorWithExtractFieldsNonExisting on testListernerEp1 {
    public function createInterceptors() returns [CommonJwtInterceptor] {
        return [new CommonJwtInterceptor(extractFields = ["email", "org_id"])];
    }

    resource function get simple\-endpoint(http:RequestContext ctx) returns InvokerDetails|error {
        return getInvokerDetailsFromCtx(ctx);
    }
}

function getHeadersWithJwt(InvokerDetails invokerDetails) returns map<string|string[]>? {
    jwt:IssuerConfig issuerConfig = {
        username: "ballerina",
        issuer: "wso2",
        audience: "vEwzbcasJVQm1jVYHUHCjhxZ4tYa",
        expTime: 3600,
        customClaims: {
            email: invokerDetails.email,
            groups: invokerDetails.groups,
            sub: invokerDetails.email
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
    return {"x-jwt-assertion": jwt};
}

function getHeadersWithoutJwt() returns map<string|string[]>? =>
    {"smaple-header-key": "smaple-header-value"};

function getHeadersWithInvalidtJwt() returns map<string|string[]>? =>
    {"x-jwt-assertion": "invalid-jwt"};

function getDefaultInvokerDetails() returns InvokerDetails => {
    email: "someone@wso2.com",
    groups: ["INTERNAL-LDAP/admin.someapp.all.apps"]
};

isolated function getInvokerDetailsFromCtx(http:RequestContext ctx) returns InvokerDetails|error =>
    check ctx.getWithType(EXTRACTED_DATA);

isolated function getInvokerDetailsWithSubFromCtx(http:RequestContext ctx) returns InvokerDetailsWithSub|error =>
    check ctx.getWithType(EXTRACTED_DATA);

public type InvokerDetailsWithSub record {|
    # The email of the invoker
    string email;
    # The sub of the invoker
    string sub;
|};
