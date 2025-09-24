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
import visitor.authorization;
import visitor.database;
import visitor.email;
import visitor.people;

import ballerina/cache;
import ballerina/http;
import ballerina/lang.array;
import ballerina/log;
import ballerina/uuid;

configurable string webAppBaseUrl = ?;

final cache:Cache cache = new ({
    capacity: 2000,
    defaultMaxAge: 1800.0,
    cleanupInterval: 900.0
});

@display {
    label: "Visitor Service",
    id: "people-ops-suite/visitor-service"
}

service http:InterceptableService / on new http:Listener(9090) {

    # Request interceptor.
    #
    # + return - authorization:JwtInterceptor, BadRequestInterceptor
    public function createInterceptors() returns http:Interceptor[] =>
        [new authorization:JwtInterceptor(), new BadRequestInterceptor()];

    # Fetch logged-in user's details.
    #
    # + return - User information or InternalServerError
    resource function get user\-info(http:RequestContext ctx) returns UserInfo|http:InternalServerError {
        // User information header.
        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            log:printError(USER_INFO_HEADER_NOT_FOUND_ERROR, userInfo);
            return <http:InternalServerError>{
                body: {
                    message: USER_INFO_HEADER_NOT_FOUND_ERROR
                }
            };
        }

        // Check if the employees are already cached.
        if cache.hasKey(userInfo.email) {
            UserInfo|error cachedUserInfo = cache.get(userInfo.email).ensureType();
            if cachedUserInfo is UserInfo {
                return cachedUserInfo;
            }
        }

        people:Employee|error? employee = people:fetchEmployee(userInfo.email);
        if employee is error {
            string customError = string `Error occurred while fetching user information: ${userInfo.email}`;
            log:printError(customError, employee);
            return <http:InternalServerError>{
                body: customError
            };
        }
        if employee is () {
            log:printError(string `No employee information found for the user: ${userInfo.email}`);
            return <http:InternalServerError>{
                body: {
                    message: "No information found for the user!"
                }
            };
        }

        // Fetch the user's privileges based on the roles.
        int[] privileges = [];
        if authorization:checkPermissions([authorization:authorizedRoles.EMPLOYEE_ROLE], userInfo.groups) {
            privileges.push(authorization:EMPLOYEE_PRIVILEGE);
        }
        if authorization:checkPermissions([authorization:authorizedRoles.ADMIN_ROLE], userInfo.groups) {
            privileges.push(authorization:SECURITY_ADMIN_PRIVILEGE);
        }

        UserInfo userInfoResponse = {...employee, privileges};

        error? cacheError = cache.put(userInfo.email, userInfoResponse);
        if cacheError is error {
            log:printError("An error occurred while writing user info to the cache", cacheError);
        }
        return userInfoResponse;
    }

    # Fetches a specific visitor by hashed NIC/Passport number.
    #
    # + hashedNic - Hashed NIC number of the visitor
    # + return - Visitor or error
    resource function get visitors/[string hashedNic](http:RequestContext ctx)
        returns database:Visitor|http:InternalServerError|http:NotFound {

        authorization:CustomJwtPayload|error invokerInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if invokerInfo is error {
            log:printError(USER_INFO_HEADER_NOT_FOUND_ERROR, invokerInfo);
            return <http:InternalServerError>{
                body: {
                    message: USER_INFO_HEADER_NOT_FOUND_ERROR
                }
            };
        }

        database:Visitor|error? visitor = database:fetchVisitor(hashedNic);
        if visitor is error {
            string customError = "Error occurred while fetching visitor!";
            log:printError(customError, visitor);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }
        if visitor is () {
            log:printError(string `No visitor information found for the hashed NIC: ${hashedNic}!`);
            return <http:NotFound>{
                body: {
                    message: "No visitor found!"
                }
            };
        }

        return visitor;
    }

    # Create a new visitor.
    #
    # + payload - Payload containing the visitor details
    # + return - Successfully created or error
    resource function post visitors(http:RequestContext ctx, database:AddVisitorPayload payload)
        returns http:Created|http:InternalServerError {

        authorization:CustomJwtPayload|error invokerInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if invokerInfo is error {
            log:printError(USER_INFO_HEADER_NOT_FOUND_ERROR, invokerInfo);
            return <http:InternalServerError>{
                body: {
                    message: USER_INFO_HEADER_NOT_FOUND_ERROR
                }
            };
        }

        error? visitorError = database:addVisitor(payload, invokerInfo.email);
        if visitorError is error {
            string customError = "Error occurred while adding visitor!";
            log:printError(customError, visitorError);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }
        return <http:Created>{
            body: {
                message: "Visitor added successfully!"
            }
        };
    }

    # Create a new visit.
    #
    # + payload - Payload containing the visit details
    # + return - Successfully created or error
    resource function post visits(http:RequestContext ctx, AddVisitPayload payload)
        returns http:Created|http:BadRequest|http:InternalServerError {

        authorization:CustomJwtPayload|error invokerInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if invokerInfo is error {
            log:printError(USER_INFO_HEADER_NOT_FOUND_ERROR, invokerInfo);
            return <http:InternalServerError>{
                body: {
                    message: USER_INFO_HEADER_NOT_FOUND_ERROR
                }
            };
        }

        // Verify existing visitor.
        database:Visitor|error? existingVisitor = database:fetchVisitor(payload.nicHash);
        if existingVisitor is error {
            string customError = "Error occurred while fetching existing visitor!";
            log:printError(customError, existingVisitor);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }
        if existingVisitor is () {
            return <http:BadRequest>{
                body: {
                    message: "Incorrect NIC hash!"
                }
            };

        }
        error? visitError = database:addVisit({...payload, status: database:ACCEPTED}, invokerInfo.email);
        if visitError is error {
            string customError = "Error occurred while adding visit!";
            log:printError(customError, visitError);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }
        return <http:Created>{
            body: {
                message: "Visit added successfully!"
            }
        };
    }

    # Fetches visits based on the given filters.
    #
    # + status - Filter :  status of the visit (Pending, Accepted, Rejected, Completed)
    # + 'limit - Limit number of visits to fetch  
    # + offset - Offset for pagination
    # + return - Array of visits or error
    resource function get visits(http:RequestContext ctx, string? status, int? 'limit, int? offset)
        returns database:VisitsResponse|http:InternalServerError {

        authorization:CustomJwtPayload|error invokerInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if invokerInfo is error {
            log:printError(USER_INFO_HEADER_NOT_FOUND_ERROR, invokerInfo);
            return <http:InternalServerError>{
                body: {
                    message: USER_INFO_HEADER_NOT_FOUND_ERROR
                }
            };
        }

        database:VisitsResponse|error visitsResponse = database:fetchVisits(status, 'limit, offset);
        if visitsResponse is error {
            string customError = "Error occurred while fetching visits!";
            log:printError(customError, visitsResponse);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        return visitsResponse;
    }

    # Create a new invitation.
    #
    # + payload - Payload containing the invitation details
    # + return - Successfully created or error
    resource function post invitations(http:RequestContext ctx, database:AddInvitationPayload payload)
        returns http:Created|http:InternalServerError {
        authorization:CustomJwtPayload|error invokerInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if invokerInfo is error {
            log:printError(USER_INFO_HEADER_NOT_FOUND_ERROR, invokerInfo);
            return <http:InternalServerError>{
                body: {
                    message: USER_INFO_HEADER_NOT_FOUND_ERROR
                }
            };
        }

        string encodeString = array:toBase64((uuid:createType4AsString()).toBytes());
        error? invitationError = database:addInvitation(payload, invokerInfo.email, encodeString);
        if invitationError is error {
            string customError = "Error occurred while creating invitation!";
            log:printError(customError, invitationError);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        string|error content = email:bindKeyValues(
                email:inviteTemplate,
                {
                    LINK: webAppBaseUrl + "/external/" + "?token=" + encodeString,
                    CONTACT_EMAIL: email:contactEmail
                }
        );

        if content is error {
            string errMsg = "Error with email template!";
            log:printError(errMsg, content);
            return <http:InternalServerError>{
                body: {
                    message: errMsg
                }
            };
        }

        error? emailError = email:sendEmail({
                                                to: [payload.inviteeEmail],
                                                'from: email:visitorNotificationFrom,
                                                subject: email:VISIT_INVITATION_SUBJECT,
                                                template: content,
                                                cc: [email:receptionEmail]
                                            });

        if emailError is error {
            string errMsg = "Error occurred while sending the email!";
            log:printError(errMsg, emailError);
        }

        return <http:Created>{
            body: {
                message: "Invitation created successfully!"
            }
        };
    }

    # Fetch invitation details using the encoded value.
    #
    # + encodeValue - Encoded value from the invitation link
    # + return - Invitation details or error
    resource function get invitations/[string encodeValue]/authorized() returns database:Invitation|http:InternalServerError {
        database:Invitation|error invitationDetails = database:checkInvitation(encodeValue);

        if invitationDetails is error {
            string errMsg = invitationDetails.message();
            return <http:InternalServerError>{
                body: {
                    message: errMsg
                }
            };
        }

        database:VisitsResponse|error visitsResponse = database:fetchVisits(invitation_id = invitationDetails.invitationId);
        if visitsResponse is error {
            string errMsg = "Error occurred while fetching visits!";
            log:printError(errMsg, visitsResponse);
            return <http:InternalServerError>{
                body: {
                    message: errMsg
                }
            };
        }

        database:AddVisitorPayload[] inviteesList = from database:Visit visit in visitsResponse.visits
            select {
                nicHash: visit.nicHash,
                name: visit.name,
                email: visit.email,
                contactNumber: visit.contactNumber,
                nicNumber: visit.nicNumber
            };

        invitationDetails.invitees = inviteesList;
        return invitationDetails;
    };

    # Fill an invitation by adding a visitor and a visit.
    #
    # + encodeValue - Encoded value from the invitation link
    # + payload - Payload containing the visitor details
    # + return - Successfully created or error
    resource function post invitations/[string encodeValue]/fill(database:AddVisitorPayload payload)
        returns http:Created|http:BadRequest|http:InternalServerError|error? {

        database:Invitation|error invitationDetails = database:checkInvitation(encodeValue);

        if invitationDetails is error {
            string errMsg = invitationDetails.message();
            return <http:InternalServerError>{
                body: {
                    message: errMsg
                }
            };
        }

        database:VisitsResponse|error visitsResponse = database:fetchVisits(invitation_id = invitationDetails.invitationId);

        if visitsResponse is error {
            string errMsg = "Error occurred while fetching visits!";
            log:printError(errMsg, visitsResponse);
            return <http:InternalServerError>{
                body: {
                    message: errMsg
                }
            };
        }

        int registeredCount = visitsResponse.totalCount;
        int totalInvitesCount = invitationDetails.noOfInvitations;

        if registeredCount >= totalInvitesCount {
            return <http:BadRequest>{
                body: {
                    message: "All invitation slots are already filled!"
                }
            };
        }

        error? visitorError = database:addVisitor(payload, invitationDetails.invitedBy);
        if visitorError is error {
            string customError = "Error occurred while adding visitor!";
            log:printError(customError, visitorError);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        // Verify existing visitor.
        database:Visitor|error? existingVisitor = database:fetchVisitor(payload.nicHash);
        if existingVisitor is error {
            string customError = "Error occurred while fetching existing visitor!";
            log:printError(customError, existingVisitor);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }
        if existingVisitor is () {
            return <http:BadRequest>{
                body: {
                    message: "Incorrect NIC hash!"
                }
            };

        }

        database:VisitInfo visitInfo = check invitationDetails.visitDetails.cloneWithType();

        error? visitError = database:addVisit({
                                                  nicHash: payload.nicHash,
                                                  companyName: visitInfo.nameOfCompany,
                                                  whomTheyMeet: visitInfo.whomTheyMeet,
                                                  purposeOfVisit: visitInfo.purposeOfVisit,
                                                  accessibleLocations: visitInfo.accessibleLocations,
                                                  timeOfEntry: visitInfo.timeOfEntry,
                                                  timeOfDeparture: visitInfo.timeOfDeparture,
                                                  status: database:PENDING

                                              }, invitationDetails.invitedBy, invitationDetails.invitationId);
        if visitError is error {
            string customError = "Error occurred while adding visit!";
            log:printError(customError, visitError);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }
        return <http:Created>{
            body: {
                message: "Visit added successfully!"
            }
        };
    };

    resource function patch visits\-status\-update\-bulk(database:VisitApprovePayload[] payload) returns http:Ok|http:BadRequest|http:InternalServerError {

        if payload.length() == 0 {
            return <http:BadRequest>{
                body: {
                    message: "No visits to approve!"
                }
            };
        }

        error? approveError = database:bulkUpdateVisitStatus(payload);

        if approveError is error {
            string customError = "Error occurred while approving visits!";
            log:printError(customError, approveError);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        return <http:Ok>{
            body: {
                message: "Visits approved successfully!"
            }
        };

    }

    # Update visit status.
    #
    # + payload - Payload containing the visit ID and the new status
    # + return - Successfully updated or error
    resource function post visits\-status\-update(database:VisitApprovePayload payload) returns http:Ok|http:BadRequest|http:InternalServerError {

        string|error encodedVisitorEmail = database:updateVisitStatus(payload);

        if encodedVisitorEmail is error {
            string customError = "Error occurred while updating visits!";
            log:printError(customError, encodedVisitorEmail);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        string|error decodedVisitorEmail = database:decrypt(encodedVisitorEmail);
        if decodedVisitorEmail is error {
            string customError = "Error occurred while decrypting email!";
            log:printError(customError, decodedVisitorEmail);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        string statusMessage;
        string emailSubject;
        match payload.status.toUpperAscii() {
            "ACCEPTED" => {
                statusMessage = "Your visit has been accepted. Please arrive at the scheduled time.";
                emailSubject = "Visit Request Accepted";
            }
            "REJECTED" => {
                statusMessage = "Your visit request has been rejected. Please contact us for more information.";
                emailSubject = "Visit Request Rejected";
            }
            "COMPLETED" => {
                statusMessage = "Your visit has been successfully completed. Thank you for visiting!";
                emailSubject = "Visit Completed";
            }
            _ => {
                statusMessage = "Visit status updated.";
                emailSubject = "Visit Status Update";
            }
        }

        string|error content = email:bindKeyValues(email:visitorStatusTemplate,
                {
                    VISIT_STATUS: payload.status.toUpperAscii(),
                    STATUS_MESSAGE: statusMessage,
                    CONTACT_EMAIL: email:contactEmail
                });

        if content is error {
            string errMsg = "Error with email template!";
            log:printError(errMsg, content);
            return <http:InternalServerError>{
                body: {
                    message: errMsg
                }
            };
        }

        error? emailError = email:sendEmail({
                                                to: [decodedVisitorEmail],
                                                'from: email:visitorNotificationFrom,
                                                subject: emailSubject,
                                                template: content,
                                                cc: [email:receptionEmail]
                                            });

        if emailError is error {
            string errMsg = "Error occurred while sending the email!";
            log:printError(errMsg, emailError);
        }

        return <http:Ok>{
            body: {
                message: "Visits updated successfully!"
            }
        };

    }
}
