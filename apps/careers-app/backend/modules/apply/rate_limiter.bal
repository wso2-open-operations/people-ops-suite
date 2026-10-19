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

# How many requests one signed-in user may make within the signed-in window.
public configurable int signedInMaxPerUser = 60;

# The length of the signed-in window, in seconds.
public configurable int signedInWindowSeconds = 60;

# How many proxies in front of the service append to X-Forwarded-For. 0 ignores the header.
configurable int trustedProxyHops = 1;

const MAX_TRACKED_KEYS = 10000;

const SWEEP_INTERVAL_SECONDS = 60;

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
# missing, the chain is shorter than the setting, or the selected entry is not a valid IP address.
public isolated function clientAddress(http:Request req, string remoteHost) returns string =>
    clientAddressBehind(req, trustedProxyHops, remoteHost);

isolated function clientAddressBehind(http:Request req, int proxyHops, string remoteHost) returns string {
    string[]|http:HeaderNotFoundError forwarded = req.getHeaders("X-Forwarded-For");
    return forwarded is string[] ? forwardedHop(string:'join(",", ...forwarded), proxyHops, remoteHost) : remoteHost;
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
    if re `(::|(0{1,4}:){5})ffff:[0-9.]+`.isFullMatch(address) {
        string embedded = address.substring(<int>address.lastIndexOf(":") + 1);
        if isIpv4(embedded) {
            return embedded;
        }
    }
    return address.includes(":") && !address.includes(".") ? expandedIpv6(address) : address;
}

isolated function expandedIpv6(string address) returns string {
    if address.includes(":::") {
        return address;
    }
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
    if groups.length() != 8 {
        return address;
    }
    foreach string group in groups {
        if !re `[0-9a-f]{1,4}`.isFullMatch(group) {
            return address;
        }
    }
    string[] trimmed = from string group in groups
        let string withoutZeros = re `^0+`.replace(group, "")
        select withoutZeros == "" ? "0" : withoutZeros;
    if trimmed.slice(0, 6) == ["0", "0", "0", "0", "0", "ffff"] {
        int|error high = int:fromHexString(trimmed[6]);
        int|error low = int:fromHexString(trimmed[7]);
        if high is int && low is int {
            return string `${high / 256}.${high % 256}.${low / 256}.${low % 256}`;
        }
    }
    return string:'join(":", ...trimmed);
}

// Whether the text is an IPv4 address, or an IPv6 address in the full form that `expandedIpv6` produces.
isolated function isIpAddress(string address) returns boolean =>
    isIpv4(address) || re `([0-9a-f]{1,4}:){7}[0-9a-f]{1,4}`.isFullMatch(address);

isolated function isIpv4(string address) returns boolean {
    if !re `(0|[1-9][0-9]{0,2})(\.(0|[1-9][0-9]{0,2})){3}`.isFullMatch(address) {
        return false;
    }
    foreach string octet in re `\.`.split(address) {
        int|error value = int:fromString(octet);
        if value is error || value > 255 {
            return false;
        }
    }
    return true;
}

# Sliding-window limiter, so one caller cannot flood the ATS with candidates.
public isolated class ApplyRateLimiter {
    private map<int[]> attempts = {};
    private int lastSweep = 0;

    # Records an application from the address; false when it has used its allowance within the window.
    public isolated function tryAcquireAddress(string address) returns boolean =>
        self.tryAcquire(limiterKey("ip", address), applyMaxPerAddress, applyWindowSeconds);

    # Records an application for the email; false when it has used its allowance within the window.
    public isolated function tryAcquireEmail(string email) returns boolean =>
        self.tryAcquire(limiterKey("email", email.toLowerAscii()), applyMaxPerEmail, applyWindowSeconds);

    # Records a request from the signed-in user; false when they have used their allowance within the signed-in window.
    public isolated function tryAcquireUser(string subject) returns boolean =>
        self.tryAcquire(limiterKey("sub", subject), signedInMaxPerUser, signedInWindowSeconds);

    isolated function tryAcquire(string key, int maxAttempts, int windowSeconds) returns boolean {
        int now = time:utcNow()[0];
        int windowStart = now - windowSeconds;
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
