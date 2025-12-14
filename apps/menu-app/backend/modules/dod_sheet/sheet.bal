// Copyright (c) 2023, WSO2 LLC. (http://www.wso2.com). All Rights Reserved.
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.
import ballerinax/googleapis.sheets as sheets;

# Insert dinner requests by email to sheet.
#
# + payload - Employee dinner request data
# + email - Employee email
# + return - Dinner request for employee
public isolated function insertDinnerRequest(DinnerRequest payload, string email) returns error? {
    string[] values = [payload.date, payload.team?: "null", payload.managerEmail, payload.mealOption, email];
    _ = check spreadsheetClient->appendValue(sheetClientConfig.sheetId, values, <sheets:A1Range>{sheetName: 
        sheetClientConfig.sheetName});
}

# Cancel dinner requests by email to sheet.
#
# + email - Employee email
# + return - Error || Null
public isolated function cancelDinnerRequest(string email) returns error? {
    int index = 1;
    sheets:Range range = check spreadsheetClient->getRange(
        sheetClientConfig.sheetId,
        sheetClientConfig.sheetName, 
        sheetClientConfig.sheetRange
    );
    foreach (int|string|decimal)[] row in range.values {
        if row[0] == email {
            _ = check spreadsheetClient->deleteRows(sheetClientConfig.sheetId, sheetClientConfig.worksheetId, index, 1);
        }
        index += 1;
    }
}
