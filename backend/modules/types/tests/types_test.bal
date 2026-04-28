// Copyright (c) 2024, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.
import ballerina/constraint;
import ballerina/test;

ParCycleCreate parCycleTemplate = {
    parCycleName: "2024 H1",
    parCycleStartDate: "2021-01-01",
    parCycleEndDate: "2021-06-30",
    parEvaluationStartDate: "2021-06-30",
    parEvaluationEndDate: "2021-07-15",
    parEmployeeDeadline: "2021-07-10",
    parLeadDeadline: "2021-07-12",
    parSpecialRatingDeadline: "2021-07-10",
    parF2FDeadline: "2021-07-10",
    parThreeSixtyRatingDeadline: "2021-07-10",
    parCycleConfigurations: {
        employeeParQuestion: "Sm9iIEV4ZWN1dGlvbiwgVGVhbSBXb3JrLCBDb21tdW5pY2F0aW9uLCBMZWFkZXJzaGlw",
        threeSixtyReviewQuestion: "V2hhdCBhcmUgdGhlIHN0cmVuZ3RocyBvZiB0aGlzIEluZGl2aWR1YWw/IGFuZCB3aGF0IGlzIHlvdXIgZmVlZGJhY2sgZm9yIGltcHJvdmVtZW50cz8=",
        parRatings: [
            "Success",
            "Needs Improvements",
            "Not Rated",
            "HR Review",
            "Leave"
        ],
        threeSixtyReviewRatings: [
            "Below Expectations",
            "Meets Expectations",
            "Exceeds Expectation"
        ]
    }
};

function validateAndCompareReturnedErrorForInvalidString(ParCycleCreate parCycle, string fieldName) {
    ParCycleCreate|error result = constraint:validate(parCycle, ParCycleCreate);
    test:assertTrue(result is error, string `Error was expected but was not returned for invalid ${fieldName}.`);
    test:assertEquals((<error>result).message(), string `The ${fieldName} should be a non-empty string with printable characters.`);
}

function validateAndCompareReturnedErrorForInvalidBase64String(ParCycleCreate parCycle, string fieldName) {
    ParCycleCreate|error result = constraint:validate(parCycle, ParCycleCreate);
    test:assertTrue(result is error, string `Error was expected but was not returned for invalid ${fieldName}.`);
    test:assertEquals((<error>result).message(), string `The ${fieldName} should be a non-empty base64 string.`);
}

function validateAndCompareReturnedErrorForInvalidDate(ParCycleCreate parCycle, string fieldName) {
    ParCycleCreate|error result = constraint:validate(parCycle, ParCycleCreate);
    test:assertTrue(result is error, string `Error was expected but was not returned for invalid ${fieldName}.`);
    test:assertEquals((<error>result).message(), string `The ${fieldName} should be in the format 'YYYY-MM-DD'.`);
}

function validateAndCompareReturnedErrorForInvalidStringArray(ParCycleCreate parCycle, string fieldName) {

    ParCycleCreate|error result = constraint:validate(parCycle, ParCycleCreate);
    if result is error {
        test:assertEquals((<error>result).message(), string `The ${fieldName} should be a non-empty string array.`);
    } else {
        test:assertFail(string `Error was expected but was not returned for invalid ${fieldName}."`);
    }
}

@test:Config
function testValidateParCycleFunction_ForEmptyParCycleName() {

    ParCycleCreate parCycle = parCycleTemplate.clone();
    parCycle.parCycleName = "";
    validateAndCompareReturnedErrorForInvalidString(parCycle, "parCycleName");
}

@test:Config
function testValidateParCycleFunction_ForEmptyAndInvalidParCycleStartDate() {

    ParCycleCreate parCycle = parCycleTemplate.clone();
    parCycle.parCycleStartDate = "";
    validateAndCompareReturnedErrorForInvalidDate(parCycle, "parCycleStartDate");
    parCycle.parCycleStartDate = "20211301";
    validateAndCompareReturnedErrorForInvalidDate(parCycle, "parCycleStartDate");
}

