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

import leaver_sweep.database;
import leaver_sweep.email;

import ballerina/log;

const string LEAVER_SWEEP_ACTOR = "system-scheduler";

public function main() returns error? {
    log:printInfo("Leaver auto-transition sweep started");

    database:LeaverTransition[] transitions = check database:transitionExpiredLeavers(LEAVER_SWEEP_ACTOR);

    if transitions.length() == 0 {
        log:printInfo("Leaver auto-transition sweep completed — no employees due for transition");
        return;
    }

    log:printInfo("Auto-transitioned leavers to Left", count = transitions.length());

    error? notifyResult = email:notifyLeaverAutoTransition(transitions);
    if notifyResult is error {
        log:printError("Failed to send leaver auto-transition summary email", notifyResult);
    }

    log:printInfo("Leaver auto-transition sweep completed");
}
