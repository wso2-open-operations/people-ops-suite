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

# Retrieves basic employee details by work email.
#
# + workEmail - WSO2 email address
# + return - Employee | Error
public isolated function fetchEmployeesBasicInfo(string workEmail) returns EmployeeBasicInfo|error {
    string document = string `
        query employeeQuery ($workEmail: String!) {
            employee(email: $workEmail) {
                employeeId,
                workEmail,
                firstName,
                lastName,
                jobRole,
                employeeThumbnail,
            }
        }
    `;

    EmployeeResponse response = check hrClient->execute(document, {workEmail});

    return response.data.employee;
}

# Retrieve the Probational Employee data.
#
# + workEmail - WSO2 Email
# + return - Employee Info
public isolated function getEmployee(string workEmail) returns Employee|error {

    string document = string `
        query employeeQuery ($workEmail: String!) {
            employee(email: $workEmail) {
                employeeId,
                firstName,
                lastName,
                lead,
                managerEmail,
                reportsTo,
                jobBand,
                jobRole,
                lastPromotedDate,
                startDate,
                employeeStatus,
                businessUnit,
                department,
                team,
                subTeam,
                employeeThumbnail
            }
        }
    `;

    EmployeeResults employeeData = check hrClient->execute(document, {workEmail});

    // Return object.
    Employee? employee = employeeData.data.employee;

    // Null Check.
    if employee is () {
        return error("No matching employee found for " + workEmail);
    }

    // Verifying user status.
    if employee.employeeStatus != Active && employee.employeeStatus != Marked\ leaver {
        return error("Deactivated account  " + workEmail);
    }

    return employee;
}

# Retrieve the employee list.
#
# + filterLeads - Leads are filtered or not  
# + jobBandArray - Array of job bands  
# + employmentTypesArray - Array of employment types
# + return - Array of employees
public isolated function getEmployees(boolean? filterLeads = (), int[]? jobBandArray = (),
        EmploymentType[]? employmentTypesArray = ()) returns EmployeeInfo[]|error {

    string document = string `
        query employeeQuery ($filter: EmployeeFilter!) {
            employees(filter: $filter) {
            employeeId,
            firstName,
            lastName,
            workEmail,
            jobBand,
            jobRole,
            lastPromotedDate,
            startDate,
            managerEmail,
            employmentType,
            businessUnit,
            department,
            team,
            subTeam,
            employeeThumbnail
            }
        }
    `;

    EmployeeFilter filter = {
        employeeStatus: [Active, Marked\ leaver],
        employmentType: employmentTypesArray is EmploymentType[] ? employmentTypesArray :
            [PERMANENT, CONSULTANCY, PART\ TIME\ CONSULTANCY],
        lead: (filterLeads is boolean && filterLeads == false) ? () : filterLeads,
        jobBand: jobBandArray is int[] ? jobBandArray : []
    };

    EmployeeInfoResult employeeData = check hrClient->execute(document, {filter});

    if employeeData.data.employees.length() <= 0 {
        return error((filterLeads is boolean && filterLeads == true) ? "No active leads found!" : "No active employees found!");
    }

    return employeeData.data.employees;
}

# Retrieve the Employee name by work email.
#
# + workEmail - workEmail
# + return - Return Value Description
public isolated function fetchEmployeeHistory(string workEmail) returns EmployeeHistory|error {

    string document = string `
        query employeeQuery ($workEmail: String!) {
            employee(email: $workEmail) {
            workEmail,
            managerEmail,
            startDate,
            jobBand,
            joinedJobRole,
            joinedBusinessUnit,
            joinedDepartment,
            joinedTeam,
            joinedLocation,
            lastPromotedDate,
            employeeThumbnail
            }
        }
    `;

    EmployeeHistoryResponse employeeData = check hrClient->execute(document, {workEmail});

    EmployeeHistory? employeeHistory = employeeData.data.employee;

    // Null Check.
    if employeeHistory is () {
        return error("No matching employee found for " + workEmail);
    }

    return employeeHistory;
}

# Retrieve the Employee name by work email.
#
# + workEmail - workEmail
# + return - Employee name object or error
public isolated function getEmployeeName(string workEmail) returns EmployeeName|error {

    string document = string `
        query employeeQuery ($workEmail: String!) {
            employee(email: $workEmail) {
            firstName,
            businessUnit,
            lastName
            }
        }
    `;

    EmployeeNameResult employeeData = check hrClient->execute(document, {workEmail});

    EmployeeName? employeeName = employeeData.data.employee;

    // Null Check
    if employeeName is null {
        return error("No matching employee found for " + workEmail);
    }

    return employeeName;
}