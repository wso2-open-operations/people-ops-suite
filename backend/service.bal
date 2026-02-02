// Copyright (c) 2025, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.
import par_app.authorization;
import par_app.entity;
import par_app.meet;
import par_app.types;
import par_app.utils;
import ballerina/http;
import ballerina/log;
import ballerinax/googleapis.gcalendar;
import ballerina/cache;

public configurable AppConfig appConfig = ?;

final cache:Cache cache = new ({
    capacity: 2000,
    defaultMaxAge: 1800.0,
    cleanupInterval: 900.0
});
@display {
    label: "Performance Appraisal Review Application",
    id: "hris/par-application"
}

service class ErrorInterceptor {
    *http:ResponseErrorInterceptor;

    remote function interceptResponseError(error err, http:RequestContext ctx) returns http:BadRequest|error {

        // Handle data-binding errors.
        if err is http:PayloadBindingError {
            string customError = string `Payload binding failed!`;
            log:printError(customError, err);
            return {
                body: {
                    message: customError
                }
            };
        }
        return err;
    }
}


service http:InterceptableService / on new http:Listener(9093) {

    # Request interceptor.
    #
    # + return - authorization:JwtInterceptor, ErrorInterceptor
    public function createInterceptors() returns http:Interceptor[] =>
        [new authorization:JwtInterceptor(), new ErrorInterceptor()];

    # Fetch samples AppConfig.
    #
    # + return - AppConfig
    resource function get app\-config() returns AppConfig => appConfig;

    # Fetch user information of the logged in users.
    #
    # + ctx - Request object
    # + return - User info object|Error
    resource function get user\-info(http:RequestContext ctx) returns UserInfoResponse|http:InternalServerError {

        // User information header.
        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            return <http:InternalServerError>{
                body: {
                    message: "User information header not found!"
                }

            };
        }

        // Check cache for logged in user.
        if cache.hasKey(userInfo.email) {
            UserInfoResponse|error cachedUserInfo = cache.get(userInfo.email).ensureType();
            if cachedUserInfo is UserInfoResponse {
                return cachedUserInfo;
            }
        }

        // Fetch the user information from the entity service.
        entity:Employeebasic|error loggedInUser = entity:fetchEmployeesBasicInfo(userInfo.email);
        if loggedInUser is error {
            string customError = string `Error occurred while retrieving user data: ${userInfo.email}!`;
            log:printError(customError, loggedInUser);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        // Fetch the user's privileges based on the roles.
        int[] privileges = [];
        if authorization:checkPermissions([authorization:authorizedRoles.employeeRole], userInfo.groups) {
            privileges.push(authorization:EMPLOYEE_ROLE_PRIVILEGE);
        }
        if authorization:checkPermissions([authorization:authorizedRoles.headPeopleOperationsRole], userInfo.groups) {
            privileges.push(authorization:HEAD_PEOPLE_OPERATIONS_PRIVILEGE);
        }

        UserInfoResponse userInfoResponse = {...loggedInUser, privileges};

        error? cacheError = cache.put(userInfo.email, userInfoResponse);
        if cacheError is error {
            log:printError("An error occurred while writing user info to the cache", cacheError);
        }
        return userInfoResponse;
    }
    
    # The resource function to add a new par cycle.
    #
    # + ctx - The request context
    # + parCycle - The par cycle to be created
    # + return - The created par cycle or an error
    resource function post par\-cycles(http:RequestContext ctx, types:ParCycleCreate parCycle)
            returns types:ParCycle|http:Conflict|http:BadRequest|http:InternalServerError {
        types:InvokerDetails|error invokerDetails = utils:getInvokerDetails(ctx);
        if invokerDetails is error {
            return utils:createInternalServerErrorResponse(invokerDetails,
                    "An error occurred while retrieving invoker details.");
        }

        error[] validationResult = types:validateParCycle(parCycle);
        if validationResult.length() > 0 {
            error err = error(string:'join(", ", ...validationResult.map(e => e.message())));
            return utils:createBadRequestResponse(err);
        }

        types:ParCycle|error createdParCycle = createParCycle(invokerDetails, parCycle);
        if createdParCycle is error {
            if createdParCycle.detail()["code"] == types:ERR_PAR_CYCLE_CONFLICT {
                return utils:createConflictResponse(createdParCycle);
            }

            return utils:createInternalServerErrorResponse(createdParCycle,
                    "An error occurred while creating the par cycle.");
        }

        return createdParCycle;
    }

    # The resource function to get a par cycle by ID.
    #
    # + parCycleId - The ID of the par cycle to be retrieved
    # + return - The par cycle or an error
    resource function get par\-cycles/[int parCycleId]() returns types:ParCycle|http:NotFound|http:InternalServerError {
        types:ParCycle|error parCycle = getParCycle(parCycleId);
        if parCycle is error {
            if parCycle.detail()["code"] == types:ERR_PAR_CYCLE_NOT_FOUND {
                return utils:createNotFoundResponse(parCycle);
            }

            return utils:createInternalServerErrorResponse(parCycle,
                    "An error occurred while retrieving the par cycle.");
        }

        return parCycle;
    }

    # The resource function to get all par cycles.
    #
    # + ctx - The request context
    # + status - The status of the par cycles to be retrieved
    # + email - The email of the employee
    # + return - The par cycles or an error
    resource function get par\-cycles(http:RequestContext ctx, types:ParCycleStatus? status, string? email)
            returns types:ParCycle[]|http:InternalServerError|http:BadRequest|http:Forbidden {
        types:InvokerDetails|error invokerDetails = utils:getInvokerDetails(ctx);
        if invokerDetails is error {
            return utils:createInternalServerErrorResponse(invokerDetails,
                    "An error occurred while retrieving invoker details.");
        }

        types:ParCycle[]|error parCycles;
        boolean isLead = email != () ? isLeadOfEmployeeInActiveParCycle(invokerDetails.email, email) : false;
        boolean isSelf = email == invokerDetails.email;
        boolean isAdmin = invokerDetails.isAdmin && !isSelf && !isLead;
        boolean isInvokerLead = isLeadInActiveParCycle(invokerDetails.email);
        if isAdmin || isLead || isSelf || (email == () && isInvokerLead) {
            parCycles = getParCycles(status, email);
        } else {
            return utils:createForbiddenResponse("You are not authorized to get par cycles.");
        }

        if parCycles is error {
            return utils:createInternalServerErrorResponse(parCycles, "An error occurred while retrieving par cycles.");
        }

        return parCycles;
    }

    # The resource function to update a par cycle.
    #
    # + parCycleId - The ID of the par cycle to be updated
    # + ctx - The request context
    # + parCycle - The updated par cycle
    # + return - The updated par cycle or an error
    resource function patch par\-cycles/[int parCycleId](http:RequestContext ctx, types:ParCycleModify parCycle)
            returns types:ParCycle|http:BadRequest|http:InternalServerError|http:UnprocessableEntity|http:NotFound {
        types:InvokerDetails|error invokerDetails = utils:getInvokerDetails(ctx);
        if invokerDetails is error {
            return utils:createInternalServerErrorResponse(invokerDetails,
                    "An error occurred while retrieving invoker details.");
        }

        types:ParCycle|error updatedParCycle = updateParCycle(invokerDetails, parCycleId, parCycle);
        if updatedParCycle is error {
            if updatedParCycle.detail()["code"] == types:ERR_PAR_CYCLE_CANNOT_BE_PROCESSED {
                return utils:createUnprocessableEntityResponse(updatedParCycle);
            } else if updatedParCycle.detail()["code"] == types:ERR_PAR_CYCLE_NOT_FOUND {
                return utils:createNotFoundResponse(updatedParCycle);
            }
            return utils:createInternalServerErrorResponse(updatedParCycle,
                    "An error occurred while updating par cycle.");
        }

        return updatedParCycle;
    }

    # The resource function to get all par ratings of a given par cycle.
    #
    # + parCycleId - The ID of the par cycle
    # + ctx - The request context
    # + return - The par cycles or an error
    resource function get par\-cycles/[int parCycleId]/par\-ratings(http:RequestContext ctx)
            returns types:ParRating[]|http:InternalServerError|http:BadRequest|http:Forbidden {
        types:InvokerDetails|error invokerDetails = utils:getInvokerDetails(ctx);
        if invokerDetails is error {
            return utils:createInternalServerErrorResponse(invokerDetails,
                    "An error occurred while retrieving invoker details.");
        }

        if !invokerDetails.isAdmin {
            return utils:createForbiddenResponse("You are not authorized to get par ratings for the par cycle.");
        }

        types:ParRating[]|error parRatings = getParRatingsWithoutComments(parCycleId);
        if parRatings is error {
            return utils:createInternalServerErrorResponse(parRatings,
                    "An error occurred while retrieving par ratings for the par cycle.");
        }
        return parRatings;
    }

    # The resource function to get par rating of a given employee in a given par cycle.
    #
    # + parCycleId - The ID of the par cycle
    # + email - The email of the employee
    # + ctx - The request context
    # + return - The par rating or an error
    resource function get par\-cycles/[int parCycleId]/employees/[string email]/par\-ratings(http:RequestContext ctx)
            returns types:ParRating|http:InternalServerError|http:NotFound|http:Forbidden {
        types:InvokerDetails|error invokerDetails = utils:getInvokerDetails(ctx);
        if invokerDetails is error {
            return utils:createInternalServerErrorResponse(invokerDetails,
                    "An error occurred while retrieving invoker details.");
        }

        boolean isTeamLead = isLeadOfEmployeeInActiveParCycle(invokerDetails.email, email);
        boolean isSelf = email == invokerDetails.email;
        boolean isAdmin = invokerDetails.isAdmin && !isSelf && !isTeamLead;
        boolean isAdditionalLead = isAdditionalLeadOfEmployee(invokerDetails.email, email);
        boolean isEmployeeLead = isLead(invokerDetails.email);

        if !(isAdmin || isEmployeeLead || isSelf || isAdditionalLead || isTeamLead) {
            return utils:createForbiddenResponse("You are not authorized to get par rating of the given employee.");
        }

        types:ParRating|error parRating = getParRating(parCycleId, email);
        if parRating is error {
            return utils:createNotFoundResponse(parRating,
                    "PAR rating record not found for the specified employee and PAR cycle.");
        }

        if isAdmin {
            return parRating;
        }

        parRating = types:sanitizeParRating(parRating, isTeamLead, isSelf);
        if parRating is error {
            return utils:createInternalServerErrorResponse(parRating,
                    "An error occurred while sanitizing the par rating of the given employee.");
        }
        return parRating;
    }

    # The resource function to update par rating of a given employee in a given par cycle.
    #
    # + parCycleId - The ID of the par cycle
    # + email - The email of the employee
    # + parRatingId - The ID of the par rating
    # + ctx - The request context
    # + parRating - The par rating to be updated
    # + return - Http OK or an error
    resource function patch par\-cycles/[int parCycleId]/employees/[string email]/par\-ratings/[int parRatingId]
            (http:RequestContext ctx, types:ParRatingModify parRating)
            returns http:Ok|http:InternalServerError|http:BadRequest|http:Forbidden {
        types:InvokerDetails|error invokerDetails = utils:getInvokerDetails(ctx);
        if invokerDetails is error {
            return utils:createInternalServerErrorResponse(invokerDetails,
                    "An error occurred while retrieving invoker details.");
        }

        boolean isTeamLead = isLeadOfEmployeeInActiveParCycle(invokerDetails.email, email);
        boolean isSelf = email == invokerDetails.email;
        boolean isAdmin = invokerDetails.isAdmin;
        boolean isAdditionalLead = isAdditionalLeadOfEmployee(invokerDetails.email, email);
        boolean isEmployeeLead = isLead(invokerDetails.email);

        if !(isAdmin || isTeamLead || isSelf || isAdditionalLead || isEmployeeLead) {
            return utils:createForbiddenResponse("You are not authorized to update par rating of the given employee.");
        }

        if !isAdmin {
            error? modifiable = types:checkForModifiableFields(parRating, isTeamLead, isSelf);
            if modifiable is error {
                if modifiable.detail()["code"] == types:ERR_PAR_RATING_UPDATE_FORBIDDEN {
                    return utils:createForbiddenResponse(modifiable.message());
                }
                return utils:createForbiddenResponse("You are not authorized to update the fields of par rating.");
            }
        }

        string|error ctxUserTimezoneOffset = ctx.getWithType(types:USER_TIMEZONE_OFFSET);
        if ctxUserTimezoneOffset is error {
            return utils:createInternalServerErrorResponse(ctxUserTimezoneOffset,
                    "An error occurred while retrieving time zone offset header.");
        }

        decimal|error userTimezoneOffset = decimal:fromString(ctxUserTimezoneOffset);
        if userTimezoneOffset is error {
            return utils:createInternalServerErrorResponse(userTimezoneOffset,
                    "An error occurred while converting time zone offset header.");
        }

        if userTimezoneOffset < -12.0d || userTimezoneOffset > 14.0d {
            return utils:createBadRequestResponse(error("Invalid timezone offset."));
        }

        error? validateParRatingModifyResult = validateParRatingModify(parRating, isTeamLead, isSelf, userTimezoneOffset);
        if validateParRatingModifyResult is error {
            if validateParRatingModifyResult.detail()["code"] == types:ERR_PAR_RATING_UPDATE_FORBIDDEN {
                return utils:createForbiddenResponse(validateParRatingModifyResult.message());
            }
            return utils:createBadRequestResponse(validateParRatingModifyResult);
        }

        error? update = updateParRating(invokerDetails, parCycleId, email, parRatingId, parRating, isAdmin,
                isTeamLead, isSelf);
        if update is error {
            if update.detail()["code"] == types:ERR_PAR_RATING_UPDATE_FORBIDDEN {
                return utils:createForbiddenResponse(update.message());
            }
            if update.detail()["code"] == types:ERR_PAR_SPECIAL_RATING_QUOTA_EXCEEDED {
                return utils:createForbiddenResponse(update.message());
            }
            return utils:createInternalServerErrorResponse(update,
                    "An error occurred while updating the par rating of the given employee.");
        }
        return http:OK;
    }

    # The resource function to get par team summaries of a given par cycle.
    #
    # + parCycleId - The ID of the par cycle
    # + ctx - The request context
    # + leadEmail - The email of the team lead
    # + return - The par team summaries or an error
    resource function get par\-cycles/[int parCycleId]/teams(http:RequestContext ctx, string? leadEmail)
            returns types:ParTeamSummary[]|http:InternalServerError|http:BadRequest|http:Forbidden {
        types:InvokerDetails|error invokerDetails = utils:getInvokerDetails(ctx);
        if invokerDetails is error {
            return utils:createInternalServerErrorResponse(invokerDetails,
                    "An error occurred while retrieving invoker details.");
        }

        string invokerEmail = invokerDetails.email;
        boolean isEmployeeLead = isLead(invokerDetails.email);

        if !(invokerDetails.isAdmin || isEmployeeLead ||
            (invokerEmail == leadEmail && isLeadInParCycle(parCycleId, invokerEmail))) {
            return utils:createForbiddenResponse("You are not authorized to get par team summary.");
        }

        types:ParTeamSummary[]|error parTeamSummary = getParTeamSummary(parCycleId, leadEmail);
        if parTeamSummary is error {
            return utils:createInternalServerErrorResponse(parTeamSummary,
                    "An error occurred while getting par team summary.");
        }
        return parTeamSummary;
    }

    # The resource function to get par team details of a given par cycle.
    #
    # + parCycleId - The ID of the par cycle
    # + parTeamId - The ID of the par team
    # + ctx - The request context
    # + return - The par team details or an error
    resource function get par\-cycles/[int parCycleId]/teams/[int parTeamId](http:RequestContext ctx)
        returns types:ParTeamDetails|http:InternalServerError|http:BadRequest|http:Forbidden {

        types:InvokerDetails|error invokerDetails = utils:getInvokerDetails(ctx);
        if invokerDetails is error {
            return utils:createInternalServerErrorResponse(invokerDetails,
                    "An error occurred while retrieving invoker details.");
        }

        if !(invokerDetails.isAdmin || isLeadInParCycle(parCycleId, invokerDetails.email)) {
            return utils:createForbiddenResponse("You are not authorized to get par team details.");
        }

        types:ParTeamDetails|error parTeamDetails = getParTeamDetails(parCycleId, parTeamId);
        if parTeamDetails is error {
            return utils:createInternalServerErrorResponse(parTeamDetails,
                    "An error occurred while retrieving par team details.");
        }
        return parTeamDetails;
    }

    # The resource function to get employee information.
    #
    # + workEmail - The work email of the employee
    # + ctx - The request context
    # + return - The employee information or an error
    resource function get employees/[string workEmail](http:RequestContext ctx)
        returns types:EmployeeInfo|http:InternalServerError|http:BadRequest|http:Forbidden {

        types:InvokerDetails|error invokerDetails = utils:getInvokerDetails(ctx);
        if invokerDetails is error {
            return utils:createInternalServerErrorResponse(invokerDetails,
                    "An error occurred while retrieving invoker details.");
        }

        boolean isLead = isLeadOfEmployeeInActiveParCycle(invokerDetails.email, workEmail);
        boolean isSelf = workEmail == invokerDetails.email;
        boolean isAdmin = invokerDetails.isAdmin && !isSelf && !isLead;
        if !isAdmin && !isLead && !isSelf {
            return utils:createForbiddenResponse("You are not authorized to get employee information.");
        }

        types:EmployeeInfo|error employeeInfo = getEmployeeInfo(workEmail);
        if employeeInfo is error {
            return utils:createInternalServerErrorResponse(employeeInfo,
                    "An error occurred while retrieving employee information.");
        }
        return employeeInfo;
    }

    # The resource function to get 360 reviewers of a given employee in a given par cycle.
    #
    # + parCycleId - The ID of the par cycle
    # + email - The email of the employee
    # + ctx - The request context
    # + return - The 360 reviewers or an error
    resource function get par\-cycles/[int parCycleId]/employees/[string email]/reviewers(http:RequestContext ctx)
            returns types:Par360Reviewer[]|http:InternalServerError|http:BadRequest|http:Forbidden {
        types:InvokerDetails|error invokerDetails = utils:getInvokerDetails(ctx);
        if invokerDetails is error {
            return utils:createInternalServerErrorResponse(invokerDetails,
                    "An error occurred while retrieving invoker details.");
        }

        boolean isTeamLead = isLeadOfEmployeeInActiveParCycle(invokerDetails.email, email);
        boolean isSelf = email == invokerDetails.email;
        boolean isAdmin = invokerDetails.isAdmin && !isSelf && !isTeamLead;
        boolean isAdditionalLead = isAdditionalLeadOfEmployee(invokerDetails.email, email);
        boolean isEmployeeLead = isLead(invokerDetails.email);

        if !isAdmin && !isTeamLead && !isSelf && !isAdditionalLead && !isEmployeeLead {
            return utils:createForbiddenResponse("You are not authorized to get 360 reviewers for the employee.");
        }

        types:Par360Reviewer[]|error par360Reviewers = getPar360Reviewers(parCycleId, email, isSelf);
        if par360Reviewers is error {
            return utils:createInternalServerErrorResponse(par360Reviewers,
                    "An error occurred while retrieving 360 reviewers.");
        }

        return par360Reviewers;
    }

    # The resource function to add 360 reviewers for a given employee in a given par cycle.
    #
    # + parCycleId - The ID of the par cycle
    # + email - The email of the employee
    # + ctx - The request context
    # + par360ReviewRequestCreate - The 360 review request to be created
    # + return - Http Created or an error
    resource function post par\-cycles/[int parCycleId]/employees/[string email]/reviewers
            (http:RequestContext ctx, types:Par360ReviewRequestCreate par360ReviewRequestCreate)
            returns http:Created|http:InternalServerError|http:BadRequest|http:Forbidden {
        types:InvokerDetails|error invokerDetails = utils:getInvokerDetails(ctx);
        if invokerDetails is error {
            return utils:createInternalServerErrorResponse(invokerDetails,
                    "An error occurred while retrieving invoker details.");
        }
        string invokerEmail = invokerDetails.email;
        boolean isTeamLead = isLeadOfEmployeeInActiveParCycle(invokerEmail, email);
        boolean isSelf = email == invokerEmail;

        foreach string reviewerEmail in par360ReviewRequestCreate.reviewerEmails {
            if (invokerEmail === reviewerEmail) && isTeamLead {
                return utils:createForbiddenResponse("Lead's can not provide voluntary feedbacks to direct subordinates");
            }
        }

        error? result = create360Requests(invokerDetails, parCycleId, email, par360ReviewRequestCreate, isTeamLead, isSelf,
                types:SERVICE);
        if result is error {
            if result.detail()["code"] == types:ERR_PAR_360_REVIEW_CANNOT_BE_PROCESSED {
                return utils:createForbiddenResponse(result.message());
            }
            return utils:createInternalServerErrorResponse(result, "An error occurred while adding 360 reviewers.");
        }
        return http:CREATED;
    }

    # The resource function to get 360 review requests received by a given employee in a given par cycle.
    #
    # + parCycleId - The ID of the par cycle
    # + email - The email of the employee
    # + ctx - The request context
    # + return - The 360 review requests or an error
    resource function get par\-cycles/[int parCycleId]/employees/[string email]/review\-requests(http:RequestContext ctx)
            returns types:Par360ReviewRequest[]|http:InternalServerError|http:BadRequest {
        types:InvokerDetails|error invokerDetails = utils:getInvokerDetails(ctx);
        if invokerDetails is error {
            return utils:createInternalServerErrorResponse(invokerDetails,
                    "An error occurred while retrieving invoker details.");
        }

        types:Par360ReviewRequest[]|error par360ReviewRequests = getPar360ReviewRequests(parCycleId, email);
        if par360ReviewRequests is error {
            return utils:createInternalServerErrorResponse(par360ReviewRequests,
                    "An error occurred while retrieving 360 reviewers.");
        }

        return par360ReviewRequests;
    }

    # The resource function to update 360 review received by a given employee in a given par cycle.
    #
    # + parCycleId - The ID of the par cycle
    # + email - The email of the employee
    # + ctx - The request context
    # + par360Review - The 360 review request to be updated
    # + return - Http OK or an error
    resource function patch par\-cycles/[int parCycleId]/employees/[string email]/review
            (http:RequestContext ctx, types:Par360ReviewUpdate par360Review)
            returns http:Ok|http:InternalServerError|http:BadRequest|http:Forbidden {
        types:InvokerDetails|error invokerDetails = utils:getInvokerDetails(ctx);
        if invokerDetails is error {
            return utils:createInternalServerErrorResponse(invokerDetails,
                    "An error occurred while retrieving invoker details.");
        }

        string|error ctxUserTimezoneOffset = ctx.getWithType(types:USER_TIMEZONE_OFFSET);
        if ctxUserTimezoneOffset is error {
            return utils:createInternalServerErrorResponse(ctxUserTimezoneOffset,
                    "An error occurred while retrieving time zone offset header.");
        }

        decimal|error userTimezoneOffset = decimal:fromString(ctxUserTimezoneOffset);
        if userTimezoneOffset is error {
            return utils:createInternalServerErrorResponse(userTimezoneOffset,
                    "An error occurred while converting time zone offset header.");
        }

        if userTimezoneOffset < -12.0d || userTimezoneOffset > 14.0d {
            return utils:createBadRequestResponse(error("Invalid timezone offset."));
        }

        error? validatePar360ReviewUpdateResult = validatePar360ReviewUpdate(par360Review, userTimezoneOffset);
        if validatePar360ReviewUpdateResult is error {
            if validatePar360ReviewUpdateResult.detail()["code"] == types:ERR_PAR_360_REVIEW_FORBIDDEN {
                return utils:createForbiddenResponse(validatePar360ReviewUpdateResult.message());
            }
            return utils:createBadRequestResponse(validatePar360ReviewUpdateResult);
        }

        error? update = updatePar360Review(invokerDetails, parCycleId, email, par360Review);
        if update is error {
            if update.detail()["code"] == types:ERR_PAR_360_REVIEW_CANNOT_BE_PROCESSED {
                return utils:createForbiddenResponse(update.message());
            }
            return utils:createInternalServerErrorResponse(update, "An error occurred while updating 360 review.");
        }
        return http:OK;
    }

    # The resource function to get 360 reviews received by a given employee in a given par cycle.
    #
    # + parCycleId - The ID of the par cycle
    # + email - The email of the employee
    # + ctx - The request context
    # + return - The 360 reviews or an error
    resource function get par\-cycles/[int parCycleId]/employees/[string email]/reviews(http:RequestContext ctx)
            returns types:Par360Review[]|http:InternalServerError|http:BadRequest|http:Forbidden {
        types:InvokerDetails|error invokerDetails = utils:getInvokerDetails(ctx);
        if invokerDetails is error {
            return utils:createInternalServerErrorResponse(invokerDetails,
                    "An error occurred while retrieving invoker details.");
        }

        boolean isTeamLead = isLeadOfEmployeeInActiveParCycle(invokerDetails.email, email);
        boolean isAdditionalLead = isAdditionalLeadOfEmployee(invokerDetails.email, email);
        boolean isEmployeeLead = isLead(invokerDetails.email);

        if !(invokerDetails.isAdmin || isTeamLead || isAdditionalLead || isEmployeeLead) {
            return utils:createForbiddenResponse("You are not authorized to get 360 reviews for the employee.");
        }

        types:Par360Review[]|error par360Reviews = getPar360Reviews(parCycleId, email);
        if par360Reviews is error {
            return utils:createInternalServerErrorResponse(par360Reviews,
                    "An error occurred while retrieving 360 reviews.");
        }
        return par360Reviews;
    }

    # The resource function to get 360 review received by a given employee in a given par cycle.
    #
    # + parCycleId - The ID of the par cycle
    # + email - The email of the employee
    # + ctx - The request context
    # + return - The 360 review or an error
    resource function get par\-cycles/[int parCycleId]/employees/[string email]/review
            (http:RequestContext ctx) returns types:Par360Review|http:InternalServerError|http:BadRequest|
            http:Forbidden {
        types:InvokerDetails|error invokerDetails = utils:getInvokerDetails(ctx);
        if invokerDetails is error {
            return utils:createInternalServerErrorResponse(invokerDetails,
                    "An error occurred while retrieving invoker details.");
        }

        types:Par360Review|error par360Review = getPar360Review(parCycleId, email, invokerDetails.email);
        if par360Review is error {
            return utils:createInternalServerErrorResponse(par360Review,
                    "An error occurred while retrieving 360 review.");
        }
        return par360Review;
    }

    # The resource function to get all employees information.
    #
    # + ctx - The request context
    # + return - The employees information or an error
    resource function get meta/employees(http:RequestContext ctx)
            returns types:BasicEmployeeInfo[]|http:InternalServerError|http:BadRequest {
        types:InvokerDetails|error invokerDetails = utils:getInvokerDetails(ctx);
        if invokerDetails is error {
            return utils:createInternalServerErrorResponse(invokerDetails,
                    "An error occurred while retrieving invoker details.");
        }

        types:BasicEmployeeInfo[]|error employees = getBasicEmployeesInfo();
        if employees is error {
            return utils:createInternalServerErrorResponse(employees, "An error occurred while retrieving employees.");
        }
        return employees;
    }

    # The resource function to get par cycle configurations.
    #
    # + ctx - The request context
    # + return - The par cycle configurations or an error
    resource function get meta/configurations(http:RequestContext ctx)
            returns types:ParCycleConfigurationsOptionalizedResponse|http:InternalServerError|http:BadRequest {
        types:InvokerDetails|error invokerDetails = utils:getInvokerDetails(ctx);
        if invokerDetails is error {
            return utils:createInternalServerErrorResponse(invokerDetails,
                    "An error occurred while retrieving invoker details.");
        }

        types:ParCycleConfigurationsOptionalizedResponse|error parCycleConfigurations = getParCycleConfigurations();
        if parCycleConfigurations is error {
            return utils:createInternalServerErrorResponse(parCycleConfigurations,
                    "An error occurred while retrieving par cycle configurations.");
        }

        if !invokerDetails.isAdmin {
            return types:sanitizeParConfigsForNonAdmins(parCycleConfigurations);
        }

        return parCycleConfigurations;
    }

    # The resource function to update par cycle configurations.
    #
    # + ctx - The request context
    # + parCycleConfigurations - The par cycle configurations to be updated
    # + return - Http OK or an error
    resource function put meta/configurations(http:RequestContext ctx,
            types:ParCycleConfigurations parCycleConfigurations)
            returns http:Ok|http:InternalServerError|http:BadRequest|http:Forbidden {
        types:InvokerDetails|error invokerDetails = utils:getInvokerDetails(ctx);
        if invokerDetails is error {
            return utils:createInternalServerErrorResponse(invokerDetails,
                    "An error occurred while retrieving invoker details.");
        }

        if !invokerDetails.isAdmin {
            return utils:createForbiddenResponse("You are not authorized to update par cycle configurations.");
        }

        error? result = createOrUpdateParCycleConfigurations(invokerDetails, parCycleConfigurations);
        if result is error {
            return utils:createInternalServerErrorResponse(result,
                    "An error occurred while updating par cycle configurations.");
        }
        return http:OK;
    }

    # The resource function to get par special rating groups.
    #
    # + ctx - The request context
    # + return - ParSpecialRatingGroupWithHeadCount type or an error
    resource function get par\-cycles/[int parCycleId]/special\-rating\-groups(http:RequestContext ctx)
            returns http:InternalServerError|http:Forbidden|types:ParSpecialRatingGroupWithHeadCount[] {
        types:InvokerDetails|error invokerDetails = utils:getInvokerDetails(ctx);
        if invokerDetails is error {
            return utils:createInternalServerErrorResponse(invokerDetails,
                    "An error occurred while retrieving invoker details.");
        }

        if !invokerDetails.isAdmin {
            return utils:createForbiddenResponse("You are not authorized to get special rating groups.");
        }

        types:ParSpecialRatingGroupWithHeadCount[]|error parSpecialRatingGroupWithHeadCount =
            getParSpecialRatingGroupsWithHeadCount(parCycleId);
        if parSpecialRatingGroupWithHeadCount is error {
            return utils:createInternalServerErrorResponse(parSpecialRatingGroupWithHeadCount,
                    "An error occurred while retrieving special rating groups.");
        }

        return parSpecialRatingGroupWithHeadCount;
    }

    # The resource function to post par special rating groups quota.
    #
    # + parSpecialRatingGroupQuota - Create data type for the special rating groups quota.
    # + ctx - The request context
    # + return - Success status or an error
    resource function post par\-cycles/[int parCycleId]/special\-rating\-groups\-quota(http:RequestContext ctx,
            types:ParSpecialRatingGroupQuota parSpecialRatingGroupQuota)
            returns http:InternalServerError|http:BadRequest|http:Ok|http:Forbidden {
        types:InvokerDetails|error invokerDetails = utils:getInvokerDetails(ctx);
        if invokerDetails is error {
            return utils:createInternalServerErrorResponse(invokerDetails,
                    "An error occurred while retrieving invoker details.");
        }

        if !invokerDetails.isAdmin {
            return utils:createForbiddenResponse("You are not authorized to add special quota.");
        }

        types:ParCycle|error parCycle = getParCycle(parCycleId);
        if parCycle is error {
            return utils:createBadRequestResponse(
                    error("The given PAR cycle does not exist to create special rating quotas."));
        }

        int[]|error existingSRGroupIds = getExistingParSpecialRatingGroupIds(parCycleId);
        if existingSRGroupIds is error {
            return utils:createInternalServerErrorResponse(existingSRGroupIds,
                    "An error occurred while retrieving existing special rating group IDs for creating group quota.");
        }

        error? validateParSpecialRatingGroupQuota = types:validateParSpecialRatingGroupQuota(parCycle,
                parSpecialRatingGroupQuota.cloneReadOnly(), existingSRGroupIds);
        if validateParSpecialRatingGroupQuota is error {
            if validateParSpecialRatingGroupQuota.detail()["code"] == types:ERR_PAR_SPECIAL_RATING_QUOTA_BAD_REQUEST {
                return utils:createBadRequestResponse(validateParSpecialRatingGroupQuota,
                        validateParSpecialRatingGroupQuota.message());
            }
            return utils:createBadRequestResponse(error("Invalid special rating group quota request."));
        }

        error? result = createParSpecialQuotas(invokerDetails, parCycleId, parSpecialRatingGroupQuota);
        if result is error {
            return utils:createInternalServerErrorResponse(result,
                    "An error occurred while creating special quota for the par cycle.");
        }
        return http:OK;
    }

    # The resource function to schedule lead reminders.
    #
    # + ctx - The request context
    # + return - Http Accepted or an error
    resource function patch reminders/schedule\-lead\-reminders(http:RequestContext ctx)
            returns http:InternalServerError|http:BadRequest|http:Forbidden|http:Accepted {
        types:InvokerDetails|error invokerDetails = utils:getInvokerDetails(ctx);
        if invokerDetails is error {
            return utils:createInternalServerErrorResponse(invokerDetails,
                    "An error occurred while retrieving invoker details.");
        }

        if !invokerDetails.isAdmin {
            return utils:createForbiddenResponse("You are not authorized to send lead reminders.");
        }

        error? result = scheduleLeadReminders(types:SERVICE);
        if result is error {
            return utils:createInternalServerErrorResponse(result, "An error occurred while sending lead reminders.");
        }
        return http:ACCEPTED;
    }

    # The resource function to schedule employee reminders.
    #
    # + ctx - The request context
    # + return - Http Accepted or an error
    resource function patch reminders/schedule\-employee\-reminders(http:RequestContext ctx)
            returns http:InternalServerError|http:BadRequest|http:Forbidden|http:Accepted {
        types:InvokerDetails|error invokerDetails = utils:getInvokerDetails(ctx);
        if invokerDetails is error {
            return utils:createInternalServerErrorResponse(invokerDetails,
                    "An error occurred while retrieving invoker details.");
        }

        if !invokerDetails.isAdmin {
            return utils:createForbiddenResponse("You are not authorized to send employee reminders.");
        }

        error? result = scheduleEmployeeReminders(types:SERVICE);
        if result is error {
            return utils:createInternalServerErrorResponse(result,
                    "An error occurred while sending employee reminders.");
        }
        return http:ACCEPTED;
    }

    # The resource function to schedule 360 reminders.
    #
    # + ctx - The request context
    # + return - Http Accepted or an error
    resource function patch reminders/schedule\-360\-reminders(http:RequestContext ctx)
            returns http:InternalServerError|http:BadRequest|http:Forbidden|http:Accepted {
        types:InvokerDetails|error invokerDetails = utils:getInvokerDetails(ctx);
        if invokerDetails is error {
            return utils:createInternalServerErrorResponse(invokerDetails,
                    "An error occurred while retrieving invoker details.");
        }

        string invokerEmail = invokerDetails.email;
        if !isLeadInActiveParCycle(invokerEmail) {
            return utils:createForbiddenResponse("You are not authorized to send 360 reminders.");
        }

        error? result = schedule360Reminders(invokerEmail, types:SERVICE);
        if result is error {
            return utils:createInternalServerErrorResponse(result, "An error occurred while sending 360 reminders.");
        }
        return http:ACCEPTED;
    }

    # The resource function to schedule special rating reminders.
    #
    # + ctx - The request context
    # + return - Http Accepted or an error
    resource function patch reminders/schedule\-special\-rating\-reminders(http:RequestContext ctx)
            returns http:InternalServerError|http:BadRequest|http:Forbidden|http:Accepted {
        types:InvokerDetails|error invokerDetails = utils:getInvokerDetails(ctx);
        if invokerDetails is error {
            return utils:createInternalServerErrorResponse(invokerDetails,
                    "An error occurred while retrieving invoker details.");
        }

        if !invokerDetails.isAdmin {
            return utils:createForbiddenResponse("You are not authorized to send special rating reminders.");
        }

        error? result = scheduleSpecialRatingReminders(types:SERVICE);
        if result is error {
            return utils:createInternalServerErrorResponse(result,
                    "An error occurred while sending special rating reminders.");
        }
        return http:ACCEPTED;
    }

    # The resource function to send reminders.
    #
    # + ctx - The request context
    # + return - Http Accepted or an error
    resource function patch reminders/send\-reminders(http:RequestContext ctx)
            returns http:InternalServerError|http:BadRequest|http:Forbidden|http:Accepted {
        types:InvokerDetails|error invokerDetails = utils:getInvokerDetails(ctx);
        if invokerDetails is error {
            return utils:createInternalServerErrorResponse(invokerDetails,
                    "An error occurred while retrieving invoker details.");
        }

        error? result = sendReminders();
        if result is error {
            return utils:createInternalServerErrorResponse(result, "An error occurred while sending reminders.");
        }
        return http:ACCEPTED;
    }

    # The resource function to schedule auto reminders.
    #
    # + ctx - The request context
    # + return - Http Accepted or an error
    resource function patch reminders/schedule\-auto\-reminders(http:RequestContext ctx)
            returns http:InternalServerError|http:BadRequest|http:Forbidden|http:Accepted {
        types:InvokerDetails|error invokerDetails = utils:getInvokerDetails(ctx);
        if invokerDetails is error {
            return utils:createInternalServerErrorResponse(invokerDetails,
                    "An error occurred while retrieving invoker details.");
        }

        error? result = scheduleAutoReminders();
        if result is error {
            return utils:createInternalServerErrorResponse(result,
                    "An error occurred while scheduling auto reminders.");
        }
        return http:ACCEPTED;
    }

    # The resource function to get direct and indirect reports of a lead.
    #
    # + parCycleId - The ID of the par cycle
    # + ctx - The request context
    # + leadEmail - The email of the team lead
    # + return - The par rating data with reports or an error
    resource function get par\-cycles/[int parCycleId]/reports(http:RequestContext ctx, string leadEmail)
            returns types:AdditionalReportsParRating[]|http:InternalServerError|http:BadRequest|http:Forbidden {
        types:InvokerDetails|error invokerDetails = utils:getInvokerDetails(ctx);
        if invokerDetails is error {
            return utils:createInternalServerErrorResponse(invokerDetails,
                    "An error occurred while retrieving invoker details.");
        }

        string invokerEmail = invokerDetails.email;
        if !(invokerDetails.isAdmin || isLead(invokerEmail) ||
            (invokerEmail == leadEmail && isLeadInParCycle(parCycleId, invokerEmail))) {
            return utils:createForbiddenResponse("You are not authorized to get par reports.");
        }

        types:AdditionalReportsParRating[]|error parReports = getLeadsDirectAndIndirectEmployeesPar(parCycleId, leadEmail);

        if parReports is error {
            return utils:createInternalServerErrorResponse(parReports,
                    "An error occurred while getting par reports.");
        }

        return parReports;
    }

    # The resource function to get the health of the application.
    #
    # + return - Returns the health of the application
    resource function get health() returns http:Ok => http:OK;

    # The resource function to get direct reports of a lead.
    #
    # + parCycleId - The ID of the par cycle
    # + ctx - The request context
    # + leadEmail - The email of the team lead
    # + return - The par rating data with reports or an error
    resource function get par\-cycles/[int parCycleId]/report\-levels(http:RequestContext ctx, string leadEmail)
            returns types:ChainReportsParRating[]|http:InternalServerError|http:BadRequest|http:Forbidden {
        types:InvokerDetails|error invokerDetails = utils:getInvokerDetails(ctx);
        if invokerDetails is error {
            return utils:createInternalServerErrorResponse(invokerDetails,
                    "An error occurred while retrieving invoker details.");
        }

        string invokerEmail = invokerDetails.email;
        if !(invokerDetails.isAdmin || isLead(invokerEmail) ||
            (invokerEmail == leadEmail && isLeadInParCycle(parCycleId, invokerEmail))) {
            return utils:createForbiddenResponse("You are not authorized to get par reports.");
        }

        types:ChainReportsParRating[]|error parReports = getDirectParRatingsOfEmployees(parCycleId, leadEmail);

        if parReports is error {
            return utils:createInternalServerErrorResponse(parReports,
                    "An error occurred while getting par reports.");
        }

        return parReports;
    }

    # The resource function to get participants of a given par cycle.
    #
    # + parCycleId - The ID of the par cycle
    # + leadEmail - The email of the team lead
    # + ctx - The request context
    # + return - The participants or an error
    resource function get par\-cycles/[int parCycleId]/participants(http:RequestContext ctx, string? leadEmail)
            returns types:Participant[]|http:InternalServerError|http:BadRequest|http:Forbidden {
        types:InvokerDetails|error invokerDetails = utils:getInvokerDetails(ctx);
        if invokerDetails is error {
            return utils:createInternalServerErrorResponse(invokerDetails,
                    "An error occurred while retrieving invoker details.");
        }

        types:Participant[]|error participants = getParticipantsOfParCycle(parCycleId, leadEmail);
        if participants is error {
            return utils:createInternalServerErrorResponse(participants,
                    "An error occurred while getting participants.");
        }
        return participants;
    }

    # The resource function to get rejected reviews of a given par cycle.
    #
    # + parCycleId - The ID of the par cycle
    # + ctx - The request context
    # + return - The reviews or an error
    resource function get par\-cycles/[int parCycleId]/rejected\-reviews(http:RequestContext ctx)
            returns types:RejectedReview[]|http:InternalServerError|http:BadRequest|http:Forbidden {

        types:InvokerDetails|error invokerDetails = utils:getInvokerDetails(ctx);
        if invokerDetails is error {
            return utils:createInternalServerErrorResponse(invokerDetails,
                    "An error occurred while retrieving invoker details.");
        }

        if !invokerDetails.isAdmin {
            return utils:createForbiddenResponse("You are not authorized to get reviews.");
        }

        types:RejectedReview[]|error reviews = getAllRejectedReviews(parCycleId);
        if reviews is error {
            return utils:createInternalServerErrorResponse(reviews,
                    "An error occurred while getting reviews.");
        }
        return reviews;
    }

    # The resource function to get busy times of the invoker and lead.
    #
    # + ctx - The request context
    # + return - The reviews or an error
    resource function get calendar/busy\-times(http:RequestContext ctx, string date)
        returns gcalendar:FreeBusyResponse|http:InternalServerError|http:BadRequest|http:Forbidden {

        types:InvokerDetails|error invokerDetails = utils:getInvokerDetails(ctx);
        if invokerDetails is error {
            return utils:createInternalServerErrorResponse(invokerDetails,
                    "An error occurred while retrieving invoker details.");
        }

        string|error ctxUserTimezoneOffset = ctx.getWithType(types:USER_TIMEZONE_OFFSET);
        if ctxUserTimezoneOffset is error {
            return utils:createInternalServerErrorResponse(ctxUserTimezoneOffset,
                    "An error occurred while retrieving time zone offset header.");
        }

        decimal|error userTimezoneOffset = decimal:fromString(ctxUserTimezoneOffset);
        if userTimezoneOffset is error {
            return utils:createInternalServerErrorResponse(userTimezoneOffset,
                    "An error occurred while converting time zone offset header.");
        }

        if userTimezoneOffset < -12.0d || userTimezoneOffset > 14.0d {
            return utils:createBadRequestResponse(error("Invalid timezone offset."));
        }
        gcalendar:FreeBusyResponse|error busySlots = getBusyTimeSlots(invokerDetails.email, date, userTimezoneOffset);

        if busySlots is error {
            return utils:createInternalServerErrorResponse(busySlots,
                    "An error occurred while getting busySlots.");
        }
        return busySlots;
    }

    # The resource function schedule a F2F meeting with the invoker and the lead.
    #
    # + ctx - The request context
    # + request - ScheduleMeetingRequest type
    # + return - The reviews or an error
    resource function post calendar/schedule\-f2f(http:RequestContext ctx, types:ScheduleMeetingRequest request)
            returns http:InternalServerError|http:BadRequest|http:Forbidden|http:Created {

        types:InvokerDetails|error invokerDetails = utils:getInvokerDetails(ctx);
        if invokerDetails is error {
            return utils:createInternalServerErrorResponse(invokerDetails,
                    "An error occurred while retrieving invoker details.");
        }
        string|error ctxUserTimezoneOffset = ctx.getWithType(types:USER_TIMEZONE_OFFSET);
        if ctxUserTimezoneOffset is error {
            return utils:createInternalServerErrorResponse(ctxUserTimezoneOffset,
                    "An error occurred while retrieving time zone offset header.");
        }

        decimal|error userTimezoneOffset = decimal:fromString(ctxUserTimezoneOffset);
        if userTimezoneOffset is error {
            return utils:createInternalServerErrorResponse(userTimezoneOffset,
                    "An error occurred while converting time zone offset header.");
        }

        if userTimezoneOffset < -12.0d || userTimezoneOffset > 14.0d {
            return utils:createBadRequestResponse(error("Invalid timezone offset."));
        }

        meet:CreateCalendarEventResponse|error creationResult = scheduleF2FMeeting(
                invokerDetails.email,
                request,
                userTimezoneOffset
        );

        if creationResult is error {
            return utils:createInternalServerErrorResponse(creationResult,
                    "An error occurred while scheduling the F2F meeting.");
        }
        return http:CREATED;
    }

    # The resource function to sync an employee details to the system.
    #
    # + workEmail - The work email of the employee
    # + ctx - The request context
    # + return - The employee information or an error
    resource function post par\-cycles/[int parCycleId]/employees/[string workEmail]/sync(http:RequestContext ctx)
            returns http:InternalServerError|http:BadRequest|http:Forbidden|http:Ok {

        types:InvokerDetails|error invokerDetails = utils:getInvokerDetails(ctx);
        if invokerDetails is error {
            return utils:createInternalServerErrorResponse(invokerDetails,
                    "An error occurred while retrieving invoker details.");
        }

        log:printInfo("Syncing employee: " + workEmail);
        error? result = validateAndSyncEmployeeInformation(workEmail, parCycleId, invokerDetails.email);
        if result is error {
            return utils:createInternalServerErrorResponse(result,
                    "An error occurred while syncing the employee information.");
        }

        entity:Employee[]|error subordinates = entity:getAllActiveEmployees(workEmail);
        if subordinates is error {
            return utils:createInternalServerErrorResponse(subordinates,
                    "An error occurred while syncing the employee's subordinates.");
        }

        foreach entity:Employee subordinate in subordinates {
            log:printInfo("Syncing subordinate employee: " + subordinate.workEmail);
            error? subordinateResult =
                validateAndSyncEmployeeInformation(subordinate.workEmail, parCycleId, invokerDetails.email);

            if subordinateResult is error {
                return utils:createInternalServerErrorResponse(subordinateResult,
                        "An error occurred while syncing the employee information.");
            }
        }
        return http:OK;
    }

    # The resource function to get PAR summaries of an employee.
    #
    # + employeeEmail - The work email of the employee
    # + ctx - The request context
    # + return - The employee PAR summary information or an error
    resource function get par\-ratings/summary/[string employeeEmail](http:RequestContext ctx)
            returns http:InternalServerError|http:BadRequest|http:Forbidden|types:EmployeeParSummary[] {

        types:InvokerDetails|error invokerDetails = utils:getInvokerDetails(ctx);
        if invokerDetails is error {
            return utils:createInternalServerErrorResponse(invokerDetails,
                    "An error occurred while retrieving invoker details.");
        }
        boolean isAdmin = invokerDetails.isAdmin;
        if !isAdmin {
            return utils:createForbiddenResponse("You are not authorized to get  employee PAR summaries.");
        }
        types:EmployeeParSummary[]|error parSummariesOfEmployee = getParSummariesOfEmployee(employeeEmail);
        if parSummariesOfEmployee is error {
            return utils:createInternalServerErrorResponse(parSummariesOfEmployee,
                    "An error occurred while retrieving employee PAR summaries.");
        }
        return parSummariesOfEmployee;
    }

    # The resource function to get special rating allocation for the active cycle.
    #
    # + ctx - The request context
    # + leadEmail - The optional parameter of the lead
    # + return - The quota allocations or an error
    resource function get par\-cycles/[int parCycleId]/special\-rating\-groups\-quota(http:RequestContext ctx,
            string? leadEmail) returns http:InternalServerError|http:Forbidden|types:SpecialRatingAllocation[] {

        types:InvokerDetails|error invokerDetails = utils:getInvokerDetails(ctx);
        if invokerDetails is error {
            return utils:createInternalServerErrorResponse(invokerDetails,
                    "An error occurred while retrieving invoker details.");
        }
        string invokerEmail = invokerDetails.email;
        boolean isAdmin = invokerDetails.isAdmin;
        boolean isEmployeeLead = isLead(invokerDetails.email) || isLeadInParCycle(parCycleId, invokerEmail);
        if !isEmployeeLead {
            return utils:createForbiddenResponse("You are not authorized to get quota allocations.");
        }
        if leadEmail is string && leadEmail !== invokerEmail {
            return utils:createForbiddenResponse("You are not authorized to get quota allocations of other functions.");
        }
        types:SpecialRatingAllocation[]|error quotaAllocations = getSpecialRatingAllocations(parCycleId,
                    (isAdmin && leadEmail is ()) ? () : invokerEmail);
        if quotaAllocations is error {
            return utils:createInternalServerErrorResponse(quotaAllocations,
                    "An error occurred while retrieving special group quota allocations.");
        }
        return quotaAllocations;
    }

    # The resource function to get employees from the HR Entity.
    #
    # + ctx - The request context
    # + return - Basic employee information array or an error
    resource function get employees(http:RequestContext ctx, string? leadEmail)
            returns types:BasicEmployeeInfo[]|http:InternalServerError|http:BadRequest|http:Forbidden {

        types:InvokerDetails|error invokerDetails = utils:getInvokerDetails(ctx);
        if invokerDetails is error {
            return utils:createInternalServerErrorResponse(invokerDetails,
                "An error occurred while retrieving invoker details.");
        }
        if !invokerDetails.isAdmin {
            if leadEmail != invokerDetails.email {
                return utils:createForbiddenResponse(
                    "You are not authorized to retrieve subordinates of this employee.");
            }
        }
        types:BasicEmployeeInfo[]|error employees = getBasicEmployeesInfo(leadEmail);
        if employees is error {
            return utils:createInternalServerErrorResponse(employees, "An error occurred while retrieving employees.");
        }
        return employees;
    }
}
