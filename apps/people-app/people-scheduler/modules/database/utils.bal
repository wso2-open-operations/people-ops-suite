// Copyright (c) 2026 WSO2 LLC. (https://www.wso2.com).
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

import ballerina/log;
import ballerina/time;

# Where HR works. Used for an employee whose work location has no usable timezone, and for
# the date the summary emails are headed with.
public const string DEFAULT_TIME_ZONE = "Asia/Colombo";

# The calendar date it is in a timezone at a given moment.
#
# + timeZone - IANA timezone name, e.g. "Asia/Colombo"
# + now - The moment to read the date at
# + return - The date in YYYY-MM-DD form, or nil when the timezone is not one the runtime knows
public isolated function dateIn(string timeZone, time:Utc now) returns string? {
    // Trapped: getZone panics on a name it does not know rather than returning nil, and one
    // mistyped timezone must not stop the sweep for everyone else.
    time:Zone?|error zone = trap time:getZone(timeZone);
    if zone !is time:Zone {
        return ();
    }
    time:Civil civil = zone.utcToCivil(now);
    return string `${civil.year}-${civil.month < 10 ? "0" : ""}${civil.month}-${civil.day < 10 ? "0" : ""}${civil.day}`;
}

# Today's date where an employee works.
#
# A location with no timezone, or one the runtime does not recognise, falls back to
# DEFAULT_TIME_ZONE so the employee still moves on, and is logged so the gap gets fixed.
#
# + employeeId - External employee ID, for the warning
# + timeZone - Timezone of the employee's work location, if it has one
# + now - The moment to read the date at
# + return - The date in YYYY-MM-DD form
isolated function employeeToday(string employeeId, string? timeZone, time:Utc now) returns string {
    if timeZone is string {
        string? date = dateIn(timeZone, now);
        if date is string {
            return date;
        }
    }
    log:printWarn("Work location has no usable timezone; using the default",
            employeeId = employeeId, timeZone = timeZone, defaultTimeZone = DEFAULT_TIME_ZONE);
    return dateIn(DEFAULT_TIME_ZONE, now) ?: time:utcToString(now).substring(0, 10);
}

# The Marked leavers whose final day is over where they work.
#
# Over means the day after it has begun: a leaver is still employed on their final day, so
# they leave at the local midnight that ends it.
#
# + candidates - Marked leavers whose final day could be over somewhere
# + now - The moment the sweep runs
# + return - The leavers due to become Left, in candidate order
isolated function dueLeavers(LeaverTransition[] candidates, time:Utc now) returns LeaverTransition[] =>
    from LeaverTransition candidate in candidates
    where candidate.finalDayOfEmployment < employeeToday(candidate.employeeId, candidate.timeZone, now)
    select candidate;

# The New joiners whose start date has begun where they work.
#
# + candidates - New joiners whose start date could have begun somewhere
# + now - The moment the sweep runs
# + return - The joiners due to become Active, in candidate order
isolated function dueJoiners(JoinerActivation[] candidates, time:Utc now) returns JoinerActivation[] =>
    from JoinerActivation candidate in candidates
    where candidate.startDate <= employeeToday(candidate.employeeId, candidate.timeZone, now)
    select candidate;

# The scheduled changes whose effective date has begun where the employee works.
#
# + candidates - Pending changes whose effective date could have begun somewhere
# + now - The moment the sweep runs
# + return - The changes due to be applied, in candidate order
isolated function dueScheduledChanges(ScheduledChange[] candidates, time:Utc now) returns ScheduledChange[] =>
    from ScheduledChange candidate in candidates
    where candidate.effectiveDate <= employeeToday(candidate.employeeId, candidate.timeZone, now)
    select candidate;
