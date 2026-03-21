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
import people.database;

import ballerina/http;
import ballerina/lang.regexp;
import ballerina/log;

# Generate the next employee ID for the given payload.
#
# + payload - Add employee payload
# + return - Generated or manually provided employee ID string or an HTTP error response in case of failure
public isolated function generateEmployeeId(database:CreateEmployeePayload payload)
        returns string|http:BadRequest|http:InternalServerError {

    database:EmployeeIdContext|error ctx = database:getEmployeeIdContext(
            payload.companyId, payload.employmentTypeId
    );
    if ctx is error {
        string customErr = "Error occurred while fetching employee ID context";
        log:printError(customErr, ctx);
        return <http:InternalServerError>{
            body: {
                message: customErr
            }
        };
    }

    match ctx.employmentType {
        database:PERMANENT|database:INTERNSHIP => {
            database:EmployeeIdSequence|error row = database:getLastEmployeeNumericSuffix(
                    ctx.companyPrefix, [ctx.employmentType]
            );
            if row is error {
                string customErr = "Error occurred while fetching last employee numeric suffix";
                log:printError(customErr, row, employmentType = ctx.employmentType, companyPrefix = ctx.companyPrefix);
                return <http:InternalServerError>{
                    body: {
                        message: customErr
                    }
                };
            }
            return string `${ctx.companyPrefix}${<int>row.lastNumericId + 1}`;
        }
        database:CONSULTANCY|database:ADVISORY_CONSULTANCY|database:PART_TIME_CONSULTANCY => {
            database:EmployeeIdSequence|error row = database:getLastEmployeeNumericSuffix(
                    database:CONSULTANCY_ID_PREFIX, [
                        database:CONSULTANCY,
                        database:ADVISORY_CONSULTANCY,
                        database:PART_TIME_CONSULTANCY
                    ]
            );
            if row is error {
                string customErr = "Error occurred while fetching last employee numeric suffix";
                log:printError(customErr, row, employmentType = ctx.employmentType);
                return <http:InternalServerError>{
                    body: {
                        message: customErr
                    }
                };
            }
            return string `${database:CONSULTANCY_ID_PREFIX}${<int>row.lastNumericId + 1}`;
        }
        database:FIXED_TERM => {
            string manualId = (payload.employeeId ?: "").trim();
            if manualId.length() == 0 {
                string customErr = "Employee ID must be provided manually for fixed-term employment type";
                log:printWarn(customErr);
                return <http:BadRequest>{
                    body: {
                        message: customErr
                    }
                };
            }

            regexp:RegExp|error companyPattern = regexp:fromString(ctx.companyPrefix + "[0-9]+");
            regexp:RegExp|error consultancyPattern = regexp:fromString(database:CONSULTANCY_ID_PREFIX + "[0-9]+");
            if companyPattern is error || consultancyPattern is error {
                string customErr = "Error occurred while validating employee ID pattern";
                log:printError(customErr);
                return <http:InternalServerError>{
                    body: {
                        message: customErr
                    }
                };
            }
            if manualId.matches(companyPattern) || manualId.matches(consultancyPattern) {
                string customErr = string `Employee ID '${manualId}' is reserved for auto-generation and cannot be assigned manually`;
                log:printWarn(customErr, employeeId = manualId);
                return <http:BadRequest>{
                    body: {
                        message: customErr
                    }
                };
            }

            database:Employee|error? existing = database:getEmployeeInfo(manualId);
            if existing is error {
                string customErr = "Error occurred while checking existing employee ID";
                log:printError(customErr, existing, employeeId = manualId);
                return <http:InternalServerError>{
                    body: {
                        message: customErr
                    }
                };
            }
            if existing is database:Employee {
                string customErr = string `Employee ID already in use: ${manualId}`;
                log:printWarn(customErr, employeeId = manualId);
                return <http:BadRequest>{
                    body: {
                        message: customErr
                    }
                };
            }
            return manualId;
        }
        _ => {
            string customErr = string `Unsupported employment type: ${ctx.employmentType}`;
            log:printError(customErr, employmentType = ctx.employmentType);
            return <http:InternalServerError>{
                body: {
                    message: customErr
                }
            };
        }
    }
}
