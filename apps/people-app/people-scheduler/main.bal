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

import ballerina/log;

# Entry point for the scheduled People App job runner (deployed as a WSO2 Choreo Scheduled Task).
# Runs each registered job in turn; a failure in one job is logged but does not prevent the others
# from running.
public function main() {
    error? leaverResult = runLeaverTransition();
    if leaverResult is error {
        log:printError("Leaver auto-transition sweep failed", leaverResult);
    }
    // Future jobs (e.g. probation-to-permanent conversion) are added here the same way: call the
    // job's `run<JobName>()` function (defined in functions.bal) and log (don't propagate) any
    // error, so one job's failure can't stop the others from running.
}
