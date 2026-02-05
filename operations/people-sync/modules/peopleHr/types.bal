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

import ballerina/data.jsondata;

# Response from People HR.
public type PeopleHrResponse record {|
    # Is error or not
    boolean isError;
    # Status of the response
    int Status;
    # Message of the response
    string Message;
    # Result array
    Employee[] Result;
    json...;
|};

# Employee information.
public type Employee record {|
    # Employee ID on People HR
    @jsondata:Name {value: "Employee Id"}
    string employeeId;

    # Title
    @jsondata:Name {value: "Title"}
    string? title;
    # First name
    @jsondata:Name {value: "First Name"}
    string? firstName;
    # Last name
    @jsondata:Name {value: "Last Name"}
    string? lastName;
    # Gender
    @jsondata:Name {value: "Gender"}
    string? gender;

    # Work email
    @jsondata:Name {value: "Work Email"}
    string? workEmail;
    # Work phone number
    @jsondata:Name {value: "Work Phone Number"}
    string? workPhoneNumber;

    # Employee's company WSO2 LK, US..etc
    @jsondata:Name {value: "Company"}
    string? company;
    # Employee location (country)
    @jsondata:Name {value: "Location"}
    string? location;

    # Business unit
    @jsondata:Name {value: "BU (Business Unit)"}
    string? businessUnit;
    # Department
    @jsondata:Name {value: "Department"}
    string? department;
    # Team
    @jsondata:Name {value: "Team (Team and Sub Team)"}
    string? team;
    # Sub Team
    @jsondata:Name {value: "Sub Team (Team and Sub Team)"}
    string? subTeam;

    # Current job band
    @jsondata:Name {value: "System1 ID"}
    string? jobBand;
    # Current job role
    @jsondata:Name {value: "Job Role"}
    string? jobRole;
    # Employment type (i.e: PERMANENT, INTERNSHIP, PROBATION etc.)
    @jsondata:Name {value: "Employment Type"}
    string? employmentType;
    # Employee Status (i.e: Left, Active, Marked leaver)
    @jsondata:Name {value: "Employee Status"}
    string? employeeStatus;

    # EPF
    @jsondata:Name {value: "EPF Number (EPF)"}
    string? epfNumber;

    # Manager email
    @jsondata:Name {value: "Manager Email"}
    string? managerEmail;
    # Additional managers (comma separated array of names)
    @jsondata:Name {value: "Additional Manager"}
    string? additionalManagers;

    # Work start date
    @jsondata:Name {value: "Start Date"}
    string? startDate;
    # Initial joined date
    @jsondata:Name {value: "Initial date of joining (Actual Start Date)"}
    string? initialDateOfJoining;
    # Continuous Service date
    @jsondata:Name {value: "Continuous Service Date"}
    string? continuousServiceDate;

    # Resignation date
    @jsondata:Name {value: "Resignation Date"}
    string? resignationDate;
    # Final day in office
    @jsondata:Name {value: "Final Day in Office"}
    string? finalDayInOffice;
    # Final day of employment
    @jsondata:Name {value: "Final Day of Employment"}
    string? finalDayOfEmployment;
    # Relocation status
    @jsondata:Name {value: "Relocation (Relocation)"}
    string? relocation;
    # Resignation reason
    @jsondata:Name {value: "Reason for Resignation (Resignation Reasons)"}
    string? reasonForResignation;

    # Personal phone number
    @jsondata:Name {value: "Personal Phone Number"}
    string? personalPhone;
    # Personal email
    @jsondata:Name {value: "Personal Email"}
    string? personalEmail;

    // TODO: check and enable if required
    // # Reports to lead name
    // string? Reports\ To;
    // # Length of service
    // string? Length\ Of\ Service;
    // # Employee's lead email (Mainly use as approver email)
    // string? Email\ \(Lead\ Email\ ID\)?;

    json...;
|};
