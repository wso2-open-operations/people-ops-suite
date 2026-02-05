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

import ballerina/cache;
import ballerina/log;

configurable string apiKey = ?;
configurable decimal cacheExpiryTimeInSeconds = 3600;

const EMPLOYEES_CACHE_KEY = "employees_data";
const QUERY_NAME = "Internal Apps Data Sync";
const ACTION = "GetQueryResult";

// TODO: This is just to reduce the number of API calls during development. Remove this before production deployment.
final cache:Cache employeesCache = new (capacity = 100, evictionPolicy = cache:LRU,
    defaultMaxAge = cacheExpiryTimeInSeconds
);

# Get employees from People HR.
#
# + return - List of employees
public isolated function getEmployees() returns Employee[]|error {
    if employeesCache.hasKey(EMPLOYEES_CACHE_KEY) {
        return employeesCache.get(EMPLOYEES_CACHE_KEY).ensureType();
    }

    PeopleHrResponse response = check peopleHrClient->/Query.post({
        APIKey: apiKey,
        QueryName: QUERY_NAME,
        Action: ACTION
    });
    if response.isError {
        return error("PeopleHR API returned an error response", message = response.Message);
    }

    cache:Error? cacheResult = employeesCache.put(EMPLOYEES_CACHE_KEY, response.Result);
    if cacheResult is cache:Error {
        log:printError("Failed to store employees data in cache", cacheResult);
    }
    return response.Result;
}
