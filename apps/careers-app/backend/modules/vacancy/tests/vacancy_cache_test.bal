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

import ballerina/http;
import ballerina/lang.runtime;
import ballerina/test;

// Stands in for the vacancy service: counts its calls, answers with the given status, and can start failing after
// a number of good calls.
isolated class FakeUpstream {
    private int calls = 0;
    private final int status;
    private final int goodCalls;

    isolated function init(int status = 200, int goodCalls = 1000) {
        self.status = status;
        self.goodCalls = goodCalls;
    }

    isolated function call() returns http:Response|error {
        int number;
        lock {
            self.calls += 1;
            number = self.calls;
        }
        if number > self.goodCalls {
            return error("upstream is down");
        }
        http:Response resp = new;
        resp.statusCode = self.status;
        resp.setJsonPayload({"id": 1});
        return resp;
    }

    isolated function count() returns int {
        lock {
            return self.calls;
        }
    }
}

function assertIsJob(json|http:Response|error result) {
    if result is json {
        test:assertEquals(result, {"id": 1});
    } else {
        test:assertFail("expected the cached JSON");
    }
}

@test:Config {}
function secondRequestIsServedFromTheCache() {
    VacancyCache cache = new (600, 21600);
    final FakeUpstream upstream = new;

    assertIsJob(cache.get("jobs", isolated function() returns http:Response|error => upstream.call()));
    assertIsJob(cache.get("jobs", isolated function() returns http:Response|error => upstream.call()));
    test:assertEquals(upstream.count(), 1);
}

@test:Config {}
function eachKeyIsCachedOnItsOwn() {
    VacancyCache cache = new (600, 21600);
    final FakeUpstream upstream = new;

    assertIsJob(cache.get("job:1", isolated function() returns http:Response|error => upstream.call()));
    assertIsJob(cache.get("job:2", isolated function() returns http:Response|error => upstream.call()));
    test:assertEquals(upstream.count(), 2);
}

@test:Config {}
function failedRepliesAreNotCached() {
    VacancyCache cache = new (600, 21600);
    final FakeUpstream upstream = new (500);

    json|http:Response|error first = cache.get("jobs", isolated function() returns http:Response|error => upstream.call());
    json|http:Response|error second = cache.get("jobs", isolated function() returns http:Response|error => upstream.call());
    test:assertTrue(first is http:Response);
    test:assertTrue(second is http:Response);
    test:assertEquals(upstream.count(), 2);
}

@test:Config {}
function unreachableUpstreamIsPassedBackAndNotCached() {
    VacancyCache cache = new (600, 21600);
    final FakeUpstream upstream = new (200, 0);

    json|http:Response|error result = cache.get("jobs", isolated function() returns http:Response|error => upstream.call());
    test:assertTrue(result is error);
}

@test:Config {}
function oldCopyIsServedAtOnceWhileItRefreshesInTheBackground() {
    // A refresh time of 0 makes every cached copy count as old.
    VacancyCache cache = new (0, 21600);
    final FakeUpstream upstream = new;

    assertIsJob(cache.get("jobs", isolated function() returns http:Response|error => upstream.call()));
    assertIsJob(cache.get("jobs", isolated function() returns http:Response|error => upstream.call()));
    runtime:sleep(1);
    test:assertEquals(upstream.count(), 2, "the second request should have started one refresh");
}

@test:Config {}
function failedRefreshKeepsTheCachedCopy() {
    VacancyCache cache = new (0, 21600);
    // The first call works, every later one fails.
    final FakeUpstream upstream = new (200, 1);

    assertIsJob(cache.get("jobs", isolated function() returns http:Response|error => upstream.call()));
    assertIsJob(cache.get("jobs", isolated function() returns http:Response|error => upstream.call()));
    runtime:sleep(1);
    assertIsJob(cache.get("jobs", isolated function() returns http:Response|error => upstream.call()));
}
