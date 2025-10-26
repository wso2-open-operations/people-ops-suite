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

public const int MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

# Validates the size of a base64-encoded file.
#
# + base64Content - The base64-encoded file content
# + return - An error if the file exceeds the max size, else nil
public isolated function validateFileSize(string base64Content) returns error? {
    if base64Content == "" {
        return;
    }
    byte[] fileBytes = check array:fromBase64(base64Content);
    if fileBytes.length() > MAX_FILE_SIZE_BYTES {
        return error("File size exceeds the maximum limit of 10 MB");
    }
}

# Extracts the file extension from a given file name.
#
# + fileName - The name of the file
# + return - The file extension or "bin" if none found
isolated function getFileExtension(string? fileName) returns string {
    if fileName is () || fileName == "" {
        return "bin";
    }
    int? dotIndex = fileName.lastIndexOf(".");
    return dotIndex is int ? fileName.substring(dotIndex + 1) : "bin";
}