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

import ballerina/sql;
import ballerina/test;

# The query's SQL text with each bound value shown as `?`, as MySQL receives it.
#
# + query - Parameterized query to render
# + return - SQL text with placeholders
isolated function sqlText(sql:ParameterizedQuery query) returns string =>
    string:'join("?", ...query.strings);

# The value bound to the placeholder that follows `column = `, or an error when the column
# is not bound to a placeholder.
#
# + query - Parameterized query to search
# + column - Column name whose bound value is wanted
# + return - The bound value, or an error when the column has no placeholder
isolated function boundValue(sql:ParameterizedQuery query, string column) returns anydata|error {
    foreach int i in 0 ..< query.insertions.length() {
        if query.strings[i].endsWith(string `${column} = `) {
            return <anydata>query.insertions[i];
        }
    }
    return error(string `${column} is not bound to a placeholder`);
}

@test:Config {}
isolated function testContinuousServiceRecordIsBoundAsEmployeePrimaryKey() returns error? {
    // Regression: the employee ID string ("DE100007") used to be bound here, which the INT
    // foreign key column rejected with "Incorrect integer value".
    sql:ParameterizedQuery query = updateEmployeeJobInfoQuery("LK100001", {continuousServiceRecord: 4821},
            "admin@example.invalid");

    anydata bound = check boundValue(query, "continuous_service_record");
    test:assertTrue(bound is int, "continuous_service_record should be bound as an int, not a string");
    test:assertEquals(bound, 4821, "the prior employment's employee.id should be bound unchanged");
}

@test:Config {}
isolated function testClearSentinelSetsContinuousServiceRecordToNull() {
    sql:ParameterizedQuery query = updateEmployeeJobInfoQuery("LK100001",
            {continuousServiceRecord: CONTINUOUS_SERVICE_RECORD_CLEAR_SENTINEL}, "admin@example.invalid");

    test:assertTrue(sqlText(query).includes("continuous_service_record = NULL"),
            "the clear sentinel should null the column");
    test:assertTrue(boundValue(query, "continuous_service_record") is error,
            "the sentinel itself must never reach the foreign key column");
}

@test:Config {}
isolated function testOmittedContinuousServiceRecordIsLeftUntouched() {
    sql:ParameterizedQuery query = updateEmployeeJobInfoQuery("LK100001", {jobRole: "Engineer"},
            "admin@example.invalid");

    test:assertFalse(sqlText(query).includes("continuous_service_record"),
            "an edit that does not set the link should not write the column");
}
