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
import ballerina/log;

# Retrieves basic employee details by work email.
#
# + workEmail - WSO2 email address
# + return - Employee | Error
public isolated function fetchEmployeesBasicInfo(string workEmail) returns Employee|error {
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

# Retrieves all active or marked-leaver employees with specific employment types.
#
# + return - EmployeeBasic Array or error
public isolated function getEmployees() returns EmployeeBasic[]|error {

    EmployeeFilter filter = {
        employeeStatus: [Active, Marked_leaver],
        employmentType: [PERMANENT, CONSULTANCY, PART_TIME_CONSULTANCY]
    };

    string document = string `query getAllEmployees($filter: EmployeeFilter!, $limit: Int, $offset: Int) {
        employees(filter: $filter, limit: $limit, offset: $offset) {
            workEmail
            firstName
            lastName
            employeeThumbnail
        }
    }`;

    EmployeeBasic[] employees = [];
    boolean fetchMore = true;
    while fetchMore {
        EmployeesResponse response = check hrClient->execute(
            document,
            {filter: filter, 'limit: DEFAULT_LIMIT, offset: employees.length()}
        );
        employees.push(...response.data.employees);
        fetchMore = response.data.employees.length() > 0;
    }
    return employees;
}

# Get career function Data.
#
# + return - Array of career functions or error
public isolated function getCareerFunctions() returns CareerFunction[]|error {
    string document = string `
        query careerFunctionsQuery($filter: CareerFunctionFilter, $limit:Int) {
            careerFunctions(filter:$filter, limit:$limit) {
                id,
                careerFunction,
                designations {
                    designation,
                    jobBand,
                    id
                }           
            }
        }
    `;

    CareerFunctionResponse|error response = hrClient->execute(document, {
        filter: {},
        'limit: 1000
    });

    if response is error {
        log:printError("Error while fetching career function details.", response);
        return error("Error while fetching career function details.");
    }

    return response.data.careerFunctions;
}

# Get cached org details.
#
# + return - Array of org details or error
public isolated function getOrgDetails() returns BusinessUnit[]|error {
    final error|BusinessUnit[] & readonly businessUnits = fetchOrgDetails().cloneReadOnly();
    if businessUnits is error {
        log:printError("Error while fetching Org Details.", businessUnits);
        return error("Error while fetching Org Details.");
    }

    return businessUnits;
}

# Fetch Org details.
#
# + return - Array of org details
isolated function fetchOrgDetails() returns BusinessUnit[]|error {
    string document = string `
        query orgDetailsQuery($filter: OrgDetailsFilter, $limit:Int) {
            orgDetails(filter:$filter, limit:$limit) {
                id,
                businessUnit,
                departments  {
                    id,
                    department,
                    teams {
                        id,
                        team,
                        subTeams {
                            id,
                            subTeam
                        }
                    }
                }           
            }
        }
    `;

    OrgDetailsResponse|error response = hrClient->execute(document, {
        filter: {},
        'limit: 1000
    });

    if response is error {
        log:printError("Error while fetching Org Details.", response);
        return error("Error while fetching Org Details.");
    }

    return response.data.orgDetails;
}

# Get cached company details.
#
# + return - Array of Companies or error
public isolated function getCompanies() returns Company[]|error {
    final error|Company[] & readonly companies = fetchCompanies().cloneReadOnly();
    if companies is error {
        log:printError("Error while fetching Companies.", companies);
        return error("Error while fetching Companies.");
    }
    return companies;
}

# Fetch company details.
#
# + return - Array of Companies or error
public isolated function fetchCompanies() returns Company[]|error {
    string document = string `
        query getCompaniesQuery ($filter: CompanyFilter,$limit:Int) {
            companies(filter: $filter,limit:$limit) {
                id,
                company,
                location,
                offices {
                    id,
                    office,
                    location
                }
            }
        }
    `;

    CompanyResponse|error response = hrClient->execute(document, {});

    if response is error {
        log:printError("Error while fetching Companies.", response);
        return error("Error while fetching Companies.");
    }

    return response.data.companies;
}

