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
import leave_service.authorization;
import leave_service.database;
import leave_service.email;
import leave_service.employee;

import ballerina/http;
import ballerina/log;
import ballerina/time;

@display {
    label: "Leave Backend Service",
    id: "people-ops/leave-application"
}

service http:InterceptableService / on new http:Listener(9090) {

    # Request interceptor.
    # + return - authorization:JwtInterceptor
    public function createInterceptors() returns http:Interceptor[] => [new authorization:JwtInterceptor()];

    function init() returns error? => log:printInfo("Leave application backend service started.");

    # Get user info with privileges.
    #
    # + ctx - HTTP request context
    # + return - User Info payload or Internal Server Error
    resource function get user\-info(http:RequestContext ctx) returns UserInfo|http:InternalServerError {
        do {
            readonly & authorization:CustomJwtPayload userInfo = check ctx.getWithType(authorization:HEADER_USER_INFO);
            employee:Employee empInfo = check employee:getEmployee(userInfo.email);

            // Fetch the user's privileges based on the roles.
            int[] privileges = [];
            if authorization:checkPermissions(authorization:authorizedRoles.employeeRoles, userInfo.groups) {
                privileges.push(authorization:EMPLOYEE_PRIVILEGE);
            }
            if authorization:checkPermissions(authorization:authorizedRoles.internRoles, userInfo.groups) {
                privileges.push(authorization:INTERN_PRIVILEGE);
            }
            if authorization:checkPermissions(authorization:authorizedRoles.adminRoles, userInfo.groups) {
                privileges.push(authorization:ADMIN_PRIVILEGE);
            }

            // Get last sabbatical leave end date
            string?|error lastSabbaticalLeaveEndDate = database:getLastSabbaticalLeaveEndDate(userInfo.email);
            if lastSabbaticalLeaveEndDate is error {
                string errMsg = "Error occurred while fetching last sabbatical leave end date";
                log:printError(errMsg, lastSabbaticalLeaveEndDate);
                return <http:InternalServerError>{
                    body: {
                        message: errMsg
                    }
                };
            }
            string?|error subordinatePercentageOnSabbaticalLeave = ();
            if (<boolean>empInfo.lead) {
                privileges.push(authorization:LEAD_PRIVILEGE);
                // Add lead specific subordinate percentage info
                subordinatePercentageOnSabbaticalLeave =
                getSubordinateCountOnSabbaticalLeaveAsAPercentage(userInfo.email);
                if subordinatePercentageOnSabbaticalLeave is error {
                    string errMsg = "Error occurred while calculating subordinate on sabbatical leave percentage";
                    return <http:InternalServerError>{
                        body: {
                            message: errMsg
                        }
                    };
                }

            }
            // Add optional mails for the form
            employee:Employee & readonly|error empLead = employee:getEmployee(empInfo.leadEmail);
            if empLead is error {
                string errorMsg = "Error occurred while fetching employee lead info";
                log:printError(errorMsg);
                return <http:InternalServerError>{
                    body: {
                        message: errorMsg
                    }
                };
            }
            employee:DefaultMail[]|error optionalMailsToNotify = getOptionalMailsToNotify(userInfo.email);
            if empInfo.leadEmail is () {
                return <http:InternalServerError>{body: {message: "Employee lead email not available"}};
            }
            if optionalMailsToNotify is error {
                string errorMsg = "Error occurred while fetching optional mails to notify";
                log:printError(errorMsg, optionalMailsToNotify);
            }
            employee:DefaultMailResponse defaultMailsToNotify = {
                mandatoryMails: [
                    {
                        email: empLead.workEmail,
                        thumbnail: empLead.employeeThumbnail ?: ""
                    },
                    {
                        email: emailGroupToNotify,
                        thumbnail: ""
                    }
                ],
                optionalMails: optionalMailsToNotify is employee:DefaultMail[] ? optionalMailsToNotify : []
            };

            UserInfo userInfoResponse = {
                employeeId: empInfo.employeeId,
                firstName: empInfo.firstName,
                lastName: empInfo.lastName,
                workEmail: empInfo.workEmail,
                leadEmail: empInfo.leadEmail,
                employeeThumbnail: empInfo.employeeThumbnail,
                jobRole: empInfo.jobRole,
                privileges: privileges,
                isLead: empInfo.lead,
                employmentStartDate: empInfo.startDate,
                subordinatePercentageOnSabbaticalLeave: subordinatePercentageOnSabbaticalLeave is string ?
                    subordinatePercentageOnSabbaticalLeave : (),
                cachedEmails: defaultMailsToNotify
            };

            return userInfoResponse;

        } on fail error internalErr {
            string errMsg = "Error occurred while fetching user info";
            log:printError(errMsg, internalErr);
            return <http:InternalServerError>{
                body: {
                    message: errMsg
                }
            };
        }
    }

    # Get application configurations.
    #
    # + return - Application configurations or Internal Server Error
    resource function get app\-config(http:RequestContext ctx)
        returns AppConfig|http:InternalServerError|http:Unauthorized {

        readonly & authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            string errMsg = "Error occurred while decoding user info from token";
            log:printError(errMsg, userInfo);
            return <http:InternalServerError>{
                body: {
                    message: errMsg
                }
            };
        }
        if !authorization:checkPermissions(authorization:authorizedRoles.employeeRoles, userInfo.groups) {
            string errMsg = "Only employees are allowed to access application configurations.";
            return <http:Unauthorized>{
                body: {
                    message: errMsg
                }
            };
        }

        return {
            isSabbaticalLeaveEnabled,
            sabbaticalLeavePolicyUrl,
            sabbaticalLeaveUserGuideUrl,
            sabbaticalLeaveEligibilityDuration,
            sabbaticalLeaveMaxApplicationDuration
        };
    }

    # Get leaves for the given filters.
    #
    # + ctx - HTTP request context
    # + email - Email of the user to filter the leaves
    # + startDate - Start date filter
    # + endDate - End date filter
    # + approverEmail - Approver email to filter the leaves
    # + statuses - Statuses to filter the leaves
    # + return - List of leaves
    resource function get leaves(http:RequestContext ctx, string? email = (), string? startDate = (),
            string? endDate = (), string? approverEmail = (), database:LeaveType[]? leaveCategory = (),
            Status[] statuses = [], int? 'limit = (), int? offset = 0, database:OrderBy? orderBy = database:ASC
    ) returns FetchedLeavesRecord|http:Forbidden|http:InternalServerError|http:BadRequest {

        if email is string && !email.matches(WSO2_EMAIL_PATTERN) {
            return <http:BadRequest>{
                body: {
                    message: string `${ERR_MSG_INVALID_WSO2_EMAIL} ${email}`
                }
            };
        }

        do {
            readonly & authorization:CustomJwtPayload userInfo = check ctx.getWithType(authorization:HEADER_USER_INFO);
            string jwt = check ctx.getWithType(authorization:INVOKER_TOKEN);
            boolean validateForSingleRole = authorization:validateForSingleRole(userInfo,
                    authorization:authorizedRoles.employeeRoles);
            if !validateForSingleRole {
                log:printWarn(string `The user ${userInfo.email} was not privileged to access the resource 
                        /leaves with email=${email.toString()}`);
                return <http:Forbidden>{
                    body: {
                        message: ERR_MSG_UNAUTHORIZED_VIEW_LEAVE
                    }
                };
            }
            // Restrict employees to view only view their own leaves
            if email is string && email != userInfo.email {
                return <http:Forbidden>{
                    body: {
                        message: ERR_MSG_UNAUTHORIZED_VIEW_LEAVE
                    }
                };
            }

            string[]? emails = (email is string) ? [email] : ();
            database:Leave[]|error leaves = database:getLeaves({
                                                                   emails,
                                                                   statuses,
                                                                   startDate,
                                                                   endDate,
                                                                   approverEmail,
                                                                   leaveTypes: leaveCategory,
                                                                   orderBy: orderBy
                                                               }, 'limit);
            if leaves is error {
                fail error(ERR_MSG_LEAVES_RETRIEVAL_FAILED, leaves);
            }
            LeaveResponse[] leaveResponses = from database:Leave leave in leaves
                select check toLeaveEntity(leave, jwt);

            Leave[] leavesFinalResult = [];
            map<float> statsMap = {};
            float totalCount = 0.0;
            foreach LeaveResponse leaveResponse in leaveResponses {
                var {
                id,
                createdDate,
                leaveType,
                endDate: entityEndDate,
                status: entityStatus,
                periodType,
                startDate: entityStartDate,
                email: entityEmail,
                isMorningLeave,
                numberOfDays
                } = leaveResponse;

                leavesFinalResult.push({
                    id,
                    createdDate,
                    leaveType,
                    endDate: entityEndDate,
                    status: <Status>entityStatus,
                    periodType,
                    startDate: entityStartDate,
                    email: entityEmail,
                    isMorningLeave,
                    numberOfDays,
                    isCancelAllowed: checkIfLeaveAllowedToCancel(leaveResponse)
                });
                statsMap[leaveType] = statsMap.hasKey(leaveType) ?
                    statsMap.get(leaveType) + numberOfDays : numberOfDays;
                if leaveType !is database:LIEU_LEAVE {
                    totalCount += numberOfDays;
                }
            }
            statsMap[TOTAL_LEAVE_TYPE] = totalCount;
            return {
                leaves,
                stats: from [string, float] ['type, count] in statsMap.entries()
                    select {
                        'type,
                        count
                    }
            };

        } on fail error internalErr {
            string errMsg = "Error occurred while fetching leaves";
            log:printError(errMsg, internalErr);
            return <http:InternalServerError>{
                body: {
                    message: errMsg
                }
            };
        }
    }

    # Create a new leave.
    #
    # + ctx - HTTP request context
    # + payload - Request payload
    # + isValidationOnlyMode - Whether to validate the leave or create the leave
    # + return - Success response if the leave is created successfully, otherwise an error response
    resource function post leaves(http:RequestContext ctx, LeavePayload payload, boolean isValidationOnlyMode = false)
        returns CalculatedLeave|http:Ok|http:BadRequest|http:Unauthorized|http:Forbidden|http:InternalServerError {

        do {
            readonly & authorization:CustomJwtPayload userInfo = check ctx.getWithType(authorization:HEADER_USER_INFO);
            string jwt = check ctx.getWithType(authorization:INVOKER_TOKEN);
            string email = userInfo.email;
            if !authorization:checkPermissions(authorization:authorizedRoles.employeeRoles, userInfo.groups) {
                return <http:Unauthorized>{
                    body: {
                        message: "You are not authorized to access this resource."
                    }
                };
            }
            // Custom logic for sabbatical leave application
            if payload.leaveType == database:SABBATICAL_LEAVE {
                if authorization:checkPermissions(authorization:authorizedRoles.internRoles, userInfo.groups) {
                    return <http:Unauthorized>{
                        body: {
                            message: "Interns are not allowed to apply for sabbatical leave."
                        }
                    };
                }
                Employee & readonly|error employeeDetails = employee:getEmployee(email);
                if employeeDetails is error {
                    string errMsg = "Error occurred while fetching employee details";
                    log:printError(errMsg, employeeDetails);
                    return <http:InternalServerError>{
                        body: {
                            message: errMsg
                        }
                    };
                }
                string?|error lastSabbaticalLeaveEndDate = database:getLastSabbaticalLeaveEndDate(email);
                if lastSabbaticalLeaveEndDate is error {
                    string errMsg = "Error occurred while fetching last sabbatical leave end date";
                    log:printError(errMsg, lastSabbaticalLeaveEndDate);
                    return <http:InternalServerError>{
                        body: {
                            message: errMsg
                        }
                    };
                }

                string? employmentStartDate = employeeDetails.startDate;
                if employmentStartDate is () {
                    string errMsg = "Employee employment start date not found.";
                    return <http:InternalServerError>{
                        body: {
                            message: errMsg
                        }
                    };
                }

                // User can apply only if he is within the eligibility period
                boolean|error isEligible = checkEligibilityForSabbaticalApplication(employmentStartDate,
                        lastSabbaticalLeaveEndDate);
                if isEligible is error {
                    string errMsg = "Error occurred while checking eligibility for sabbatical leave application";
                    log:printError(errMsg, isEligible);
                    return <http:InternalServerError>{
                        body: {
                            message: errMsg
                        }
                    };
                }
                if !isEligible {
                    return <http:Forbidden>{
                        body: {
                            message: "Employee is not eligible to apply for sabbatical leave."
                        }
                    };
                }
                int|error differenceInDays = getDateDiffInDays(payload.endDate, payload.startDate);
                if differenceInDays is error {
                    string errMsg = "Error occurred while calculating sabbatical leave duration";
                    log:printError(errMsg, differenceInDays);
                    return <http:InternalServerError>{
                        body: {
                            message: errMsg
                        }
                    };
                }
                // Sabbatical leave duration cannot exceed the maximum allowed duration
                if (differenceInDays > sabbaticalLeaveMaxApplicationDuration) {
                    string errMsg = "Sabbatical leave duration cannot exceed 6 weeks (42 days).";
                    return <http:BadRequest>{
                        body: {
                            message: errMsg
                        }
                    };
                }

                string? leadMail = employeeDetails.leadEmail;
                if leadMail is () {
                    string errMsg = "Employee lead email not found.";
                    return <http:InternalServerError>{
                        body: {
                            message: errMsg
                        }
                    };
                }
                string? location = employeeDetails.location;
                if location is () {
                    string errMsg = "Employee location not found.";
                    return <http:InternalServerError>{
                        body: {
                            message: errMsg
                        }
                    };
                }

                error? response = processSabbaticalLeaveRequest({
                                                                    action: APPLY,
                                                                    applicantEmail: email,
                                                                    approverEmail: leadMail,
                                                                    leaveStartDate: payload.startDate,
                                                                    leaveEndDate: payload.endDate,
                                                                    location,
                                                                    comment: payload.comment,
                                                                    numberOfDays: <float>differenceInDays
                                                                });

                if response is error {
                    string errMsg = "Error occurred while processing sabbatical leave application request";
                    log:printError(errMsg, response);
                    return <http:InternalServerError>{
                        body: {
                            message: errMsg
                        }
                    };
                }
                return <http:Ok>{
                    body: {
                        message: "Sabbatical leave application submitted successfully"
                    }
                };
            }

            // Logic for all other leave types (casual, maternity, paternity, lieu...etc)
            log:printInfo(string `Leave${isValidationOnlyMode ? " validation " : " "}request received from email: ${
                        email} with payload: ${payload.toString()}`);

            [time:Utc, time:Utc]|error validatedDateRange = validateDateRange(payload.startDate, payload.endDate);
            if validatedDateRange is error {
                log:printError(ERR_MSG_INVALID_DATE_FORMAT, validatedDateRange);
                return <http:BadRequest>{
                    body: {
                        message: ERR_MSG_INVALID_DATE_FORMAT
                    }
                };
            }
            // Day[] weekdaysFromRange = getWeekdaysFromRange(validatedDateRange[0], validatedDateRange[1]);
            LeaveInput input = {
                email,
                startDate: payload.startDate,
                endDate: payload.endDate,
                leaveType: payload.leaveType,
                periodType: payload.periodType,
                isMorningLeave: payload.isMorningLeave,
                emailRecipients: payload.emailRecipients,
                calendarEventId: payload.calendarEventId,
                comment: payload.comment,
                isPublicComment: payload.isPublicComment,
                emailSubject: payload.emailSubject,
                status: APPROVED
            };
            if isValidationOnlyMode {
                LeaveDetails|error validatedLeave = insertLeaveToDatabase(input, isValidationOnlyMode, jwt);
                if validatedLeave is error {
                    fail error(validatedLeave.message(), validatedLeave);
                }

                return {
                    workingDays: payload.periodType is database:HALF_DAY_LEAVE
                        ? 0.5
                        : <float>validatedLeave.effectiveDays.length(),
                    hasOverlap: false,
                    message: "Valid leave request"
                };
            }

            final readonly & email:EmailNotificationDetails emailContentForLeave = check email:generateContentForLeave(
                        jwt, email, payload
                );
            final readonly & string calendarEventId = createUuidForCalendarEvent();
            final readonly & string[]|error allRecipientsForUser = getAllEmailRecipientsForUser(
                        email,
                    payload.emailRecipients,
                    jwt
                );
            if allRecipientsForUser is error {
                fail error(allRecipientsForUser.message(), allRecipientsForUser);
            }
            final readonly & string? comment = payload.comment;

            payload.emailSubject = emailContentForLeave.subject;
            payload.calendarEventId = calendarEventId;
            input.emailSubject = emailContentForLeave.subject;
            input.calendarEventId = calendarEventId;
            input.emailRecipients = allRecipientsForUser;

            LeaveDetails|error leave = insertLeaveToDatabase(input, isValidationOnlyMode, jwt);
            if leave is error {
                fail error(leave.message(), leave);
            }
            final readonly & LeaveResponse leaveResponse = {
                id: leave.id,
                startDate: leave.startDate,
                calendarEventId: leave.calendarEventId,
                periodType: leave.periodType,
                createdDate: leave.createdDate,
                leaveType: leave.leaveType,
                endDate: leave.endDate,
                location: leave.location,
                numberOfDays: leave.numberOfDays ?: 0.0,
                status: <Status>leave.status,
                email: leave.email,
                isMorningLeave: leave.isMorningLeave
            };
            log:printInfo(string `Submitted leave successfully. ID: ${leaveResponse.id}.`);

            future<error?> notificationFuture = start email:sendLeaveNotification(
                        emailContentForLeave,
                    allRecipientsForUser
                );
            _ = start createLeaveEventInCalendar(email, leaveResponse, calendarEventId);
            if comment is string && !checkIfEmptyString(comment) {
                string[] commentRecipients = allRecipientsForUser;
                if !payload.isPublicComment {
                    commentRecipients = check getPrivateRecipientsForUser(
                                email,
                            payload.emailRecipients,
                            jwt
                        );
                }

                error? notificationResult = wait notificationFuture;
                if notificationResult is () {
                    // Does not send the additional comment notification if the main notification has failed
                    final email:EmailNotificationDetails contentForAdditionalComment =
                        email:generateContentForAdditionalComment(emailContentForLeave.subject, comment);
                    _ = start email:sendAdditionalComment(contentForAdditionalComment.cloneReadOnly(),
                            commentRecipients.cloneReadOnly());
                }
            }
            return <http:Ok>{
                body: {
                    message: "Leave submitted successfully"
                }
            };

        } on fail error internalErr {
            string errMsg = "Error occurred while submitting a leave";
            log:printError(errMsg, internalErr);
            return <http:InternalServerError>{
                body: {
                    message: errMsg
                }
            };
        }
    }

    # Cancel a leave.
    #
    # + id - Leave ID
    # + ctx - Request context
    # + return - Cancelled leave on success, otherwise an error response
    resource function delete leaves/[int id](http:RequestContext ctx)
        returns http:Ok|http:Forbidden|http:BadRequest|http:InternalServerError {

        do {
            readonly & authorization:CustomJwtPayload userInfo = check ctx.getWithType(authorization:HEADER_USER_INFO);
            string jwt = check ctx.getWithType(authorization:INVOKER_TOKEN);
            final database:Leave|error? leave = database:getLeave(id);
            if leave is () {
                return <http:BadRequest>{
                    body: {
                        message: "Invalid leave ID!"
                    }
                };
            }
            if leave is error {
                fail error(ERR_MSG_LEAVE_RETRIEVAL_FAILED, leave);
            }

            LeaveResponse leaveResponse = check toLeaveEntity(leave, jwt);
            final string email = userInfo.email;
            if leaveResponse.email != email {
                boolean validateForSingleRole = authorization:validateForSingleRole(userInfo,
                        authorization:authorizedRoles.adminRoles);
                if !validateForSingleRole {
                    return <http:Forbidden>{
                        body: {
                            message: "You are not authorized to cancel this leave!"
                        }
                    };
                }
            }
            if leaveResponse.status == CANCELLED {
                return <http:BadRequest>{
                    body: {
                        message: "Leave is already cancelled!"
                    }
                };
            }

            any|error result = database:cancelLeave(id);
            if result is error {
                fail error(result.message(), result);
            }
            database:Leave|error? cancelledLeave = database:getLeave(id);
            if cancelledLeave is error? {
                fail error("Error occurred when fetching cancelled leave!", cancelledLeave);
            }

            LeaveDetails|error cancelledLeaveDetails = getLeaveEntityFromDbRecord(cancelledLeave, jwt, true);
            if cancelledLeaveDetails is error {
                fail error(cancelledLeaveDetails.message(), cancelledLeaveDetails);
            }

            email:EmailNotificationDetails generateContentForLeave = check email:generateContentForLeave(
                    jwt,
                    email,
                    leaveResponse,
                    isCancel = true,
                    emailSubject = cancelledLeaveDetails.emailSubject
            );
            string[] allRecipientsForUser = check getAllEmailRecipientsForUser(
                    email,
                    cancelledLeaveDetails.emailRecipients,
                    jwt
            );
            if cancelledLeaveDetails.leaveType == database:SABBATICAL_LEAVE {
                string|null approverEmail = cancelledLeaveDetails.approverEmail;
                // process cancellation for the sabbatical leaves
                if approverEmail is () {
                    string errMsg = string `Approver email is not available for leave with ID: ${id}.`;
                    log:printError(errMsg);
                    return <http:InternalServerError>{
                        body: {
                            message: errMsg
                        }
                    };
                }
                error? cancellationResult = processSabbaticalLeaveRequest({
                                                                              action: CANCEL,
                                                                              applicantEmail: email,
                                                                              approverEmail,
                                                                              leaveStartDate:
                                                                            cancelledLeaveDetails.
                                                                            startDate.substring(0, 10),
                                                                              leaveEndDate: cancelledLeaveDetails.
                                                                            endDate.substring(0, 10),
                                                                              leaveId: id
                                                                          });
                if cancellationResult is error {
                    log:printError("Failed to process sabbatical leave cancellation notification", cancellationResult);
                    return <http:InternalServerError>{
                        body: {
                            message: "Error occurred while cancelling sabbatical leave!"
                        }
                    };
                }
            } else {
                // Send email in the regular format for non-sabbatical leaves
                _ = start email:sendLeaveNotification(
                        generateContentForLeave.cloneReadOnly(),
                        allRecipientsForUser.cloneReadOnly()
                );
            }

            if cancelledLeaveDetails.calendarEventId is () {
                log:printError(string `Calendar event ID is not available for leave with ID: ${id}.`);
            } else {
                _ = start deleteLeaveEventFromCalendar(email, <string>cancelledLeaveDetails.calendarEventId);
            }

            return <http:Ok>{
                body: {
                    message: "Leave cancelled successfully"
                }
            };

        } on fail error internalErr {
            string errMsg = "Error occurred while deleting a leave request";
            log:printError(errMsg, internalErr);
            return <http:InternalServerError>{
                body: {
                    message: errMsg
                }
            };
        }
    }

    # Fetch all the employees.
    #
    # + ctx - HTTP request context
    # + location - Employee location
    # + businessUnit - Employee business unit
    # + team - Employee team
    # + unit - Employee unit
    # + employeeStatuses - Employee statuses to filter the employees
    # + leadEmail - Manager email to filter the employees
    # + return - List of employee records
    resource function get employees(http:RequestContext ctx, string? location, string? businessUnit, string? team,
            string? unit, string[]? employeeStatuses, string? leadEmail)
            returns MinimalEmployeeInfo[]|http:InternalServerError {

        do {
            Employee[] employees = check employee:getEmployees(
                    {
                        location,
                        businessUnit,
                        team,
                        unit,
                        status: employeeStatuses,
                        leadEmail
                    }
            );

            MinimalEmployeeInfo[] employeesToReturn = from Employee employee in employees
                select {
                    firstName: employee.firstName ?: "",
                    lastName: employee.lastName ?: "",
                    workEmail: employee.workEmail,
                    employeeThumbnail: employee.employeeThumbnail ?: ""
                };

            return employeesToReturn;

        } on fail error internalErr {
            string errMsg = "Error occurred while fetching employees";
            log:printError(errMsg, internalErr);
            return <http:InternalServerError>{
                body: {
                    message: errMsg
                }
            };
        }
    }

    # Fetch an employee by email.
    #
    # + ctx - HTTP request context
    # + return - The employee record
    resource function get employees/[string email](http:RequestContext ctx)
        returns Employee|http:InternalServerError|http:BadRequest {

        if !email.matches(WSO2_EMAIL_PATTERN) {
            return <http:BadRequest>{
                body: {
                    message: string `${ERR_MSG_INVALID_WSO2_EMAIL} ${email}`
                }
            };
        }

        do {
            Employee & readonly employee = check employee:getEmployee(email);

            return {
                employeeId: employee.employeeId,
                firstName: employee.firstName,
                lastName: employee.lastName,
                workEmail: employee.workEmail,
                employeeThumbnail: employee.employeeThumbnail,
                location: employee.location,
                leadEmail: employee.leadEmail,
                jobRole: employee.jobRole,
                startDate: employee.startDate,
                finalDayOfEmployment: employee.finalDayOfEmployment,
                lead: employee.lead,
                subordinateCount: employee.subordinateCount
            };

        } on fail error internalErr {
            string errMsg = "Error occurred while fetching employee";
            log:printError(errMsg, internalErr);
            return <http:InternalServerError>{
                body: {
                    message: errMsg
                }
            };
        }
    }

    # Fetch legally entitled leave for the given employee.
    #
    # + ctx - HTTP request context
    # + years - Years to fetch leave entitlement. Empty array will fetch leave entitlement for current year
    # + return - Leave entitlement
    resource function get employees/[string email]/leave\-entitlement(http:RequestContext ctx, int[]? years = ())
        returns LeaveEntitlement[]|http:BadRequest|http:Forbidden|http:InternalServerError {

        if !email.matches(WSO2_EMAIL_PATTERN) {
            return <http:BadRequest>{
                body: {
                    message: string `${ERR_MSG_INVALID_WSO2_EMAIL} ${email}`
                }
            };
        }

        do {
            readonly & authorization:CustomJwtPayload userInfo = check ctx.getWithType(authorization:HEADER_USER_INFO);
            string jwt = check ctx.getWithType(authorization:INVOKER_TOKEN);
            if email != userInfo.email {
                boolean validateForSingleRole = authorization:validateForSingleRole(userInfo,
                        authorization:authorizedRoles.adminRoles);
                if !validateForSingleRole {
                    log:printWarn(string `The user ${userInfo.email} was not privileged to access the${false ?
                                " admin " : " "}resource /leave-entitlement with email=${email.toString()}`);
                    return <http:Forbidden>{
                        body: {
                            message: ERR_MSG_UNAUTHORIZED_VIEW_LEAVE
                        }
                    };
                }
            }

            Employee & readonly employee = check employee:getEmployee(email);
            LeaveEntitlement[]|error leaveEntitlements = getLeaveEntitlement(employee, jwt, years ?: []);
            if leaveEntitlements is error {
                fail error("Error occurred while retrieving leave entitlement!", leaveEntitlements);
            }

            return leaveEntitlements;

        } on fail error internalErr {
            string errMsg = "Error occurred while fetching legally entitled leave for the given employee";
            log:printError(errMsg, internalErr);
            return <http:InternalServerError>{
                body: {
                    message: errMsg
                }
            };
        }
    }

    # Fetch user calendar.
    #
    # + ctx - Request context
    # + startDate - Start date of the calendar
    # + endDate - End date of the calendar
    # + return - User calendar
    resource function get user\-calendar(http:RequestContext ctx, string startDate, string endDate)
        returns UserCalendarInformation|http:InternalServerError {

        do {
            authorization:CustomJwtPayload {email} = check ctx.getWithType(authorization:HEADER_USER_INFO);
            string jwt = check ctx.getWithType(authorization:INVOKER_TOKEN);
            UserCalendarInformation|http:InternalServerError|error userCalendarInformation =
                getUserCalendarInformation(email, startDate, endDate, jwt);
            if userCalendarInformation is error {
                return <http:InternalServerError>{
                    body: {
                        message: userCalendarInformation.message()
                    }
                };
            }

            return userCalendarInformation;

        } on fail error internalErr {
            string errMsg = "Error occurred while fetching user calendar";
            log:printError(errMsg, internalErr);
            return <http:InternalServerError>{
                body: {
                    message: errMsg
                }
            };
        }
    }

    # Generate and fetch leave reports for admins and leads.
    #
    # + ctx - Request context
    # + payload - Request payload
    # + return - Leave report or lead-specific leave report
    resource function post leaves/report(http:RequestContext ctx, ReportPayload payload)
        returns ReportContent|http:Forbidden|http:InternalServerError {

        do {
            authorization:CustomJwtPayload {email, groups} = check ctx.getWithType(authorization:HEADER_USER_INFO);
            string jwt = check ctx.getWithType(authorization:INVOKER_TOKEN);

            boolean isAdmin = authorization:checkRoles(authorization:authorizedRoles.adminRoles, groups);
            Employee[] employees;

            employees = check employee:getEmployees(
                    {
                        location: payload.location,
                        businessUnit: payload.businessUnit,
                        team: payload.department,
                        unit: payload.team,
                        status: payload.employeeStatuses,
                        leadEmail: isAdmin ? () : email
                    }
                );
            string[] emails = from Employee employee in employees
                select employee.workEmail;

            if !isAdmin && emails.length() == 0 {
                return <http:Forbidden>{
                    body: {
                        message: "You have not been assigned as a lead/manager to any employee!"
                    }
                };
            }

            final database:Leave[]|error leaves = database:getLeaves(
                    {emails, statuses: (), startDate: payload.startDate, endDate: payload.endDate}
            );
            if leaves is error {
                fail error(ERR_MSG_LEAVES_RETRIEVAL_FAILED, leaves);
            }

            LeaveResponse[] leaveResponses = from database:Leave leave in leaves
                select check toLeaveEntity(leave, jwt);

            return getLeaveReportContent(leaveResponses);

        } on fail error internalErr {
            string errMsg = "Error occurred while generating leave report";
            log:printError(errMsg, internalErr);
            return <http:InternalServerError>{
                body: {
                    message: errMsg
                }
            };
        }
    }

    # Approve / Reject the sabbatical leave application request.
    #
    # + ctx - Request context
    # + return - Success response if the application is approved/rejected successfully, otherwise an error response
    resource function post leaves/[int id]/[Action action](http:RequestContext ctx)
        returns http:Ok|http:InternalServerError|http:Forbidden {
        authorization:CustomJwtPayload|error {email, groups} = ctx.getWithType(authorization:HEADER_USER_INFO);
        if !authorization:checkPermissions(authorization:authorizedRoles.employeeRoles, groups) {
            return <http:Forbidden>{
                body: {
                    message: "You are not authorized to access this resource."
                }
            };
        }

        // Get the lead info from the database and check if the approver is the relevant lead then proceed
        database:Leave|error? leave = database:getLeave(id);
        if leave is error || leave is () {
            string errMsg = "Error occurred while fetching sabbatical leave records.";
            log:printError(errMsg, leave);
            return <http:InternalServerError>{
                body: {
                    message: errMsg
                }
            };
        }
        string? approverEmail = leave.approverEmail;
        if approverEmail is () {
            string errMsg = "Sabbatical leave approver email is not assigned.";
            log:printError(errMsg);
            return <http:InternalServerError>{
                body: {
                    message: errMsg
                }
            };
        }
        if approverEmail.toLowerAscii() != email.toLowerAscii() {
            string errMsg = "The current user is not authorized to approve/reject this sabbatical leave application";
            log:printError(errMsg);
            return <http:Forbidden>{
                body: {
                    message: errMsg
                }
            };
        }

        Employee|error applicantInfo = employee:getEmployee(leave.email);
        if applicantInfo is error {
            string errMsg = "Error occurred while fetching sabbatical leave applicant details.";
            log:printError(errMsg, applicantInfo);
            return <http:InternalServerError>{
                body: {
                    message: errMsg
                }
            };
        }
        SabbaticalAction|null actionToProcess = ();
        match (action) {
            APPROVE_ACTION => {
                actionToProcess = APPROVE;
            }
            REJECT_ACTION => {
                actionToProcess = REJECT;
            }
        }

        if actionToProcess is () {
            string errMsg = "Invalid action for sabbatical leave approval/rejection.";
            log:printError(errMsg);
            return <http:InternalServerError>{
                body: {
                    message: errMsg
                }
            };
        }
        error? approvalResult = processSabbaticalLeaveRequest({
                                                                  action: actionToProcess,
                                                                  applicantEmail: leave.email,
                                                                  leaveStartDate: leave.startDate.substring(0, 10),
                                                                  leaveEndDate: leave.endDate.substring(0, 10),
                                                                  approverEmail,
                                                                  leaveId: id
                                                              });
        if approvalResult is error {
            log:printError("Failed to process sabbatical leave approval notification", approvalResult);
            return <http:InternalServerError>{
                body: {
                    message: "Error occurred while processing sabbatical leave approval/rejection!"
                }
            };
        }
        return <http:Ok>{
            body: {
                message: "Sabbatical leave approval / rejection processed successfully"
            }
        };
    }
}
