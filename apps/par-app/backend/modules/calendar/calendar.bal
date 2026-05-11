// Copyright (c) 2025, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.
import par_app.types;

import ballerina/log;
import ballerina/uuid;
import ballerinax/googleapis.gcalendar;

# Function to get busy time periods fro the employee and lead from the google calendar.
#
# + employeeEmail - The email of the employee
# + leadEmail - The email of the lead
# + date - The date which checks against availability
# + return - A list of ParTeamSummary objects or an error if the operation failed
public isolated function checkCalendarAvailability(string employeeEmail, string leadEmail, string date)
    returns gcalendar:FreeBusyResponse|error {

    string timeMin = date + "T00:00:00Z";
    string timeMax = date + "T23:59:59Z";

    gcalendar:FreeBusyRequest request = {
        "timeMin": timeMin,
        "timeMax": timeMax,
        "items": [{id: employeeEmail}, {id: leadEmail}],
        "timeZone": types:UTC
    };

    gcalendar:FreeBusyResponse|gcalendar:Error freeBusyResponse =
        calendar->/freeBusy.post(request);
    if freeBusyResponse is gcalendar:Error {
        log:printError("Error occurred while retrieving busy time periods result: ", freeBusyResponse);
        return freeBusyResponse;
    }
    return freeBusyResponse;
}

# Function to create a F2F google meet event for the given employee and lead.
#
# + employeeEmail - Email of the invoker employee
# + leadEmail - Leads email of the employee
# + request - ScheduleMeetingRequest type
# + return - Return Event type
public isolated function scheduleGoogleMeet(string employeeEmail, string leadEmail,
        types:ScheduleMeetingRequest request) returns gcalendar:Event|error {

    gcalendar:Event payload =
            {
        'start: {
            dateTime: request.startTime,
            timeZone: types:UTC
        },
        end: {
            dateTime: request.endTime,
            timeZone: types:UTC
        },
        summary: request.title,
        description: request.description,
        conferenceData: {
            createRequest: {
                requestId: createUuidForCalendarEvent(),
                conferenceSolutionKey: {
                    'type: "hangoutsMeet"
                }
            }
        },
        attendees: [{email: employeeEmail}, {email: leadEmail}]
    };

    gcalendar:Event|gcalendar:Error eventResult =
        calendar->/calendars/[employeeEmail]/events.post(payload);
    if eventResult is error {
        log:printError("Error occurred while creating the google meet", eventResult);
        return eventResult;
    }
    return eventResult;
}

# Generates a UUID to be used for the calendar event creation.
#
# + return - UUID for calendar event
isolated function createUuidForCalendarEvent() returns string {
    string uuid = uuid:createType4AsString();
    string calendarId = re `-`.replaceAll(uuid, "");
    return calendarId.toLowerAscii();
}
