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
import ballerinax/googleapis.sheets as sheets;

# Employee Entity GraphQl Client
public configurable readonly & GoogleSheetConfig googleSheetConfigs = ?;

# Initialize Employee Service EndPoint
#
# + return - Employee Service Client
public isolated function initializeGoogleSheetClient() returns sheets:Client|error {

    sheets:ConnectionConfig spreadsheetConfig = {
        auth: {
            clientId: googleSheetConfigs.clientID,
            clientSecret: googleSheetConfigs.clientSecret,
            refreshUrl: sheets:REFRESH_URL,
            refreshToken: googleSheetConfigs.refreshToken
        }
    };

    final sheets:Client gsClient = check new (spreadsheetConfig);

    return gsClient;
}