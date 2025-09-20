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
import ballerina/log;

string[] & readonly defaultExtractFields = ["email", "groups"];

public isolated service class CommonJwtInterceptor {
    *http:RequestInterceptor;
    private final string & readonly jwtHeaderName;
    private final string[] & readonly extractFields;
    private final string[] & readonly pathsToSkip;

    # This function initializes the interceptor with the given configurations.
    #
    # + jwtHeaderName - The name of the JWT header. Default: 'x-jwt-assertion'
    # + extractFields - The fields to be extracted from the JWT. Default: ['email', 'groups']
    # + pathsToSkip - The paths to be skipped from the interceptor
    public function init(string jwtHeaderName = X_JWT_ASSERTION, string[] extractFields = defaultExtractFields,
            string[] pathsToSkip = []) {
        self.jwtHeaderName = jwtHeaderName;
        log:printDebug(string `JWT header name set to: '${self.jwtHeaderName}'`);
        self.extractFields = extractFields.cloneReadOnly();
        log:printDebug(string `Extract fields set to: '${self.extractFields.toString()}'`);
        self.pathsToSkip = pathsToSkip.cloneReadOnly();
        log:printDebug(string `Skip paths set to: '${self.pathsToSkip.toString()}'`);
    }

    isolated resource function 'default [string... paths](http:RequestContext ctx, http:Headers headers)
            returns http:Forbidden|http:NextService|error? {
        if self.checkSkipPaths() {
            string fullPath = string:'join("/", ...paths);
            foreach string skipPath in self.pathsToSkip {
                if fullPath.matches(re `${skipPath}`) {
                    return ctx.next();
                }
            }
        }

        string|error jwtAssertion = headers.getHeader(self.jwtHeaderName);
        if jwtAssertion is error {
            return createForbiddenResponse(string `${ERR_JWT_HEADER_NOT_FOUND_DESCRIPTION} Header: '${self.jwtHeaderName}'`,
                jwtAssertion);
        }

        (ExtractedData & readonly)|error extractedData = decodeAndExtract(jwtAssertion, self.extractFields);
        if extractedData is error {
            if extractedData.detail()["code"] == ERR_FIELD_NOT_FOUND_ID {
                return createForbiddenResponse(extractedData.message(), extractedData);
            }
            return createForbiddenResponse(ERR_UNABLE_TO_DECODE_JWT_DESCRIPTION, extractedData);
        }

        ctx.set(EXTRACTED_DATA, extractedData);
        return ctx.next();
    }

    isolated function checkSkipPaths() returns boolean => self.pathsToSkip.length() > 0;
}

# Create a forbidden response with the given message and error.
#
# + message - The message to be included in the response
# + err - The error that occurred
# + return - The forbidden response
isolated function createForbiddenResponse(string message, error err) returns http:Forbidden {
    log:printWarn(message, err);
    return <http:Forbidden>{
        body: {
            message
        }
    };
}

# Decode the JWT token and extract the required fields.
#
# + jwtStr - The JWT token
# + extractFields - The fields to be extracted from the JWT
# + return - The extracted data or an error
isolated function decodeAndExtract(string jwtStr, string[] extractFields) returns readonly & ExtractedData|error {
    [jwt:Header, jwt:Payload] [_, payload] = check jwt:decode(jwtStr);
    ExtractedData extractedData = {};
    foreach string extractField in extractFields {
        json data = check payload[extractField].ensureType();
        if data is () {
            return error(string `${ERR_FIELD_NOT_FOUND_DESCRIPTION} Required field: '${extractField}'`,
                code = ERR_FIELD_NOT_FOUND_ID);
        }
        extractedData[extractField] = data;
    }
    return extractedData.cloneReadOnly();
}