@test:Config
function testValidateParCycleFunction_ForEmptyAndInvalidParCycleEndDate() {

    ParCycleCreate parCycle = parCycleTemplate.clone();
    parCycle.parCycleEndDate = "";
    validateAndCompareReturnedErrorForInvalidDate(parCycle, "parCycleEndDate");
    parCycle.parCycleEndDate = "20211301";
    validateAndCompareReturnedErrorForInvalidDate(parCycle, "parCycleEndDate");
}

@test:Config
function testValidateParCycleFunction_ForEmptyAndInvalidParEvaluationStartDate() {

    ParCycleCreate parCycle = parCycleTemplate.clone();
    parCycle.parEvaluationStartDate = "";
    validateAndCompareReturnedErrorForInvalidDate(parCycle, "parEvaluationStartDate");
    parCycle.parEvaluationStartDate = "20211301";
    validateAndCompareReturnedErrorForInvalidDate(parCycle, "parEvaluationStartDate");
}

@test:Config
function testValidateParCycleFunction_ForEmptyAndInvalidParEvaluationEndDate() {

    ParCycleCreate parCycle = parCycleTemplate.clone();
    parCycle.parEvaluationEndDate = "";
    validateAndCompareReturnedErrorForInvalidDate(parCycle, "parEvaluationEndDate");
    parCycle.parEvaluationEndDate = "20211301";
    validateAndCompareReturnedErrorForInvalidDate(parCycle, "parEvaluationEndDate");
}

@test:Config
function testValidateParCycleFunction_ForEmptyAndInvalidParSpecialRatingDeadline() {

    ParCycleCreate parCycle = parCycleTemplate.clone();
    parCycle.parSpecialRatingDeadline = "";
    validateAndCompareReturnedErrorForInvalidDate(parCycle, "parSpecialRatingDeadline");
    parCycle.parSpecialRatingDeadline = "20211301";
    validateAndCompareReturnedErrorForInvalidDate(parCycle, "parSpecialRatingDeadline");
}

@test:Config
function testValidateParCycleFunction_ForEmptyAndInvalidThreeSixtyRatingDeadline() {

    ParCycleCreate parCycle = parCycleTemplate.clone();
    parCycle.parThreeSixtyRatingDeadline = "";
    validateAndCompareReturnedErrorForInvalidDate(parCycle, "parThreeSixtyRatingDeadline");
    parCycle.parThreeSixtyRatingDeadline = "20211301";
    validateAndCompareReturnedErrorForInvalidDate(parCycle, "parThreeSixtyRatingDeadline");
}

@test:Config
function testValidateParCycleFunction_ForEmptyAndInvalidParEmployeeDeadline() {

    ParCycleCreate parCycle = parCycleTemplate.clone();
    parCycle.parEmployeeDeadline = "";
    validateAndCompareReturnedErrorForInvalidDate(parCycle, "parEmployeeDeadline");
    parCycle.parEmployeeDeadline = "20211301";
    validateAndCompareReturnedErrorForInvalidDate(parCycle, "parEmployeeDeadline");
}

@test:Config
function testValidateParCycleFunction_ForEmptyAndInvalidParLeadDeadline() {

    ParCycleCreate parCycle = parCycleTemplate.clone();
    parCycle.parLeadDeadline = "";
    validateAndCompareReturnedErrorForInvalidDate(parCycle, "parLeadDeadline");
    parCycle.parLeadDeadline = "20211301";
    validateAndCompareReturnedErrorForInvalidDate(parCycle, "parLeadDeadline");
}

@test:Config
function testValidateParCycleFunction_ForEmptyParCycleCofiguration_EmployeeParQuestion() {

    ParCycleCreate parCycle = parCycleTemplate.clone();
    parCycle.parCycleConfigurations.employeeParQuestion = "";
    validateAndCompareReturnedErrorForInvalidString(parCycle, "employeeParQuestion");
}

