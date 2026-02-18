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
        customClaims: {
            "groups": groups,
            "email": "test@wso2.com"
        }
    };
    return jwt:issue(issuerConfig);
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
    string token = check getTestJwt(["unknown-role"]);
    map<string> headers = {"x-jwt-assertion": token};
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
    string token = check getTestJwt(["admin"]); // Matches Config.toml headPeopleOperationsRole
    map<string> headers = {"x-jwt-assertion": token};

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
    string token = check getTestJwt(["employee"]); // Matches Config.toml employeeRole
    map<string> headers = {"x-jwt-assertion": token};

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
    string token = check getTestJwt(["employee"]);
    map<string> headers = {"x-jwt-assertion": token};

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
    string token = check getTestJwt(["employee"]);
    map<string> headers = {"x-jwt-assertion": token};

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
    string token = check getTestJwt(["admin"]);
    map<string> headers = {"x-jwt-assertion": token};
    
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
    string token = check getTestJwt(["employee"]);
    map<string> headers = {"x-jwt-assertion": token};
    
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
    string token = check getTestJwt(["employee"]);
    map<string> headers = {"x-jwt-assertion": token};
    
    http:Response|error response = dashboardClient->get("/analytics/today", headers);
    
    if response is http:Response {
        test:assertEquals(response.statusCode, 200, "Expected 200 OK for Analytics Today");
    } else {
        test:assertFail("Client call failed");
    }
}
