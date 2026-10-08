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

# The attempts that still fall inside the window.
#
# + attempts - Times of earlier attempts, in seconds
# + windowStart - The start of the window, in seconds
# + return - The attempts made after the window start
isolated function recentAttempts(int[] attempts, int windowStart) returns int[] {
    int[] recent = [];
    foreach int attempt in attempts {
        if attempt > windowStart {
            recent.push(attempt);
        }
    }
    return recent;
}

# The key under which a caller's attempts are counted. The value is hashed, so the limiter never holds an email
# address or an IP address in memory.
#
# + kind - What the value is, such as "ip" or "email"
# + value - The address or email to count attempts for
# + return - A key for the limiter
public isolated function limiterKey(string kind, string value) returns string {
    byte[] digest = crypto:hashSha256(value.toBytes());
    return kind + ":" + array:toBase16(digest);
}

# The caller's address: the last X-Forwarded-For hop is the one the proxy itself appended, so unlike the earlier
# hops it cannot be set by the caller. Without the header the connection's own address is used, so callers never
# share one bucket.
#
# + req - The incoming request
# + remoteHost - The address of the connection
# + return - The address to count attempts for
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

# Sliding-window limiter: remembers when each key last applied so one caller cannot flood the ATS with candidates.
public isolated class ApplyRateLimiter {
    private map<int[]> attempts = {};

    # Records an attempt for the key. Returns false when the key has used its allowance within the window.
    #
    # + key - The key from `limiterKey`
    # + return - True when the attempt is allowed
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

    # Drops keys whose attempts have all aged out so the map cannot grow without bound.
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
