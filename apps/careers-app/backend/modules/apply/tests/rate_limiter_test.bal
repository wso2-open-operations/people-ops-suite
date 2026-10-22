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
    foreach int attempt in 1 ... applyMaxPerAddress {
        test:assertTrue(limiter.tryAcquireAddress("1.1.1.1"), string `Attempt ${attempt} should be allowed`);
    }
    test:assertFalse(limiter.tryAcquireAddress("1.1.1.1"));
}

@test:Config {}
function eachAddressAndEachEmailHasItsOwnAllowance() {
    ApplyRateLimiter limiter = new;
    foreach int _ in 1 ... applyMaxPerAddress {
        _ = limiter.tryAcquireAddress("1.1.1.1");
    }
    test:assertFalse(limiter.tryAcquireAddress("1.1.1.1"));
    test:assertTrue(limiter.tryAcquireAddress("2.2.2.2"));
    test:assertTrue(limiter.tryAcquireEmail("1.1.1.1"));
}

@test:Config {}
function theEmailLimitIsSeparateFromTheAddressLimit() {
    ApplyRateLimiter limiter = new;
    foreach int attempt in 1 ... applyMaxPerEmail {
        test:assertTrue(limiter.tryAcquireEmail("someone@example.test"), string `Attempt ${attempt} should be allowed`);
    }
    test:assertFalse(limiter.tryAcquireEmail("someone@example.test"));
    test:assertFalse(limiter.tryAcquireEmail("SOMEONE@Example.test"));
    test:assertTrue(limiter.tryAcquireAddress("1.1.1.1"));
    test:assertTrue(applyMaxPerEmail < applyMaxPerAddress);
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
function clientAddressIsTheLastForwardedHopBehindOneProxy() {
    http:Request spoofed = new;
    spoofed.setHeader("X-Forwarded-For", "9.9.9.9, 10.0.0.1");
    test:assertEquals(clientAddressBehind(spoofed, 1, "192.168.1.5"), "10.0.0.1");

    http:Request single = new;
    single.setHeader("X-Forwarded-For", "10.0.0.2");
    test:assertEquals(clientAddressBehind(single, 1, "192.168.1.5"), "10.0.0.2");
}

@test:Config {}
function aClientCannotChangeItsAddressByPaddingTheHeader() {
    http:Request first = new;
    first.setHeader("X-Forwarded-For", "1.2.3.4, 10.0.0.1");
    http:Request second = new;
    second.setHeader("X-Forwarded-For", "5.6.7.8, 9.9.9.9, 10.0.0.1");
    test:assertEquals(clientAddressBehind(first, 1, "192.168.1.5"), "10.0.0.1");
    test:assertEquals(clientAddressBehind(second, 1, "192.168.1.5"), "10.0.0.1");
}

@test:Config {}
function aClientLineBeforeTheProxyLineDoesNotChangeTheAddress() {
    http:Request first = new;
    first.addHeader("X-Forwarded-For", "1.2.3.4");
    first.addHeader("X-Forwarded-For", "10.0.0.1");
    http:Request second = new;
    second.addHeader("X-Forwarded-For", "5.6.7.8");
    second.addHeader("X-Forwarded-For", "10.0.0.1");
    test:assertEquals(clientAddressBehind(first, 1, "192.168.1.5"), "10.0.0.1");
    test:assertEquals(clientAddressBehind(second, 1, "192.168.1.5"), "10.0.0.1");
}

@test:Config {}
function ignoringTheHeaderUsesTheConnectionAddress() {
    http:Request req = new;
    req.setHeader("X-Forwarded-For", "9.9.9.9, 10.0.0.1");
    test:assertEquals(clientAddressBehind(req, 0, "192.168.1.5"), "192.168.1.5");
}

@test:Config {}
function clientAddressCountsAcrossSeparateForwardedHeaderLines() {
    http:Request twoLines = new;
    twoLines.addHeader("X-Forwarded-For", "9.9.9.9, 10.0.0.2");
    twoLines.addHeader("X-Forwarded-For", "10.0.0.1");
    test:assertEquals(clientAddressBehind(twoLines, 1, "192.168.1.5"), "10.0.0.1");
    test:assertEquals(clientAddressBehind(twoLines, 2, "192.168.1.5"), "10.0.0.2");
}

@test:Config {}
function forwardedHopIsCountedFromTheRight() {
    string chain = "9.9.9.9, 10.0.0.1, 10.0.0.2";
    test:assertEquals(forwardedHop(chain, 1, "192.168.1.5"), "10.0.0.2");
    test:assertEquals(forwardedHop(chain, 2, "192.168.1.5"), "10.0.0.1");
    test:assertEquals(forwardedHop(chain, 3, "192.168.1.5"), "9.9.9.9");
}

@test:Config {}
function aPortDoesNotChangeTheAddress() {
    test:assertEquals(forwardedHop("203.0.113.7:51234", 1, "192.168.1.5"), "203.0.113.7");
    test:assertEquals(forwardedHop("203.0.113.7:40000", 1, "192.168.1.5"), "203.0.113.7");
}

@test:Config {}
function ipv6AddressesAreInOneForm() {
    test:assertEquals(forwardedHop("[2001:DB8::1]:443", 1, "192.168.1.5"), "2001:db8:0:0:0:0:0:1");
    test:assertEquals(forwardedHop("2001:db8:0:0:0:0:0:1", 1, "192.168.1.5"), "2001:db8:0:0:0:0:0:1");
    test:assertEquals(forwardedHop("::1", 1, "192.168.1.5"), "0:0:0:0:0:0:0:1");
    test:assertEquals(forwardedHop("0:0:0:0:0:0:0:1", 1, "192.168.1.5"), "0:0:0:0:0:0:0:1");
    test:assertEquals(forwardedHop("fe80::1%eth0", 1, "192.168.1.5"), "fe80:0:0:0:0:0:0:1");
}

@test:Config {}
function anEntryThatIsNotAnAddressFallsBackToTheConnectionAddress() {
    test:assertEquals(forwardedHop("not-an-ip", 1, "192.168.1.5"), "192.168.1.5");
    test:assertEquals(forwardedHop("999", 1, "192.168.1.5"), "192.168.1.5");
}

@test:Config {}
function anIpv4EntryMustBeFourOctetsUpTo255() {
    test:assertEquals(forwardedHop("255.255.255.255", 1, "192.168.1.5"), "255.255.255.255");
    test:assertEquals(forwardedHop("0.0.0.0", 1, "192.168.1.5"), "0.0.0.0");
    foreach string invalid in ["256.1.1.1", "999.999.999.999", "1.2.3", "1.2.3.4.5", "1.2.3.04", "1.2.3.4.", "1..3.4"] {
        test:assertEquals(forwardedHop(invalid, 1, "192.168.1.5"), "192.168.1.5", invalid);
    }
}

@test:Config {}
function anIpv6EntryMustBeEightGroupsOfUpToFourHexDigits() {
    foreach string invalid in ["1:2:3", "1:2:3:4:5:6:7:8:9", "1::2::3", ":::", "12345::1", "g::1", "1:2:3:4:5:6:7::8:9"] {
        test:assertEquals(forwardedHop(invalid, 1, "192.168.1.5"), "192.168.1.5", invalid);
    }
    test:assertEquals(forwardedHop("1:2:3:4:5:6:7::", 1, "192.168.1.5"), "1:2:3:4:5:6:7:0");
}

@test:Config {}
function anIpv4MappedIpv6AddressIsTheSameAsItsIpv4Address() {
    test:assertEquals(forwardedHop("::ffff:203.0.113.7", 1, "192.168.1.5"), "203.0.113.7");
    test:assertEquals(forwardedHop("::FFFF:203.0.113.7", 1, "192.168.1.5"), "203.0.113.7");
    test:assertEquals(forwardedHop("::ffff:cb00:7107", 1, "192.168.1.5"), "203.0.113.7");
    test:assertEquals(forwardedHop("::FFFF:CB00:7107", 1, "192.168.1.5"), "203.0.113.7");
    test:assertEquals(forwardedHop("0:0:0:0:0:ffff:cb00:7107", 1, "192.168.1.5"), "203.0.113.7");
    test:assertEquals(forwardedHop("0000:0000:0000:0000:0000:ffff:203.0.113.7", 1, "192.168.1.5"), "203.0.113.7");
    test:assertEquals(forwardedHop("[::ffff:203.0.113.7]:443", 1, "192.168.1.5"), "203.0.113.7");
    test:assertEquals(forwardedHop("::ffff:999.0.0.1", 1, "192.168.1.5"), "192.168.1.5");
    test:assertEquals(forwardedHop("::fffe:cb00:7107", 1, "192.168.1.5"), "0:0:0:0:0:fffe:cb00:7107");
}

@test:Config {}
function forwardedHopFallsBackToTheConnectionAddress() {
    test:assertEquals(forwardedHop("10.0.0.1", 0, "192.168.1.5"), "192.168.1.5");
    test:assertEquals(forwardedHop("10.0.0.1", 2, "192.168.1.5"), "192.168.1.5");
    test:assertEquals(forwardedHop("10.0.0.1,", 1, "192.168.1.5"), "192.168.1.5");
}

@test:Config {}
function clientAddressFallsBackToTheConnectionAddress() {
    test:assertEquals(clientAddressBehind(new, 1, "192.168.1.5"), "192.168.1.5");
    test:assertEquals(clientAddressBehind(new, 1, "192.168.1.6"), "192.168.1.6");
}

@test:Config {}
function eachSignedInUserHasTheirOwnAllowance() {
    ApplyRateLimiter limiter = new;
    foreach int attempt in 1 ... signedInMaxPerUser {
        test:assertTrue(limiter.tryAcquireUser("user-a"), string `Request ${attempt} should be allowed`);
    }
    test:assertFalse(limiter.tryAcquireUser("user-a"));
    test:assertTrue(limiter.tryAcquireUser("user-b"));
}
