// Copyright (c) 2026, WSO2 LLC. (http://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 Inc. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

configurable string apiKey = ?;

const QUERY_NAME = "Internal Apps Data Sync";
const ACTION = "GetQueryResult";

# Get employees from People HR
#
# + return - List of employees
public isolated function getEmployees() returns Employee[]|error {
    PeopleHrResponse response = check peopleHrClient->/Query.post({
        APIKey: apiKey,
        QueryName: QUERY_NAME,
        Action: ACTION
    });
    if response.isError {
        return error("PeopleHR API returned an error response", message = response.Message);
    }
    return response.Result;
}