@test:Config
function testValidateParCycleFunction_ForEmptyParCycleCofiguration_EmployeeParQuestion_WithSpaces() {

    ParCycleCreate parCycle = parCycleTemplate.clone();
    parCycle.parCycleConfigurations.employeeParQuestion = "          ";
    validateAndCompareReturnedErrorForInvalidString(parCycle, "employeeParQuestion");
}

@test:Config
function testValidateParCycleFunction_ForEmptyParCycleCofiguration_ThreeSixtyReviewQuestion() {

    ParCycleCreate parCycle = parCycleTemplate.clone();
    parCycle.parCycleConfigurations.threeSixtyReviewQuestion = "";
    validateAndCompareReturnedErrorForInvalidString(parCycle, "threeSixtyReviewQuestion");
}

@test:Config
function testValidateParCycleFunction_ForEmptyParCycleCofiguration_parRatings() {

    ParCycleCreate parCycle = parCycleTemplate.clone();
    parCycle.parCycleConfigurations.parRatings = [];
    validateAndCompareReturnedErrorForInvalidStringArray(parCycle, "parRatings");
}

@test:Config
function testValidateParCycleFunction_ForEmptyParCycleCofiguration_threeSixtyReviewRatings() {

    ParCycleCreate parCycle = parCycleTemplate.clone();
    parCycle.parCycleConfigurations.threeSixtyReviewRatings = [];
    validateAndCompareReturnedErrorForInvalidStringArray(parCycle, "threeSixtyReviewRatings");
}

function getDefaultDatesForParCycle() returns ParCycleDates|error {
    return {
        parCycleStartDate: "2022-01-01",
        parCycleEndDate: "2022-06-30",
        parEvaluationStartDate: "2022-06-01",
        parEvaluationEndDate: "2022-07-15",
        parSpecialRatingDeadline: "2022-06-15",
        parF2FDeadline: "2022-06-30",
        parThreeSixtyRatingDeadline: "2022-06-30",
        parEmployeeDeadline: "2022-06-30",
        parLeadDeadline: "2022-07-12"
    };
}

@test:Config
function testValidateDateRangeFunction_ForDifferentDateRangesForParCycleStartEndDates() returns error? {

    ParCycleDates parCycleDates = check getDefaultDatesForParCycle();

    // Same date for start and end date
    parCycleDates.parCycleStartDate = "2022-01-01";
    parCycleDates.parCycleEndDate = "2022-01-01";

    error[] err = validateDates(parCycleDates);
    if err.length() > 0 {
        test:assertEquals((<error>err[0]).message(), "The 'parCycleStartDate' should be earlier than 'parCycleEndDate'");
    } else {
        test:assertFail("Error should be returned for invalid date range");
    }

    // End date earlier than start date
    parCycleDates.parCycleStartDate = "2022-01-01";
    parCycleDates.parCycleEndDate = "2021-12-31";

    err = validateDates(parCycleDates);
    if err.length() > 0 {
        test:assertEquals((<error>err[0]).message(), "The 'parCycleStartDate' should be earlier than 'parCycleEndDate'");
    } else {
        test:assertFail("Error should be returned for invalid date range");
    }

    // Valid date range
    parCycleDates.parCycleStartDate = "2022-01-01";
    parCycleDates.parCycleEndDate = "2022-06-30";

    err = validateDates(parCycleDates);
    if err.length() > 0 {
        test:assertFail("No error should be returned for valid date range. Error: " + err[0].message());
    }
}

