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
import ballerina/http;
import ballerina/log;

public configurable string fromEmailAddress = ?;
public configurable string[] adminEmailList = ?;

# Sends a notification email to the admin group for a visit that was forcefully
# completed by the scheduler because the reception did not complete it.
#
# + visit - Details of the completed visit
# + return - An error if sending fails
public function sendCompletionEmail(CompletedVisitInfo visit) returns error? {
    string template = buildEmailBody(visit);

    http:Response|http:ClientError response = emailClient->/send\-email.post(<EmailPayload>{
        to: adminEmailList,
        'from: fromEmailAddress,
        subject: SCHEDULER_COMPLETION_SUBJECT,
        template: template
    });

    if response is http:ClientError {
        string msg = string `Client error while sending completion email for visit ${visit.id}`;
        log:printError(msg, response);
        return error(msg, response);
    }

    if response.statusCode != http:STATUS_OK {
        string msg = string `Email service rejected completion email for visit ${visit.id}, status: ${response.statusCode}`;
        log:printError(msg);
        return error(msg);
    }
}

isolated function buildEmailBody(CompletedVisitInfo visit) returns string {
    string visitorName = visit.visitorName;
    string visitDate = visit.visitDate;
    string timeOfEntry = visit.timeOfEntry ?: "N/A";
    string timeOfDeparture = visit.timeOfDeparture ?: "N/A";
    string whomTheyMeet = visit.whomTheyMeet ?: "N/A";
    string passNumber = visit.passNumber ?: "N/A";
    string companyName = visit.companyName ?: "N/A";
    string purposeOfVisit = visit.purposeOfVisit ?: "N/A";

    return string `
        <html>
        <body style="font-family: 'Roboto', Helvetica, sans-serif; color: #465868;">
            <h2 style="color: #d9534f;">Visit Auto-Completed by Scheduler</h2>
            <p>
                The following visit was <strong>forcefully completed by the scheduler</strong>
                because it was not completed by the reception before the scheduled departure time.
            </p>
            <table style="border-collapse: collapse; width: 100%;">
                <tr>
                    <td style="padding: 8px; font-weight: bold;">Visit ID</td>
                    <td style="padding: 8px;">${visit.id}</td>
                </tr>
                <tr style="background-color: #f9f9f9;">
                    <td style="padding: 8px; font-weight: bold;">Visitor Name</td>
                    <td style="padding: 8px;">${visitorName}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; font-weight: bold;">Company</td>
                    <td style="padding: 8px;">${companyName}</td>
                </tr>
                <tr style="background-color: #f9f9f9;">
                    <td style="padding: 8px; font-weight: bold;">Visit Date</td>
                    <td style="padding: 8px;">${visitDate}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; font-weight: bold;">Entry Time (UTC)</td>
                    <td style="padding: 8px;">${timeOfEntry}</td>
                </tr>
                <tr style="background-color: #f9f9f9;">
                    <td style="padding: 8px; font-weight: bold;">Scheduled Departure (UTC)</td>
                    <td style="padding: 8px;">${timeOfDeparture}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; font-weight: bold;">Whom They Meet</td>
                    <td style="padding: 8px;">${whomTheyMeet}</td>
                </tr>
                <tr style="background-color: #f9f9f9;">
                    <td style="padding: 8px; font-weight: bold;">Pass Number</td>
                    <td style="padding: 8px;">${passNumber}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; font-weight: bold;">Purpose of Visit</td>
                    <td style="padding: 8px;">${purposeOfVisit}</td>
                </tr>
            </table>
            <p style="margin-top: 20px; color: #888; font-size: 13px;">
                This is an automated notification from the Visitor Management Scheduler.
            </p>
        </body>
        </html>
    `;
}
