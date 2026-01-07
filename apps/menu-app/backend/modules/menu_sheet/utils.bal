// Copyright (c) 2025, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.
import ballerina/time;

# Get the current date and time in readable IST format.
#
# + return - Return the date and time in IST format as a string
isolated function getDateTimeInReadableFormat() returns string {
    // currentTime = Fri, 25 Jul 2025 21:39:46 +0000
    time:Utc currentTime = time:utcAddSeconds(time:utcNow(), 19800);
    string[] splitTime = re ` `.split(time:utcToEmailString(currentTime));

    // return Fri, 25 Jul 2025 21:39:46 
    if splitTime.length() > 5 {
        return string:'join(" ", splitTime[0], splitTime[1], splitTime[2], splitTime[3], splitTime[4]);
    }

    return currentTime.toString(); // return Fri, 25 Jul 2025 21:39:46 +0000 for fallback
}

# Convert a array of union types to a string array.
#
# + values - Row values from the sheet
# + return - Converted string array
isolated function toString((int|string|decimal)[] values) returns string[] =>
    values.'map(value => value.toString());
