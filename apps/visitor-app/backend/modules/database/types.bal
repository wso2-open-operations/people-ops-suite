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
import ballerina/sql;
import ballerinax/mysql;

# [Configurable] Database configs.
type DatabaseConfig record {|
    # If the MySQL server is secured, the username
    string user;
    # The password of the MySQL server for the provided username
    string password;
    # The name of the database
    string database;
    # Hostname of the MySQL server
    string host;
    # Port number of the MySQL server
    int port;
    # The `mysql:Options` configurations
    mysql:Options options?;
    # The `sql:ConnectionPool` configurations
    sql:ConnectionPool connectionPool?;
|};

# Database record for Visitor.
public type Visitor record {|
    *AddVisitorPayload;
    # Who created the visitor 
    string createdBy;
    # When the visitor was created 
    string createdOn;
    # Who updated the visitor
    string updatedBy;
    # When the visitor was updated
    string updatedOn;
|};

# [Database] Insert record for visitor.
public type AddVisitorPayload record {|
    # Nic Hash of the visitor
    string nicHash;
    # Name of the visitor
    string name;
    # NIC number of visitor
    string nicNumber;
    # Working phone number of visitor
    string contactNumber;
    # Email of the visitor
    string? email;
|};

# [Database] Insert record for visit.
public type AddVisitPayload record {|
    # Nic Hash of the visitor
    string nicHash;
    # Company name of visitor
    string? companyName;
    # Number in the tag given to visitor
    string passNumber;
    # The person the visitor is supposed to meet
    string whomTheyMeet;
    # Purpose of the visit
    string purposeOfVisit;
    # The floors and rooms that the visitor can access
    Floor[] accessibleLocations;
    # Time at which the visitor is supposed to check in [in UTC]
    string timeOfEntry;
    # Time at which the visitor is supposed to check out [in UTC]
    string timeOfDeparture;
|};

public type DatabaseAddVisitPayload record {|
    *AddVisitPayload;
    # Status of the visit
    Status status;
|};

# [Database] Floor record.
public type Floor record {|
    # Floor
    string floor;
    # Array of rooms
    string[] rooms;
|};
