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
import ballerina/graphql;

configurable string hrEntityBaseUrl = ?;
configurable GraphQlRetryConfig retryConfig = ?;
configurable Oauth2Config oauthConfig = ?;

# Hr Entity -> GraphQL Service Credentials.
@display {
    label: "HR Entity GraphQL Service",
    id: "hris/entity-graphql-service"
}

graphql:Client? hrClient = ();

# Initialize HR GraphQL client.
#
# + return - Error if initialization fails
function init() returns error? {
    hrClient = check new (hrEntityBaseUrl, {
        auth: {
            ...oauthConfig
        },
        retryConfig: {
            ...retryConfig
        }
    });
}

# Get initialized HR GraphQL client.
#
# + return - graphql:Client or error if uninitialized
public function getHrClient() returns graphql:Client|error {
    graphql:Client? hrGraphQlClient = hrClient;
    if hrGraphQlClient is graphql:Client {
        return hrGraphQlClient;
    }
    return error("HR GraphQL client is not initialized");
}
