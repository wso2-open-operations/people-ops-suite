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
import schedular.email;
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
    string today = string:substring(time:utcToString(now), 0, 10);
    time:Utc oneWeekAgo = time:utcAddSeconds(now, -7.0 * 24.0 * 60.0 * 60.0);

    foreach visitor:Visit visit in activeVisits {
        string? timeOfDeparture = visit.timeOfDeparture;
        if timeOfDeparture is string {
            string departureDate = string:substring(timeOfDeparture, 0, 10);
            if departureDate == today {
                log:printInfo("Force completing visit with today's departure",
                        id = visit.id,
                        visitorName = buildVisitorName(visit.firstName, visit.lastName),
                        timeOfDeparture = timeOfDeparture
                );

                error? completeError = visitor:completeVisit(visit.id);
                if completeError is error {
                    log:printError("Failed to force complete visit, skipping email", completeError, id = visit.id);
                    continue;
                }

                error? emailError = email:sendForceCompleteEmail({
                                                                     id: visit.id,
                                                                     visitorName: buildVisitorName(visit.firstName, visit.lastName),
                                                                     visitDate: visit.visitDate,
                                                                     timeOfEntry: visit.timeOfEntry,
                                                                     timeOfDeparture: visit.timeOfDeparture,
                                                                     whomTheyMeet: visit.whomTheyMeet,
                                                                     passNumber: visit.passNumber,
                                                                     companyName: visit.companyName,
                                                                     purposeOfVisit: visit.purposeOfVisit
                                                                 });
                if emailError is error {
                    log:printError("Failed to send force-complete email", emailError, id = visit.id);
                }
            }
        } else {
            string? entry = visit.timeOfEntry;
            if entry is () {
                continue;
            }

            time:Utc|error entryUtc = time:utcFromString(re ` `.replaceAll(entry, "T") + "Z");
            if entryUtc is error {
                log:printError("Cannot parse timeOfEntry, skipping", entryUtc, id = visit.id, timeOfEntry = entry);
                continue;
            }

            if time:utcDiffSeconds(oneWeekAgo, entryUtc) >= 0d {
                log:printInfo("Visit has no departure and entry was a week ago or more",
                        id = visit.id,
                        visitorName = buildVisitorName(visit.firstName, visit.lastName),
                        timeOfEntry = entry
                );

                error? emailError = email:sendExpiredVisitEmail({
                                                                    id: visit.id,
                                                                    visitorName: buildVisitorName(visit.firstName, visit.lastName),
                                                                    visitDate: visit.visitDate,
                                                                    timeOfEntry: visit.timeOfEntry,
                                                                    timeOfDeparture: (),
                                                                    whomTheyMeet: visit.whomTheyMeet,
                                                                    passNumber: visit.passNumber,
                                                                    companyName: visit.companyName,
                                                                    purposeOfVisit: visit.purposeOfVisit
                                                                });
                if emailError is error {
                    log:printError("Failed to send expired-visit email", emailError, id = visit.id);
                }
            }
        }
    }

    log:printInfo("Scheduler run completed");
}
