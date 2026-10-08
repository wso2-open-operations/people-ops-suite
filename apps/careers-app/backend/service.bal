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

import wso2/careers_app.apply;
import wso2/careers_app.jwt;
import wso2/careers_app.types;
import wso2/careers_app.vacancy;

import ballerina/http;
import ballerina/log;

configurable string[] allowedOrigins = ?;
configurable int port = ?;

# Longest piece of an upstream reply written to the log.
const int MAX_LOGGED_REPLY_LENGTH = 200;

final apply:ApplyRateLimiter applyRateLimiter = new;

# Passes an upstream JSON response, or maps its failure to a gateway error.
isolated function forwardOrError(http:Response|error resp, string failureMessage, string requestId)
        returns json|http:BadGateway|http:GatewayTimeout {
    if resp is error {
        log:printError(failureMessage, resp, requestId = requestId);
        return <http:GatewayTimeout>{body: {message: "Upstream service unreachable"}};
    }
    if resp.statusCode == 503 || resp.statusCode == 504 {
        log:printError(string `${failureMessage}: status ${resp.statusCode}`, requestId = requestId);
        return <http:GatewayTimeout>{body: {message: "Upstream service unreachable"}};
    }
    if resp.statusCode != 200 {
        log:printError(string `${failureMessage}: status ${resp.statusCode}`, requestId = requestId);
        return <http:BadGateway>{body: {message: failureMessage}};
    }
    json|error respBody = resp.getJsonPayload();
    if respBody is error {
        log:printError(failureMessage + " (non-JSON body)", respBody, requestId = requestId);
        return <http:BadGateway>{body: {message: failureMessage}};
    }
    return respBody;
}

@http:ServiceConfig {
    cors: {
        allowOrigins: allowedOrigins,
        allowMethods: [http:GET, http:POST, http:OPTIONS],
        allowHeaders: [http:CONTENT_TYPE, http:AUTH_HEADER, types:REQUEST_ID_HEADER],
        allowCredentials: true,
        maxAge: 84900
    }
}
service http:InterceptableService / on new http:Listener(port, requestLimits = {maxEntityBodySize: apply:MAX_REQUEST_BYTES}) {

    function init() {
        log:printInfo("Careers App backend started...");
    }

    public function createInterceptors() returns http:Interceptor[] =>
        [new types:RequestIdInterceptor(), new apply:RemoteAddressInterceptor(), new jwt:JwtInterceptor()];

    # Proxies the job listing from career-vacancy-service. Public: no sign-in needed.
    resource function get jobs(http:RequestContext ctx) returns json|http:BadGateway|http:GatewayTimeout {
        string requestId = types:requestIdOf(ctx);
        http:Response|error resp = vacancy:listJobs(requestId);
        return forwardOrError(resp, "Failed to fetch jobs from upstream service", requestId);
    }

    # Proxies the team/location org structure from career-vacancy-service. Public: no sign-in needed.
    resource function get jobs/org\-structure(http:RequestContext ctx)
            returns json|http:BadGateway|http:GatewayTimeout {
        string requestId = types:requestIdOf(ctx);
        http:Response|error resp = vacancy:getOrgStructure(requestId);
        return forwardOrError(resp, "Failed to fetch org structure from upstream service", requestId);
    }

    # Proxies a single job's detail from career-vacancy-service, 404 if it doesn't exist. Public: no sign-in needed.
    resource function get jobs/[string jobId](http:RequestContext ctx)
            returns json|http:BadRequest|http:NotFound|http:BadGateway|http:GatewayTimeout {
        if !types:isValidJobId(jobId) {
            return <http:BadRequest>{body: {message: "Invalid job id"}};
        }
        string requestId = types:requestIdOf(ctx);
        http:Response|error resp = vacancy:getJob(jobId, requestId);
        if resp is error {
            log:printError("Failed to fetch job from upstream service", resp, requestId = requestId);
            return <http:GatewayTimeout>{body: {message: "Upstream service unreachable"}};
        }
        if resp.statusCode == 404 {
            return <http:NotFound>{body: {message: "Job not found"}};
        }
        return forwardOrError(resp, "Failed to fetch job from upstream service", requestId);
    }

    # Validates the application form and CV, then creates the candidate in career-vacancy-service.
    # Public: guests have no account, so each address and each email is rate limited instead.
    resource function post jobs/[string jobId]/apply(http:Request req, http:RequestContext ctx)
            returns http:Created|http:BadRequest|http:NotFound|http:TooManyRequests|http:BadGateway|http:GatewayTimeout {
        if !types:isValidJobId(jobId) {
            return <http:BadRequest>{body: {message: "Invalid job id"}};
        }
        string requestId = types:requestIdOf(ctx);
        string address = apply:clientAddress(req, apply:remoteHost(ctx));
        if !applyRateLimiter.tryAcquire(apply:limiterKey("ip", address)) {
            log:printWarn("Application rate limit reached for a client address", requestId = requestId);
            return <http:TooManyRequests>{body: {message: "Too many applications. Please try again later."}};
        }

        apply:ApplicationForm|string form = apply:parseApplicationForm(req);
        if form is string {
            return <http:BadRequest>{body: {message: form}};
        }

        if !applyRateLimiter.tryAcquire(apply:limiterKey("email", form.email.toLowerAscii())) {
            log:printWarn("Application rate limit reached for an email address", requestId = requestId);
            return <http:TooManyRequests>{body: {message: "Too many applications. Please try again later."}};
        }

        vacancy:CandidateApplication candidate = {
            firstName: form.firstName,
            lastName: form.lastName,
            personalEmail: form.email,
            contactNo: form.phone,
            address: form.address,
            resume: form.cv
        };
        http:Response|error resp = vacancy:applyForJob(jobId, candidate, requestId);
        if resp is error {
            log:printError("Failed to reach the vacancy service for an application", resp, requestId = requestId);
            return <http:GatewayTimeout>{body: {message: "Upstream service unreachable"}};
        }
        if resp.statusCode < 200 || resp.statusCode >= 300 {
            // Log the upstream status and a short piece of its reply, never the applicant's details.
            string|error reply = resp.getTextPayload();
            string replySnippet = reply is string ? (reply.length() > MAX_LOGGED_REPLY_LENGTH
                ? reply.substring(0, MAX_LOGGED_REPLY_LENGTH) : reply) : "";
            log:printError(string `Vacancy service did not accept an application for vacancy ${jobId}: status ${resp.statusCode}`,
                reply = replySnippet, requestId = requestId);
            return apply:applyFailure(resp.statusCode);
        }
        log:printInfo(string `Application submitted for vacancy ${jobId}`, requestId = requestId);
        return <http:Created>{body: {message: "Application submitted"}};
    }
}