@test:Config
function testValidateDateRangeFunction_ForDifferentDateRangesForParCycleEvaluationStartEndDates() returns error? {

    ParCycleDates parCycleDates = check getDefaultDatesForParCycle();

    // Same date for start and end date
    parCycleDates.parEvaluationStartDate = "2022-01-01";
    parCycleDates.parEvaluationEndDate = "2022-01-01";

    error[] err = validateDates(parCycleDates);
    if err.length() > 0 {
        test:assertEquals((<error>err[0]).message(), "The 'parEvaluationStartDate' should be earlier than 'parEvaluationEndDate'");
    } else {
        test:assertFail("Error should be returned for invalid date range");
    }

    // End date earlier than start date
    parCycleDates.parEvaluationStartDate = "2022-01-01";
    parCycleDates.parEvaluationEndDate = "2021-12-31";

    err = validateDates(parCycleDates);
    if err.length() > 0 {
        test:assertEquals((<error>err[0]).message(), "The 'parEvaluationStartDate' should be earlier than 'parEvaluationEndDate'");
    } else {
        test:assertFail("Error should be returned for invalid date range");
    }

    // Valid date range
    parCycleDates.parEvaluationStartDate = "2022-01-01";
    parCycleDates.parEvaluationEndDate = "2022-07-15";

    err = validateDates(parCycleDates);
    if err.length() > 0 {
        test:assertFail("No error should be returned for valid date range. Error: " + err[0].message());
    }
}

@test:Config
function testValidateDateRangeFunction_ForDifferentDateForParSpecialRatingDeadline() returns error? {

    ParCycleDates parCycleDates = check getDefaultDatesForParCycle();

    parCycleDates.parEvaluationStartDate = "2022-06-01";
    parCycleDates.parEvaluationEndDate = "2022-07-15";

    // Same date of the evaluation start date
    parCycleDates.parSpecialRatingDeadline = "2022-06-01";

    error[] err = validateDates(parCycleDates);
    if err.length() > 0 {
        test:assertEquals((<error>err[0]).message(), "The 'parSpecialRatingDeadline' must be set between 'parEvaluationStartDate' and 'parEvaluationEndDate'");
    } else {
        test:assertFail("Error should be returned for invalid date range");
    }

    // A date earlier than the evaluation start date
    parCycleDates.parSpecialRatingDeadline = "2022-05-31";

    err = validateDates(parCycleDates);
    if err.length() > 0 {
        test:assertEquals((<error>err[0]).message(), "The 'parSpecialRatingDeadline' must be set between 'parEvaluationStartDate' and 'parEvaluationEndDate'");
    } else {
        test:assertFail("Error should be returned for invalid date range");
    }

    // A date later than the evaluation end date
    parCycleDates.parSpecialRatingDeadline = "2022-07-16";

    err = validateDates(parCycleDates);
    if err.length() > 0 {
        test:assertEquals((<error>err[0]).message(), "The 'parSpecialRatingDeadline' must be set between 'parEvaluationStartDate' and 'parEvaluationEndDate'");
    } else {
        test:assertFail("Error should be returned for invalid date range");
    }

    // A valid date for the special rating deadline
    parCycleDates.parSpecialRatingDeadline = "2022-06-15";

    err = validateDates(parCycleDates);
    if err.length() > 0 {
        test:assertFail("No error should be returned for valid date range. Error: " + err[0].message());
    }
}

