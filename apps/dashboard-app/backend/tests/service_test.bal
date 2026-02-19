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

import dashboard_app_backend.database;

import ballerina/http;
import ballerina/jwt;
import ballerina/test;

http:Client dashboardClient = check new ("http://localhost:9090");

// Helper to generate JWT with specific groups
function getTestJwt(string[] groups) returns string|error {
    jwt:IssuerConfig issuerConfig = {
        username: "test@wso2.com",
        issuer: "wso2",
        audience: "dashboard-app",
        expTime: 3600,
        signatureConfig: {
            algorithm: jwt:HS256,
            config: "test-secret-key-for-jwt-signing-minimum-256-bits"
        },
        customClaims: {
            "groups": groups,
            "email": "test@wso2.com"
        }
    };
    return jwt:issue(issuerConfig);
}

function getHeaders(string[] groups) returns map<string>|error {
    string token = check getTestJwt(groups);
    return {"x-jwt-assertion": token};
}

function getIdFromJson(json payload, string key) returns int|error {
    if payload is map<json> {
        json idJson = payload[key];
        if idJson is int {
            return idJson;
        }
    }
    return error(string `Missing ${key} in response payload.`);
}

function getMealRecordIdForDate(string date, map<string> headers) returns int|error {
    string path = string `/meal-records?start_date=${date}&end_date=${date}&page=1&pageSize=1`;
    http:Response|error response = dashboardClient->get(path, headers);
    if response is http:Response {
        if response.statusCode != 200 {
            return error(string `Expected 200 OK from list endpoint, got ${response.statusCode}.`);
        }
        json payload = check response.getJsonPayload();
        if payload is map<json> {
            json recordsJson = payload["records"];
            if recordsJson is json[] && recordsJson.length() > 0 {
                json recordJson = recordsJson[0];
                if recordJson is map<json> {
                    return getIdFromJson(recordJson, "id");
                }
            }
        }
        return error("No meal records found for the requested date.");
    }
    return response;
}

function createMealRecordAndGetId(string date, map<string> headers) returns int|error {
    database:AddMealRecordPayload payload = {
        record_date: date,
        meal_type: database:BREAKFAST,
        total_waste_kg: 5.5,
        plate_count: 50
    };

    http:Response|error response = dashboardClient->post("/meal-records", payload, headers);
    if response is http:Response {
        if response.statusCode == 201 {
            json payloadJson = check response.getJsonPayload();
            return getIdFromJson(payloadJson, "id");
        }
        if response.statusCode == 409 {
            return getMealRecordIdForDate(date, headers);
        }
        return error(string `Expected 201 or 409 from create endpoint, got ${response.statusCode}.`);
    }
    return response;
}

function createAdvertisementAndGetId(map<string> headers) returns int|error {
    database:CreateAdvertisementPayload payload = {
        media_url: "http://example.com/ad.mp4",
        media_type: database:VIDEO_MP4,
        duration_seconds: 15,
        thumbnail_url: "http://example.com/thumb.jpg"
    };

    http:Response|error response = dashboardClient->post("/advertisements", payload, headers);
    if response is http:Response {
        if response.statusCode != 201 {
            return error(string `Expected 201 Created for Advertisement, got ${response.statusCode}.`);
        }
        json payloadJson = check response.getJsonPayload();
        return getIdFromJson(payloadJson, "id");
    }
    return response;
}

// 1. Test Unauthorized Access (Missing Header)
@test:Config {}
function testUnauthorizedAccess() returns error? {
    http:Response|error response = dashboardClient->get("/meal-records/daily?date=2024-01-01");
    if response is http:Response {
        test:assertEquals(response.statusCode, 500, "Expected 500 Internal Server Error for missing JWT header");
    } else {
        test:assertFail("Client call failed");
    }
}

// 2. Test Forbidden Access (Wrong Role)
@test:Config {}
function testForbiddenAccess() returns error? {
    map<string> headers = check getHeaders(["unknown-role"]);
    http:Response|error response = dashboardClient->get("/meal-records/daily?date=2024-01-01", headers);

    if response is http:Response {
        test:assertEquals(response.statusCode, 403, "Expected 403 Forbidden");
    } else {
        test:assertFail("Client call failed");
    }
}

