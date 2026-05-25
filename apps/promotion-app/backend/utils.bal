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
import ballerina/time;

# Checks whether the deadlines are in future with user's timezone offset.
#
# + dbStoredDate - The date stored in database to be checked
# + userTimezoneOffset - User's timezone offset
# + return - Returns true if the date is in the future, false otherwise
public isolated function isFutureDate(string dbStoredDate, decimal userTimezoneOffset) returns boolean|error {
    time:Utc dbDateUtc = check getDateUtc(dbStoredDate);
    // Add 86400 to include that day
    time:Utc dbDateUserLocal = time:utcAddSeconds(dbDateUtc, 86400d + userTimezoneOffset * 3600d);

    time:Utc currentDateUtc = time:utcNow();
    time:Utc currentDateUserLocal = time:utcAddSeconds(currentDateUtc, userTimezoneOffset * 3600);

    return time:utcDiffSeconds(dbDateUserLocal, currentDateUserLocal) >= 0d;
}

# Get date in UTC for the given date.
#
# + date - The date in the format 'yyyy-MM-dd'
# + return - The date in UTC or an error if the operation failed
public isolated function getDateUtc(string date) returns time:Utc|error =>
    time:utcFromString(date + UTC_DEFAULT_STRING);
