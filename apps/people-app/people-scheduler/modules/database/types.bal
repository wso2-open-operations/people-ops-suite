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

# Row mapping for an employee whose Marked-leaver period has ended and who should transition to Left.
public type LeaverTransition record {|
    # External employee ID
    @sql:Column {name: "employee_id"}
    string employeeId;
    # First name
    @sql:Column {name: "first_name"}
    string firstName;
    # Last name
    @sql:Column {name: "last_name"}
    string lastName;
    # Work email
    @sql:Column {name: "work_email"}
    string workEmail;
    # Final day of employment
    @sql:Column {name: "final_day_of_employment"}
    string finalDayOfEmployment;
|};
