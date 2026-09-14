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

# [Configurable] People Ops database configs.
type DatabaseConfig record {|
    # User of the database
    string user;
    # Password of the database
    string password;
    # Name of the database
    string database;
    # Host of the database
    string host;
    # Port of the database
    int port;
    # Maximum number of open connections
    int maxOpenConnections;
    # Maximum lifetime of a connection
    decimal maxConnectionLifeTime;
    # Minimum number of open connections
    int minIdleConnections;
|};

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

# A change to an employee's general information waiting for its effective date.
public type ScheduledChange record {|
    # Scheduled change id
    int id;
    # Employee table primary key the change applies to
    @sql:Column {name: "employee_pk_id"}
    int employeePkId;
    # External employee ID
    @sql:Column {name: "employee_id"}
    string employeeId;
    # First name
    @sql:Column {name: "first_name"}
    string firstName;
    # Last name
    @sql:Column {name: "last_name"}
    string lastName;
    # Date the change takes effect
    @sql:Column {name: "effective_date"}
    string effectiveDate;
    # Fields being changed, as column-name to value
    json changes;
    # What those same fields held when the change was scheduled
    json expected;
    # Who scheduled it
    @sql:Column {name: "created_by"}
    string createdBy;
|};

# What the sweep did with one scheduled change, for the run's summary.
public type ScheduledChangeOutcome record {|
    # Scheduled change id
    int id;
    # External employee ID
    string employeeId;
    # Employee's full name
    string employeeName;
    # Date the change was due
    string effectiveDate;
    # Applied, superseded or failed
    string status;
    # Why it was not applied, where that applies
    string? failureReason;
    # Reader-facing names of the fields the change set
    string[] fields;
|};
