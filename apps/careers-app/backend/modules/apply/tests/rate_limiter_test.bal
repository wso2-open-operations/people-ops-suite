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
import ballerina/test;

@test:Config {}
function limiterAllowsTheConfiguredNumberThenBlocks() {
    ApplyRateLimiter limiter = new;
    string key = limiterKey("ip", "1.1.1.1");
    foreach int attempt in 1 ... applyMaxPerWindow {
        test:assertTrue(limiter.tryAcquire(key), string `Attempt ${attempt} should be allowed`);
    }
    test:assertFalse(limiter.tryAcquire(key));
}

@test:Config {}
function eachAddressAndEachEmailHasItsOwnAllowance() {
    ApplyRateLimiter limiter = new;
    string firstAddress = limiterKey("ip", "1.1.1.1");
    foreach int _ in 1 ... applyMaxPerWindow {
        _ = limiter.tryAcquire(firstAddress);
    }
    test:assertFalse(limiter.tryAcquire(firstAddress));
    // Another address, and the same text used as an email, are counted separately.
    test:assertTrue(limiter.tryAcquire(limiterKey("ip", "2.2.2.2")));
    test:assertTrue(limiter.tryAcquire(limiterKey("email", "1.1.1.1")));
}

@test:Config {}
function limiterKeysDoNotContainTheirValue() {
    string key = limiterKey("email", "someone@example.com");
    test:assertFalse(key.includes("someone"));
    test:assertFalse(key.includes("example.com"));
    test:assertEquals(key, limiterKey("email", "someone@example.com"));
    test:assertNotEquals(key, limiterKey("email", "other@example.com"));
}

@test:Config {}
function attemptsOutsideTheWindowAreForgotten() {
    test:assertEquals(recentAttempts([10, 50, 90, 120], 60), [90, 120]);
    test:assertEquals(recentAttempts([], 60), []);
}

@test:Config {}
function clientAddressIsTheLastForwardedHop() {
    http:Request spoofed = new;
    spoofed.setHeader("X-Forwarded-For", "9.9.9.9, 10.0.0.1");
    test:assertEquals(clientAddress(spoofed, "192.168.1.5"), "10.0.0.1");

    http:Request single = new;
    single.setHeader("X-Forwarded-For", "10.0.0.2");
    test:assertEquals(clientAddress(single, "192.168.1.5"), "10.0.0.2");
}

@test:Config {}
function clientAddressFallsBackToTheConnectionAddress() {
    // Without the header each caller is still counted by its own address, not in one shared bucket.
    test:assertEquals(clientAddress(new, "192.168.1.5"), "192.168.1.5");
    test:assertEquals(clientAddress(new, "192.168.1.6"), "192.168.1.6");
}
