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

import ballerina/test;

@test:Config {}
function invalidEmailsAreRejected() {
    test:assertTrue(isValidEmail("name@example.com"));
    foreach string email in ["", "abc", "a@b", "@example.com", "a b@example.com", "a@@example.com", "a@.example.com"] {
        test:assertFalse(isValidEmail(email), string `Email "${email}"`);
    }
}

@test:Config {}
function phoneNumbersMustBeInInternationalFormat() {
    test:assertTrue(isValidPhone("+94771234567"));
    foreach string phone in ["0771234567", "94771234567", "+0771234567", "+94 77 123 4567", "+9477abc", "+1"] {
        test:assertFalse(isValidPhone(phone), string `Phone "${phone}"`);
    }
}

@test:Config {}
function aPdfIsRecognisedByItsFirstBytes() {
    test:assertTrue(isPdf([0x25, 0x50, 0x44, 0x46, 0x2d]));
    test:assertFalse(isPdf([0x25, 0x50]));
    test:assertFalse(isPdf([0x50, 0x4b, 0x03, 0x04]));
}
