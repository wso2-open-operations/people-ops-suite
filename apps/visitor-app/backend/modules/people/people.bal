// Copyright (c) 2025, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

# Retrieve the employee data.
#
# + workEmail - Employee email
# + return - Employee object or Error if so
public isolated function fetchEmployee(string workEmail) returns Employee|error? {

    string document = string `
        query employeeQuery ($workEmail: String!) {
            employee(email: $workEmail) {
                employeeId
                workEmail
                firstName
                lastName
                jobRole
                employeeThumbnail
            }
        }
    `;

    EmployeeResponse employeeResponse = check hrClient->execute(document, {workEmail});
    Employee? employee = employeeResponse.data.employee;
    if employee is () {
        return;
    }

    return employee;
}
