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
import ballerina/log;
import ballerina/oauth2;

const int PAGE_SIZE = 100;

isolated function getJwtHeader() returns map<string|string[]>|error {
    string|oauth2:Error token = tokenProvider.generateToken();
    if token is oauth2:Error {
        return error("Failed to generate access token", token);
    }
    return {"x-jwt-assertion": token};
}

# Fetches all active (APPROVED) visits from the backend, paginating through all results.
#
# + return - Full list of active visits or an error
public function fetchActiveVisits() returns Visit[]|error {
    Visit[] allVisits = [];
    int offset = 0;

    while true {
        map<string|string[]>|error headers = getJwtHeader();
        if headers is error {
            log:printError("Failed to get access token", headers);
            return headers;
        }

        string path = string `/visits?statusArray=APPROVED&limit=${PAGE_SIZE}&offset=${offset}`;
        VisitsResponse|http:ClientError response = visitorClient->get(path, headers);

        if response is http:ClientError {
            string msg = "Error fetching active visits from backend";
            log:printError(msg, response);
            return error(msg, response);
        }

        allVisits.push(...response.visits);

        if allVisits.length() >= response.totalCount {
            break;
        }
        offset += PAGE_SIZE;
    }

    return allVisits;
}

# Calls the backend COMPLETE action for the given visit ID.
#
# + visitId - ID of the visit to complete
# + return - An error if the request fails
public function completeVisit(int visitId) returns error? {
    map<string|string[]>|error headers = getJwtHeader();
    if headers is error {
        log:printError("Failed to get access token", headers);
        return headers;
    }

    http:Response|http:ClientError response = visitorClient->post(
        string `/visits/${visitId}/COMPLETE`, {}, headers
    );

    if response is http:ClientError {
        string msg = string `Error completing visit ${visitId}`;
        log:printError(msg, response);
        return error(msg, response);
    }

    if response.statusCode != http:STATUS_OK {
        string msg = string `Backend rejected COMPLETE for visit ${visitId}, status: ${response.statusCode}`;
        log:printError(msg);
        return error(msg);
    }
}
