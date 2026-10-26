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
import leave_service.authorization;
import leave_service.database;
import leave_service.employee;
import leave_service.policy;
import leave_service.sick_note;

import ballerina/http;
import ballerina/lang.value;
import ballerina/log;
import ballerina/mime;

# Key that encrypts sick notes: 32 bytes, base64-encoded. Each environment has its own key, kept in the secret store.
configurable string sickNoteEncryptionKey = ?;

# The decoded sick note key. A key that is not base64 of exactly 32 bytes stops the service from starting.
final byte[] & readonly sickNoteKey = check sick_note:decodeKey(sickNoteEncryptionKey).cloneReadOnly();

# Name of the multipart part that carries the leave as JSON.
const LEAVE_PART = "leave";

# Name of the multipart part that carries the sick note file.
const SICK_NOTE_PART = "sickNote";

const ERR_MSG_SUBMIT_LEAVE_FAILED = "Error occurred while submitting a leave";
const ERR_MSG_SICK_NOTE_NOT_FOUND = "No sick note was found for this leave.";
const ERR_MSG_SICK_NOTE_UNREADABLE = "The sick note could not be read.";

# Leave and sick note sent together to submit sick leave in France.
type SickLeaveSubmission record {|
    # The leave, as sent to `POST /leaves`
    LeavePayload leave;
    # The sick note file. Empty when the request has no sick note part
    byte[] sickNote;
|};

# Submit sick leave in France with its sick note. The note is checked, encrypted and saved with the leave in one
# transaction; the leave then goes through the same submission as `POST /leaves`. The note is never sent by email or
# added to the calendar event.
#
# + req - Multipart request with the `leave` and `sickNote` parts
# + email - Email of the applicant
# + jwt - JWT token of the applicant
# + return - Ok when the leave is submitted, BadRequest for an invalid leave or sick note, otherwise
# InternalServerError
function submitSickLeave(http:Request req, string email, string jwt)
    returns http:Ok|http:BadRequest|http:InternalServerError {

    SickLeaveSubmission|error submission = readSickLeaveParts(req);
    if submission is error {
        return <http:BadRequest>{
            body: {
                message: submission.message()
            }
        };
    }
    string|error contentType = sick_note:detectContentType(submission.sickNote);
    if contentType is error {
        return <http:BadRequest>{
            body: {
                message: contentType.message()
            }
        };
    }
    string|error location = employee:getEmployeeLocation(email, jwt);
    if location is error {
        log:printError(ERR_MSG_SUBMIT_LEAVE_FAILED, location);
        return <http:InternalServerError>{
            body: {
                message: ERR_MSG_SUBMIT_LEAVE_FAILED
            }
        };
    }
    if !policy:requiresSickNote(submission.leave.leaveType, location) {
        return <http:BadRequest>{
            body: {
                message: "This endpoint is only for sick leave in France."
            }
        };
    }
    sick_note:EncryptedSickNote|error encrypted = sick_note:encrypt(submission.sickNote, sickNoteKey);
    if encrypted is error {
        log:printError("Error occurred while encrypting a sick note", encrypted);
        return <http:InternalServerError>{
            body: {
                message: ERR_MSG_SUBMIT_LEAVE_FAILED
            }
        };
    }

    CalculatedLeave|http:Ok|http:BadRequest|http:InternalServerError result = submitLeave(submission.leave, email, jwt,
            false, {
                content: encrypted.content,
                iv: encrypted.iv,
                keyId: encrypted.keyId,
                contentType,
                sizeBytes: submission.sickNote.length(),
                uploadedBy: email
            });
    // Not reached: a calculated leave is returned only in validation mode, which this submission never uses.
    if result is CalculatedLeave {
        return <http:InternalServerError>{
            body: {
                message: ERR_MSG_SUBMIT_LEAVE_FAILED
            }
        };
    }
    return result;
}

