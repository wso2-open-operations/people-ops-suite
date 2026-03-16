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

# [Configurable] Google sheet OAuth2 application configuration for parking reservations.
public type ParkingSheetConfig record {|
    # OAuth2 token endpoint.
    string tokenUrl;
    # OAuth 2 refresh token.
    string refreshToken;
    # OAuth2 client ID.
    string clientId;
    # OAuth2 client secret.
    string clientSecret;
    # Sheet ID.
    string sheetId;
    # Sheet name (tab) to append reservations to.
    string sheetName;
|};

