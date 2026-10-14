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
configurable int applyMaxPerWindow = 300;

# The length of the window, in seconds.
configurable int applyWindowSeconds = 3600;

# How many proxies in front of the service append to X-Forwarded-For. 0 ignores the header.
configurable int trustedProxyHops = 1;

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

# The caller's address: the X-Forwarded-For entry that the outermost trusted proxy appended, counted from the
# right by `trustedProxyHops`. The connection's own address is used when the setting is 0, the header is
# missing, the chain is shorter than the setting, or the selected entry is empty.
public isolated function clientAddress(http:Request req, string remoteHost) returns string {
    string|http:HeaderNotFoundError forwarded = req.getHeader("X-Forwarded-For");
    return forwarded is string ? forwardedHop(forwarded, trustedProxyHops, remoteHost) : remoteHost;
}

isolated function forwardedHop(string forwarded, int proxyHops, string remoteHost) returns string {
    if proxyHops < 1 {
        return remoteHost;
    }
    string[] hops = re `,`.split(forwarded);
    if hops.length() < proxyHops {
        return remoteHost;
    }
    string hop = hops[hops.length() - proxyHops].trim();
    return hop == "" ? remoteHost : hop;
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
