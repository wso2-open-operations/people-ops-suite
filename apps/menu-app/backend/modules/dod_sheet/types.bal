// Copyright (c) 2023, WSO2 LLC. (http://www.wso2.com). All Rights Reserved.
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

# [Configurable] Google sheet OAuth2 application configuration.
# 
type DodSheet record {|
    # OAuth2 token endpoint
    string tokenUrl;
    # OAuth 2 refresh token
    string refreshToken;
    # OAuth2 client ID
    string clientId;
    # OAuth2 client secret
    string clientSecret;
    # Sheet ID
    string sheetId;
    # Sheet name
    string sheetName;
    # Worksheet ID
    int worksheetId;
    # Sheet range
    string sheetRange;
|};

# Dinner request data.
public type DinnerRequest record {|
    # Request Id 
    string id?;
    # Meal option
    string mealOption;
    # Date of meal request
    string date;
    # Department of employee
    string department;
    # Team of employee
    string? team;
    # Manager email
    string managerEmail;
    # Timestamp of the request
    string timestamp?;
|};
