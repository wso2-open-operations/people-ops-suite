import par_app.types;

import ballerina/lang.regexp;
import ballerina/time;

// Copyright (c) 2024, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.
configurable string[] allowedEmailTemplateTypes = [];

# This function validates if the given template is explicitly allowed in the configuration.
#
# + templateToValidate - The email template type to validate.
# + return - Boolean value indicating whether the template type is allowed.
public isolated function isTemplateAllowed(string templateToValidate) returns boolean =>
    allowedEmailTemplateTypes.some(emailTemplate => emailTemplate == templateToValidate);

# Convert a date string (ISO 8601) to the desired format: `DD Mon YY`.
#
# + date - String date in ISO 8601 format
# + return - Return formatted date string or error for invalid input
public isolated function formatDateString(string date) returns string|types:ValidationError {
    time:Civil|types:ValidationError civilDate = getCivilDateFromString(date);
    if civilDate is types:ValidationError {
        return civilDate; // Return the validation error if the date is invalid
    }

    return string `${civilDate.day.toString().padStart(2)} ${getMonthString(civilDate.month)} ${civilDate.year}`;
}

# Get Civil date from a string in ISO 8601 format. This date will be timezone independent.
#
# + date - String date in ISO 8601 format
# + return - Return Civil date or error for validation failure
isolated function getCivilDateFromString(string date) returns time:Civil|types:ValidationError {
    time:Civil|time:Error civilDate = time:civilFromString(getTimestampFromDateString(date));
    if civilDate is error {
        return error(civilDate.message(), externalMessage = types:ERR_MSG_INVALID_DATE_FORMAT);
    }

    return civilDate;
}

# Get timestamp from a string in ISO 8601 format. This date will be timezone independent.
#
# + date - String date in ISO 8601 format
# + return - Return timestamp
public isolated function getTimestampFromDateString(string date) returns string {
    string timestamp = date;
    if regexp:find(types:REGEX_DATE_YYYY_MM_DD, date) is regexp:Span {
        timestamp = date.substring(0, 10) + "T00:00:00Z";
    }

    return timestamp;
}

# Get month's name for a given month's index.
#
# + month - Index of a month
# + return - Return the month's name as a short abbreviation
public isolated function getMonthString(int month) returns string {
    match month {
        1 => {
            return "Jan";
        }
        2 => {
            return "Feb";
        }
        3 => {
            return "Mar";
        }
        4 => {
            return "Apr";
        }
        5 => {
            return "May";
        }
        6 => {
            return "Jun";
        }
        7 => {
            return "Jul";
        }
        8 => {
            return "Aug";
        }
        9 => {
            return "Sep";
        }
        10 => {
            return "Oct";
        }
        11 => {
            return "Nov";
        }
        12 => {
            return "Dec";
        }
        _ => {
            return month.toString();
        }
    }
}
