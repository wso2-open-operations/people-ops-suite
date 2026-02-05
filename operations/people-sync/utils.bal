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

import people_sync.peopleHr;

import ballerina/io;

// TODO: Define all mandatory fields here.
final string[] & readonly mandatoryFields = ["workEmail"];

# Get the list of mandatory fields that are missing for an employee.
#
# + employee - Employee record to be validated
# + return - List of missing mandatory fields
isolated function getMissingMandatoryFields(peopleHr:Employee employee) returns string[]
    => from string fieldName in employee.keys()
    where mandatoryFields.indexOf(fieldName) != () && employee[fieldName] is ()
    select fieldName;

# Write missing fields map to CSV file.
#
# + missingFieldsMap - Map of employee ID to missing fields
# + return - Error if file writing fails
function writeMissingFieldsToCsv(map<string[]> missingFieldsMap) returns error? {
    string[][] csvData = [["Employee ID", "Missing Fields"]];
    foreach [string, string[]] [employeeId, missingFields] in missingFieldsMap.entries() {
        string missingFieldsStr = string:'join(", ", ...missingFields);
        csvData.push([employeeId, missingFieldsStr]);
    }

    // TODO: Send the file as an email attachment instead of writing to disk.
    check io:fileWriteCsv("missing_fields_report.csv", csvData);
}
