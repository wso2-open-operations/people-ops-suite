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
import ballerinax/googleapis.sheets as sheets;

# Insert dinner requests by email to sheet.
#
# + payload - Employee dinner request data
# + email - Employee email
# + return - Dinner request for employee
public isolated function insertDinnerRequest(DinnerRequest payload, string email) returns error? {
    string[] values = [payload.date, payload.team?: "null", payload.managerEmail, payload.mealOption, email];
    _ = check dodSpreadsheetClient->appendValue(dodSheetClientConfig.sheetId, values, <sheets:A1Range>{sheetName: 
        dodSheetClientConfig.sheetName});
}

# Cancel dinner requests by email to sheet.
#
# + email - Employee email
# + return - Error || Null
public isolated function cancelDinnerRequest(string email) returns error? {
    int index = 1;
    sheets:Range range = check dodSpreadsheetClient->getRange(
        dodSheetClientConfig.sheetId,
        dodSheetClientConfig.sheetName, 
        dodSheetClientConfig.sheetRange
    );
    foreach (int|string|decimal)[] row in range.values {
        if row[0] == email {
            _ = check dodSpreadsheetClient->deleteRows(dodSheetClientConfig.sheetId, dodSheetClientConfig.worksheetId, index, 1);
        }
        index += 1;
    }
}
