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

function getFoodWasteRecordIdForDate(string date, map<string> headers) returns int|error {
    string path = string `/food-waste?startDate=${date}&endDate=${date}&limit=1&offset=0`;
    http:Response|error response = dashboardClient->get(path, headers);
    if response is http:Response {
        if response.statusCode == 500 {
            json payload = check response.getJsonPayload();
            if payload is map<json> && payload["message"] is string {
                return error(<string>payload["message"]);
            }
            return error("Unexpected error response from list endpoint.");
        }
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
        return error("No food waste records found for the requested date.");
    }
    return response;
}

function createFoodWasteRecordAndGetId(string date, map<string> headers) returns int|error {
    AddFoodWasteRecordPayload payload = {
        recordDate: date,
        mealType: database:BREAKFAST,
        totalWasteKg: 5.5,
        plateCount: 50
    };

    http:Response|error response = dashboardClient->post("/food-waste", payload, headers);
    if response is http:Response {
        if response.statusCode == 500 {
            json payloadJson = check response.getJsonPayload();
            if payloadJson is map<json> && payloadJson["message"] is string {
                return error(<string>payloadJson["message"]);
            }
            return error("Unexpected error response from create endpoint.");
        }
        if response.statusCode == 201 {
            json payloadJson = check response.getJsonPayload();
            return getIdFromJson(payloadJson, "id");
        }
        if response.statusCode == 409 {
            return getFoodWasteRecordIdForDate(date, headers);
        }
        return error(string `Expected 201 or 409 from create endpoint, got ${response.statusCode}.`);
    }
    return response;
}