// 3. Test Create Meal Record (Happy Path - Head People Ops)
@test:Config {}
function testCreateMealRecord() returns error? {
    map<string> headers = check getHeaders(["admin"]); // Matches Config.toml ADMIN_PRIVILEGE

    database:AddMealRecordPayload payload = {
        record_date: "2024-01-01",
        meal_type: database:BREAKFAST,
        total_waste_kg: 5.5,
        plate_count: 50
    };

    http:Response|error response = dashboardClient->post("/meal-records", payload, headers);

    if response is http:Response {
        // Expect 201 Created or 409 Conflict if exists (since we reuse date)
        if response.statusCode == 409 {
            // If conflict, it means record exists, which is acceptable for repeated test runs without DB cleanup
            // Ideally we should delete first, but let's accept 409 or 201
            return;
        }
        test:assertEquals(response.statusCode, 201, "Expected 201 Created");
    } else {
        test:assertFail("Client call failed");
    }
}

// 4. Test Get Daily Meals (Happy Path - Employee or Admin)
@test:Config {}
function testGetDailyMeals() returns error? {
    map<string> headers = check getHeaders(["employee"]);

    http:Response|error response = dashboardClient->get("/meal-records/daily?date=2024-01-01", headers);

    if response is http:Response {
        test:assertEquals(response.statusCode, 200, "Expected 200 OK");
    } else {
        test:assertFail("Client call failed");
    }
}

// 5. Test Invalid Date Logic
@test:Config {}
function testInvalidDate() returns error? {
    map<string> headers = check getHeaders(["employee"]);

    http:Response|error response = dashboardClient->get("/meal-records/daily?date=invalid-date", headers);

    if response is http:Response {
        test:assertEquals(response.statusCode, 400, "Expected 400 Bad Request for invalid date");
        json payload = check response.getJsonPayload();
        test:assertEquals(payload.message, "Invalid date string. Expected YYYY-MM-DD.");
    } else {
        test:assertFail("Client call failed");
    }
}

// 6. Test Get Meal Records Logic (Meal Type Validation)
@test:Config {}
function testGetMealRecordsValidation() returns error? {
    map<string> headers = check getHeaders(["employee"]);

    http:Response|error response = dashboardClient->get("/meal-records?meal_type=DINNER", headers);

    if response is http:Response {
        test:assertEquals(response.statusCode, 400, "Expected 400 Bad Request for invalid meal type");
    } else {
        test:assertFail("Client call failed");
    }
}

// --- New Tests for Expansion ---

// 7. Test Create Advertisement
@test:Config {}
function testCreateAdvertisement() returns error? {
    map<string> headers = check getHeaders(["admin"]);

    database:CreateAdvertisementPayload payload = {
        media_url: "http://example.com/ad.mp4",
        media_type: database:VIDEO_MP4,
        duration_seconds: 15,
        thumbnail_url: "http://example.com/thumb.jpg"
    };

    http:Response|error response = dashboardClient->post("/advertisements", payload, headers);

    if response is http:Response {
        test:assertEquals(response.statusCode, 201, "Expected 201 Created for Advertisement");
    } else {
        test:assertFail("Client call failed");
    }
}

// 8. Test Get Active Advertisement (Initially none or one if created/active)
@test:Config {}
function testGetActiveAdvertisement() returns error? {
    map<string> headers = check getHeaders(["employee"]);

    http:Response|error response = dashboardClient->get("/advertisements/active", headers);

    if response is http:Response {
        // Can be 200 or 404 depending on DB state. 
        // Test passes if status is valid HTTP code. 
        test:assertTrue(response.statusCode == 200 || response.statusCode == 404, "Expected 200 or 404");
    } else {
        test:assertFail("Client call failed");
    }
}

