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
import visitor.database;

# Converts the json array of accessible locations to a readable string.
#
# + accessibleLocations - Json string array containing floors and rooms
# + return - Formatted string
public isolated function organizeLocations(database:Floor[] accessibleLocations) returns string {
    string formattedString = "";
    foreach var location in accessibleLocations {
        string floor = location.floor.toJsonString();
        string roomList = location.rooms.length() > 0 ? string:'join(" | ", ...location.rooms) : "";
        if (roomList != "") {
            formattedString += string `Floor ${floor}: ${roomList}<br>`;
        } else {
            formattedString += string `Floor ${floor}<br>`;
        }
    }

    return formattedString.trim();
}
