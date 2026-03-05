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

import careers_app.people;

import ballerina/cache;
import ballerina/log;

public const int MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

# Validates the size of a byte array file.
#
# + fileBytes - The byte array content of the file
# + return - An error if the file exceeds the max size, else nil
public isolated function validateFileSize(byte[] fileBytes) returns error? {
    if fileBytes.length() == 0 {
        return;
    }
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

# Get cached company details.
#
# + return - Array of Companies or error
public isolated function getCompanies() returns people:Company[]|error {
    lock {
        people:Company[]|error|() cachedCompanies = companiesCache.get(CACHE_KEY_COMPANIES).ensureType();
        if cachedCompanies is people:Company[] {
            return cachedCompanies.cloneReadOnly();
        } else {
            people:Company[]|error fetchedCompanies = people:getCompanies();
            if fetchedCompanies is error {
                log:printError("Error while retrieving companies.", fetchedCompanies);
                return error("Error while retrieving companies.");
            }
            cache:Error? cacheErr = companiesCache.put(CACHE_KEY_COMPANIES, fetchedCompanies.cloneReadOnly());
            if cacheErr is cache:Error {
                log:printError("Failed to cache companies.", cacheErr);
            }
            return fetchedCompanies.cloneReadOnly();
        }
    }
}

# Get cached organizational details.
#
# + return - Array of BusinessUnit records or error
public isolated function getOrgDetails() returns people:BusinessUnit[]|error {
    lock {
        people:BusinessUnit[]|error|() cachedOrgDetails = orgDetailsCache.get(CACHE_KEY_ORG_DETAILS).ensureType();
        if cachedOrgDetails is people:BusinessUnit[] {
            return cachedOrgDetails.cloneReadOnly();
        } else {
            people:BusinessUnit[]|error fetchedBusinessUnits = people:getOrgDetails();
            if fetchedBusinessUnits is error {
                log:printError("Error while retrieving org details.", fetchedBusinessUnits);
                return error("Error while retrieving org details.");
            }
            cache:Error? cacheErr = orgDetailsCache.put(CACHE_KEY_ORG_DETAILS, fetchedBusinessUnits.cloneReadOnly());
            if cacheErr is cache:Error {
                log:printError("Failed to cache org details.", cacheErr);
            }
            return fetchedBusinessUnits.cloneReadOnly();
        }
    }
}

# Get designation name by designation ID.
#
# + designationId - Designation ID
# + return - Designation name or error
public isolated function getDesignationById(int designationId) returns string|error {
    string[] designations = from people:CareerFunction cf in check people:getCareerFunctions()
        let people:Designation[] designationList = cf.designations
        from people:Designation designation in designationList
        where designation.id === designationId
        select designation.designation;

    if designations.length() === 0 {
        return error(string `No designation found for ${designationId}`);
    }
    if designations.length() > 1 {
        return error(string `Multiple designations found for ${designationId}`);
    }

    return designations[0];
}