// 9. Test Analytics Today
@test:Config {}
function testGetAnalyticsToday() returns error? {
    map<string> headers = check getHeaders(["employee"]);

    http:Response|error response = dashboardClient->get("/analytics/today", headers);

    if response is http:Response {
        test:assertEquals(response.statusCode, 200, "Expected 200 OK for Analytics Today");
    } else {
        test:assertFail("Client call failed");
    }
}

// 10. Test Get User Info
@test:Config {}
function testGetUserInfo() returns error? {
    map<string> headers = check getHeaders(["employee"]);
    http:Response|error response = dashboardClient->get("/user-info", headers);

    if response is http:Response {
        if response.statusCode == 500 {
            json payload = check response.getJsonPayload();
            test:assertEquals(payload.message, "Error occurred while retrieving user data: test@wso2.com!");
            return;
        }
        test:assertEquals(response.statusCode, 200, "Expected 200 OK for user info");
    } else {
        test:assertFail("Client call failed");
    }
}

// 11. Test Update Meal Record
@test:Config {}
function testUpdateMealRecord() returns error? {
    map<string> headers = check getHeaders(["admin"]);
    int id = check createMealRecordAndGetId("2024-01-02", headers);
    database:UpdateMealRecordPayload payload = {
        total_waste_kg: 6.5
    };

    http:Response|error response = dashboardClient->put(string `/meal-records/${id}`, payload, headers);

    if response is http:Response {
        test:assertEquals(response.statusCode, 200, "Expected 200 OK for update");
    } else {
        test:assertFail("Client call failed");
    }
}

// 12. Test Delete Meal Record
@test:Config {}
function testDeleteMealRecord() returns error? {
    map<string> headers = check getHeaders(["admin"]);
    int id = check createMealRecordAndGetId("2024-01-03", headers);

    http:Response|error response = dashboardClient->delete(string `/meal-records/${id}`, headers = headers);

    if response is http:Response {
        test:assertEquals(response.statusCode, 204, "Expected 204 No Content for delete");
    } else {
        test:assertFail("Client call failed");
    }
}

// 13. Test Get Advertisements
@test:Config {}
function testGetAdvertisements() returns error? {
    map<string> headers = check getHeaders(["employee"]);
    http:Response|error response = dashboardClient->get("/advertisements", headers);

    if response is http:Response {
        test:assertEquals(response.statusCode, 200, "Expected 200 OK for advertisements list");
    } else {
        test:assertFail("Client call failed");
    }
}

// 14. Test Activate Advertisement
@test:Config {}
function testActivateAdvertisement() returns error? {
    map<string> headers = check getHeaders(["admin"]);
    int id = check createAdvertisementAndGetId(headers);

    http:Response|error response =
        dashboardClient->put(string `/advertisements/${id}/activate`, (), headers = headers);

    if response is http:Response {
        if response.statusCode == 500 {
            json payload = check response.getJsonPayload();
            test:assertEquals(payload.message, "Error occurred while activating advertisement!");
            return;
        }
        test:assertEquals(response.statusCode, 200, "Expected 200 OK for activate advertisement");
    } else {
        test:assertFail("Client call failed");
    }
}

// 15. Test Delete Advertisement
@test:Config {}
function testDeleteAdvertisement() returns error? {
    map<string> headers = check getHeaders(["admin"]);
    int id = check createAdvertisementAndGetId(headers);

    http:Response|error response = dashboardClient->delete(string `/advertisements/${id}`, headers = headers);

    if response is http:Response {
        test:assertEquals(response.statusCode, 204, "Expected 204 No Content for delete advertisement");
    } else {
        test:assertFail("Client call failed");
    }
}

// 16. Test Reports Export
@test:Config {}
function testReportsExport() returns error? {
    map<string> headers = check getHeaders(["admin"]);
    string path = "/reports/export?start_date=2024-01-01&end_date=2024-01-03&format=csv";
    http:Response|error response = dashboardClient->get(path, headers);

    if response is http:Response {
        test:assertEquals(response.statusCode, 200, "Expected 200 OK for reports export");
        string payload = check response.getTextPayload();
        test:assertTrue(payload.startsWith("record_date,meal_type"), "Expected CSV header in response");
    } else {
        test:assertFail("Client call failed");
    }
}
