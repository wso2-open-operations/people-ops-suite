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

# OAuth2 client credentials grant configuration.
public type ClientAuthConfig record {|
    # Token URL
    string tokenUrl;
    # Client ID
    string clientId;
    # Client Secret
    string clientSecret;
|};

# Full visit record including visitor information returned by the backend API.
public type Visit record {|
    # Visit ID
    int id;
    # Current status of the visit
    string status;
    # Date of the visit (YYYY-MM-DD)
    string visitDate;
    # Scheduled entry time in UTC (YYYY-MM-DDTHH:mm:ss)
    string? timeOfEntry;
    # Scheduled departure time in UTC (YYYY-MM-DDTHH:mm:ss)
    string? timeOfDeparture;
    # Pass number assigned to the visitor
    string? passNumber;
    # Visitor's company name
    string? companyName;
    # Email of the employee the visitor is meeting
    string? whomTheyMeet;
    # Purpose of the visit
    string? purposeOfVisit;
    # Hashed visitor ID
    string? visitorIdHash;
    # Visitor first name
    string? firstName;
    # Visitor last name
    string? lastName;
    # Visitor email
    string? email;
    # Visitor contact number
    string? contactNumber;
|};

# Response from GET /visits.
public type VisitsResponse record {|
    # Total number of visits matching the filter
    int totalCount;
    # List of visits
    Visit[] visits;
|};