# Read the `leave` and `sickNote` parts of a multipart sick leave request.
#
# + req - Multipart request
# + return - The leave and the sick note file, or an error whose message can be shown to the user
function readSickLeaveParts(http:Request req) returns SickLeaveSubmission|error {
    mime:Entity[]|http:ClientError parts = req.getBodyParts();
    if parts is http:ClientError {
        return error("Send the leave and the sick note as multipart/form-data.", parts);
    }
    LeavePayload? leave = ();
    byte[] sickNote = [];
    foreach mime:Entity part in parts {
        string partName = part.getContentDisposition().name;
        if partName == LEAVE_PART {
            LeavePayload|error leavePart = readLeavePart(part);
            if leavePart is error {
                return error("The leave part is not a valid leave.", leavePart);
            }
            leave = leavePart;
        } else if partName == SICK_NOTE_PART {
            byte[]|mime:ParserError sickNotePart = part.getByteArray();
            if sickNotePart is mime:ParserError {
                return error("The sick note could not be read from the request.", sickNotePart);
            }
            sickNote = sickNotePart;
        }
    }
    if leave is () {
        return error("The leave part is missing.");
    }
    return {leave, sickNote};
}

# Read the leave from the `leave` part, which carries the same JSON as the `POST /leaves` body.
#
# + part - The `leave` part
# + return - The leave, or an error if the part is not a valid leave
function readLeavePart(mime:Entity part) returns LeavePayload|error {
    byte[] content = check part.getByteArray();
    return value:fromJsonStringWithType(check string:fromBytes(content));
}

# Send a sick note to the applicant or a member of `sickNoteRoles`. The download is recorded before the file is sent,
# and the file is not sent if the record cannot be saved.
#
# + leaveId - Leave ID
# + requesterEmail - Email of the user asking for the file
# + requesterGroups - Groups of the user asking for the file
# + return - The file, NotFound if the leave has no sick note or it was deleted, Forbidden for anyone other than the
# applicant and `sickNoteRoles`, otherwise InternalServerError
function downloadSickNote(int leaveId, string requesterEmail, string[] requesterGroups)
    returns http:Response|http:NotFound|http:Forbidden|http:InternalServerError {

    database:StoredSickNote|error? sickNote = database:getSickNote(leaveId);
    if sickNote is error {
        string errMsg = "Error occurred while fetching the sick note";
        log:printError(errMsg, sickNote, leaveId = leaveId);
        return <http:InternalServerError>{
            body: {
                message: errMsg
            }
        };
    }
    if sickNote is () {
        return <http:NotFound>{
            body: {
                message: ERR_MSG_SICK_NOTE_NOT_FOUND
            }
        };
    }
    if !sick_note:canDownload(requesterEmail, requesterGroups, sickNote.email,
            authorization:authorizedRoles.sickNoteRoles) {
        log:printWarn("Sick note download refused", leaveId = leaveId, requestedBy = requesterEmail);
        return <http:Forbidden>{
            body: {
                message: "You are not authorized to download this sick note."
            }
        };
    }
    byte[]? content = sickNote.content;
    byte[]? iv = sickNote.iv;
    if sickNote.deletedAt is string || content is () || iv is () {
        return <http:NotFound>{
            body: {
                message: ERR_MSG_SICK_NOTE_NOT_FOUND
            }
        };
    }

    // Only the current key exists; a note under any other key id cannot be decrypted.
    byte[]|error file = sickNote.keyId == sick_note:CURRENT_KEY_ID
        ? sick_note:decrypt({content, iv, keyId: sickNote.keyId}, sickNoteKey)
        : error(string `No key is configured for key id ${sickNote.keyId}.`);
    if file is error {
        log:printError(ERR_MSG_SICK_NOTE_UNREADABLE, file, leaveId = leaveId);
        return <http:InternalServerError>{
            body: {
                message: ERR_MSG_SICK_NOTE_UNREADABLE
            }
        };
    }
    error? recorded = database:recordSickNoteDownload(sickNote.id, leaveId, requesterEmail);
    if recorded is error {
        string errMsg = "Error occurred while recording the sick note download";
        log:printError(errMsg, recorded, leaveId = leaveId);
        return <http:InternalServerError>{
            body: {
                message: errMsg
            }
        };
    }
    log:printInfo("Sick note downloaded", leaveId = leaveId, downloadedBy = requesterEmail);

    http:Response response = new;
    response.setBinaryPayload(file, sickNote.contentType);
    response.setHeader("Content-Disposition",
            string `attachment; filename="${sick_note:downloadFileName(leaveId, sickNote.contentType)}"`);
    response.setHeader("Cache-Control", "no-store");
    return response;
}
