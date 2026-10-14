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

import ballerina/crypto;
import ballerina/http;
import ballerina/lang.array;
import ballerina/time;

# How many applications one address, and one email, may make within the window.
configurable int applyMaxPerWindow = 5;

# The length of the window, in seconds.
configurable int applyWindowSeconds = 3600;

const int MAX_TRACKED_KEYS = 10000;

isolated function recentAttempts(int[] attempts, int windowStart) returns int[] {
    int[] recent = [];
    foreach int attempt in attempts {
        if attempt > windowStart {
            recent.push(attempt);
        }
    }
    return recent;
}

# The key an address or email is counted under. It is hashed, so no personal data is held in memory.
public isolated function limiterKey(string kind, string value) returns string {
    byte[] digest = crypto:hashSha256(value.toBytes());
    return kind + ":" + array:toBase16(digest);
}

# The caller's address: the last X-Forwarded-For hop, which the proxy appended and the caller cannot set,
# or the connection's own address when the header is missing.
public isolated function clientAddress(http:Request req, string remoteHost) returns string {
    string|http:HeaderNotFoundError forwarded = req.getHeader("X-Forwarded-For");
    if forwarded is string {
        int? comma = forwarded.lastIndexOf(",");
        string hop = (comma is int ? forwarded.substring(comma + 1) : forwarded).trim();
        if hop != "" {
            return hop;
        }
    }
    return remoteHost;
}

# Sliding-window limiter, so one caller cannot flood the ATS with candidates.
public isolated class ApplyRateLimiter {
    private map<int[]> attempts = {};

    # Records an attempt for the key; false when the key has used its allowance within the window.
    public isolated function tryAcquire(string key) returns boolean {
        int now = time:utcNow()[0];
        int windowStart = now - applyWindowSeconds;
        lock {
            if self.attempts.length() > MAX_TRACKED_KEYS {
                self.sweep(windowStart);
            }
            int[] recent = recentAttempts(self.attempts[key] ?: [], windowStart);
            if recent.length() >= applyMaxPerWindow {
                self.attempts[key] = recent;
                return false;
            }
            recent.push(now);
            self.attempts[key] = recent;
            return true;
        }
    }

    // Drops keys whose attempts have all aged out, so the map cannot grow without bound.
    private isolated function sweep(int windowStart) {
        lock {
            foreach string key in self.attempts.keys() {
                int[] recent = recentAttempts(self.attempts.get(key), windowStart);
                if recent.length() == 0 {
                    _ = self.attempts.remove(key);
                } else {
                    self.attempts[key] = recent;
                }
            }
        }
    }
}