@test:Config
function testValidateDateRangeFunction_ForDifferentDateForParEmployeeDeadline() returns error? {

    ParCycleDates parCycleDates = check getDefaultDatesForParCycle();

    parCycleDates.parEvaluationStartDate = "2022-06-01";
    parCycleDates.parEvaluationEndDate = "2022-07-15";

    // Same date of the evaluation start date
    parCycleDates.parEmployeeDeadline = "2022-06-01";

    error[] err = validateDates(parCycleDates);
    if err.length() > 0 {
        test:assertEquals((<error>err[0]).message(), "The 'parEmployeeDeadline' must be set between 'parEvaluationStartDate' and 'parEvaluationEndDate'");
    } else {
        test:assertFail("Error should be returned for invalid date range");
    }

    // A date earlier than the evaluation start date
    parCycleDates.parEmployeeDeadline = "2022-05-31";

    err = validateDates(parCycleDates);
    if err.length() > 0 {
        test:assertEquals((<error>err[0]).message(), "The 'parEmployeeDeadline' must be set between 'parEvaluationStartDate' and 'parEvaluationEndDate'");
    } else {
        test:assertFail("Error should be returned for invalid date range");
    }

    // A date later than the evaluation end date
    parCycleDates.parEmployeeDeadline = "2022-07-16";

    err = validateDates(parCycleDates);
    if err.length() > 0 {
        test:assertEquals((<error>err[0]).message(), "The 'parEmployeeDeadline' must be set between 'parEvaluationStartDate' and 'parEvaluationEndDate'");
    } else {
        test:assertFail("Error should be returned for invalid date range");
    }

    // A valid date for the employee deadline
    parCycleDates.parEmployeeDeadline = "2022-06-15";

    err = validateDates(parCycleDates);
    if err.length() > 0 {
        test:assertFail("No error should be returned for valid date range. Error: " + err[0].message());
    }
}

@test:Config
function testValidateDateRangeFunction_ForDifferentDateForParLeadDeadline() returns error? {

    ParCycleDates parCycleDates = check getDefaultDatesForParCycle();

    parCycleDates.parEvaluationStartDate = "2022-06-01";
    parCycleDates.parEvaluationEndDate = "2022-07-15";
    parCycleDates.parEmployeeDeadline = "2022-06-25";

    // Same date of the evaluation start date
    parCycleDates.parLeadDeadline = "2022-06-01";

    error[] err = validateDates(parCycleDates);
    if err.length() > 0 {
        test:assertEquals((<error>err[0]).message(), "The 'parLeadDeadline' must be set between 'parEvaluationStartDate' and 'parEvaluationEndDate'");
    } else {
        test:assertFail("Error should be returned for invalid date range");
    }

    // A date earlier than the evaluation start date
    parCycleDates.parLeadDeadline = "2022-05-31";

    err = validateDates(parCycleDates);
    if err.length() > 0 {
        test:assertEquals((<error>err[0]).message(), "The 'parLeadDeadline' must be set between 'parEvaluationStartDate' and 'parEvaluationEndDate'");
    } else {
        test:assertFail("Error should be returned for invalid date range");
    }

    // A date later than the evaluation end date
    parCycleDates.parLeadDeadline = "2022-07-16";

    err = validateDates(parCycleDates);
    if err.length() > 0 {
        test:assertEquals((<error>err[0]).message(), "The 'parLeadDeadline' must be set between 'parEvaluationStartDate' and 'parEvaluationEndDate'");
    } else {
        test:assertFail("Error should be returned for invalid date range");
    }

    // Same date of the employee deadline
    parCycleDates.parLeadDeadline = "2022-06-25";

    err = validateDates(parCycleDates);
    if err.length() > 0 {
        test:assertEquals((<error>err[0]).message(), "The 'parEmployeeDeadline' must be earlier than 'parLeadDeadline'");
    } else {
        test:assertFail("Error should be returned for invalid date range");
    }

    // A date earlier than the employee deadline
    parCycleDates.parLeadDeadline = "2022-06-24";

    err = validateDates(parCycleDates);
    if err.length() > 0 {
        test:assertEquals((<error>err[0]).message(), "The 'parEmployeeDeadline' must be earlier than 'parLeadDeadline'");
    } else {
        test:assertFail("Error should be returned for invalid date range");
    }

    // A valid date for the lead deadline
    parCycleDates.parLeadDeadline = "2022-06-30";

    err = validateDates(parCycleDates);
    if err.length() > 0 {
        test:assertFail("No error should be returned for valid date range. Error: " + err[0].message());
    }
}

