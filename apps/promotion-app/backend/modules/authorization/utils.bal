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

import promotion_app.database;
import promotion_app.people;

# Helper function to user has roles.
#
# + requiredRoles - Required Role list
# + userRoles - Roles list, The user has
# + return - Allow or not
public isolated function checkPermissions(string[] requiredRoles, string[] userRoles) returns boolean {
    if userRoles.length() == 0 && requiredRoles.length() > 0 {
        return false;
    }

    final string[] & readonly userRolesReadOnly = userRoles.cloneReadOnly();
    return requiredRoles.every(role => userRolesReadOnly.indexOf(role) !is ());
}

# Split Lead Email.
#
# + email - User's email address
# + return - Object containing user's roles, employee data, and access levels
public isolated function getUserPrivileges(string email) returns UserAppPrivilege|error {

    // Fetch user record from the database using the provided email.
    database:User? applicationUser = check database:getUser(email = email);

    // Retrieve corresponding employee data from the People service using the same email.
    people:Employee employeeData = check people:getEmployee(workEmail = email);

    UserAppPrivilege userAppPrivileges = {
        employeeData
    };

    if applicationUser !is () {
        userAppPrivileges.roles = applicationUser.roles;
        userAppPrivileges.functionalLeadAccessLevels = applicationUser.functionalLeadAccessLevels;
    }

    // If the employee is marked as a lead, append the LEAD role to their roles list.
    if employeeData.lead {
        userAppPrivileges.roles.push(<database:Role>database:LEAD);
    }

    return userAppPrivileges;
}
