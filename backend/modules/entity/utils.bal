// Copyright (c) 2024, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.
configurable string[] employeeTypes = [];
configurable string[] allowedEmployeeStatusTypes = [];

# This function get and validate the authorized employee types from the configuration.
#
# + return - Array of authorized employee types or default employee types [PERMANENT, CONSULTANCY]
public isolated function getAuthorizedEmployeeTypes() returns string[] {
    string[] defaultEmployeeTypes = [
        ADVISORY\ CONSULTANT,
        CONSULTANCY,
        INTERNSHIP,
        PART\ TIME\ CONSULTANCY,
        PERMANENT,
        PROBATION
    ];
    string[] authorizedTypes = [];
    if employeeTypes.length() > 0 {
        foreach string employeeType in employeeTypes {
            if defaultEmployeeTypes.some(definedType => definedType == employeeType) {
                authorizedTypes.push(employeeType);
            }
        }
        if authorizedTypes.length() > 0 {
            return authorizedTypes;
        }
    }
    return [PERMANENT, CONSULTANCY, PROBATION, PART\ TIME\ CONSULTANCY];
}

# This function get and validate the authorized employee status types from the configuration.
#
# + return - Array of authorized employee status types or default employee types [Active, Marked Leaver]
public isolated function getAuthorizedEmployeeStatusTypes() returns string[] {
    string[] defaultEmployeeStatusTypes = [
        EmployeeStatusMarkedLeaver,
        EmployeeStatusActive,
        EmployeeStatusLeft
    ];
    string[] authorizedStatusTypes = [];
    if allowedEmployeeStatusTypes.length() > 0 {
        foreach string employeeStatusType in allowedEmployeeStatusTypes {
            if defaultEmployeeStatusTypes.some(definedType => definedType == employeeStatusType) {
                authorizedStatusTypes.push(employeeStatusType);
            }
        }
        if authorizedStatusTypes.length() > 0 {
            return authorizedStatusTypes;
        }
    }
    return [EmployeeStatusActive, EmployeeStatusMarkedLeaver];
}
