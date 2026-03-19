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

import ballerina/lang.regexp;

# Generate the next employee ID for the given payload.
#
# + payload - Add employee payload
# + return - Generated or manually provided employee ID string, or error
public isolated function generateEmployeeId(database:CreateEmployeePayload payload)
        returns string|error {

    database:EmployeeIdContext ctx = check database:getEmployeeIdContext(
            payload.companyId, payload.employmentTypeId
    );

    match ctx.employmentType {
        database:PERMANENT|database:INTERNSHIP => {
            database:EmployeeIdSequence row = check database:getLastEmployeeNumericSuffix(
                    ctx.companyPrefix, [ctx.employmentType]
            );
            return string `${ctx.companyPrefix}${<int>row.lastNumericId + 1}`;
        }
        database:CONSULTANCY|database:ADVISORY_CONSULTANCY|database:PART_TIME_CONSULTANCY => {
            database:EmployeeIdSequence row = check database:getLastEmployeeNumericSuffix(
                    database:CONSULTANCY_ID_PREFIX, [
                        database:CONSULTANCY,
                        database:ADVISORY_CONSULTANCY,
                        database:PART_TIME_CONSULTANCY
                    ]
            );
            return string `${database:CONSULTANCY_ID_PREFIX}${<int>row.lastNumericId + 1}`;
        }
        database:FIXED_TERM => {
            string manualId = (payload.employeeId ?: "").trim();
            if manualId.length() == 0 {
                return error("Employee ID must be provided manually for fixed-term employment type");
            }

            regexp:RegExp companyPattern = check regexp:fromString(ctx.companyPrefix + "[0-9]+");
            regexp:RegExp consultancyPattern = check regexp:fromString(database:CONSULTANCY_ID_PREFIX + "[0-9]+");
            if manualId.matches(companyPattern) || manualId.matches(consultancyPattern) {
                return error(string `Employee ID '${manualId}' is reserved for auto-generation and cannot be assigned manually`);
            }

            database:Employee|error? existing = database:getEmployeeInfo(manualId);
            if existing is error {
                return existing;
            }
            if existing is database:Employee {
                return error(string `Employee ID already in use: ${manualId}`);
            }
            return manualId;
        }
        _ => {
            return error(string `Unsupported employment type: ${ctx.employmentType}`);
        }
    }
}
