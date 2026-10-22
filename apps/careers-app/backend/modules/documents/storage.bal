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
import ballerina/time;
import ballerina/url;

// The longest a write waits for the storage service to reply.
const decimal STORAGE_TIMEOUT_SECONDS = 60;

const STORAGE_API_VERSION = "2023-11-03";

// Azure does not accept a chunked body, so the client speaks HTTP/1.1 and is told never to chunk.
final http:Client storageClient = check new (storageConfig.baseUrl, {
    httpVersion: http:HTTP_1_1,
    timeout: STORAGE_TIMEOUT_SECONDS,
    http1Settings: {chunking: http:CHUNKING_NEVER}
});

isolated function sasQuery() returns string {
    string token = storageConfig.sasToken;
    return token.startsWith("?") ? token.substring(1) : token;
}

// The request path of a blob. Each part of the name is encoded, since a candidate's name can hold spaces and letters
// a path does not allow.
isolated function blobPath(string name) returns string|error {
    string[] parts = [];
    foreach string part in re `/`.split(name) {
        parts.push(check url:encode(part, "UTF-8"));
    }
    return string `/${storageConfig.container}/${string:'join("/", ...parts)}?${sasQuery()}`;
}

// The file in a submission's folder that records it and its current state.
isolated function manifestName(string folder) returns string => string `${folder}/submitted.json`;

// The small file that says which folder holds an application's submission, so it can be found by the application id
// alone. It is for this service only; the folders under applications/ are what people open.
isolated function indexName(string applicationId) returns string => string `index/${applicationId}.json`;

// The longest a candidate's name is kept in a folder or file name.
const MAX_STORED_NAME_LENGTH = 80;

// The text as a name a path and a file system accept: characters they reject become spaces, and what is left is
// trimmed. Names that end up empty are replaced by the fallback.
isolated function safeName(string text, string fallback) returns string {
    string cleaned = re `[\\/:*?"<>|\p{Cc}]+`.replaceAll(text, " ");
    cleaned = re `\s+`.replaceAll(cleaned, " ").trim();
    cleaned = re `^[.\s]+|[.\s]+$`.replaceAll(cleaned, "");
    if cleaned.length() > MAX_STORED_NAME_LENGTH {
        cleaned = cleaned.substring(0, MAX_STORED_NAME_LENGTH).trim();
    }
    return cleaned == "" ? fallback : cleaned;
}

// The folder HR opens for a submission: the candidate's full name, then the application id so two candidates with
// the same name never share one.
isolated function folderOf(string candidateName, string applicationId) returns string =>
    string `applications/${safeName(candidateName, "Candidate")} - ${applicationId}`;

// What a document is called in a file name: its label without the explanation in brackets.
isolated function shortLabelOf(string key) returns string {
    foreach DocumentSpec spec in REQUIRED_DOCUMENTS {
        if spec.key == key {
            return safeName(re `\s*\(.*\)`.replaceAll(spec.label, ""), key);
        }
    }
    return safeName(key, "Document");
}

// A document's file, "<full name> - <document>": one fixed name per document, so an edit replaces the earlier file.
isolated function fileName(string folder, string candidateName, string key, string extension) returns string =>
    string `${folder}/${safeName(candidateName, "Candidate")} - ${shortLabelOf(key)}.${extension}`;

isolated function storageError(http:Response resp) returns error {
    string|http:HeaderNotFoundError reason = resp.getHeader("x-ms-error-code");
    // The reply's text says which header or value was refused. It holds no secret, and only its start is kept.
    string|error body = resp.getTextPayload();
    string detail = body is string ? (body.length() > 400 ? body.substring(0, 400) : body) : "";
    return error(string `The storage service replied with status ${resp.statusCode} (${reason is string ? reason : "no reason given"}) ${detail}`);
}

// Writes a blob. With `createOnly` it must not exist yet, and with `etag` it must be unchanged since it was read.
// False when that condition is not met.
isolated function putBlob(string name, byte[] content, string contentType, map<string> metadata,
        boolean createOnly = false, string? etag = ()) returns boolean|error {
    http:Request req = new;
    req.setBinaryPayload(content, contentType);
    req.setHeader("x-ms-blob-type", "BlockBlob");
    req.setHeader("x-ms-version", STORAGE_API_VERSION);
    if createOnly {
        req.setHeader("If-None-Match", "*");
    }
    if etag is string {
        req.setHeader("If-Match", etag);
    }
    // The length is stated up front, so the body is never sent in chunks.
    req.setHeader("Content-Length", content.length().toString());
    foreach [string, string] [key, value] in metadata.entries() {
        req.setHeader("x-ms-meta-" + key, value);
    }
    http:Response resp = check storageClient->put(check blobPath(name), req);
    if resp.statusCode == http:STATUS_CREATED {
        return true;
    }
    if resp.statusCode == http:STATUS_CONFLICT || resp.statusCode == http:STATUS_PRECONDITION_FAILED {
        return false;
    }
    return storageError(resp);
}

# The moment the deadline falls, or nothing when it is not set or cannot be read.
public isolated function editableUntil() returns time:Utc? {
    if submissionDeadline == "" {
        return ();
    }
    time:Utc|error deadline = time:utcFromString(submissionDeadline);
    return deadline is time:Utc ? deadline : ();
}

