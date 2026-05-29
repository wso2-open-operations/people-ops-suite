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

# Google sheet configuration.
type GoogleSheetConfig record {|
    # Refresh Token
    string refreshToken;
    # Client ID 
    string clientID;
    # Client Secret
    string clientSecret;
|};

# Google sheet configuration.
public type BuMappingSheetColumns record {|
    # Number of columns in the sheet
    int numberOfColumns;
    # Column of the business unit
    string businessUnitColumn;
    # Column of the department
    string departmentColumn;
    # Column of the team
    string teamColumn;
    # Column of the functional lead 1
    string functionalLeadColumn;
|};

