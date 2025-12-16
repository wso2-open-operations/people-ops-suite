// Copyright (c) 2025, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

# [Configurable] Google sheet OAuth2 application configuration.
type MenuSheet record {|
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
    # Sheet range for menu item
    int sheetRangeItem;
    # Sheet range for menu description
    int sheetRangeDescription;
    # Sheet name for feedbacks
    string mealFeedbackSheetName;
|};

# Meta Data.
public type MetaData record {|
    # Title
    string title;
    # Description
    string description;
|};

# Menu Items.
public type Menu record {|
    # Meal date
    string date;
    # Breakfast item
    MetaData breakfast;
    # Juice item
    MetaData juice;
    # Lunch item
    MetaData lunch;
    # Dessert item
    MetaData dessert;
    # Snack item
    MetaData snack;
|};

# Meal enum.
public enum Meal {
    LUNCH = "Lunch"
}

# Lunch feedback record.
public type Feedback record {|
    # Feedback message
    string message;
    # Meal type
    Meal meal = LUNCH;
|};
