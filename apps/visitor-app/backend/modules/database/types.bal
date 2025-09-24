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

import ballerina/constraint;
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

# Database audit fields.
public type AuditFields record {|
    # Who created the visitor 
    string createdBy;
    # When the visitor was created 
    string createdOn;
    # Who updated the visitor
    string updatedBy;
    # When the visitor was updated
    string updatedOn;
|};

# Database record for Visitor.
public type Visitor record {|
    *AddVisitorPayload;
    *AuditFields;
|};

# [Database] Insert record for visitor.
public type AddVisitorPayload record {|
    # Nic Hash of the visitor
    @constraint:String {
        pattern: {
            value: NONE_EMPTY_PRINTABLE_STRING_REGEX,
            message: "The NIC Hash should be a non-empty string with printable characters."
        }
    }
    string nicHash;
    # Name of the visitor
    @constraint:String {
        pattern: {
            value: NONE_EMPTY_PRINTABLE_STRING_REGEX,
            message: "The name should be a non-empty string with printable characters."
        }
    }
    string name;
    # NIC number of visitor
    @constraint:String {
        pattern: {
            value: NONE_EMPTY_PRINTABLE_STRING_REGEX,
            message: "The NIC number should be a non-empty string with printable characters."
        }
    }
    string nicNumber;
    # Working phone number of visitor
    @constraint:String {
        pattern: {
            value: INTERNATIONAL_CONTACT_NUMBER_REGEX,
            message: "The contact number should be in valid international format."
        }
    }
    string contactNumber;
    # Email of the visitor
    string? email;
|};

# [Database] Floor record.
public type Floor record {|
    # Floor
    string floor;
    # Array of rooms
    string[] rooms;
|};

# [Database] Insert record for visit.
public type AddVisitPayload record {|
    # Nic Hash of the visitor
    string nicHash;
    # Company name of visitor
    string? companyName;
    # Number in the tag given to visitor
    string passNumber?;
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
    # Status of the visit
    Status status;
|};

# [Database] Visit record.
public type VisitRecord record {|
    *AuditFields;
    # Nic Hash of the visitor
    string nicHash;
    # Unique identifier for the visit
    int id;
    # Name of the visitor
    string name;
    # NIC number of visitor
    string nicNumber;
    # Working phone number of visitor
    string contactNumber;
    # Email of the visitor
    string email;
    # Company name of visitor
    string? companyName;
    # Number in the tag given to visitor
    string passNumber?;
    # The person the visitor is supposed to meet
    string whomTheyMeet;
    # Purpose of the visit
    string purposeOfVisit;
    # The floors and rooms that the visitor can access
    json accessibleLocations;
    # Time at which the visitor is supposed to check in [in UTC]
    string timeOfEntry;
    # Time at which the visitor is supposed to check out [in UTC]
    string timeOfDeparture;
    # Status of the visit
    Status status;
    # Total number of visits
    int totalCount;
    # Invitation ID associated with the visit
    int? invitationId;
|};

# Visit record.
public type Visit record {|
    *AddVisitPayload;
    *AuditFields;
    # Unique identifier for the visit
    int id;
    # Name of the visitor
    string name;
    # NIC number of visitor
    string nicNumber;
    # Working phone number of visitor
    string contactNumber;
    # Email of the visitor
    string? email;
    # Invitation ID associated with the visit
    int? invitationId;
|};

# Response Record for Visits.
public type VisitsResponse record {|
    # The total count of visits
    int totalCount;
    # Array of visits
    Visit[] visits;
|};

# Visit Invitations.
public type VisitInfo record {|
    # name of company
    string nameOfCompany;
    # person they meet
    string whomTheyMeet;
    # purpose of visit
    string purposeOfVisit;
    # accessible locations
    Floor[] accessibleLocations;
    # scheduled date
    string sheduledDate;
    # time of entry
    string timeOfEntry;
    # time of departure
    string timeOfDeparture;
|};

# Details of an invitation.
public type InvitationDetails record {|
    # invitation creation time
    string createdOn;
    # invitation updater
    string updatedBy;
    # invitation update time
    string updatedOn;
    # invitation status
    int isActive;
    # invitations count
    int noOfInvitations;
    # visit information
    VisitInfo visitDetails;
    # invitee email
    string inviteeEmail;
|};

# Invitation details.
public type Invitation record {|
    # Id of the invitation
    int invitationId;
    # Who invited the visitor
    string invitedBy;
    # Email of the invitee
    string inviteeEmail;
    # Encoded uuid value
    string encodeValue;
    # No of invitations
    int noOfInvitations;
    # When the invitation was sent
    string createdOn;
    # When the invitation was updated
    string updatedOn;
    # Validity of the invitation
    int isActive;
    # Visit details in the invitation
    json visitDetails;
|};

public type InvitationRecord record {|
    # Id of the invitation
    int invitationId;
    # When the invitation was sent
    string createdOn;
    # Validity of the invitation
    int isActive;
    # No of invitations
    int noOfInvitations;
    # Visit details in the invitation
    json visitDetails;
    # Who invited the visitor
    AddVisitorPayload[] invitees?;
    # Invited by
    string invitedBy;
|};

public type VisitApprovePayload record {|
    int id;
    int? passNumber = ();
    string status;
|};