@test:Config
function testValidateDateRangeFunction_ForDifferentDateForThreeSixtyDeadline() returns error? {

    ParCycleDates parCycleDates = check getDefaultDatesForParCycle();

    parCycleDates.parEvaluationStartDate = "2022-06-01";
    parCycleDates.parEvaluationEndDate = "2022-07-15";

    // Same date of the evaluation start date
    parCycleDates.parThreeSixtyRatingDeadline = "2022-06-01";

    error[] err = validateDates(parCycleDates);
    if err.length() > 0 {
        test:assertEquals((<error>err[0]).message(), "The 'parThreeSixtyRatingDeadline' must be set between 'parEvaluationStartDate' and 'parEvaluationEndDate'");
    } else {
        test:assertFail("Error should be returned for invalid date range");
    }

    // A date earlier than the evaluation start date
    parCycleDates.parThreeSixtyRatingDeadline = "2022-05-31";

    err = validateDates(parCycleDates);
    if err.length() > 0 {
        test:assertEquals((<error>err[0]).message(), "The 'parThreeSixtyRatingDeadline' must be set between 'parEvaluationStartDate' and 'parEvaluationEndDate'");
    } else {
        test:assertFail("Error should be returned for invalid date range");
    }

    // A date later than the evaluation end date
    parCycleDates.parThreeSixtyRatingDeadline = "2022-07-16";

    err = validateDates(parCycleDates);
    if err.length() > 0 {
        test:assertEquals((<error>err[0]).message(), "The 'parThreeSixtyRatingDeadline' must be set between 'parEvaluationStartDate' and 'parEvaluationEndDate'");
    } else {
        test:assertFail("Error should be returned for invalid date range");
    }

    // A valid date for the employee deadline
    parCycleDates.parThreeSixtyRatingDeadline = "2022-06-15";

    err = validateDates(parCycleDates);
    if err.length() > 0 {
        test:assertFail("No error should be returned for valid date range. Error: " + err[0].message());
    }
}

@test:Config
function testValidateDateFunction_ForInvalidDate() returns error? {
    ParCycleDates parCycleDates = check getDefaultDatesForParCycle();
    parCycleDates.parCycleStartDate = "20220101";

    error[] err = validateDates(parCycleDates);
    if err.length() > 0 {
        test:assertEquals((<error>err[0]).message(), "Invalid date format for the field 'parCycleStartDate'. The date should be in the format 'YYYY-MM-DD'");
    } else {
        test:assertFail("Error should be returned for invalid date range");
    }
}

@test:Config
function testValidateDateFunction_ValidateParSpecialRatingGroupQuota_WhenParCycleIsPendingState() returns error? {
    ParCycle parCycle = getDefaultParCycle();
    error? validateParSpecialRatingGroupQuotaResult = validateParSpecialRatingGroupQuota(parCycle,
            getParSpecialRatingGroupQuota_One().cloneReadOnly(), [1, 2]);
    if validateParSpecialRatingGroupQuotaResult is error {
        test:assertEquals((<error>validateParSpecialRatingGroupQuotaResult).message(),
            "Cannot create special rating quotas when the PAR cycle is not in the PENDING_QUOTA state.");
    } else {
        test:assertFail("Error should be returned for invalid date range");
    }
}

@test:Config
function testValidateDateFunction_ValidateParSpecialRatingGroupQuota_WithWrongQuotaListSize() returns error? {
    ParCycle parCycle = getDefaultParCycle();
    parCycle.parCycleStatus = PENDING_QUOTA;
    error? validateParSpecialRatingGroupQuotaResult = validateParSpecialRatingGroupQuota(parCycle,
            getParSpecialRatingGroupQuota_One().cloneReadOnly(), [1, 2]);
    if validateParSpecialRatingGroupQuotaResult is error {
        test:assertEquals((<error>validateParSpecialRatingGroupQuotaResult).message(),
            "The special rating group quota list size mismatch.");
    } else {
        test:assertFail("Error should be returned for invalid quota list size");
    }
}

