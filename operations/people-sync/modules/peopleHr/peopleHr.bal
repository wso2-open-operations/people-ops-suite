// Copyright (c) 2026 WSO2 LLC. (https://www.wso2.com).
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

configurable string apiKey = ?;

const QUERY_NAME = "Internal Apps Data Sync";
const ACTION = "GetQueryResult";

# Get employees from People HR.
#
# + return - List of employees
public isolated function getEmployees() returns Employee[]|error {
    PeopleHrResponse response = check peopleHrClient->/Query.post({
        APIKey: apiKey,
        QueryName: QUERY_NAME,
        Action: ACTION
    });
    if response.isError {
        return error("PeopleHR API returned an error response", message = response.Message);
    }
    return response.Result;
}
