// Copyright (c) 2024, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.
import par_app.types;

import ballerina/test;
import ballerina/time;

@test:Config
function testParReminders_AutoReminderEligibility() returns error? {
    time:Utc dateTodayUtc = check time:utcFromString(time:utcToString(time:utcNow()).substring(0, 10) +
        types:DEFAULT_TIME_OF_DAY);
    time:Utc daysToTestUtc = time:utcAddSeconds(dateTodayUtc, 10 * types:SECONDS_FOR_ONE_DAY * -1);

    foreach int i in 0 ... 19 {
        boolean isAutoReminder = isAutoReminderEligible(daysToTestUtc);
        time:Seconds utcDiffSeconds = time:utcDiffSeconds(daysToTestUtc, dateTodayUtc);
        int diffSeconds = check int:fromString(utcDiffSeconds.toString());
        if diffSeconds is types:SECONDS_FOR_ONE_DAY|types:SECONDS_FOR_THREE_DAYS|types:SECONDS_FOR_SEVEN_DAYS {
            test:assertTrue(isAutoReminder,
                string `Auto reminder eligibility should be true for the given date. Test Id:${i}`);
        } else {
            test:assertFalse(isAutoReminder,
                string `Auto reminder eligibility should be false for the given date. Test Id:${i}`);
        }
        daysToTestUtc = time:utcAddSeconds(daysToTestUtc, types:SECONDS_FOR_ONE_DAY * 1);
    }
}