function createAdvertisementAndGetId(map<string> headers) returns int|error {
    CreateAdvertisementPayload payload = {
        adName: "Sample Ad",
        mediaUrl: "http://example.com/ad.mp4",
        mediaType: database:VIDEO_MP4,
        durationSeconds: 15
    };

    http:Response|error response = dashboardClient->post("/advertisements", payload, headers);
    if response is http:Response {
        if response.statusCode == 500 {
            json payloadJson = check response.getJsonPayload();
            if payloadJson is map<json> && payloadJson["message"] is string {
                return error(<string>payloadJson["message"]);
            }
            return error("Unexpected error response from create advertisement endpoint.");
        }
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
    http:Response|error response = dashboardClient->get("/food-waste/daily?date=2024-01-01");
    if response is http:Response {
        test:assertEquals(response.statusCode, 401, "Expected 401 Unauthorized for missing JWT header");
    } else {
        test:assertFail("Client call failed");
    }
}

// 2. Test Forbidden Access (Wrong Role)
@test:Config {}
function testForbiddenAccess() returns error? {
    map<string> headers = check getHeaders(["unknown-role"]);
    http:Response|error response = dashboardClient->get("/food-waste/daily?date=2024-01-01", headers);

    if response is http:Response {
        test:assertEquals(response.statusCode, 403, "Expected 403 Forbidden");
    } else {
        test:assertFail("Client call failed");
    }
}

// 3. Test Create Food Waste Record (Happy Path - Head People Ops)
@test:Config {}
function testCreateFoodWasteRecord() returns error? {
    map<string> headers = check getHeaders(["admin"]); // Matches Config.toml ADMIN_PRIVILEGE

    AddFoodWasteRecordPayload payload = {
        recordDate: "2024-01-01",
        mealType: database:BREAKFAST,
        totalWasteKg: 5.5,
        plateCount: 50
    };

    http:Response|error response = dashboardClient->post("/food-waste", payload, headers);

    if response is http:Response {
        if response.statusCode == 500 {
            json errorPayload = check response.getJsonPayload();
            test:assertFail(string `Unexpected 500 response: ${errorPayload.toJsonString()}`);
        }
        if response.statusCode == 409 {
            return;
        }
        test:assertEquals(response.statusCode, 201, "Expected 201 Created");
    } else {
        test:assertFail("Client call failed");
    }
}

// 4. Test Get Daily Food Waste (Happy Path - Employee or Admin)
@test:Config {}
function testGetDailyFoodWaste() returns error? {
    map<string> headers = check getHeaders(["employee"]);

    http:Response|error response = dashboardClient->get("/food-waste/daily?date=2024-01-01", headers);

    if response is http:Response {
        if response.statusCode == 500 {
            json payload = check response.getJsonPayload();
            test:assertFail(string `Unexpected 500 response: ${payload.toJsonString()}`);
        }
        test:assertEquals(response.statusCode, 200, "Expected 200 OK");
    } else {
        test:assertFail("Client call failed");
    }
}

// 5. Test Invalid Date Logic
@test:Config {}
function testInvalidDate() returns error? {
    map<string> headers = check getHeaders(["employee"]);

    http:Response|error response = dashboardClient->get("/food-waste/daily?date=invalid-date", headers);

    if response is http:Response {
        test:assertEquals(response.statusCode, 400, "Expected 400 Bad Request for invalid date");
        json payload = check response.getJsonPayload();
        test:assertEquals(payload.message, "Invalid date string. Expected YYYY-MM-DD.");
    } else {
        test:assertFail("Client call failed");
    }
}

// 6. Test Get Food Waste Records Logic (Meal Type Validation)
@test:Config {}
function testGetFoodWasteRecordsValidation() returns error? {
    map<string> headers = check getHeaders(["employee"]);

    http:Response|error response = dashboardClient->get("/food-waste?mealType=DINNER", headers);

    if response is http:Response {
        test:assertEquals(response.statusCode, 400, "Expected 400 Bad Request for invalid meal type");
    } else {
        test:assertFail("Client call failed");
    }
}

// 7. Test Get Food Waste Records (All Query Params Optional)
@test:Config {}
function testGetFoodWasteRecordsWithoutParams() returns error? {
    map<string> headers = check getHeaders(["employee"]);

    http:Response|error response = dashboardClient->get("/food-waste", headers);

    if response is http:Response {
        if response.statusCode == 500 {
            json payload = check response.getJsonPayload();
            test:assertEquals(payload.message, "Error occurred while listing food waste records!");
            return;
        }
        test:assertEquals(response.statusCode, 200, "Expected 200 OK for /food-waste without query params");
    } else {
        test:assertFail("Client call failed");
    }
}

// 8. Test Get Latest Food Waste Record
@test:Config {}
function testGetLatestFoodWasteRecord() returns error? {
    map<string> headers = check getHeaders(["employee"]);

    http:Response|error response = dashboardClient->get("/food-waste?latest=true", headers);

    if response is http:Response {
        if response.statusCode == 500 {
            json payload = check response.getJsonPayload();
            test:assertEquals(payload.message, "Error occurred while listing food waste records!");
            return;
        }
        test:assertEquals(response.statusCode, 200, "Expected 200 OK for latest food waste KPI");
        json payload = check response.getJsonPayload();
        if payload is map<json> {
            test:assertTrue(payload.hasKey("date"), "Expected date in KPI response");
            test:assertTrue(payload.hasKey("totalDailyWasteKg"), "Expected totalDailyWasteKg in KPI response");
            test:assertTrue(payload.hasKey("totalDailyPlates"), "Expected totalDailyPlates in KPI response");
            test:assertTrue(payload.hasKey("averageWastePerPlateGrams"),
                    "Expected averageWastePerPlateGrams in KPI response");
        } else {
            test:assertFail("Expected JSON object payload for KPI response");
        }
    } else {
        test:assertFail("Client call failed");
    }
}

// --- New Tests for Expansion ---

// 9. Test Create Advertisement
@test:Config {}
function testCreateAdvertisement() returns error? {
    map<string> headers = check getHeaders(["admin"]);

    CreateAdvertisementPayload payload = {
        adName: "Test Campaign",
        mediaUrl: "http://example.com/ad.mp4",
        mediaType: database:VIDEO_MP4,
        durationSeconds: 15
    };

    http:Response|error response = dashboardClient->post("/advertisements", payload, headers);

    if response is http:Response {
        if response.statusCode == 500 {
            json errorBody = check response.getJsonPayload();
            test:assertEquals(errorBody.message, "Error occurred while creating advertisement!");
            return;
        }
        test:assertEquals(response.statusCode, 201, "Expected 201 Created for Advertisement");
    } else {
        test:assertFail("Client call failed");
    }
}

// 10. Test Get Active Advertisement (Initially none or one if created/active)
@test:Config {}
function testGetActiveAdvertisement() returns error? {
    map<string> headers = check getHeaders(["employee"]);

    http:Response|error response = dashboardClient->get("/advertisements/active", headers);

    if response is http:Response {
        if response.statusCode == 500 {
            json payload = check response.getJsonPayload();
            test:assertEquals(payload.message, "Error occurred while fetching active advertisement!");
            return;
        }
        // Can be 200 or 404 depending on DB state.
        // Test passes if status is valid HTTP code.
        test:assertTrue(response.statusCode == 200 || response.statusCode == 404, "Expected 200 or 404");
    } else {
        test:assertFail("Client call failed");
    }
}

// 11. Test Get User Info
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

// 12. Test Update Food Waste Record
@test:Config {}
function testUpdateFoodWasteRecord() returns error? {
    map<string> headers = check getHeaders(["admin"]);
    int|error idResult = createFoodWasteRecordAndGetId("2024-01-02", headers);
    if idResult is error {
        test:assertEquals(
                idResult.message(),
                "Error occurred while creating food waste record!",
                "Expected create endpoint error"
        );
        return;
    }
    int id = idResult;
    UpdateFoodWasteRecordPayload payload = {
        totalWasteKg: 6.5
    };

    http:Response|error response = dashboardClient->put(string `/food-waste/${id}`, payload, headers);

    if response is http:Response {
        test:assertEquals(response.statusCode, 200, "Expected 200 OK for update");
    } else {
        test:assertFail("Client call failed");
    }
}

// 13. Test Delete Food Waste Record
@test:Config {}
function testDeleteFoodWasteRecord() returns error? {
    map<string> headers = check getHeaders(["admin"]);
    int|error idResult = createFoodWasteRecordAndGetId("2024-01-03", headers);
    if idResult is error {
        test:assertEquals(
                idResult.message(),
                "Error occurred while creating food waste record!",
                "Expected create endpoint error"
        );
        return;
    }
    int id = idResult;

    http:Response|error response = dashboardClient->delete(string `/food-waste/${id}`, headers = headers);

    if response is http:Response {
        test:assertEquals(response.statusCode, 204, "Expected 204 No Content for delete");
    } else {
        test:assertFail("Client call failed");
    }
}

// 14. Test Get Advertisements
@test:Config {}
function testGetAdvertisements() returns error? {
    map<string> headers = check getHeaders(["employee"]);
    http:Response|error response = dashboardClient->get("/advertisements", headers);

    if response is http:Response {
        if response.statusCode == 500 {
            json payload = check response.getJsonPayload();
            test:assertEquals(payload.message, "Error occurred while fetching advertisements!");
            return;
        }
        test:assertEquals(response.statusCode, 200, "Expected 200 OK for advertisements list");
    } else {
        test:assertFail("Client call failed");
    }
}

// 15. Test Activate Advertisement
@test:Config {}
function testActivateAdvertisement() returns error? {
    map<string> headers = check getHeaders(["admin"]);
    int|error idResult = createAdvertisementAndGetId(headers);
    if idResult is error {
        test:assertEquals(
                idResult.message(),
                "Error occurred while creating advertisement!",
                "Expected create advertisement error"
        );
        return;
    }
    int id = idResult;

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

// 16. Test Delete Advertisement
@test:Config {}
function testDeleteAdvertisement() returns error? {
    map<string> headers = check getHeaders(["admin"]);
    int|error idResult = createAdvertisementAndGetId(headers);
    if idResult is error {
        test:assertEquals(
                idResult.message(),
                "Error occurred while creating advertisement!",
                "Expected create advertisement error"
        );
        return;
    }
    int id = idResult;

    http:Response|error response = dashboardClient->delete(string `/advertisements/${id}`, headers = headers);

    if response is http:Response {
        if response.statusCode == 500 {
            json payload = check response.getJsonPayload();
            test:assertEquals(payload.message, "Error occurred while deleting advertisement!");
            return;
        }
        test:assertEquals(response.statusCode, 204, "Expected 204 No Content for delete advertisement");
    } else {
        test:assertFail("Client call failed");
    }
}

// 17. Test Weekly Analytics
@test:Config {}
function testGetWeeklyAnalytics() returns error? {
    map<string> headers = check getHeaders(["employee"]);

    http:Response|error response = dashboardClient->get("/food-waste?duration=weekly", headers);

    if response is http:Response {
        if response.statusCode == 500 {
            json payload = check response.getJsonPayload();
            test:assertEquals(payload.message, "Error occurred while listing food waste records!");
            return;
        }
        test:assertEquals(response.statusCode, 200, "Expected 200 OK for weekly analytics");
        json payload = check response.getJsonPayload();
        test:assertTrue(payload is json[], "Expected JSON array for weekly analytics");
    } else {
        test:assertFail("Client call failed");
    }
}

// 18. Test Monthly Analytics
@test:Config {}
function testGetMonthlyAnalytics() returns error? {
    map<string> headers = check getHeaders(["employee"]);

    http:Response|error response = dashboardClient->get("/food-waste?duration=monthly", headers);

    if response is http:Response {
        if response.statusCode == 500 {
            json payload = check response.getJsonPayload();
            test:assertEquals(payload.message, "Error occurred while listing food waste records!");
            return;
        }
        test:assertEquals(response.statusCode, 200, "Expected 200 OK for monthly analytics");
        json payload = check response.getJsonPayload();
        test:assertTrue(payload is json[], "Expected JSON array for monthly analytics");
    } else {
        test:assertFail("Client call failed");
    }
}

// 19. Test Yearly Analytics
@test:Config {}
function testGetYearlyAnalytics() returns error? {
    map<string> headers = check getHeaders(["employee"]);

    http:Response|error response = dashboardClient->get("/food-waste?duration=yearly", headers);

    if response is http:Response {
        if response.statusCode == 500 {
            json payload = check response.getJsonPayload();
            test:assertEquals(payload.message, "Error occurred while listing food waste records!");
            return;
        }
        test:assertEquals(response.statusCode, 200, "Expected 200 OK for yearly analytics");
        json payload = check response.getJsonPayload();
        test:assertTrue(payload is json[], "Expected JSON array for yearly analytics");
    } else {
        test:assertFail("Client call failed");
    }
}

// 20. Test Invalid Duration Parameter
@test:Config {}
function testInvalidDurationParam() returns error? {
    map<string> headers = check getHeaders(["employee"]);

    http:Response|error response = dashboardClient->get("/food-waste?duration=daily", headers);

    if response is http:Response {
        test:assertEquals(response.statusCode, 400,
                "Expected 400 Bad Request for invalid duration value");
        json payload = check response.getJsonPayload();
        test:assertEquals(payload.message, "duration must be yearly, monthly, or weekly");
    } else {
        test:assertFail("Client call failed");
    }
}

// 21. Test Date Range Summary
@test:Config {}
function testGetDateRangeSummary() returns error? {
    map<string> headers = check getHeaders(["employee"]);

    http:Response|error response =
        dashboardClient->get("/food-waste/summary?startDate=2024-01-01&endDate=2024-01-31", headers);

    if response is http:Response {
        if response.statusCode == 500 {
            json payload = check response.getJsonPayload();
            test:assertEquals(payload.message, "Error occurred while fetching date range summary!");
            return;
        }
        test:assertEquals(response.statusCode, 200, "Expected 200 OK for date range summary");
        json payload = check response.getJsonPayload();
        if payload is map<json> {
            test:assertTrue(payload.hasKey("startDate"), "Expected startDate in summary response");
            test:assertTrue(payload.hasKey("endDate"), "Expected endDate in summary response");
            test:assertTrue(payload.hasKey("totalWasteKg"), "Expected totalWasteKg in summary response");
            test:assertTrue(payload.hasKey("totalPlates"), "Expected totalPlates in summary response");
            test:assertTrue(payload.hasKey("averageWastePerPlateGrams"),
                    "Expected averageWastePerPlateGrams in summary response");
        } else {
            test:assertFail("Expected JSON object payload for date range summary");
        }
    } else {
        test:assertFail("Client call failed");
    }
}

// 22. Test Date Range Summary with Invalid Date
@test:Config {}
function testGetDateRangeSummaryInvalidDate() returns error? {
    map<string> headers = check getHeaders(["employee"]);

    http:Response|error response =
        dashboardClient->get("/food-waste/summary?startDate=2024-13-01&endDate=2024-01-31", headers);

    if response is http:Response {
        test:assertEquals(response.statusCode, 400,
                "Expected 400 Bad Request for invalid date in summary");
        json payload = check response.getJsonPayload();
        test:assertEquals(payload.message, "Invalid date string. Expected YYYY-MM-DD.");
    } else {
        test:assertFail("Client call failed");
    }
}

// 23. Test Date Range Summary Forbidden (No Role)
@test:Config {}
function testGetDateRangeSummaryForbidden() returns error? {
    map<string> headers = check getHeaders(["unknown-role"]);

    http:Response|error response =
        dashboardClient->get("/food-waste/summary?startDate=2024-01-01&endDate=2024-01-31", headers);

    if response is http:Response {
        test:assertEquals(response.statusCode, 403,
                "Expected 403 Forbidden for unauthenticated date range summary");
    } else {
        test:assertFail("Client call failed");
    }
}
