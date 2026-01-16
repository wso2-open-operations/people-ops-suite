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
import ballerina/time;

# Parses and validates a date string in `YYYY-MM-DD` format and ensures it is not in the future.
#
# + dateStr - Date string in `YYYY-MM-DD` format
# + return - Validated `time:Date` if the input is valid and not in the future; otherwise `()`
isolated function parsePastOrTodayDate(string dateStr) returns time:Date? {
    string trimmed = dateStr.trim();
    if trimmed.length() != 10 || trimmed[4] != "-" || trimmed[7] != "-" {
        return ();
    }

    int|error yearRes  = int:fromString(trimmed.substring(0, 4));
    int|error monthRes = int:fromString(trimmed.substring(5, 7));
    int|error dayRes   = int:fromString(trimmed.substring(8, 10));

    if yearRes is error || monthRes is error || dayRes is error {
        return ();
    }

    int year = yearRes;
    int month = monthRes;
    int day = dayRes;

    time:Date date = { year: year, month: month, day: day };

    if time:dateValidate(date) is time:Error {
        return ();
    }

    time:Civil now = time:utcToCivil(time:utcNow());

    boolean isFuture =
        now.year < date.year ||
        (now.year == date.year && now.month < date.month) ||
        (now.year == date.year && now.month == date.month && now.day < date.day);

    if isFuture {
        return ();
    }

    return date;
}

# Calculates the service length (completed years and months) from the given start date up to today.
#
# + startDateStr - Start date in `YYYY-MM-DD` format
# + return - `ServiceLength` containing completed years and months (or `{ years: 0, months: 0 }` for invalid input)
public isolated function calculateServiceLength(string startDateStr) returns ServiceLength {
    time:Date? startDate = parsePastOrTodayDate(startDateStr);
    if startDate is () {
        return { years: 0, months: 0 };
    }

    time:Civil now = time:utcToCivil(time:utcNow());

    int totalMonths = (now.year - startDate.year) * 12 + (now.month - startDate.month);
    if now.day < startDate.day {
        totalMonths -= 1;
    }

    return {
        years: totalMonths / 12,
        months: totalMonths % 12
    };
}

# Calculates the age in completed years for the given date of birth up to today.
# 
# + dobStr - Date of birth in `YYYY-MM-DD` format
# + return - Age in completed years (or `0` for invalid input)
public isolated function calculateAge(string dobStr) returns int {
    time:Date? dob = parsePastOrTodayDate(dobStr);
    if dob is () {
        return 0;
    }

    time:Civil now = time:utcToCivil(time:utcNow());

    int age = now.year - dob.year;
    if (now.month < dob.month) || (now.month == dob.month && now.day < dob.day) {
        age -= 1;
    }

    return age;
}
