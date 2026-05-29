// Copyright (c) 2025, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.
import ballerina/http;
import ballerina/uuid;

# Create an meeting in the calendar.
#
# + createCalendarEventRequest - Create calendar event request
# + creatorEmail - Event creator Email
# + return - JSON response if successful, else an error
public isolated function createMeeting(CreateCalendarEventRequest createCalendarEventRequest,
        string creatorEmail) returns CreateCalendarEventResponse|error {

    // Internal participants validation.
    string:RegExp wso2EmailDomainRegex = re `(?i:^([a-z0-9_\-\.]+)@wso2\.com$)`;
    if !wso2EmailDomainRegex.isFullMatch(createCalendarEventRequest.participant.trim()) {
        return error(string `Invalid WSO2 participant email: ${createCalendarEventRequest.participant}`);
    }

    string updatedDescription = createCalendarEventRequest.description;

    // Format the event payload as required by the Google Calendar API.
    CreateCalendarEventPayload calendarEventPayload = {
        summary: createCalendarEventRequest.title,
        description: updatedDescription,
        'start: {
            dateTime: createCalendarEventRequest.startTime
        },
        end: {
            dateTime: createCalendarEventRequest.endTime
        },
        attendees: [
            {email: createCalendarEventRequest.participant},
            {email: creatorEmail}
        ],
        guestsCanModify: true,
        conferenceData: {
            createRequest: {
                requestId: uuid:createType4AsString(),
                conferenceSolutionKey: {
                    'type: CONFERENCE_SOLUTION_TYPE
                }
            }
        }
    };

    http:Request req = new;
    json calendarEventPayloadJson = calendarEventPayload.toJson();
    req.setPayload(calendarEventPayloadJson);
    http:Response response = check calendarClient->post(string `/events/${creatorEmail}?sendUpdates=all`, req);

    if response.statusCode == 201 {
        json responseJson = check response.getJsonPayload();
        CreateCalendarEventResponse createCalendarEventResponse = check responseJson
        .cloneWithType(CreateCalendarEventResponse);
        return createCalendarEventResponse;
    }

    json? errorResponseBody = check response.getJsonPayload();
    return error(string `Status: ${response.statusCode}, Response: ${errorResponseBody.toJsonString()}`);
}
