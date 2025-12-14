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
import ballerina/cache;
import ballerina/graphql;

isolated cache:Cache hrisEmployeeCache = new (
    'defaultMaxAge = CACHE_DEFAULT_MAX_AGE,
    'cleanupInterval = CACHE_CLEANUP_INTERVAL
);

# Get Employee from HRIS by email with caching using GraphQL.
#
# + email - Employee email
# + return - Return Employee entity or error
public isolated function getEmployee(string? email)
    returns readonly & Employee|error {

    // lock {
    //     any|cache:Error cachedEmployee = hrisEmployeeCache.get(email);
    //     if cachedEmployee is readonly & Employee {
    //         return cachedEmployee;
    //     }
    // }

    string document = string `
        query getEmployee($email: String!) {
            employee(email: $email) {
                employeeId
                firstName
                lastName
                workEmail
                startDate
                employeeThumbnail
                location
                jobRole
                managerEmail
                finalDayOfEmployment
                lead
            }
        }
    `;

    SingleEmployeeResponse|graphql:ClientError response = hrClient->execute(document, {email});
    if response is graphql:ClientError {
        return error(ERR_MSG_EMPLOYEE_RETRIEVAL_FAILED, response);
    }

    EmployeeResponse|null employeeResp = response.data.employee;
    if employeeResp is () {
        return error(ERR_MSG_EMPLOYEE_RETRIEVAL_FAILED);
    }
    readonly & Employee employee = toEmployee(employeeResp);

    // lock {
    //     cache:Error? cachingErr = hrisEmployeeCache.put(email, employee);
    //     if cachingErr is cache:Error {
    //         log:printError("Error caching employee data from HRIS");
    //     }
    // }

    return employee;
}

# Get Employees from HRIS by filters using GraphQL.
#
# + filters - Filter object containing the filter criteria for the query
# + return - Return an array of Employee entity or error
public isolated function getEmployees(EmployeeFilter filters = {}) returns readonly & Employee[]|error {

    GraphQLEmployeeFilter gqlFilter = {
        location: filters.location,
        businessUnit: filters.businessUnit,
        team: filters.team,
        employeeStatus: filters.status,
        managerEmail: filters.leadEmail,
        employmentType: filters.employmentType,
        lead: filters.lead
    };

    string document = string `
        query getEmployees($filter: EmployeeFilter!) {
            employees(filter: $filter) {
                employeeId
                firstName
                lastName
                workEmail
                startDate
                employeeThumbnail
                location
                jobRole
                managerEmail
                finalDayOfEmployment
                lead
            }
        }
    `;

    MultipleEmployeesResponse|graphql:ClientError response = hrClient->execute(document, {filter: gqlFilter});

    if response is graphql:ClientError {
        return error(ERR_MSG_EMPLOYEES_RETRIEVAL_FAILED, response);
    }

    return from EmployeeResponse empResp in response.data.employees
        select toEmployee(empResp);
}

# Get the location of an employee based on their email address using GraphQL.
#
# + email - Email address of the employee 
# + token - JWT token (not used in GraphQL OAuth2 flow)
# + return - The employee's location or an error
public isolated function getEmployeeLocation(string email, string token) returns string|error {

    readonly & Employee|error employee = getEmployee(email);
    if employee is error {
        return error(employee.message(), employee);
    }
    string? location = employee.location;
    if location is () {
        return error("Employee location not found!");
    }

    return location;
}

