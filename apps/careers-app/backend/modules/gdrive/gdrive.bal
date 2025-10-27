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

import ballerina/lang.array;
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

    log:printDebug("Searching for applicant folder: " + email);
    stream<drive:File> applicantSearch = check gDriveClient->getFoldersByName(email);
    record {|drive:File value;|}? applicantRecord = applicantSearch.next(); 
    applicantSearch.close();

    if applicantRecord is () {
        log:printWarn("Applicant folder not found, creating: " + email);
        drive:File newFolder = check gDriveClient->createFolder(email, parentId);
        return newFolder.id.toString();
    }

    log:printDebug("Applicant folder found: " + applicantRecord.value.id.toString());
    return applicantRecord.value.id.toString();
}

# Uploads a profile photo to the applicant's Google Drive folder and returns the web view link.
#
# + base64Photo - Base64 encoded content of the profile photo
# + fileName - The file name for the photo (with extension)
# + email - The email of the applicant
# + return - The web view link of the uploaded photo or an error if upload/validation fails
public isolated function uploadApplicantPhoto(string base64Photo, string fileName, string email)
    returns string|error {
    if base64Photo == "" {
        return "";
    }

    string folderId = check getApplicantFolder(email);
    byte[] photoBytes = check array:fromBase64(base64Photo);

    log:printDebug("Uploading profile photo: " + fileName);
    drive:File uploaded = check gDriveClient->uploadFileUsingByteArray(photoBytes, fileName, folderId);
    drive:File fileMeta = check gDriveClient->getFile(uploaded.id.toString(), "webViewLink, mimeType");

    string mimeType = fileMeta.mimeType.toString();
    if !mimeType.startsWith("image/") {
        _ = check gDriveClient->deleteFile(uploaded.id.toString());
        return error InvalidFileTypeError(string `Invalid photo type. Expected image/*, but got ${mimeType}.`);
    }

    log:printDebug("Profile photo uploaded successfully: " + fileMeta.webViewLink.toString());
    return fileMeta.webViewLink.toString();
}

# Uploads a CV to the applicant's Google Drive folder and returns the web view link.
#
# + base64Cv - Base64 encoded content of the CV
# + fileName - The file name for the CV (with extension)
# + applicantFolderName - The name of the applicant folder
# + return - The web view link of the uploaded CV or an error if upload/validation fails
public isolated function uploadApplicantCv(string base64Cv, string fileName, string applicantFolderName)
    returns string|error {
    if base64Cv == "" {
        return "";
    }

    string folderId = check getApplicantFolder(applicantFolderName);
    byte[] cvBytes = check array:fromBase64(base64Cv);

    log:printDebug("Uploading CV: " + fileName);
    drive:File uploaded = check gDriveClient->uploadFileUsingByteArray(cvBytes, fileName, folderId);
    drive:File fileMeta = check gDriveClient->getFile(uploaded.id.toString(), "webViewLink, mimeType");

    string mimeType = fileMeta.mimeType.toString();
    if mimeType != mime:APPLICATION_PDF {
        _ = check gDriveClient->deleteFile(uploaded.id.toString());
        return error InvalidFileTypeError(string `Invalid CV type. Expected PDF, but got ${mimeType}.`);
    }

    log:printDebug("CV uploaded successfully: " + fileMeta.webViewLink.toString());
    return fileMeta.webViewLink.toString();
}
