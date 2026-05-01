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




# Represents the response structure for retrieving user information.
public type UserInfoResponse record {|
    # The employee name
    string employeeName;
    # The work email
    string workEmail;
    # The start date
    string startDate?;
    # The Job role
    string jobRole;
    # The business unit
    string businessUnit?;
    # The department
    string department?;
    # The team
    string team?;
    # The email of the lead
    string? leadEmail;
    # The location
    string location?;
    # Whether the employee is a team lead
    boolean isTeamLead;
    # Whether the employee is a lead
    boolean lead;
    # Thumbnail of the employee
    string? employeeThumbnail;
    # User Privileges
    int[] privileges;
|};

# AppConfig Type
public type AppConfig record {|
    # Sample AppConfig
    string sampleAppConfig;
|};
