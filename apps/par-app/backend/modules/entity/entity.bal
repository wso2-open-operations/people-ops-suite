// Copyright (c) 2024, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.
import ballerina/cache;
import ballerina/log;

configurable int hrEntityCacheCapacity = 1000;
configurable decimal hrEntityCacheDefaultMaxAge = 1800.0;
configurable decimal hrEntityCacheCleanupInterval = 60.0;
configurable int hrEntityRequestBatchSize = 100;

const CACHE_EMPLOYEES = "CACHE_EMPLOYEES";
const CACHE_EMPLOYEE = "CACHE_EMPLOYEE";
final string GET_EMPLOYEES_DOCUMENT = string `
    query getAllEmployees($filter: EmployeeFilter!, $limit: Int, $offset: Int) {
        employees(filter: $filter, limit: $limit, offset: $offset) {
            firstName
            lastName
            workEmail
            company
            location
            businessUnit
            department
            team
            subTeam
            managerEmail
            jobRole
            startDate
            employeeThumbnail
            lead
            employmentType
            employeeStatus
        }
    }
`;
final string GET_EMPLOYEE_DOCUMENT = string `
    query getEmployee($workEmail: String!) {
        employee(email: $workEmail) {
            firstName
            lastName
            workEmail
            company
            location
            businessUnit
            department
            team
            subTeam
            managerEmail
            jobRole
            startDate
            employeeThumbnail
            lead
            employmentType
            employeeStatus
        }
    }
`;

isolated cache:Cache cache = new ({
    capacity: hrEntityCacheCapacity,
    defaultMaxAge: hrEntityCacheDefaultMaxAge,
    cleanupInterval: hrEntityCacheCleanupInterval
});

# This function returns the list of active employees in the organization.
# The information is retrieved from the HR entity service.
#
# + managerEmail - The email of the lead
# + additionalManagerEmail  - Additional manager's email
# + return - An array of employees in the organization or an error if the employees retrieval is unsuccessful
public isolated function getAllActiveEmployees(string? managerEmail = (),string? additionalManagerEmail = ()) 
    returns Employee[]|error {
    
    string[] allowedEmployeeTypes = getAuthorizedEmployeeTypes();
    string[] allowedEmployeeStatusTypes = getAuthorizedEmployeeStatusTypes();
    lock {

        Employee[] employees = [];
        EmployeeFilter filter = {
            employeeStatus: allowedEmployeeStatusTypes.cloneReadOnly(),
            employmentType: allowedEmployeeTypes.cloneReadOnly()
        };
        if managerEmail is string {
            filter.managerEmail = managerEmail;
        }
        if additionalManagerEmail is string {
            filter.additionalManagerEmail = additionalManagerEmail;
        }
        boolean fetchMore = true;
        while fetchMore {
            GetEmployeesResponse result = check hrClient->execute(GET_EMPLOYEES_DOCUMENT, {
                filter,
                'limit: hrEntityRequestBatchSize,
                offset: employees.length()
            });
            employees.push(...result.data.employees);
            fetchMore = result.data.employees.length() > 0;
        }

        return employees.cloneReadOnly();
    }
}

# This function returns the employee with the given work email.
#
# + workEmail - The work email of the employee to retrieve
# + return - The employee with the given work email or an error if the employee retrieval is unsuccessful
public isolated function getEmployee(string workEmail) returns Employee|error {
    lock {
        string cacheKey = string `${CACHE_EMPLOYEE}_${workEmail}`;
        any|cache:Error cachedEmployee = cache.get(cacheKey);
        if cachedEmployee is readonly & Employee {
            return cachedEmployee;
        }
        GetEmployeeResponse result = check hrClient->execute(GET_EMPLOYEE_DOCUMENT, {workEmail});
        Employee employee = result.data.employee.cloneReadOnly();
        cache:Error? cachePut = cache.put(cacheKey, employee);
        if cachePut is cache:Error {
            log:printWarn("Error occurred while caching the employee.", cachePut);
        }
        return employee.cloneReadOnly();
    }
}

# This function clears the cache.
#
# + return - An error if the cache clearing is unsuccessful or nil if the cache is cleared successfully
public isolated function clearCache() returns error? {
    lock {
        _ = check cache.invalidateAll();
    }
}

# Fetch Employee Data.
#
# + workEmail - WSO2 email address
# + return - Employee | Error
public isolated function fetchEmployeesBasicInfo(string workEmail) returns Employeebasic|error {
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

    EmployeeResponse|error response = hrClient->execute(document, {workEmail});
    if response is error {
        return response;
    }
    return response.data.employee;
}