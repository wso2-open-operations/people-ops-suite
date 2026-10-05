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

# Get the display name of an employee.
#
# + email - Work email of the employee
# + return - Full name, or the email itself when the employee has no name on record, or an error
public isolated function getEmployeeName(string email) returns string|error {
    string document = string `
        query getEmployee($email: String!) {
            employee(email: $email) {
                firstName
                lastName
            }
        }
    `;

    SingleEmployeeResponse response = check hrClient->execute(document, {email});
    EmployeeNameResponse? employee = response.data.employee;
    if employee is () {
        return error(string `Employee not found: ${email}`);
    }
    string? firstName = employee.firstName;
    if firstName is () {
        return email;
    }
    string? lastName = employee.lastName;
    return lastName is string ? string `${firstName} ${lastName}` : firstName;
}
