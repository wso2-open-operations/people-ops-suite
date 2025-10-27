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
import ballerina/time;
import ballerina/uuid;

configurable string webAppUrl = ?;

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
        returns http:InternalServerError|http:BadRequest|http:Created {

        authorization:CustomJwtPayload|error invokerInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if invokerInfo is error {
            log:printError(USER_INFO_HEADER_NOT_FOUND_ERROR, invokerInfo);
            return <http:InternalServerError>{
                body: {
                    message: USER_INFO_HEADER_NOT_FOUND_ERROR
                }
            };
        }

        time:Utc|error idealEntryTime = time:utcFromString(payload.timeOfEntry + ".000Z");
        if idealEntryTime is error {
            string customError = "Error occurred while parsing the visit entry time!";
            log:printError(customError, idealEntryTime);
            return <http:BadRequest>{
                body: {
                    message: customError
                }
            };
        }
        time:Utc|error idealDepartureTime = time:utcFromString(payload.timeOfDeparture + ".000Z");
        if idealDepartureTime is error {
            string customError = "Error occurred while parsing the visit departure time!";
            log:printError(customError, idealDepartureTime);
            return <http:BadRequest>{
                body: {
                    message: customError
                }
            };
        }

        time:Utc exactEntryTime = idealEntryTime;
        // Determine visit status based on user role.
        database:Status visitStatus = database:REQUESTED;
        if authorization:checkPermissions([authorization:authorizedRoles.ADMIN_ROLE], invokerInfo.groups) {
            visitStatus = database:APPROVED; // Set status to APPROVED for admin users.
            exactEntryTime = time:utcNow(); // Override entry time to current time for approved visits.
            if payload.passNumber !is string {
                return <http:BadRequest>{
                    body: {
                        message: "Pass number is required when creating an approved visit!"
                    }
                };
            }
            if payload.accessibleLocations !is database:Floor[] {
                return <http:BadRequest>{
                    body: {
                        message: "At least one accessible location is required when creating an approved visit!"
                    }
                };
            }
        } else {
            // Sanitize fields not required for non-admin users.
            payload.passNumber = ();
            payload.accessibleLocations = ();
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
                    message: "No visitor found with the provided NIC hash!"
                }
            };

        }

        error? visitError = database:addVisit(
                {
                    nicHash: payload.nicHash,
                    companyName: payload.companyName,
                    passNumber: payload.passNumber,
                    whomTheyMeet: payload.whomTheyMeet,
                    purposeOfVisit: payload.purposeOfVisit,
                    accessibleLocations: payload.accessibleLocations,
                    timeOfEntry: exactEntryTime,
                    timeOfDeparture: idealDepartureTime,
                    status: visitStatus
                }, invokerInfo.email, invokerInfo.email);
        if visitError is error {
            string customError = "Error occurred while adding visit!";
            log:printError(customError, visitError);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        string? visitorEmail = existingVisitor.email;
        string? passNumber = payload.passNumber;
        database:Floor[]? accessibleLocations = payload.accessibleLocations;
        if visitorEmail is string && visitStatus == database:APPROVED && passNumber is string &&
                accessibleLocations is database:Floor[] {

            string accessibleLocationString = organizeLocations(accessibleLocations);

            // https://github.com/wso2-open-operations/people-ops-suite/pull/31#discussion_r2414681918
            string|error formattedFromDate = formatDateTime(payload.timeOfEntry, "Asia/Colombo");
            if formattedFromDate is error {
                string customError = "Error occurred while formatting the visit start time!";
                log:printError(customError, formattedFromDate);
            }
            string|error formattedToDate = formatDateTime(payload.timeOfDeparture, "Asia/Colombo");
            if formattedToDate is error {
                string customError = "Error occurred while formatting the visit end time!";
                log:printError(customError, formattedToDate);
            }
            string|error content = email:bindKeyValues(email:visitorApproveTemplate,
                    {
                        "TIME": time:utcToEmailString(time:utcNow()),
                        "EMAIL": visitorEmail,
                        "NAME": generateSalutation(existingVisitor.name),
                        "TIME_OF_ENTRY": formattedFromDate is error ? payload.timeOfEntry + "(UTC)" : formattedFromDate,
                        "TIME_OF_DEPARTURE": formattedToDate is error ?
                            payload.timeOfDeparture + "(UTC)" : formattedToDate,
                        "ALLOWED_FLOORS": accessibleLocationString,
                        "PASS_NUMBER": passNumber.toString(),
                        "CONTACT_EMAIL": email:contactUsEmail,
                        "YEAR": time:utcToCivil(time:utcNow()).year.toString()
                    });
            if content is error {
                string customError = "An error occurred while binding values to the email template!";
                log:printError(customError, content);
            } else {
                error? emailError = email:sendEmail(
                            {
                            to: [visitorEmail],
                            'from: email:fromEmailAddress,
                            subject: email:VISIT_ACCEPTED_SUBJECT,
                            template: content,
                            cc: [email:receptionEmail]
                        });
                if emailError is error {
                    string customError = "An error occurred while sending the approval email!";
                    log:printError(customError, emailError);
                }
            }
        }

        return <http:Created>{
            body: {
                message: "Visit added successfully!"
            }
        };
    }

    # Fetches visits based on the given filters.
    #
    # + inviter - The email of the inviter (employee)
    # + statusArray - Filter :  status array of the visits (Pending, Accepted, Rejected, Completed)
    # + 'limit - Limit number of visits to fetch
    # + offset - Offset for pagination
    # + return - Array of visits or error
    resource function get visits(http:RequestContext ctx, string? inviter, database:Status[]? statusArray,
            int? 'limit, int? offset) returns database:VisitsResponse|http:Forbidden|http:InternalServerError {

        authorization:CustomJwtPayload|error invokerInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if invokerInfo is error {
            log:printError(USER_INFO_HEADER_NOT_FOUND_ERROR, invokerInfo);
            return <http:InternalServerError>{
                body: {
                    message: USER_INFO_HEADER_NOT_FOUND_ERROR
                }
            };
        }

        if !authorization:checkPermissions(
                [authorization:authorizedRoles.ADMIN_ROLE], invokerInfo.groups) &&
                inviter is string && inviter != invokerInfo.email {

            string customError = "Non-admin users cannot access visits of other employees!";
            log:printError(customError);
            return <http:Forbidden>{
                body: {
                    message: customError
                }
            };

        }

        database:VisitsResponse|error visitsResponse = database:fetchVisits({inviter, statusArray, 'limit, offset});

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
    resource function post invitations(http:RequestContext ctx, AddInvitationPayload payload)
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
        error? invitationError = database:addInvitation({...payload, isActive: true}, invokerInfo.email, encodeString);

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
                    LINK: webAppUrl + "/external/" + "?token=" + encodeString,
                    CONTACT_EMAIL: email:contactUsEmail,
                    YEAR: time:utcToCivil(time:utcNow()).year.toString()
                }
        );

        if content is error {
            string customError = "An error occurred while binding values to the email template!";
            log:printError(customError, content);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        error? emailError = email:sendEmail({
                                                to: [payload.inviteeEmail],
                                                'from: email:fromEmailAddress,
                                                subject: email:VISIT_INVITATION_SUBJECT,
                                                template: content,
                                                cc: [email:receptionEmail]
                                            });

        if emailError is error {
            string customError = "Error occurred while sending the email!";
            log:printError(customError, emailError);
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
    resource function post invitations/[string encodeValue]/authorize()
        returns http:Ok|http:InternalServerError|http:Unauthorized|http:BadRequest {

        database:Invitation|error? invitation = database:fetchInvitation(encodeValue);
        if invitation is () {
            return <http:BadRequest>{
                body: {
                    message: "Invalid invitation link!"
                }
            };
        }
        if invitation is error {
            string customError = "Error occurred while fetching invitation!";
            log:printError(customError, invitation);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        if invitation.active == false {
            return <http:Unauthorized>{
                body: {
                    message: "Invitation is no longer active!"
                }
            };
        }

        database:VisitsResponse|error visitsResponse = database:fetchVisits({invitationId: invitation.invitationId});
        if visitsResponse is error {
            string customError = "Error occurred while fetching visits for this invitation!";
            log:printError(customError, visitsResponse);
            return <http:InternalServerError>{
                body: {
                    message: customError
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

        if invitation.'type == "LK-QR" {
            invitation.invitees = [];
        } else {
            invitation.invitees = inviteesList;
        }

        return <http:Ok>{
            body: invitation
        };
    };

    # Fill an invitation by adding a visitor and a visit.
    #
    # + encodeValue - Encoded value from the invitation link
    # + payload - Payload containing the visitor details
    # + return - Successfully created or error
    resource function post invitations/[string encodeValue]/fill(FillInvitationPayload payload)
        returns http:Created|http:BadRequest|http:InternalServerError {

        // Retrieve invitation details
        database:Invitation|error? invitation = database:fetchInvitation(encodeValue);
        if invitation is () {
            return <http:BadRequest>{
                body: {
                    message: "Invalid invitation link!"
                }
            };
        }
        if invitation is error {
            string customError = "Error occurred while fetching invitation!";
            log:printError(customError, invitation);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        if invitation.active == false {
            return <http:BadRequest>{
                body: {
                    message: "Invitation is no longer active!"
                }
            };
        }

        database:VisitInfo? invitationVisitInfo = invitation.visitInfo;
        database:VisitInfo newVisitInfo = {
            companyName: payload.companyName,
            whomTheyMeet: payload.whomTheyMeet,
            purposeOfVisit: payload.purposeOfVisit,
            timeOfEntry: payload.timeOfEntry,
            timeOfDeparture: payload.timeOfDeparture
        };

        time:Utc|error idealEntryTime = time:utcFromString(payload.timeOfEntry + ".000Z");
        if idealEntryTime is error {
            string customError = "Error occurred while parsing the visit entry time!";
            log:printError(customError, idealEntryTime);
            return <http:BadRequest>{
                body: {
                    message: customError
                }
            };
        }
        time:Utc|error idealDepartureTime = time:utcFromString(payload.timeOfDeparture + ".000Z");
        if idealDepartureTime is error {
            string customError = "Error occurred while parsing the visit departure time!";
            log:printError(customError, idealDepartureTime);
            return <http:BadRequest>{
                body: {
                    message: customError
                }
            };
        }

        // Handle LK-QR invitation.
        if invitation.'type == "LK-QR" {
            // Persist new visitor.
            error? visitorError = database:addVisitor(
                    {
                        nicHash: payload.nicHash,
                        name: payload.name,
                        nicNumber: payload.nicNumber,
                        contactNumber: payload.contactNumber,
                        email: payload.email
                    }, invitation.createdBy);

            if visitorError is error {
                string customError = "Error occurred while adding visitor!";
                log:printError(customError, visitorError);
                return <http:InternalServerError>{
                    body: {
                        message: customError
                    }
                };
            }

            // Persist new visit.
            error? visitError = database:addVisit(
                    {
                        companyName: payload.companyName,
                        whomTheyMeet: payload.whomTheyMeet,
                        timeOfEntry: time:utcNow(),
                        timeOfDeparture: idealDepartureTime,
                        purposeOfVisit: payload.purposeOfVisit,
                        nicHash: payload.nicHash,
                        status: database:REQUESTED
                    }, invitation.createdBy, invitation.inviteeEmail, invitation.invitationId);

            if visitError is error {
                string customError = "Error occurred while adding visit!";
                log:printError(customError, visitError);
                return <http:InternalServerError>{
                    body: {
                        message: customError
                    }
                };
            }

            // TODO : Send LK-QR specific email notification.
            return <http:Created>{
                body: {
                    message: "Visit added successfully!"
                }
            };
        }

        // Retrieve existing visits for the invitation
        database:VisitsResponse|error existingVisitors = database:fetchVisits({invitationId: invitation.invitationId});
        if existingVisitors is error {
            string customError = "Error occurred while fetching visits for this invitation!";
            log:printError(customError, existingVisitors);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }
        if existingVisitors.totalCount >= invitation.noOfVisitors {
            return <http:BadRequest>{
                body: {
                    message: "All invitation slots are already filled!"
                }
            };
        }

        // Verify if the visit details are provided previously matched with the newly provided visit details
        if invitationVisitInfo is database:VisitInfo && invitationVisitInfo != newVisitInfo {
            return <http:BadRequest>{
                body: {
                    message: "Provided visit details do not match with the previously provided visit details!"
                }
            };
        }
        if invitationVisitInfo is () {
            error? invitationResult = database:updateInvitation(
                    invitation.invitationId, {visitInfo: newVisitInfo}, invitation.inviteeEmail);

            if invitationResult is error {
                string customError = "Error occurred while updating invitation!";
                log:printError(customError, invitationResult);
                return <http:InternalServerError>{
                    body: {
                        message: customError
                    }
                };
            }
        }

        // Persist new visitor.
        error? visitorError = database:addVisitor(
                {
                    nicHash: payload.nicHash,
                    name: payload.name,
                    nicNumber: payload.nicNumber,
                    contactNumber: payload.contactNumber,
                    email: payload.email
                }, invitation.createdBy);

        if visitorError is error {
            string customError = "Error occurred while adding visitor!";
            log:printError(customError, visitorError);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        // Persist new visit.
        error? visitError = database:addVisit(
                {
                    companyName: payload.companyName,
                    whomTheyMeet: payload.whomTheyMeet,
                    purposeOfVisit: payload.purposeOfVisit,
                    timeOfEntry: idealEntryTime,
                    timeOfDeparture: idealDepartureTime,
                    nicHash: payload.nicHash,
                    status: database:REQUESTED
                }, invitation.createdBy, invitation.inviteeEmail, invitation.invitationId);

        if visitError is error {
            string customError = "Error occurred while adding visit!";
            log:printError(customError, visitError);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }
        if existingVisitors.totalCount + 1 >= invitation.noOfVisitors {
            error? updateError = database:updateInvitation(
                    invitation.invitationId, {active: false}, invitation.inviteeEmail);

            if updateError is error {
                string customError = "Error occurred while deactivating invitation!";
                log:printError(customError, updateError);
                return <http:InternalServerError>{
                    body: {
                        message: customError
                    }
                };
            }
        }

        return <http:Created>{
            body: {
                message: "Visit added successfully!"
            }
        };
    };

    # Update visit details of existing visit.
    #
    # + visitId - ID of the visit to be updated
    # + action - Action to be performed on the visit (ACCEPTED, REJECTED, COMPLETED)
    # + payload - Payload containing the visit details to be updated
    # + return - Successfully updated or error
    resource function post visits/[int visitId]/[Action action](http:RequestContext ctx, ActionPayload payload)
        returns http:Ok|http:BadRequest|http:InternalServerError|http:Forbidden {

        authorization:CustomJwtPayload|error invokerInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if invokerInfo is error {
            log:printError(USER_INFO_HEADER_NOT_FOUND_ERROR, invokerInfo);
            return <http:InternalServerError>{
                body: {
                    message: USER_INFO_HEADER_NOT_FOUND_ERROR
                }
            };
        }

        if !authorization:checkPermissions([authorization:authorizedRoles.ADMIN_ROLE], invokerInfo.groups) {
            string customError = string `Non-admin users cannot ${action} visits!`;
            log:printError(customError);
            return <http:Forbidden>{
                body: {
                    message: customError
                }
            };
        }

        database:Visit|error? visit = database:fetchVisit(visitId);
        if visit is () {
            return <http:BadRequest>{
                body: {
                    message: "Invalid visit ID!"
                }
            };
        }
        if visit is error {
            string customError = "Error occurred while fetching visit!";
            log:printError(customError, visit);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        // Get visitor email for sending notifications
        string? visitorEmail = visit.email;

        // Approve a visit.
        if action == APPROVE {
            if visit.status != database:REQUESTED {
                return <http:BadRequest>{
                    body: {
                        message: "The visit is not in the approvable state!"
                    }
                };
            }

            string? passNumber = payload.passNumber;
            database:Floor[]? accessibleLocations = payload.accessibleLocations;
            if passNumber is () {
                return <http:BadRequest>{
                    body: {
                        message: "Pass number is required when approving a visit!"
                    }
                };
            }
            if accessibleLocations is () || array:length(accessibleLocations) == 0 {
                return <http:BadRequest>{
                    body: {
                        message: "At least one accessible location is required when approving a visit!"
                    }
                };
            }

            error? response = database:updateVisit(visitId,
                    {
                        status: database:APPROVED,
                        passNumber: payload.passNumber,
                        accessibleLocations: accessibleLocations,
                        actionedBy: invokerInfo.email,
                        timeOfEntry: time:utcNow()
                    }, invokerInfo.email);

            if response is error {
                string customError = "Error occurred while approving the visit!";
                log:printError(customError, response);
                return <http:InternalServerError>{
                    body: {
                        message: customError
                    }
                };
            }

            if visitorEmail is string {
                string accessibleLocationString = organizeLocations(accessibleLocations);

                // https://github.com/wso2-open-operations/people-ops-suite/pull/31#discussion_r2414681918
                string|error formattedFromDate = formatDateTime(visit.timeOfEntry, "Asia/Colombo");
                if formattedFromDate is error {
                    string customError = "Error occurred while formatting the visit start time!";
                    log:printError(customError, formattedFromDate);
                }
                string|error formattedToDate = formatDateTime(visit.timeOfDeparture, "Asia/Colombo");
                if formattedToDate is error {
                    string customError = "Error occurred while formatting the visit end time!";
                    log:printError(customError, formattedToDate);
                }
                string|error content = email:bindKeyValues(email:visitorApproveTemplate,
                        {
                            "TIME": time:utcToEmailString(time:utcNow()),
                            "EMAIL": visitorEmail,
                            "NAME": generateSalutation(visit.name),
                            "TIME_OF_ENTRY": formattedFromDate is error ? visit.timeOfEntry + "(UTC)" : formattedFromDate,
                            "TIME_OF_DEPARTURE": formattedToDate is error ?
                                visit.timeOfDeparture + "(UTC)" : formattedToDate,
                            "ALLOWED_FLOORS": accessibleLocationString,
                            "PASS_NUMBER": passNumber.toString(),
                            "CONTACT_EMAIL": email:contactUsEmail,
                            "YEAR": time:utcToCivil(time:utcNow()).year.toString()
                        });
                if content is error {
                    string customError = "An error occurred while binding values to the email template!";
                    log:printError(customError, content);
                } else {
                    error? emailError = email:sendEmail(
                            {
                                to: [visitorEmail],
                                'from: email:fromEmailAddress,
                                subject: email:VISIT_ACCEPTED_SUBJECT,
                                template: content,
                                cc: [email:receptionEmail]
                            });
                    if emailError is error {
                        string customError = "An error occurred while sending the approval email!";
                        log:printError(customError, emailError);
                    }
                }
            }

            return <http:Ok>{
                body: {
                    message: "Visit approved successfully!"
                }
            };

        }

        // Reject a visit.
        if action == REJECT {
            if payload.rejectionReason is () || payload.rejectionReason == "" {
                return <http:BadRequest>{
                    body: {
                        message: "Rejection reason is required when rejecting a visit!"
                    }
                };
            }
            if visit.status != database:REQUESTED {
                return <http:BadRequest>{
                    body: {
                        message: "The visit is not in the rejectable state!"
                    }
                };
            }
            error? response = database:updateVisit(
                    visitId,
                    {
                        status: database:REJECTED,
                        rejectionReason: payload.rejectionReason,
                        actionedBy: invokerInfo.email
                    }, invokerInfo.email);

            if response is error {
                string customError = "Error occurred while rejecting the visits!";
                log:printError(customError, response);
                return <http:InternalServerError>{
                    body: {
                        message: customError
                    }
                };
            }

            if visitorEmail is string {
                string|error formattedFromDate = formatDateTime(visit.timeOfEntry, "Asia/Colombo");
                if formattedFromDate is error {
                    string customError = "Error occurred while formatting the visit start time!";
                    log:printError(customError, formattedFromDate);
                }
                string|error formattedToDate = formatDateTime(visit.timeOfDeparture, "Asia/Colombo");
                if formattedToDate is error {
                    string customError = "Error occurred while formatting the visit end time!";
                    log:printError(customError, formattedToDate);
                }
                string|error content = email:bindKeyValues(email:visitorRejectingTemplate,
                        {
                            "TIME": time:utcToEmailString(time:utcNow()),
                            "EMAIL": visitorEmail,
                            "NAME": generateSalutation(visit.name),
                            "TIME_OF_ENTRY": formattedFromDate is error ? visit.timeOfEntry + "(UTC)" : formattedFromDate,
                            "TIME_OF_DEPARTURE": formattedToDate is error ?
                                visit.timeOfDeparture + "(UTC)" : formattedToDate,

                            "CONTACT_EMAIL": email:contactUsEmail,
                            "YEAR": time:utcToCivil(time:utcNow()).year.toString()
                        });
                if content is error {
                    string customError = "An error occurred while binding values to the email template!";
                    log:printError(customError, content);
                } else {
                    error? emailError = email:sendEmail(
                                {
                                to: [visitorEmail],
                                'from: email:fromEmailAddress,
                                subject: email:VISIT_REJECTED_SUBJECT,
                                template: content,
                                cc: [email:receptionEmail]
                            });
                    if emailError is error {
                        string customError = "An error occurred while sending the rejection email!";
                        log:printError(customError, emailError);
                    }
                }
            }
            return <http:Ok>{
                body: {
                    message: "Visit rejected successfully!"
                }
            };
        }

        // Complete a visit.
        if action == COMPLETE {
            if visit.status != database:APPROVED {
                return <http:BadRequest>{
                    body: {
                        message: "The visit is not in the completable state!"
                    }
                };
            }
            error? response = database:updateVisit(visitId,
                    {
                        status: database:COMPLETED,
                        actionedBy: invokerInfo.email,
                        timeOfDeparture: time:utcNow()
                    }, invokerInfo.email);

            if response is error {
                string customError = "Error occurred while completing the visits!";
                log:printError(customError, response);
                return <http:InternalServerError>{
                    body: {
                        message: customError
                    }
                };
            }

            if visitorEmail is string {
                database:Floor[]? accessibleLocations = visit.accessibleLocations;
                if accessibleLocations is () {
                    string customError = "No accessible locations found for the visit!";
                    log:printError(customError);

                }

                string accessibleLocationString = accessibleLocations is database:Floor[] ?
                    organizeLocations(accessibleLocations) : "N/A";

                string|error formattedFromDate = formatDateTime(visit.timeOfEntry, "Asia/Colombo");
                if formattedFromDate is error {
                    string customError = "Error occurred while formatting the visit start time!";
                    log:printError(customError, formattedFromDate);
                }
                string|error formattedToDate = formatDateTime(visit.timeOfDeparture, "Asia/Colombo");
                if formattedToDate is error {
                    string customError = "Error occurred while formatting the visit end time!";
                    log:printError(customError, formattedToDate);
                }
                string|error content = email:bindKeyValues(email:visitorCompletionTemplate,
                        {
                            "TIME": time:utcToEmailString(time:utcNow()),
                            "EMAIL": visitorEmail,
                            "NAME": generateSalutation(visit.name),
                            "TIME_OF_ENTRY": formattedFromDate is error ? visit.timeOfEntry + "(UTC)" : formattedFromDate,
                            "TIME_OF_DEPARTURE": formattedToDate is error ?
                                visit.timeOfDeparture + "(UTC)" : formattedToDate,
                            "ALLOWED_FLOORS": accessibleLocationString,
                            "START_TIME": visit.timeOfEntry,
                            "END_TIME": visit.timeOfDeparture,
                            "PASS_NUMBER": <string>visit.passNumber,
                            "CONTACT_EMAIL": email:contactUsEmail
                        });
                if content is error {
                    string customError = "An error occurred while binding values to the email template!";
                    log:printError(customError, content);
                } else {
                    error? emailError = email:sendEmail(
                            {
                                to: [visitorEmail],
                                'from: email:fromEmailAddress,
                                subject: email:VISIT_COMPLETION_SUBJECT,
                                template: content,
                                cc: [email:receptionEmail]
                            });

                    if emailError is error {
                        string customError = "An error occurred while sending the completion email!";
                        log:printError(customError, emailError);
                    }
                }
            }
            return <http:Ok>{
                body: {
                    message: "Visit completed successfully!"
                }
            };
        }
    }
}

