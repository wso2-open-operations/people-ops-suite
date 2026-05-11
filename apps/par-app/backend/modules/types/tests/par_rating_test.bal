// Copyright (c) 2024, WSO2 LLC. (http://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.
import ballerina/constraint;
import ballerina/test;

ParRatingModify parRatingModifyTemplate = {
    parRating: "SUCESSFUL",
    parSpecialRating: "N/A",
    parEmployeeComment: "U2FtcGxlIGNvbW1lbnQ=",
    parEmployeeStatus: PENDING,
    parLeadComment: "U2FtcGxlIGNvbW1lbnQ=",
    parLeadStatus: PENDING,
    parF2fStatus: PENDING,
    parEmployeeAcceptanceStatus: PENDING,
    parEmployeeAcceptanceComment: "U2FtcGxlIGNvbW1lbnQ=",
    parAdminComment: "U2FtcGxlIGNvbW1lbnQ="
};

function validateAndCompareReturnedError_InvalidStringForParRatingModify(ParRatingModify parRating, string fieldName) {
    ParRatingModify|error result = constraint:validate(parRating, ParRatingModify);
    if result is error {
        test:assertEquals(result.message(),
            string `The ${fieldName} should be a non-empty string with printable characters.`);
    } else {
        test:assertFail(string `Error was expected but was not returned for invalid ${fieldName}."`);
    }
}

function validateAndCompareReturnedError_InvalidBase64StringForParRatingModify(ParRatingModify parRating,
        string fieldName) {
    ParRatingModify|error result = constraint:validate(parRating, ParRatingModify);
    if result is error {
        test:assertEquals(result.message(), string `The ${fieldName} should be a non-empty base64 string.`);
    } else {
        test:assertFail(string `Error was expected but was not returned for invalid ${fieldName}."`);
    }
}

@test:Config
function testValidateParRating_ForEmptyParRating() {
    ParRatingModify parRating = {
        parRating: ""
    };
    validateAndCompareReturnedError_InvalidStringForParRatingModify(parRating, "parRating");
}

@test:Config
function testValidateParRating_ForEmptyParSpecialRating() {
    ParRatingModify parRating = {
        parSpecialRating: ""
    };
    validateAndCompareReturnedError_InvalidStringForParRatingModify(parRating, "parSpecialRating");
}

@test:Config
function testValidateParRating_ForEmptyParEmployeeComment() {
    ParRatingModify parRating = {
        parEmployeeComment: ""
    };
    validateAndCompareReturnedError_InvalidBase64StringForParRatingModify(parRating, "parEmployeeComment");
}

@test:Config
function testValidateParRating_ForEmptyParLeadComment() {
    ParRatingModify parRating = {
        parLeadComment: ""
    };
    validateAndCompareReturnedError_InvalidBase64StringForParRatingModify(parRating, "parLeadComment");
}

@test:Config
function testValidateParRating_ForEmptyParEmployeeAcceptanceComment() {
    ParRatingModify parRating = {
        parEmployeeAcceptanceComment: ""
    };
    validateAndCompareReturnedError_InvalidBase64StringForParRatingModify(parRating, "parEmployeeAcceptanceComment");
}

@test:Config
function testValidateParRating_ForEmptyParAdminComment() {
    ParRatingModify parRating = {
        parAdminComment: ""
    };
    validateAndCompareReturnedError_InvalidBase64StringForParRatingModify(parRating, "parAdminComment");
}

@test:Config
function testValidateParRatingModify_ForLead_WithEmployeeComment() {
    ParRatingModify parRating = {
        parEmployeeComment: "Some comment."
    };
    error? result = checkForModifiableFields(parRating, true, false);
    if result is error {
        test:assertEquals(result.message(), "Leads are not allowed to modify the employee comment.");
    } else {
        test:assertFail("Error was expected but was not returned.");
    }
}

@test:Config
function testValidateParRatingModify_ForLead_WithEmployeeStatus() {
    ParRatingModify parRating = {
        parEmployeeStatus: DRAFT
    };
    error? result = checkForModifiableFields(parRating, true, false);
    if result is error {
        test:assertEquals(result.message(), "Leads are not allowed to modify the employee status.");
    } else {
        test:assertFail("Error was expected but was not returned.");
    }
}

@test:Config
function testValidateParRatingModify_ForLead_WithEmployeeAcceptanceStatus() {
    ParRatingModify parRating = {
        parEmployeeAcceptanceStatus: ACCEPTED
    };
    error? result = checkForModifiableFields(parRating, true, false);
    if result is error {
        test:assertEquals(result.message(), "Leads are not allowed to modify the employee acceptance status.");
    } else {
        test:assertFail("Error was expected but was not returned.");
    }
}

@test:Config
function testValidateParRatingModify_ForLead_WithEmployeeAcceptanceComment() {
    ParRatingModify parRating = {
        parEmployeeAcceptanceComment: "Some comment."
    };
    error? result = checkForModifiableFields(parRating, true, false);
    if result is error {
        test:assertEquals(result.message(), "Leads are not allowed to modify the employee acceptance comment.");
    } else {
        test:assertFail("Error was expected but was not returned.");
    }
}

