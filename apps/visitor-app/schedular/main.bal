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
import schedular.visitor;

import ballerina/log;
import ballerina/time;

public function main() returns error? {
    log:printInfo("Scheduler run started");

    visitor:Visit[]|error activeVisits = visitor:fetchActiveVisits();
    if activeVisits is error {
        log:printError("Failed to fetch active visits, aborting run", activeVisits);
        return activeVisits;
    }

    log:printInfo("Active visits fetched", count = activeVisits.length());

    time:Utc now = time:utcNow();

    // foreach visitor:Visit v in activeVisits {
    //     string? departure = v.timeOfDeparture;
    //     if departure is () {
    //         log:printInfo("Skipping visit with no departure time set", id = v.id);
    //         continue;
    //     }

    //     time:Utc|error departureUtc = time:utcFromString(departure + "Z");
    //     if departureUtc is error {
    //         log:printError("Cannot parse timeOfDeparture, skipping", departureUtc, id = v.id, timeOfDeparture = departure);
    //         continue;
    //     }

    //     if time:utcDiffSeconds(now, departureUtc) < 0d {
    //         continue;
    //     }

    //     log:printInfo("Completing expired visit", id = v.id, timeOfDeparture = departure);

    //     error? completeError = visitor:completeVisit(v.id);
    //     if completeError is error {
    //         log:printError("Failed to complete visit, skipping email", completeError, id = v.id);
    //         continue;
    //     }

    //     string visitorName = buildVisitorName(v.firstName, v.lastName);
    //     error? emailError = email:sendCompletionEmail({
    //         id: v.id,
    //         visitorName: visitorName,
    //         visitDate: v.visitDate,
    //         timeOfEntry: v.timeOfEntry,
    //         timeOfDeparture: v.timeOfDeparture,
    //         whomTheyMeet: v.whomTheyMeet,
    //         passNumber: v.passNumber,
    //         companyName: v.companyName,
    //         purposeOfVisit: v.purposeOfVisit
    //     });
    //     if emailError is error {
    //         log:printError("Failed to send completion email", emailError, id = v.id);
    //     }
    // }

    log:printInfo("Scheduler run completed");
}

isolated function buildVisitorName(string? firstName, string? lastName) returns string {
    if firstName is string && lastName is string {
        return firstName + " " + lastName;
    }
    if firstName is string {
        return firstName;
    }
    return "Unknown Visitor";
}
