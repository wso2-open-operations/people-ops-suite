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
import ballerinax/googleapis.sheets;

// Google Sheet client
final sheets:Client spreadsheetClient = check initializeGoogleSheetClient();

# Returns the data set from the google sheet.
#
# + sheetURL - URL of the google sheet
# + return - Data set from the google sheet
public isolated function getSheetData(string sheetURL) returns (int|string|decimal)[][]|error {
    sheets:Spreadsheet spreadsheet = check spreadsheetClient->openSpreadsheetByUrl(sheetURL);

    // Cover all cells in the sheet
    string a1Notation = A1_NOTATION + (spreadsheet.sheets[0].properties.gridProperties.rowCount).toString();
    string workSheetName = spreadsheet.sheets[0].properties.title;
    sheets:Range openRes = check spreadsheetClient->getRange(spreadsheet.spreadsheetId, workSheetName, a1Notation);

    return openRes.values;
}

# Append data to the google sheet.
#
# + sheetURL - URL of the google sheet  
# + sheetNumber - Which sheet to write data  
# + dataRow - Data array to be appended
# + return - Error if any
public isolated function appendData(string sheetURL, int sheetNumber, (int|string|decimal)[] dataRow) returns error? {

    sheets:Spreadsheet spreadsheet = check spreadsheetClient->openSpreadsheetByUrl(sheetURL);

    _ = check spreadsheetClient->appendValue(spreadsheet.spreadsheetId,
            dataRow, {sheetName: spreadsheet.sheets[sheetNumber - 1].properties.title});
}