@test:Config
function testValidateParRatingModify_ForLead_WithAdminComment() {
    ParRatingModify parRating = {
        parAdminComment: "Some comment."
    };
    error? result = checkForModifiableFields(parRating, true, false);
    if result is error {
        test:assertEquals(result.message(), "Leads are not allowed to modify the admin comment.");
    } else {
        test:assertFail("Error was expected but was not returned.");
    }
}

@test:Config
function testValidateParRatingModify_ForEmployee_WithParRating() {
    ParRatingModify parRating = {
        parRating: "Some Rating"
    };
    error? result = checkForModifiableFields(parRating, false, true);
    if result is error {
        test:assertEquals(result.message(), "Employees are not allowed to modify the PAR rating.");
    } else {
        test:assertFail("Error was expected but was not returned.");
    }
}

@test:Config
function testValidateParRatingModify_ForEmployee_WithParSpecialRating() {
    ParRatingModify parRating = {
        parSpecialRating: "Some Rating"
    };
    error? result = checkForModifiableFields(parRating, false, true);
    if result is error {
        test:assertEquals(result.message(), "Employees are not allowed to modify the special rating.");
    } else {
        test:assertFail("Error was expected but was not returned.");
    }
}

@test:Config
function testValidateParRatingModify_ForEmployee_WithLeadComment() {
    ParRatingModify parRating = {
        parLeadComment: "Some comment."
    };
    error? result = checkForModifiableFields(parRating, false, true);
    if result is error {
        test:assertEquals(result.message(), "Employees are not allowed to modify the lead comment.");
    } else {
        test:assertFail("Error was expected but was not returned.");
    }
}

@test:Config
function testValidateParRatingModify_ForEmployee_WithLeadStatus() {
    ParRatingModify parRating = {
        parLeadStatus: DRAFT
    };
    error? result = checkForModifiableFields(parRating, false, true);
    if result is error {
        test:assertEquals(result.message(), "Employees are not allowed to modify the lead status.");
    } else {
        test:assertFail("Error was expected but was not returned.");
    }
}

@test:Config
function testValidateParRatingModify_ForEmployee_WithAdminComment() {
    ParRatingModify parRating = {
        parAdminComment: "Some comment."
    };
    error? result = checkForModifiableFields(parRating, false, true);
    if result is error {
        test:assertEquals(result.message(), "Employees are not allowed to modify the admin comment.");
    } else {
        test:assertFail("Error was expected but was not returned.");
    }
}

@test:Config
function testValidateParRatingModify_ForAdmins() {
    ParRatingModify parRating = {
        parEmployeeComment: "Some comment.",
        parEmployeeStatus: DRAFT,
        parEmployeeAcceptanceStatus: ACCEPTED,
        parEmployeeAcceptanceComment: "Some comment.",
        parRating: "Some Rating",
        parSpecialRating: "Some Rating",
        parLeadComment: "Some comment.",
        parLeadStatus: DRAFT,
        parAdminComment: "Some comment."
    };
    error? result = checkForModifiableFields(parRating, false, false);
    if result != () {
        test:assertFail("Error was not expected but was returned. Error: " + result.message());
    }
}

@test:Config
function testSanitizeParRating_ForEmployee() {
    ParRating parRating = getDefaultParRating();
    ParRating resultParRating = sanitizeParRating(parRating.clone(), false, true);
    parRating.parRating = ();
    parRating.parSpecialRating = ();
    parRating.parLeadComment = ();
    parRating.parAdminComment = ();
    test:assertEquals(resultParRating, parRating, "Expected and returned PAR rating are not equal.");
}

@test:Config
function testSanitizeParRating_ForLead() {
    ParRating parRating = getDefaultParRating();
    ParRating resultParRating = sanitizeParRating(parRating.clone(), true, false);
    parRating.parEmployeeComment = ();
    parRating.parEmployeeAcceptanceComment = ();
    parRating.parAdminComment = ();
    test:assertEquals(resultParRating, parRating, "Expected and returned PAR rating are not equal.");
}

@test:Config
function testSanitizeParRating_ForAdin() {
    ParRating parRating = getDefaultParRating();
    ParRating resultParRating = sanitizeParRating(parRating.clone(), false, false);
    test:assertEquals(resultParRating, parRating, "Expected and returned PAR rating are not equal.");
}

function getDefaultParRating() returns ParRating => {
    parRatingId: 1,
    parCycleId: 1,
    parEmployeeEmail: "someone@wso2.com",
    parCompany: "WSO2 Lanka",
    parLocation: "Sri Lanka",
    parBusinessUnit: "Corporate",
    parDepartment: "ENGINEERING",
    parTeam: "API MANAGEMENT",
    parSubTeam: "SOME SUB TEAM",
    parLeadEmail: "apim-lead@wso2.com",
    parRating: "Successful",
    parSpecialRating: "TOP5P",
    parEmployeeComment: "Employee omment",
    parEmployeeStatus: PENDING,
    parLeadComment: "Lead comment",
    parLeadStatus: PENDING,
    parF2fStatus: PENDING,
    parEmployeeAcceptanceStatus: PENDING,
    parEmployeeAcceptanceComment: "Employee acceptance comment",
    parAdminComment: "Admin comment"
};
