// Copyright (c) 2025, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.
import menu_app.types;

import ballerina/cache;
import ballerinax/googleapis.sheets as sheets;

isolated cache:Cache menuShortTermCache = new (capacity = 3, defaultMaxAge = 600, evictionFactor = 0.2);
isolated cache:Cache menuLongTermCache = new (capacity = 3, defaultMaxAge = 43200, evictionFactor = 0.2);

# Get menu from cache or sheet.
#
# + return - Menu or error
public isolated function getMenu() returns types:Menu|error {
    lock {
        string[] sortedKeys = menuShortTermCache.keys().sort("descending");
        if sortedKeys.length() > 0 {
            any|cache:Error shortTermCacheValue = menuShortTermCache.get(sortedKeys[0]);
            if shortTermCacheValue is types:Menu {
                return shortTermCacheValue.cloneReadOnly();
            }
        }
    }

    future<types:Menu|error> menuDataFuture = start getMenuData();
    lock {
        string[] sortedKeys = menuLongTermCache.keys().sort("descending");
        if sortedKeys.length() > 0 {
            any|cache:Error longTermCacheValue = menuLongTermCache.get(sortedKeys[0]);
            if longTermCacheValue is types:Menu {
                return longTermCacheValue.cloneReadOnly();
            }
        }
    }

    return wait menuDataFuture;
}

# Retrieve menu data from sheet.
#
# + return - string[]|error
isolated function getMenuData() returns types:Menu|error {
    future<string[]|error> menuItemsFuture = start getRowData(sheetClientConfig.sheetRangeItem);
    future<string[]|error> menuDescriptionsFuture = start getRowData(sheetClientConfig.sheetRangeDescription);
    string[] menuItems = check wait menuItemsFuture;
    string[] menuDescriptions = check wait menuDescriptionsFuture;
    if menuItems.length() < 6 || menuDescriptions.length() < 6 {
        return error("Error retrieving menu data.", menuItemsLength = menuItems.length(),
            menuDescriptionsLength = menuDescriptions.length());
    }

    final readonly & string date = menuItems[0];
    final readonly & types:Menu menu = {
        date,
        breakfast: {title: menuItems[1], description: menuDescriptions[1]},
        juice: {title: menuItems[2], description: menuDescriptions[2]},
        lunch: {title: menuItems[3], description: menuDescriptions[3]},
        dessert: {title: menuItems[4], description: menuDescriptions[4]},
        snack: {title: menuItems[5], description: menuDescriptions[5]}
    };

    lock {
        _ = check menuShortTermCache.put(date, menu);
    }

    lock {
        _ = check menuLongTermCache.put(date, menu);
    }

    return menu;
};

# Retrieve menu description from sheet.
#
# + sheetRange - Sheet range
# + return - string[]|error
isolated function getRowData(int sheetRange) returns string[]|error {
    sheets:Row row = check spreadsheetClient->getRow(
        sheetClientConfig.sheetId,
        sheetClientConfig.sheetName,
        sheetRange
    );

    return toString(row.values);
}

# Add feedback to a separate sheet.
#
# + feedback - Lunch feedback
# + vendor - Vendor name
# + return - Return the updated row position or an error
public isolated function addFeedback(types:Feedback feedback, string vendor) returns int|error {
    sheets:ValueRange result = check spreadsheetClient->appendValue(
        sheetClientConfig.sheetId,
        [getDateTimeInReadableFormat(), vendor, feedback.message],
        {sheetName: sheetClientConfig.mealFeedbackSheetName}
    );

    return result.rowPosition;
}
