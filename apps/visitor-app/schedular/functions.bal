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
# Builds the full name of a visitor from their first and last names, handling null values gracefully.
#
# + firstName - First name of the visitor, can be null  
# + lastName - Last name of the visitor, can be null
# + return - Full name of the visitor, or "Unknown Visitor" if both names are null
isolated function buildVisitorName(string? firstName, string? lastName) returns string {
    if firstName is string && lastName is string {
        return firstName + " " + lastName;
    }
    if firstName is string {
        return firstName;
    }
    return "Unknown Visitor";
}
