// Copyright (c) 2024, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.
import ballerina/test;

@test:Config
function testEmail_IsLimitedOnlyEmails_WithValidEmailInTo() {
    EmailRecord emailRecord = {
        to: ["tom@wso2.com"],
        cc: [],
        subject: "",
        templateId: "",
        contentKeyValPairs: {}
    };
    boolean isLimitedOnlyEmailsResult = isAllowedToSend(emailRecord);
    test:assertTrue(isLimitedOnlyEmailsResult, "Email is limited only to emails.");
}

@test:Config
function testEmail_IsLimitedOnlyEmails_WithValidEmailsInTo() {
    EmailRecord emailRecord = {
        to: ["tom@wso2.com", "bob@wso2.com"],
        cc: [],
        subject: "",
        templateId: "",
        contentKeyValPairs: {}
    };
    boolean isLimitedOnlyEmailsResult = isAllowedToSend(emailRecord);
    test:assertTrue(isLimitedOnlyEmailsResult, "Email is limited only to emails.");
}

@test:Config
function testEmail_IsLimitedOnlyEmails_WithInvalidEmailInTo() {
    EmailRecord emailRecord = {
        to: ["carl@wso2.com"],
        cc: [],
        subject: "",
        templateId: "",
        contentKeyValPairs: {}
    };
    boolean isLimitedOnlyEmailsResult = isAllowedToSend(emailRecord);
    test:assertFalse(isLimitedOnlyEmailsResult, "Email is limited only to emails.");
}

@test:Config
function testEmail_IsLimitedOnlyEmails_WithInvalidEmailsInTo() {
    EmailRecord emailRecord = {
        to: ["carl@wso2.com", "anne@wso2.com"],
        cc: [],
        subject: "",
        templateId: "",
        contentKeyValPairs: {}
    };
    boolean isLimitedOnlyEmailsResult = isAllowedToSend(emailRecord);
    test:assertFalse(isLimitedOnlyEmailsResult, "Email is limited only to emails.");
}

@test:Config
function testEmail_IsLimitedOnlyEmails_WithValidAndInvalidEmailsInTo() {
    EmailRecord emailRecord = {
        to: ["carl@wso2.com", "anne@wso2.com", "tom@wso2.com"],
        cc: [],
        subject: "",
        templateId: "",
        contentKeyValPairs: {}
    };
    boolean isLimitedOnlyEmailsResult = isAllowedToSend(emailRecord);
    test:assertFalse(isLimitedOnlyEmailsResult, "Email is limited only to emails.");
}

@test:Config
function testEmail_IsLimitedOnlyEmails_WithSingleValidEmailInCc() {
    EmailRecord emailRecord = {
        to: [],
        cc: ["tom@wso2.com"],
        subject: "",
        templateId: "",
        contentKeyValPairs: {}
    };
    boolean isLimitedOnlyEmailsResult = isAllowedToSend(emailRecord);
    test:assertTrue(isLimitedOnlyEmailsResult, "Email is limited only to emails.");
}

@test:Config
function testEmail_IsLimitedOnlyEmails_WithSingleInvalidEmailInCc() {
    EmailRecord emailRecord = {
        to: [],
        cc: ["carl@wso2.com"],
        subject: "",
        templateId: "",
        contentKeyValPairs: {}
    };
    boolean isLimitedOnlyEmailsResult = isAllowedToSend(emailRecord);
    test:assertFalse(isLimitedOnlyEmailsResult, "Email is limited only to emails.");
}

@test:Config
function testEmail_IsLimitedOnlyEmails_WithValidAndInvalidEmailsInCc() {
    EmailRecord emailRecord = {
        to: [],
        cc: ["carl@wso2.com", "anne@wso2.com", "tom@wso2.com"],
        subject: "",
        templateId: "",
        contentKeyValPairs: {}
    };
    boolean isLimitedOnlyEmailsResult = isAllowedToSend(emailRecord);
    test:assertFalse(isLimitedOnlyEmailsResult, "Email is limited only to emails.");
}
