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
