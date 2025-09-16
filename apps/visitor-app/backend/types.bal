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
import visitor.people;

import ballerina/constraint;

# Response for fetching user information.
type UserInfo record {
    *people:Employee;
    # Array of privileges assigned to the user
    int[] privileges;
};

# Payload for adding a new visit.
public type AddVisitPayload record {|
    # Nic Hash of the visitor
    @constraint:String {
        pattern: {
            value: database:NONE_EMPTY_PRINTABLE_STRING_REGEX,
            message: "The NIC Hash should be a non-empty string with printable characters."
        }
    }
    string nicHash;
    # Company name of visitor
    string? companyName;
    # Number in the tag given to visitor
    @constraint:String {
        pattern: {
            value: database:NONE_EMPTY_PRINTABLE_STRING_REGEX,
            message: "The pass number should be a non-empty string with printable characters."
        }
    }
    string passNumber?;
    # The person the visitor is supposed to meet
    @constraint:String {
        pattern: {
            value: database:NONE_EMPTY_PRINTABLE_STRING_REGEX,
            message: "The who they meet should be a non-empty string with printable characters."
        }
    }
    string whomTheyMeet;
    # Purpose of the visit
    string purposeOfVisit;
    # The floors and rooms that the visitor can access
    database:Floor[] accessibleLocations;
    # Time at which the visitor is supposed to check in [in UTC]
    @constraint:String {
        pattern: {
            value: database:UTC_TIMESTAMP_REGEX,
            message: "The time of entry should be a valid UTC string(YYYY-MM-DDTHH:mm:ss)."
        }
    }
    string timeOfEntry;
    # Time at which the visitor is supposed to check out [in UTC]
    @constraint:String {
        pattern: {
            value: database:UTC_TIMESTAMP_REGEX,
            message: "The time of departure should be a valid UTC string(YYYY-MM-DDTHH:mm:ss)."
        }
    }
    string timeOfDeparture;
|};

# [Database] Floor record.
public type Floor record {|
    # Floor
    string floor;
    # Array of rooms
    string[] rooms;
|};

# Details of a visit.
public type visitInfo record {|
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
public type invitationDetails record {|
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
    visitInfo visitDetails;
    # invitee email
    string inviteeEmail;
|};

