import ballerina/lang.array as array;
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
import ballerina/sql;

# Build the database select query with dynamic filter attributes.
#
# + mainQuery - Main query without the new sub query
# + filters - Array of sub queries to be added to the main query
# + return - Dynamically build sql:ParameterizedQuery
isolated function buildSqlSelectQuery(sql:ParameterizedQuery mainQuery, sql:ParameterizedQuery[] filters)
    returns sql:ParameterizedQuery {

    boolean isFirstSearch = true;
    sql:ParameterizedQuery updatedQuery = mainQuery;

    foreach sql:ParameterizedQuery filter in filters {
        if isFirstSearch {
            updatedQuery = sql:queryConcat(mainQuery, ` WHERE `, filter);
            isFirstSearch = false;
            continue;
        }

        updatedQuery = sql:queryConcat(updatedQuery, ` AND `, filter);
    }

    return updatedQuery;
}

# Helper function to user has roles.
#
# + requiredRoles - Required Role list  
# + userRoles - Roles list, the user has 
# + return - boolean
public isolated function checkRoles(Role[] requiredRoles, Role[] userRoles) returns boolean {

    // If the user has no roles assigned (userRoles is empty) and there are required roles, return false (the user can't access).
    if userRoles.length() == 0 && requiredRoles.length() > 0 {
        return false;
    }

    // Initialize an index variable `idsx` to loop through the `requiredRole` array.
    int idx = 0;

    // Loop through each role in the `requiredRole` array.
    while idx < requiredRoles.length() {

        // Check if the current role in `requiredRole` exists in the `userRoles` array.
        // `array:indexOf` searches for the index of `requiredRole[idx]` in the `userRoles` array.
        // If the role is not found, `indexOf` returns `()`, which we check to return `false` immediately.
        if userRoles.indexOf(requiredRoles[idx]) is () {
            // If the role is not found, return false as the user doesn't have all the required roles.
            return false;
        }

        // Move to the next role in the `requiredRole` array.
        idx += 1;
    }

    // If all required roles were found in the user's roles, return true, allowing access.
    return true;
}