@test:Config
function testValidateDateFunction_ValidateParSpecialRatingGroupQuota_NotAllExistingGroupsWereSpecified() returns error? {
    ParCycle parCycle = getDefaultParCycle();
    parCycle.parCycleStatus = PENDING_QUOTA;
    error? validateParSpecialRatingGroupQuotaResult = validateParSpecialRatingGroupQuota(parCycle,
            getParSpecialRatingGroupQuota_One().cloneReadOnly(), [2]);
    if validateParSpecialRatingGroupQuotaResult is error {
        test:assertEquals((<error>validateParSpecialRatingGroupQuotaResult).message(),
            "The special rating group quota not found for the group id 1.");
    } else {
        test:assertFail("Error should be returned when quota is not found for the group id");
    }
}

@test:Config
function testValidateDateFunction_ValidateParSpecialRatingGroupQuota_GroupWithoutACorrespondingQuota() returns error? {
    ParCycle parCycle = getDefaultParCycle();
    parCycle.parCycleStatus = PENDING_QUOTA;
    ParSpecialRatingGroupQuota parSpecialRatingGroupQuotaOne = getParSpecialRatingGroupQuota_One();
    parSpecialRatingGroupQuotaOne.specialRatingQuotas[0].specialRatingQuotaId = 2;
    error? validateParSpecialRatingGroupQuotaResult = validateParSpecialRatingGroupQuota(parCycle,
            parSpecialRatingGroupQuotaOne.cloneReadOnly(), [1]);
    if validateParSpecialRatingGroupQuotaResult is error {
        test:assertEquals((<error>validateParSpecialRatingGroupQuotaResult).message(),
            "The special rating quota not found for the quota id 1.");
    } else {
        test:assertFail("Error should be returned when quota is not found for the quota id");
    }
}

function getDefaultParCycle() returns ParCycle {
    ParCycle requestParCycle = {
        parCycleId: 1,
        parCycleName: "2022 H1",
        parCycleStartDate: "2022-01-01",
        parCycleEndDate: "2022-06-30",
        parEvaluationStartDate: "2022-06-15",
        parEvaluationEndDate: "2022-07-20",
        parEmployeeDeadline: "2022-07-05",
        parLeadDeadline: "2022-07-15",
        parSpecialRatingDeadline: "2022-07-15",
        parF2FDeadline: "2022-07-10",
        parThreeSixtyRatingDeadline: "2022-07-10",
        parCycleStatus: PENDING,
        parCycleConfigurations: {
            employeeParQuestion: "Sm9iIEV4ZWN1dGlvbiwgVGVhbSBXb3JrLCBDb21tdW5pY2F0aW9uLCBMZWFkZXJzaGlw",
            threeSixtyReviewQuestion: "V2hhdCBhcmUgdGhlIHN0cmVuZ3RocyBvZiB0aGlzIEluZGl2aWR1YWw/IGFuZCB3aGF0IGlzIHlvdXIgZmVlZGJhY2sgZm9yIGltcHJvdmVtZW50cz8=",
            parRatings: ["Exceptional", "Successful", "Needs Improvements"],
            threeSixtyReviewRatings: ["Satisfactory", "Unsatisfactory"]
        }
    };
    return requestParCycle;
}

function getParSpecialRatingGroupQuota_One() returns ParSpecialRatingGroupQuota => {
    parSpecialRatingGroups: [
        {
            parCycleId: 1,
            specialRatingGroupId: 1,
            businessUnit: "1",
            department: "1",
            team: "",
            specialRatingQuotaId: 1
        }
    ],
    specialRatingQuotas: [
        {
            specialRatingQuotaId: 1,
            specialRatingQuotaName: "Special Rating Quota 1",
            top5pQuota: 2,
            top20pQuota: 2,
            allocatedLeads: ["test@wso2.com"]
        }
    ]
};
