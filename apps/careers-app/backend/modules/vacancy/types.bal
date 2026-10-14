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

# career-vacancy-service connection details.
public type VacancyConfig record {|
    string baseUrl;
    string tokenUrl;
    string clientId;
    string clientSecret;
|};

# Candidate details posted to career-vacancy-service when someone applies. `resume` holds the CV's bytes,
# which the service expects as a JSON array of byte values.
public type CandidateApplication record {|
    string firstName;
    string lastName;
    string personalEmail;
    string contactNo;
    string address;
    byte[] resume;
    string taskInfo?;
    string university?;
    string wso2Email?;
|};

type TokenResponse record {
    string access_token;
    int expires_in;
};
