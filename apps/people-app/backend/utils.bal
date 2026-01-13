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

# Parse a date string in "YYYY-MM-DD" format and validate that it is not in the future.
#
# + dateStr - Input date string in "YYYY-MM-DD" format
# + return - Validated date or () if the input is invalid or a future date
isolated function parsePastOrTodayDate(string dateStr) returns time:Date? {
    string trimmed = dateStr.trim();

    if trimmed.length() != 10 || trimmed[4] != "-" || trimmed[7] != "-" {
        return ();
    }

    int|error yearRes = int:fromString(trimmed.substring(0, 4));
    int|error monthRes = int:fromString(trimmed.substring(5, 7));
    int|error dayRes = int:fromString(trimmed.substring(8, 10));

    if yearRes is error || monthRes is error || dayRes is error {
        return ();
    }

    int year = yearRes;
    int month = monthRes;
    int day = dayRes;

    if year <= 0 || month < 1 || month > 12 {
        return ();
    }

    int maxDay = getDaysInMonth(year, month);
    if day < 1 || day > maxDay {
        return ();
    }

    time:Civil now = time:utcToCivil(time:utcNow());

    boolean isFuture =
        now.year < year ||
        (now.year == year && now.month < month) ||
        (now.year == year && now.month == month && now.day < day);

    if isFuture {
        return ();
    }

    return { year, month, day };
}

# Calculates a human-readable length of service as "X years Y months".
# Returns "N/A" if the input date is invalid or in the future.
#
# + startDateStr - Start date in "YYYY-MM-DD" format
# + return - Human-readable length of service (or "N/A")
public isolated function calculateLengthOfService(string startDateStr) returns string {
    time:Date? startDate = parsePastOrTodayDate(startDateStr);
    if startDate is () {
        return "N/A";
    }

    time:Civil now = time:utcToCivil(time:utcNow());

    int totalMonths = (now.year - startDate.year) * 12 + (now.month - startDate.month);
    if now.day < startDate.day {
        totalMonths -= 1;
    }

    if totalMonths <= 0 {
        return "Less than 1 month";
    }

    int years = totalMonths / 12;
    int months = totalMonths % 12;

    if years > 0 && months > 0 {
        string yearPart = years == 1 ? "1 year" : string `${years} years`;
        string monthPart = months == 1 ? "1 month" : string `${months} months`;
        return string `${yearPart} ${monthPart}`;
    }

    if years > 0 {
        return years == 1 ? "1 year" : string `${years} years`;
    }

    return months == 1 ? "1 month" : string `${months} months`;
}

# Calculates age in completed years based on a date of birth.
#
# + dobStr - Date of birth in "YYYY-MM-DD" format
# + return - Age in years or () if the input is invalid or in the future
public isolated function calculateAge(string dobStr) returns int? {
    time:Date? dob = parsePastOrTodayDate(dobStr);
    if dob is () {
        return ();
    }

    time:Civil now = time:utcToCivil(time:utcNow());

    int age = now.year - dob.year;
    if (now.month < dob.month) || (now.month == dob.month && now.day < dob.day) {
        age -= 1;
    }

    return age < 0 ? () : age;
}

isolated function isLeapYear(int year) returns boolean {
    if year % 400 == 0 {
        return true;
    }
    if year % 100 == 0 {
        return false;
    }
    return year % 4 == 0;
}

isolated function getDaysInMonth(int year, int month) returns int {
    if month == 1 || month == 3 || month == 5 || month == 7 || month == 8 || month == 10 || month == 12 {
        return 31;
    }
    if month == 4 || month == 6 || month == 9 || month == 11 {
        return 30;
    }
    return isLeapYear(year) ? 29 : 28;
}
