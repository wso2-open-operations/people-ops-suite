// Copyright (c) 2025, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.
import ballerina/time;

# Checks whether current time falls within the given time range to add feedbacks.
#
# + date - The date stored in the sheet to be checked
# + startTime - Start time in HH:MM format
# + endTime - End time in HH:MM format
# + return - True if the current time falls within the range false otherwise
isolated function isWithinTimeRange(string date, time:TimeOfDay startTime, time:TimeOfDay endTime)
    returns boolean|error {

    string formattedDate = re `/`.replaceAll(date, "-"); // Convert date from YYYY/MM/DD to YYYY-MM-DD
    time:Utc sheetDateUtc = check time:utcFromString(formattedDate + DEFAULT_TIME_OF_DAY);
    time:Utc startTimeUtc = time:utcAddSeconds(sheetDateUtc, startTime.hour * 3600 + startTime.minute * 60);
    time:Utc endTimeUtc = time:utcAddSeconds(sheetDateUtc, endTime.hour * 3600 + endTime.minute * 60);
    time:Utc currentTimeUtc = time:utcNow();
    time:Utc currentTimeUserLocal = time:utcAddSeconds(currentTimeUtc, DEFAULT_TIME_OFFSET * 3600);
    return currentTimeUserLocal >= startTimeUtc && currentTimeUserLocal <= endTimeUtc;
}

# Validates whether all provided user groups exist in the list of valid user groups.
#
# + userGroups - Array of user group names to validate
# + validUserGroups - Array of allowed user group names from the database
# + return - true if all provided groups are valid or if no groups provided, false if any group is invalid
public isolated function checkUserGroups(string[] userGroups, string[] validUserGroups) returns boolean {
    if userGroups.length() === 0 {
        return true;
    }

    final string[] & readonly validUserGroupsReadOnly = validUserGroups.cloneReadOnly();
    return userGroups.every(group => validUserGroupsReadOnly.indexOf(group) !is ());
}
