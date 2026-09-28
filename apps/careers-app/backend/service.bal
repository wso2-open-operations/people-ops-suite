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

import wso2/careers_app.jwt;
import wso2/careers_app.vacancy;

import ballerina/http;
import ballerina/log;

configurable string[] allowedOrigins = ?;
configurable int port = ?;


# Resolves the authenticated caller
isolated function requireUser(http:RequestContext ctx) returns jwt:AsgardeoJwt|http:Unauthorized {
    jwt:AsgardeoJwt|error user = jwt:getUser(ctx);
    if user is error {
        return <http:Unauthorized>{body: {message: "Unauthorized"}};
    }
    return user;
}


# Passes an upstream JSON response.
isolated function forwardOrError(http:Response|error resp, string failureMessage)
        returns json|http:BadGateway|http:GatewayTimeout {
    if resp is error {
        log:printError(failureMessage, resp);
        return <http:GatewayTimeout>{body: {message: "Upstream service unreachable"}};
    }
    if resp.statusCode != 200 {
        log:printError(string `${failureMessage}: status ${resp.statusCode}`);
        return <http:BadGateway>{body: {message: failureMessage}};
    }
    json|error respBody = resp.getJsonPayload();
    if respBody is error {
        log:printError(failureMessage + " (non-JSON body)", respBody);
        return <http:BadGateway>{body: {message: failureMessage}};
    }
    return respBody;
}

@http:ServiceConfig {
    cors: {
        allowOrigins: allowedOrigins,
        allowMethods: [http:GET, http:POST, http:PATCH, http:DELETE, http:OPTIONS],
        allowHeaders: [http:CONTENT_TYPE, http:AUTH_HEADER],
        allowCredentials: true,
        maxAge: 84900
    }
}
service http:InterceptableService / on new http:Listener(port) {

    function init() {
        log:printInfo("Careers App backend started...");
    }

    public function createInterceptors() returns http:Interceptor[] => [new jwt:JwtInterceptor()];

    # Proxies the job listing from career-vacancy-service.
    resource function get jobs(http:RequestContext ctx)
            returns json|http:Unauthorized|http:BadGateway|http:GatewayTimeout {
        jwt:AsgardeoJwt|http:Unauthorized userResult = requireUser(ctx);
        if userResult is http:Unauthorized {
            return userResult;
        }
        http:Response|error resp = vacancy:listJobs();
        return forwardOrError(resp, "Failed to fetch jobs from upstream service");
    }

    # Proxies the team/location org structure from career-vacancy-service.
    resource function get jobs/org\-structure(http:RequestContext ctx)
            returns json|http:Unauthorized|http:BadGateway|http:GatewayTimeout {
        jwt:AsgardeoJwt|http:Unauthorized userResult = requireUser(ctx);
        if userResult is http:Unauthorized {
            return userResult;
        }
        http:Response|error resp = vacancy:getOrgStructure();
        return forwardOrError(resp, "Failed to fetch org structure from upstream service");
    }

    # Proxies a single job's detail from career-vacancy-service, 404 if it doesn't exist.
    resource function get jobs/[string jobId](http:RequestContext ctx)
            returns json|http:Unauthorized|http:NotFound|http:BadGateway|http:GatewayTimeout {
        jwt:AsgardeoJwt|http:Unauthorized userResult = requireUser(ctx);
        if userResult is http:Unauthorized {
            return userResult;
        }
        http:Response|error resp = vacancy:getJob(jobId);
        if resp is error {
            log:printError("Failed to fetch job from upstream service", resp);
            return <http:GatewayTimeout>{body: {message: "Upstream service unreachable"}};
        }
        if resp.statusCode == 404 {
            return <http:NotFound>{body: {message: "Job not found"}};
        }
        return forwardOrError(resp, "Failed to fetch job from upstream service");
    }
}
