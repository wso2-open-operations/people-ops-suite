// Copyright (c) 2025 WSO2 LLC. (https://www.wso2.com).
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
import ballerina/mime;
import ballerinax/googleapis.drive;

public configurable string googleDriveParentDirName = ?;
final drive:Client gDriveClient = check initializeGoogleDriveClient();

# Retrieves (or creates) the **root parent folder**.
#
# + return - Folder ID as a string, or an error if the operation fails
public isolated function getGDriveParentFolder() returns string|error {
    log:printDebug("Retrieving parent folder ID for: " + googleDriveParentDirName);
    stream<drive:File> parentSearch = check gDriveClient->getFoldersByName(googleDriveParentDirName);
    record {|drive:File value;|}? parentRecord = parentSearch.next();
    parentSearch.close();

    if parentRecord is () {
        log:printWarn("Parent folder not found, creating: " + googleDriveParentDirName);
        drive:File parentFolder = check gDriveClient->createFolder(googleDriveParentDirName);
        return parentFolder.id.toString();
    }

    log:printDebug("Parent folder found: " + parentRecord.value.id.toString());
    return parentRecord.value.id.toString();
}

# Retrieves or creates an applicant-specific folder inside the parent folder.
#
# + email - The name of the applicant folder (usually the applicant's email)
# + return - Folder ID as a string, or an error if the operation fails
public isolated function getApplicantFolder(string email) returns string|error {
    string parentId = check getGDriveParentFolder();

    log:printDebug("Searching for applicant folder: " + email + " inside parent: " + parentId);

    // Search for folder with specific name AND parent folder
    string query = string `name='${email}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
    stream<drive:File, error?> applicantSearch = check gDriveClient->getAllFiles(query);
    record {|drive:File value;|}? applicantRecord = check applicantSearch.next();

    check applicantSearch.close();

    if applicantRecord is () {
        log:printWarn("Applicant folder not found, creating: " + email);
        drive:File newFolder = check gDriveClient->createFolder(email, parentId);
        return newFolder.id.toString();
    }

    log:printDebug("Applicant folder found: " + applicantRecord.value.id.toString());
    return applicantRecord.value.id.toString();
}

# Uploads a profile photo to the applicant's Google Drive folder and returns the byte array.
#
# + photoBytes - Byte array content of the profile photo
# + fileName - The file name for the photo (with extension)
# + email - The email of the applicant
# + return - The byte array of the photo or an error if upload/validation fails
public isolated function uploadApplicantPhoto(byte[] photoBytes, string fileName, string email)
    returns byte[]|error {
    if photoBytes.length() == 0 {
        return [];
    }

    string folderId = check getApplicantFolder(email);

    log:printDebug("Uploading profile photo: " + fileName);
    drive:File uploaded = check gDriveClient->uploadFileUsingByteArray(photoBytes, fileName, folderId);
    drive:File fileMeta = check gDriveClient->getFile(uploaded.id.toString(), "webViewLink, mimeType");

    string mimeType = fileMeta.mimeType.toString();
    if !mimeType.startsWith("image/") {
        _ = check gDriveClient->deleteFile(uploaded.id.toString());
        return error InvalidFileTypeError(string `Invalid photo type. Expected image/*, but got ${mimeType}.`);
    }

    log:printDebug("Profile photo uploaded successfully and returning byte array");
    return photoBytes;
}

# Uploads a CV to the applicant's Google Drive folder and returns the byte array.
#
# + cvBytes - Byte array content of the CV
# + fileName - The file name for the CV (with extension)
# + applicantFolderName - The name of the applicant folder
# + return - The byte array of the CV or an error if upload/validation fails
public isolated function uploadApplicantCv(byte[] cvBytes, string fileName, string applicantFolderName)
    returns byte[]|error {
    if cvBytes.length() == 0 {
        return [];
    }

    string folderId = check getApplicantFolder(applicantFolderName);

    log:printDebug("Uploading CV: " + fileName);
    drive:File uploaded = check gDriveClient->uploadFileUsingByteArray(cvBytes, fileName, folderId);
    drive:File fileMeta = check gDriveClient->getFile(uploaded.id.toString(), "webViewLink, mimeType");

    string mimeType = fileMeta.mimeType.toString();
    if mimeType != mime:APPLICATION_PDF {
        _ = check gDriveClient->deleteFile(uploaded.id.toString());
        return error InvalidFileTypeError(string `Invalid CV type. Expected PDF, but got ${mimeType}.`);
    }

    log:printDebug("CV uploaded successfully and returning byte array");
    return cvBytes;
}