# Whether a submission can still be changed: only when a deadline is set and has not passed.
public isolated function canEdit() returns boolean {
    time:Utc? deadline = editableUntil();
    return deadline is time:Utc && time:utcDiffSeconds(deadline, time:utcNow()) > 0d;
}

# Reads the record of an application's submission and the tag Azure gives its current version, or nothing when
# there is no submission. Needs a token that may read.
public isolated function loadManifest(string applicationId) returns [Manifest, string]?|error {
    string? folder = check folderOfSubmission(applicationId);
    if folder is () {
        return ();
    }
    http:Response resp = check storageClient->get(check blobPath(manifestName(folder)),
        {"x-ms-version": STORAGE_API_VERSION});
    if resp.statusCode == http:STATUS_NOT_FOUND {
        return ();
    }
    if resp.statusCode != http:STATUS_OK {
        return storageError(resp);
    }
    json body = check resp.getJsonPayload();
    Manifest manifest = check body.fromJsonWithType();
    string etag = check resp.getHeader("ETag");
    return [manifest, etag];
}

// The folder that holds an application's submission, from the index, or nothing when it has none.
isolated function folderOfSubmission(string applicationId) returns string?|error {
    http:Response resp = check storageClient->get(check blobPath(indexName(applicationId)),
        {"x-ms-version": STORAGE_API_VERSION});
    if resp.statusCode == http:STATUS_NOT_FOUND {
        return ();
    }
    if resp.statusCode != http:STATUS_OK {
        return storageError(resp);
    }
    json body = check resp.getJsonPayload();
    SubmissionIndex index = check body.fromJsonWithType();
    return index.folder;
}

# What the candidate's page needs to know: whether they submitted, whether they can still change it and until
# when, and, for the candidate whose submission it is, the details they saved and which documents they sent.
public isolated function submissionStatus(string applicationId) returns SubmissionStatus|error {
    [Manifest, string]? loaded = check loadManifest(applicationId);
    if loaded is () {
        return {submitted: false, canEdit: false, editableUntil: submissionDeadline};
    }
    Manifest manifest = loaded[0];
    return {
        submitted: true,
        canEdit: canEdit(),
        editableUntil: submissionDeadline,
        details: manifest.details,
        files: manifest.files.keys()
    };
}

# Stores a first submission: the documents, then the record of it. Nothing is written when the application already
# has a submission, and the record cannot overwrite one that appears in the meantime.
public isolated function storeDocuments(string applicationId, Submission submission, string candidateName,
        string requestId) returns SubmitOutcome|error {
    [Manifest, string]? existing = check loadManifest(applicationId);
    if existing !is () {
        return ALREADY_SUBMITTED;
    }
    map<string> metadata = {applicationid: applicationId, requestid: requestId};
    string folder = folderOf(candidateName, applicationId);
    map<string> files = {};
    foreach UploadedDocument document in submission.documents {
        string name = fileName(folder, candidateName, document.key, document.extension);
        _ = check putBlob(name, document.content, document.contentType, metadata);
        files[document.key] = name;
    }
    string now = time:utcToString(time:utcNow());
    Manifest manifest = {
        applicationId,
        candidateName,
        folder,
        details: submission.details,
        files,
        declared: true,
        submittedAt: now,
        updatedAt: now
    };
    boolean written = check putBlob(manifestName(folder), manifest.toJsonString().toBytes(),
        "application/json", metadata, createOnly = true);
    // The index is written even when the record already existed, so a submission whose index was lost is found again.
    SubmissionIndex index = {folder};
    _ = check putBlob(indexName(applicationId), index.toJsonString().toBytes(), "application/json", metadata);
    return written ? STORED : ALREADY_SUBMITTED;
}

# Applies a candidate's changes to a submission: the files they sent replace the earlier ones, and the details are
# replaced. The record is only replaced if nobody changed it since it was read, which is false when someone did.
public isolated function saveChanges(string applicationId, Manifest current, string etag, Submission update,
        string candidateName, string requestId) returns boolean|error {
    map<string> metadata = {applicationid: applicationId, requestid: requestId};
    map<string> files = current.files.clone();
    // The folder and the file names keep the name the submission was made under, so a change of name does not
    // leave the earlier files behind.
    string folder = current.folder;
    foreach UploadedDocument document in update.documents {
        string name = fileName(folder, current.candidateName, document.key, document.extension);
        _ = check putBlob(name, document.content, document.contentType, metadata);
        string? previous = files[document.key];
        if previous is string && previous != name {
            // The earlier file has another extension. It cannot be deleted with this token, so it is emptied.
            _ = check putBlob(previous, [], "application/octet-stream", metadata);
        }
        files[document.key] = name;
    }
    Manifest next = {
        applicationId: current.applicationId,
        candidateName,
        folder,
        details: update.details,
        files,
        declared: true,
        submittedAt: current.submittedAt,
        updatedAt: time:utcToString(time:utcNow())
    };
    return putBlob(manifestName(folder), next.toJsonString().toBytes(), "application/json", metadata, etag = etag);
}
