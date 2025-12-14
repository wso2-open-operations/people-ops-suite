// Copyright (c) 2023, WSO2 LLC. (http://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.
import ballerina/sql;
import menu_app.people;

# Get dinner requests by email.
#
# + email - Employee email
# + return - Dinner request for employee
public isolated function getDinnerRequestByEmail(string email) returns DinnerRequest|error? {
    DinnerRequest|error dinnerRequestResult = databaseClient->queryRow(getDinnerRequestByEmailQuery(email));
    return dinnerRequestResult is sql:NoRowsError ? () : dinnerRequestResult;
}

# Get all Dinner Requests for a particular day.
# 
# + return - All dinner requests
public isolated function getDinnerRequests() returns DinnerRequest[]|error {
    stream<DinnerRequest, sql:Error?> dinnerRequestResultStream = databaseClient->query(getAllDinnerRequestsQuery());
    return from var result in dinnerRequestResultStream select result;
}

# Insert dinner request.
#
# + dinnerRequest - Dinner request payload
# + email - Employee email
# + return - Success result
public isolated function insertDinnerRequest(DinnerRequest dinnerRequest, string email) returns sql:ExecutionResult|error {
    return databaseClient->execute(insertDinnerRequestQuery(dinnerRequest, email ,check people:fetchEmployee(email)));
}

# Cancel dinner request.
#
# + email - Dinner request email
# + return - Success result
public isolated function cancelDinnerRequest(string email) returns sql:ExecutionResult|error {
    return databaseClient->execute(cancelDinnerRequestQuery(email));
}
