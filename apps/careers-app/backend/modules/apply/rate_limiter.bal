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

# How many applications one address may make within the window.
configurable int applyMaxPerAddress = 300;

# How many applications one email may make within the window.
configurable int applyMaxPerEmail = 5;

# The length of the window, in seconds.
configurable int applyWindowSeconds = 3600;

# How many proxies in front of the service append to X-Forwarded-For. 0 ignores the header.
configurable int trustedProxyHops = 1;

const int MAX_TRACKED_KEYS = 10000;

const int SWEEP_INTERVAL_SECONDS = 60;

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
    string[]|http:HeaderNotFoundError forwarded = req.getHeaders("X-Forwarded-For");
    return forwarded is string[] ? forwardedHop(string:'join(",", ...forwarded), trustedProxyHops, remoteHost)
        : remoteHost;
}

isolated function forwardedHop(string forwarded, int proxyHops, string remoteHost) returns string {
    if proxyHops < 1 {
        return remoteHost;
    }
    string[] hops = re `,`.split(forwarded);
    if hops.length() < proxyHops {
        return remoteHost;
    }
    string hop = normalisedAddress(hops[hops.length() - proxyHops]);
    return isIpAddress(hop) ? hop : remoteHost;
}

// The address without its port, brackets or zone, with an IPv6 address in its full lower-case form.
isolated function normalisedAddress(string entry) returns string {
    string address = entry.trim().toLowerAscii();
    if address.startsWith("[") {
        int? close = address.indexOf("]");
        address = close is int ? address.substring(1, close) : address.substring(1);
    } else if re `:`.split(address).length() == 2 && address.includes(".") {
        address = address.substring(0, <int>address.indexOf(":"));
    }
    int? zone = address.indexOf("%");
    if zone is int {
        address = address.substring(0, zone);
    }
    return address.includes(":") && !address.includes(".") ? expandedIpv6(address) : address;
}

isolated function expandedIpv6(string address) returns string {
    int? gap = address.indexOf("::");
    string headPart = gap is int ? address.substring(0, gap) : address;
    string tailPart = gap is int ? address.substring(gap + 2) : "";
    string[] head = headPart == "" ? [] : re `:`.split(headPart);
    string[] tail = tailPart == "" ? [] : re `:`.split(tailPart);
    string[] groups = [...head];
    if gap is int {
        foreach int _ in 0 ..< 8 - head.length() - tail.length() {
            groups.push("0");
        }
    }
    groups.push(...tail);
    string[] trimmed = from string group in groups
        let string withoutZeros = re `^0+`.replace(group, "")
        select withoutZeros == "" ? "0" : withoutZeros;
    return string:'join(":", ...trimmed);
}

isolated function isIpAddress(string address) returns boolean =>
    re `(\d{1,3}\.){3}\d{1,3}`.isFullMatch(address) || re `[0-9a-f:.]*:[0-9a-f:.]*`.isFullMatch(address);

# Sliding-window limiter, so one caller cannot flood the ATS with candidates.
public isolated class ApplyRateLimiter {
    private map<int[]> attempts = {};
    private int lastSweep = 0;

    # Records an application from the address; false when it has used its allowance within the window.
    public isolated function tryAcquireAddress(string address) returns boolean =>
        self.tryAcquire(limiterKey("ip", address), applyMaxPerAddress);

    # Records an application for the email; false when it has used its allowance within the window.
    public isolated function tryAcquireEmail(string email) returns boolean =>
        self.tryAcquire(limiterKey("email", email.toLowerAscii()), applyMaxPerEmail);

    isolated function tryAcquire(string key, int maxAttempts) returns boolean {
        int now = time:utcNow()[0];
        int windowStart = now - applyWindowSeconds;
        lock {
            if self.attempts.length() > MAX_TRACKED_KEYS && now - self.lastSweep >= SWEEP_INTERVAL_SECONDS {
                self.lastSweep = now;
                self.sweep(windowStart);
            }
            int[] recent = recentAttempts(self.attempts[key] ?: [], windowStart);
            if recent.length() >= maxAttempts {
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
