// Copyright (c) 2025, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.
import par_app.calendar;
import par_app.database;
import par_app.email;
import par_app.entity;
import par_app.meet;
import par_app.types;
import par_app.utils;

import ballerina/log;
import ballerina/task;
import ballerina/time;
import ballerinax/googleapis.gcalendar;

configurable boolean enableEmailScheduler = false;
configurable boolean enableAutoReminderScheduler = false;
configurable int emailBatchSize = 10;
configurable string[] specialRatingEligibilityList = [];
configurable string eligibilityEvaluationDate = ?;
configurable int reportingChainMaxDepth = ?;

const SEND_REMINDERS_INTERVAL = 60.0d;
const SCHEDULE_AUTO_REMINDERS_INTERVAL = 86400.0d;

task:JobId? sendRemindersJobId = enableEmailScheduler ?
    check task:scheduleJobRecurByFrequency(new SendRemindersJob(), SEND_REMINDERS_INTERVAL) : ();
task:JobId? sendAutoRemindersJobId = enableAutoReminderScheduler ?
    check task:scheduleJobRecurByFrequency(new ScheduleAutoRemindersJob(), SCHEDULE_AUTO_REMINDERS_INTERVAL,
            startTime = time:utcToCivil(time:utcAddSeconds(check getDateTodayUtc(),
                            check types:SECONDS_FOR_ONE_DAY.ensureType()))) : ();

# Create a new PAR cycle.
#
# + invokerDetails - The details of the user who invoked the function
# + parCycle - The details of the PAR cycle to be created
# + return - ParCycle|error The details of the created PAR cycle or an error if the operation failed
public isolated function createParCycle(types:InvokerDetails invokerDetails, types:ParCycleCreate parCycle)
    returns types:ParCycle|error {
    database:ParCycle[] activeParCycles = check database:getParCyclesByStatus(
            [types:PENDING, types:PENDING_QUOTA, types:OPEN]);
    if activeParCycles.length() > 0 {
        return error(
            "There is already an active PAR cycle. Please close the active PAR cycle before creating a new one.",
            code = types:ERR_PAR_CYCLE_CONFLICT
        );
    }

    int newParCycleId = check database:createParCycle(mapToDatabaseParCycle(parCycle, invokerDetails.email));

    _ = start prepareParCycleForEvaluation(invokerDetails, newParCycleId, eligibilityEvaluationDate);

    return getParCycle(newParCycleId);
}

# Map a ParCycleCreate record to a database ParCycle record.
#
# + parCycle - The ParCycleCreate record to be mapped
# + invokerEmail - The email of the user who invoked the function
# + return - The mapped database ParCycle record
isolated function mapToDatabaseParCycle(types:ParCycleCreate parCycle, string invokerEmail) returns database:ParCycle =>
    let types:ParCycleCreate {parCycleName, parCycleStartDate, parCycleEndDate, parEvaluationStartDate,
        parEvaluationEndDate, parEmployeeDeadline, parLeadDeadline, parSpecialRatingDeadline, parF2FDeadline,
        parThreeSixtyRatingDeadline, parCycleConfigurations} = parCycle
    in {
        parCycleName,
        parCycleStartDate,
        parCycleEndDate,
        parEvaluationStartDate,
        parEvaluationEndDate,
        parEmployeeDeadline,
        parLeadDeadline,
        parSpecialRatingDeadline,
        parF2FDeadline,
        parThreeSixtyRatingDeadline,
        parCycleConfigurations: parCycleConfigurations.toJsonString(),
        parCycleStatus: types:PENDING,
        parCycleCreatedBy: invokerEmail,
        parCycleUpdatedBy: invokerEmail
    };

# Prepare the PAR cycle for evaluation.
#
# + eligibilityEvaluationDate - The end date of the PAR evaluation
# + invokerDetails - The details of the user who invoked the function
# + parCycleId - The ID of the PAR cycle to be prepared for evaluation
# + return - error? An error if the operation failed
isolated function prepareParCycleForEvaluation(types:InvokerDetails invokerDetails, int parCycleId,
        string eligibilityEvaluationDate) returns error? {

    do {
        entity:Employee[] employees = check entity:getAllActiveEmployees();
        log:printDebug("Employees records were retrieved successfully", count = employees.length());

        database:ParSpecialRatingGroup[]|error parSpecialRatingGroups = createAndGetSpecialRatingGroups(
                invokerDetails, parCycleId, employees);
        if parSpecialRatingGroups is error {
            check error("Error occurred while creating special rating groups", parSpecialRatingGroups);
            return;
        }

        database:ParTeam[]|error parTeams = createAndGetParTeams(invokerDetails, parCycleId, employees,
                parSpecialRatingGroups);
        if parTeams is error {
            check error("Error occurred while creating PAR teams", parTeams);
            return;
        }

        error? defaultParRatingResult =
            createDefaultParRatings(invokerDetails, parCycleId, employees, parTeams, eligibilityEvaluationDate);
        if defaultParRatingResult is error {
            check error("Error occurred while creating default PAR ratings", defaultParRatingResult);
            return;
        }
        check updateParCycleState(invokerDetails, parCycleId, types:PENDING_QUOTA);
        log:printInfo("The PAR cycle is waiting for special ratings quota.", id = parCycleId);
    } on fail error e {
        log:printError("An error occurred while preparing the Par Cycle for evaluation", e, parCycleId = parCycleId);
        check updateParCycleState(invokerDetails, parCycleId, types:FAILED);
    }
}

# Create and get special rating groups for the PAR cycle.
#
# + invokerDetails - The details of the user who invoked the function
# + parCycleId - The ID of the PAR cycle for which the special rating groups are to be created
# + employees - The list of employees for whom the special rating groups are to be created
# + return - An array of ParSpecialRatingGroup records or an error if the operation failed
isolated function createAndGetSpecialRatingGroups(types:InvokerDetails invokerDetails, int parCycleId,
        entity:Employee[] employees) returns database:ParSpecialRatingGroup[]|error {
    string invokerEmail = invokerDetails.email;
    database:ParSpecialRatingGroup[] parSpecialRatingGroups = from entity:Employee {businessUnit, department, team}
        in employees
        group by businessUnit, department, team
        select {
            parCycleId,
            parBusinessUnit: businessUnit,
            parDepartment: department,
            parTeam: team ?: "",
            parSrGroupCreatedBy: invokerEmail,
            parSrGroupUpdatedBy: invokerEmail
        };
    check database:insertParSpecialRatingGroupsBulk(parSpecialRatingGroups);
    return database:getParSpecialRatingGroups(parCycleId);
}

# Create and get PAR teams for the PAR cycle.
#
# + invokerDetails - The details of the user who invoked the function
# + parCycleId - The ID of the PAR cycle for which the PAR teams are to be created
# + employees - The list of employees for whom the PAR teams are to be created
# + parSpecialRatingGroups - The list of special rating groups for the PAR cycle
# + return - An array of ParTeam records or an error if the operation failed
isolated function createAndGetParTeams(types:InvokerDetails invokerDetails, int parCycleId,
        entity:Employee[] employees, database:ParSpecialRatingGroup[] parSpecialRatingGroups)
        returns database:ParTeam[]|error {
    string invokerEmail = invokerDetails.email;
    database:ParTeam[] parTeams = from entity:Employee {businessUnit, department, team, subTeam, managerEmail}
        in employees
        group by businessUnit, department, team, subTeam, managerEmail
        select {
            parCycleId,
            parBusinessUnit: businessUnit,
            parDepartment: department,
            parTeam: team ?: "",
            parSubTeam: subTeam ?: "",
            parLeadEmail: managerEmail ?: "",
            parSpecialRatingGroupId: check getParSpecialRatingGroupId(parSpecialRatingGroups, businessUnit,
                    department, team ?: ""),
            parTeamCreatedBy: invokerEmail,
            parTeamUpdatedBy: invokerEmail
        };
    check database:insertParTeamsBulk(parTeams);
    return database:getParTeams(parCycleId);
}

isolated function getParSpecialRatingGroupId(database:ParSpecialRatingGroup[] parSpecialRatingGroups,
        string businessUnit, string department, string team) returns int|error {
    foreach var parSpecialRatingGroup in parSpecialRatingGroups {
        if parSpecialRatingGroup.parBusinessUnit == businessUnit &&
            parSpecialRatingGroup.parDepartment == department &&
            (parSpecialRatingGroup.parTeam) == team {
            return parSpecialRatingGroup.parSpecialRatingGroupId.ensureType();
        }
    }
    return error(string `Special rating group not found for the given business unit: '${businessUnit}', ` +
            string `department: '${department}', and team: '${team}'`,
        code = types:ERR_PAR_SPECIAL_RATING_GROUP_NOT_FOUND);
}

# Generate default PAR rating entries for all employees.
#
# + eligibilityEvaluationDate - The end date of the PAR evaluation
# + invokerDetails - The details of the user who invoked the function
# + parCycleId - The ID of the PAR cycle for which the default PAR ratings are to be generated
# + employees - The list of employees for whom the default PAR ratings are to be generated
# + teams - The list of PAR teams
# + return - error? An error if the operation failed
isolated function createDefaultParRatings(types:InvokerDetails invokerDetails, int parCycleId,
        entity:Employee[] employees, database:ParTeam[] teams, string eligibilityEvaluationDate) returns error? {
    string invokerEmail = invokerDetails.email;
    database:ParRating[] parRatings = from var employee in employees
        let entity:Employee {firstName, lastName, workEmail, company, location, businessUnit, department,
            team, subTeam, managerEmail, employmentType, employeeStatus, startDate} = employee
        select {
            parEmployeeEmail: workEmail,
            parEmployeeName: string `${firstName} ${lastName}`,
            parCycleId,
            parCompany: company,
            parLocation: location,
            parTeamId: check getParTeamId(teams, businessUnit, department, team ?: "", subTeam ?: "", managerEmail ?: ""),
            parRatingCreatedBy: invokerEmail,
            parRatingUpdatedBy: invokerEmail,
            parRating: types:NOT_ASSIGNED,
            parSpecialRating: types:NOT_ASSIGNED,
            parEmployeeStatus: types:PENDING,
            parLeadStatus: types:PENDING,
            parF2fStatus: types:PENDING,
            parEmployeeAcceptanceStatus: types:PENDING,
            parSpecialRatingEligibility:
                checkSpecialRatingEligibility(employeeStatus, subTeam, employmentType, eligibilityEvaluationDate,
                    startDate, workEmail)
        };
    check database:insertDefaultParRatingsBulk(parRatings);

    log:printInfo("Default PAR ratings were created successfully for all employees", count = employees.length());
}

# Check if an employee is eligible for special ratings based on their status and employment type.
#
# + subTeam - The sub team of the employee
# + employeeStatus - The status of the employee
# + employmentType - The employment type of the employee
# + eligibilityEvaluationDate - The end date of the PAR evaluation
# + employeeStartDate - The start date of the employee
# + workEmail - The work email of the employee
# + return - boolean true if the employee is eligible for special ratings, false otherwise
isolated function checkSpecialRatingEligibility(entity:EmployeeStatus employeeStatus, string? subTeam,
        entity:EmploymentType employmentType, string eligibilityEvaluationDate, string employeeStartDate,
        string workEmail) returns boolean {

    //Exclude if the employee is in the leadership group
    if subTeam is string && subTeam === types:LEADERSHIP_GROUP {
        return false;
    }
    //Exclude employees if they can not complete at least 90 days before the PAR evaluation deadline
    time:Utc|error startDate = getDateUtc(employeeStartDate);
    time:Utc|error endDate = getDateUtc(eligibilityEvaluationDate);
    if startDate is error || endDate is error {
        log:printError(string `Error occurred while parsing the eligibility date range for employee ${workEmail}`);
        return false;
    }
    float numberOfDaysFromRange = getNumberOfDaysFromRange(startDate, endDate);
    if numberOfDaysFromRange < types:TOP_RATINGS_ELIGIBILITY_DAYS {
        return false;
    }
    // Exclude the employees if their both employee status and employment type is restricted
    boolean isEmployeeTypeAndStatusAllowed = specialRatingEligibilityList.indexOf(employeeStatus) is int &&
        specialRatingEligibilityList.indexOf(employmentType) is int;
    return isEmployeeTypeAndStatusAllowed;
}

# Get the ID of a PAR team based on its attributes.
#
# + parTeams - The list of PAR teams
# + businessUnit - The business unit of the PAR team
# + department - The department of the PAR team
# + team - The team of the PAR team
# + subTeam - The sub-team of the PAR team
# + leadEmail - The email of the lead of the PAR team
# + return - The ID of the PAR team or an error if the team is not found
isolated function getParTeamId(database:ParTeam[] parTeams, string businessUnit, string department,
        string team, string subTeam, string leadEmail) returns int|error {
    foreach var parTeam in parTeams {
        if parTeam.parBusinessUnit == businessUnit && parTeam.parDepartment == department && parTeam.parTeam == team &&
                parTeam.parSubTeam == subTeam && parTeam.parLeadEmail == leadEmail {
            return parTeam.parTeamId.ensureType();
        }
    }
    return error(string `PAR team not found for the given business unit: '${businessUnit}', ` +
            string `department: '${department}', team: '${team}', and sub-team: '${subTeam}'`,
        code = types:ERR_PAR_TEAM_NOT_FOUND);
}

# Update the status of a PAR cycle.
#
# + invokerDetails - The details of the user who invoked the function
# + parCycleId - The ID of the PAR cycle for which the status is to be updated
# + state - The new status of the PAR cycle
# + return - error? An error if the operation failed
isolated function updateParCycleState(types:InvokerDetails invokerDetails, int parCycleId, types:ParCycleStatus state)
        returns error? {
    types:ParCycle|error parCycleResult = updateParCycle(invokerDetails, parCycleId, {parCycleStatus: state});
    if parCycleResult is error {
        log:printError(string `Error occurred while updating the PAR cycle status to '${state}'`, parCycleResult);
        return parCycleResult;
    }
}

# Get the details of a PAR cycle.
#
# + parCycleId - The ID of the PAR cycle for which the details are to be retrieved
# + return - ParCycle|error The details of the PAR cycle or an error if the operation failed
public isolated function getParCycle(int parCycleId) returns types:ParCycle|error =>
    getParCycleFrom(check database:getParCycle(parCycleId));

# Get the details of all PAR cycles.
#
# + status - The status of the PAR cycles to be retrieved
# + email - The email of the user for whom the PAR cycles are to be retrieved
# + return - The details of the PAR cycles or an error if the operation failed
public isolated function getParCycles(types:ParCycleStatus? status, string? email)
    returns types:ParCycle[]|error => from database:ParCycle parCycle in check database:getParCycles(status, email)
    select check getParCycleFrom(parCycle);

# Convert a database ParCycle record to a ParCycle record.
#
# + parCycle - The database ParCycle record to be converted
# + return - ParCycle The converted ParCycle record
public isolated function getParCycleFrom(database:ParCycle parCycle) returns types:ParCycle|error =>
    let database:ParCycle {parCycleId, parCycleName, parCycleStartDate, parCycleEndDate, parEvaluationStartDate,
        parEvaluationEndDate, parEmployeeDeadline, parLeadDeadline, parSpecialRatingDeadline, parF2FDeadline,
        parThreeSixtyRatingDeadline, parCycleConfigurations, parCycleStatus} = parCycle
    in {
        parCycleId: check parCycleId.ensureType(),
        parCycleName,
        parCycleStartDate,
        parCycleEndDate,
        parEvaluationStartDate,
        parEvaluationEndDate,
        parEmployeeDeadline,
        parLeadDeadline,
        parSpecialRatingDeadline,
        parF2FDeadline,
        parThreeSixtyRatingDeadline,
        parCycleConfigurations: check parCycleConfigurations.fromJsonStringWithType(),
        parCycleStatus: check parCycleStatus.ensureType()
    };

# Update the details of a PAR cycle.
#
# + invoker - The details of the user who invoked the function
# + parCycleId - The ID of the PAR cycle for which the details are to be updated
# + parCycle - The details of the PAR cycle to be updated
# + return - ParCycle|error The details of the updated PAR cycle or an error if the operation failed
public isolated function updateParCycle(types:InvokerDetails invoker, int parCycleId, types:ParCycleModify parCycle)
    returns types:ParCycle|error {
    database:ParCycle existingParCycle = check database:getParCycle(parCycleId);

    if existingParCycle.parCycleStatus is types:CLOSED {
        return error("PAR cycle is closed. Cannot modify a closed PAR cycle.",
            code = types:ERR_PAR_CYCLE_CANNOT_BE_PROCESSED);
    }

    database:ParCycleOptionalized parCycleOptionalized = {parCycleId};

    types:ParCycleModify {parCycleName, parCycleStartDate, parCycleEndDate, parEvaluationStartDate,
        parEvaluationEndDate, parEmployeeDeadline, parLeadDeadline, parSpecialRatingDeadline,
        parThreeSixtyRatingDeadline, parCycleConfigurations, parCycleStatus} = parCycle;

    if utils:isUpdatedString(existingParCycle.parCycleName, parCycleName) {
        parCycleOptionalized.parCycleName = parCycleName;
    }

    if utils:isUpdatedString(existingParCycle.parCycleStartDate, parCycleStartDate) {
        parCycleOptionalized.parCycleStartDate = parCycleStartDate;
    }

    if utils:isUpdatedString(existingParCycle.parCycleEndDate, parCycleEndDate) {
        parCycleOptionalized.parCycleEndDate = parCycleEndDate;
    }

    if utils:isUpdatedString(existingParCycle.parEvaluationStartDate, parEvaluationStartDate) {
        parCycleOptionalized.parEvaluationStartDate = parEvaluationStartDate;
    }

    if utils:isUpdatedString(existingParCycle.parEvaluationEndDate, parEvaluationEndDate) {
        parCycleOptionalized.parEvaluationEndDate = parEvaluationEndDate;
    }

    if utils:isUpdatedString(existingParCycle.parEmployeeDeadline, parEmployeeDeadline) {
        parCycleOptionalized.parEmployeeDeadline = parEmployeeDeadline;
    }

    if utils:isUpdatedString(existingParCycle.parLeadDeadline, parLeadDeadline) {
        parCycleOptionalized.parLeadDeadline = parLeadDeadline;
    }

    if utils:isUpdatedString(existingParCycle.parSpecialRatingDeadline, parSpecialRatingDeadline) {
        parCycleOptionalized.parSpecialRatingDeadline = parSpecialRatingDeadline;
    }

    if utils:isUpdatedString(existingParCycle.parThreeSixtyRatingDeadline, parThreeSixtyRatingDeadline) {
        parCycleOptionalized.parThreeSixtyRatingDeadline = parThreeSixtyRatingDeadline;
    }

    error[] validateDates = types:validateDates({
        parCycleStartDate: parCycleOptionalized.parCycleStartDate ?: existingParCycle.parCycleStartDate,
        parCycleEndDate: parCycleOptionalized.parCycleEndDate ?: existingParCycle.parCycleEndDate,
        parEvaluationStartDate: parCycleOptionalized.parEvaluationStartDate ?: existingParCycle.parEvaluationStartDate,
        parEvaluationEndDate: parCycleOptionalized.parEvaluationEndDate ?: existingParCycle.parEvaluationEndDate,
        parSpecialRatingDeadline: parCycleOptionalized.parSpecialRatingDeadline ?: existingParCycle.parSpecialRatingDeadline,
        parF2FDeadline: parCycleOptionalized.parF2FDeadline ?: existingParCycle.parF2FDeadline,
        parThreeSixtyRatingDeadline: parCycleOptionalized.parThreeSixtyRatingDeadline ?: existingParCycle.parThreeSixtyRatingDeadline,
        parEmployeeDeadline: parCycleOptionalized.parEmployeeDeadline ?: existingParCycle.parEmployeeDeadline,
        parLeadDeadline: parCycleOptionalized.parLeadDeadline ?: existingParCycle.parLeadDeadline
    });
    if validateDates.length() > 0 {
        return error(string:'join(", ", ...validateDates.map(e => e.message())), code = types:ERR_PAR_CYCLE_CANNOT_BE_PROCESSED);
    }

    boolean sendInvitationEmails = false;
    if utils:isUpdatedString(existingParCycle.parCycleStatus, parCycleStatus) {
        parCycleOptionalized.parCycleStatus = parCycleStatus;
        if existingParCycle.parCycleStatus is types:PENDING_QUOTA && parCycleStatus is types:OPEN {
            sendInvitationEmails = true;
        }
    }

    database:ParCycleConfigurationsOptionalized existingParCycleConfigurations =
        check existingParCycle.parCycleConfigurations.fromJsonStringWithType();

    if parCycleConfigurations !is () {
        types:ParCycleConfigurationsOptionalized {parRatings, threeSixtyReviewRatings, employeeParQuestion,
            threeSixtyReviewQuestion} = check parCycleConfigurations.ensureType();

        if utils:isUpdatedStringArray(existingParCycleConfigurations.parRatings, parRatings) {
            return error("Cannot modify PAR ratings after the PAR Cycle is created.",
            code = types:ERR_PAR_CYCLE_CANNOT_BE_PROCESSED);
        }

        if utils:isUpdatedStringArray(existingParCycleConfigurations.threeSixtyReviewRatings, threeSixtyReviewRatings) {
            return error("Cannot modify Threesixty ratings after the PAR Cycle is created.",
            code = types:ERR_PAR_CYCLE_CANNOT_BE_PROCESSED);
        }

        if utils:isUpdatedString(existingParCycleConfigurations.employeeParQuestion, employeeParQuestion) {
            existingParCycleConfigurations.employeeParQuestion = employeeParQuestion;
        }

        if utils:isUpdatedString(existingParCycleConfigurations.threeSixtyReviewQuestion, threeSixtyReviewQuestion) {
            existingParCycleConfigurations.threeSixtyReviewQuestion = threeSixtyReviewQuestion;
        }

        parCycleOptionalized.parCycleConfigurations = existingParCycleConfigurations.toJsonString();
    }

    parCycleOptionalized.parCycleUpdatedBy = invoker.email;

    check database:updateParCycle(parCycleOptionalized);

    if sendInvitationEmails {
        string[] parCycleEmployeeEmails = check database:getParCycleEmployeeEmails(parCycleId);
        log:printInfo("Sending PAR cycle invitation emails to employees");
        check createParCycleInvitationRequests(parCycleId, parCycleEmployeeEmails, types:PROCESSING);
        log:printInfo("PAR cycle invitation emails were sent successfully", count = parCycleEmployeeEmails.length());
    }

    return getParCycle(parCycleId);
}

# Get PAR special rating groups with head count.
#
# + parCycleId - The ID of the PAR cycle for which the special rating groups are to be retrieved
# + return - An array of ParSpecialRatingGroupWithHeadCount records or an error if the operation failed
public isolated function getParSpecialRatingGroupsWithHeadCount(int parCycleId)
        returns types:ParSpecialRatingGroupWithHeadCount[]|error {
    database:ParSpecialRatingGroupWithHeadCount[] parSpecialRatingGroupsWithHeadCount =
        check database:getParSpecialRatingGroupsWithHeadCount(parCycleId);
    return from database:ParSpecialRatingGroupWithHeadCount parSpecialRatingGroupWithHeadCount
        in parSpecialRatingGroupsWithHeadCount
        select check getParSpecialRatingGroupWithHeadCountFrom(parSpecialRatingGroupWithHeadCount);
}

# Convert a database ParSpecialRatingGroupWithHeadCount record to a ParSpecialRatingGroupWithHeadCount record.
#
# + parSpecialRatingGroupWithHeadCount - The database ParSpecialRatingGroupWithHeadCount record to be converted
# + return - The converted ParSpecialRatingGroupWithHeadCount record
isolated function getParSpecialRatingGroupWithHeadCountFrom(
        database:ParSpecialRatingGroupWithHeadCount parSpecialRatingGroupWithHeadCount)
        returns types:ParSpecialRatingGroupWithHeadCount|error =>
    let database:ParSpecialRatingGroupWithHeadCount {parSpecialRatingGroupId, parCycleId, parBusinessUnit,
        parDepartment, parTeam, parGroupHeadCount} = parSpecialRatingGroupWithHeadCount
    in {
        parCycleId: parCycleId,
        specialRatingGroupId: check parSpecialRatingGroupId.ensureType(),
        businessUnit: parBusinessUnit,
        department: parDepartment,
        team: parTeam,
        headCount: parGroupHeadCount
    };

# Get the details of a PAR rating.
#
# + parCycleId - The ID of the PAR cycle for which the rating is to be retrieved
# + email - The email of the employee for whom the rating is to be retrieved
# + return - The details of the PAR rating or an error if the operation failed
public isolated function getParRating(int parCycleId, string email) returns types:ParRating|error {
    database:ParRating parRating = check database:getParRating(parCycleId, email);
    database:ParTeam parTeam = check database:getParTeam(parRating.parTeamId);
    return getParRatingFrom(parRating, parTeam);
}

# Get the details from a database ParRating record.
#
# + rating - The database ParRating record
# + team - The database ParTeam record
# + return - The converted ParRating record
public isolated function getParRatingFrom(database:ParRating rating, database:ParTeam team)
        returns types:ParRating|error =>
    let database:ParRating {parCycleId, parEmployeeEmail, parCompany, parLocation, parRating, parSpecialRating,
        parEmployeeComment, parEmployeeStatus, parLeadComment, parLeadStatus, parF2fStatus, parF2fDate,
        parEmployeeAcceptanceStatus, parEmployeeAcceptanceComment, parAdminComment, parRatingSharedBy,
        parPerformanceNoticeAck} = rating
    in
    let database:ParTeam {parBusinessUnit, parDepartment, parTeam, parSubTeam, parLeadEmail} = team
        in {
            parRatingId: check rating.parRatingId.ensureType(),
            parCycleId,
            parEmployeeEmail,
            parCompany,
            parLocation,
            parBusinessUnit,
            parDepartment,
            parTeam,
            parSubTeam,
            parLeadEmail,
            parRating,
            parSpecialRating,
            parEmployeeComment,
            parEmployeeStatus,
            parLeadComment,
            parLeadStatus,
            parF2fStatus,
            parF2fDate,
            parEmployeeAcceptanceStatus,
            parEmployeeAcceptanceComment,
            parAdminComment,
            parRatingSharedBy,
            parPerformanceNoticeAck
        };

# Get all ParRatings without comments of a given Par Cycle.
#
# + parCycleId - The ID of the PAR cycle for which the ratings are to be retrieved
# + return - An array of ParRating records or an error if the operation failed
public isolated function getParRatingsWithoutComments(int parCycleId) returns types:ParRating[]|error {
    database:ParRating[] parRatings = check database:getParRatingsWithoutComments(parCycleId);
    database:ParTeam[] parTeams = check database:getParTeams(parCycleId);
    return from database:ParRating rating in parRatings
        join database:ParTeam team in parTeams on rating.parTeamId equals team.parTeamId
        select check getParRatingFrom(rating, team);
}

# Update the details of a PAR rating.
#
# + invoker - The details of the user who invoked the function
# + parCycleId - The ID of the PAR cycle for which the rating is to be updated
# + email - The email of the employee for whom the rating is to be updated
# + parRatingId - The ID of the PAR rating to be updated
# + rating - The details of the PAR rating to be updated
# + isAdmin - Indicates whether the user is an admin
# + isLead - Indicates whether the lead is updating the rating
# + isSelf - Indicates whether the user is updating their own rating
# + return - An error if the operation failed or null otherwise
public isolated function updateParRating(types:InvokerDetails invoker, int parCycleId, string email,
        int parRatingId, types:ParRatingModify rating, boolean isAdmin, boolean isLead, boolean isSelf) returns error? {

    database:ParCycle existingParCycle = check database:getParCycle(parCycleId);

    if existingParCycle.parCycleStatus is types:CLOSED {
        return error("Cannot modify PAR ratings of a closed PAR cycle.",
            code = types:ERR_PAR_RATING_CANNOT_BE_PROCESSED);
    }

    database:ParRating existingParRating = check database:getParRating(parCycleId, email);
    if parRatingId != existingParRating.parRatingId {
        return error("The PAR rating does not belong to the specified PAR cycle.",
            code = types:ERR_PAR_RATING_CANNOT_BE_PROCESSED);
    }

    check checkForUnmodifiableStates(existingParRating, rating, isAdmin, isLead, isSelf);

    types:ParRatingModify {parRating, parSpecialRating, parEmployeeComment, parEmployeeStatus,
        parLeadComment, parLeadStatus, parF2fStatus, parF2fDate, parEmployeeAcceptanceStatus,
        parEmployeeAcceptanceComment, parAdminComment, parPerformanceNoticeAck} = rating;

    boolean sendParLeadSharedNotification = false;
    boolean sendParEmployeeSharedNotification = false;
    database:ParRatingOptionalized optionalParRating = {parRatingId, parRatingUpdatedBy: invoker.email};

    if parRating != () && parRating.trim() != "" {
        optionalParRating.parRating = parRating;
    }
    if utils:isUpdatedString(existingParRating.parSpecialRating, parSpecialRating) {
        database:ParTeam parTeam = check database:getParTeam(existingParRating.parTeamId);
        types:ParSpecialRatingQuota parSpecialRatingQuota = getParSpecialRatingQuota(parCycleId,
                parTeam.parSpecialRatingGroupId ?: 0);
        types:ParCurrentSpecialRating parCurrentSpecialRatings = getParCurrentSpecialRatings(parCycleId,
                parTeam.parTeamId ?: 0, parTeam.parSpecialRatingGroupId ?: 0);
        int adjustedTop5Assigned = parCurrentSpecialRatings.top5pCount;
        int adjustedTop20Assigned = parCurrentSpecialRatings.top20pCount;
        if existingParRating.parSpecialRating is types:TOP5P {
            adjustedTop5Assigned -= 1;
        } else if existingParRating.parSpecialRating is types:TOP20P {
            adjustedTop20Assigned -= 1;
        }
        boolean isFlexibleOne = parSpecialRatingQuota.top5pQuota == 1 && parSpecialRatingQuota.top20pQuota == 0;
        if isFlexibleOne {
            int totalAssignedExSelf = adjustedTop5Assigned + adjustedTop20Assigned;
            if (parSpecialRating is types:TOP5P || parSpecialRating is types:TOP20P) {
                if totalAssignedExSelf >= 1 {
                    return error("The quota for special ratings (1 flexible slot) has been exceeded.",
                        code = types:ERR_PAR_SPECIAL_RATING_QUOTA_EXCEEDED);
                }
            }
        } else {
            if parSpecialRating == types:TOP5P &&
                    adjustedTop5Assigned + 1 > parSpecialRatingQuota.top5pQuota {
                return error("The quota for the top 5% special rating has been exceeded.",
                    code = types:ERR_PAR_SPECIAL_RATING_QUOTA_EXCEEDED);
            }
            if parSpecialRating == types:TOP20P &&
                    adjustedTop20Assigned + 1 > parSpecialRatingQuota.top20pQuota {
                return error("The quota for the top 20% special rating has been exceeded.",
                    code = types:ERR_PAR_SPECIAL_RATING_QUOTA_EXCEEDED);
            }
        }
        optionalParRating.parSpecialRating = parSpecialRating;
    }
    if utils:isUpdatedString(existingParRating.parEmployeeComment, parEmployeeComment) {
        optionalParRating.parEmployeeComment = parEmployeeComment;
    }
    if parEmployeeStatus !is () && existingParRating.parEmployeeStatus != parEmployeeStatus {
        if parEmployeeStatus is types:SHARED && existingParRating.parEmployeeComment is () &&
                optionalParRating.parEmployeeComment is () {
            return error("Employee comment is required before sharing the PAR.",
                code = types:ERR_PAR_RATING_UPDATE_FORBIDDEN);
        }
        optionalParRating.parEmployeeStatus = parEmployeeStatus;
        if parEmployeeStatus is types:SHARED && isSelf {
            sendParEmployeeSharedNotification = true;
        }
    }
    if utils:isUpdatedString(existingParRating.parLeadComment, parLeadComment) {
        optionalParRating.parLeadComment = parLeadComment;
    }
    if parLeadStatus !is () && existingParRating.parLeadStatus != parLeadStatus {
        if parLeadStatus is types:SHARED &&
                ((existingParRating.parLeadComment is () && optionalParRating.parLeadComment is ()) ||
                (existingParRating.parRating == types:NOT_ASSIGNED && optionalParRating.parRating is ())) {
            return error("Lead comment and par rating are required before sharing the PAR.",
                code = types:ERR_PAR_RATING_UPDATE_FORBIDDEN);
        }
        optionalParRating.parLeadStatus = parLeadStatus;
        if existingParRating.parEmployeeStatus is types:SHARED && parLeadStatus !is types:PENDING {
            optionalParRating.parEmployeeStatus = types:SHARED_BLOCKED;
        }
        //This needs to be handled in the future.
        // if parLeadStatus is types:SHARED {
        //     sendParLeadSharedNotification = true;
        // }
    }
    if parF2fStatus !is () && existingParRating.parF2fStatus != parF2fStatus {
        if existingParRating.parLeadStatus !is types:SHARED {
            return error("Cannot modify the F2F status before lead shares the PAR rating with the employee.",
                code = types:ERR_PAR_RATING_UPDATE_FORBIDDEN);
        }
        if existingParRating.parF2fStatus is types:COMPLETED {
            return error("Cannot modify the F2F status after it is completed.",
                code = types:ERR_PAR_RATING_UPDATE_FORBIDDEN);
        }
        if parF2fDate is () {
            return error("F2F date is required when updating the F2F status.",
                code = types:ERR_PAR_RATING_UPDATE_FORBIDDEN);
        }
        if !check isTodayOrPastDate(parF2fDate) {
            return error("F2F date should be today or a past date.",
                code = types:ERR_PAR_RATING_UPDATE_FORBIDDEN);
        }
        optionalParRating.parF2fStatus = parF2fStatus;
        optionalParRating.parF2fDate = parF2fDate;
    }
    if parEmployeeAcceptanceStatus !is () &&
            existingParRating.parEmployeeAcceptanceStatus != parEmployeeAcceptanceStatus {
        if existingParRating.parLeadStatus !is types:SHARED {
            return error("Cannot modify the employee acceptance status before lead shares the PAR rating.",
                code = types:ERR_PAR_RATING_UPDATE_FORBIDDEN);
        }
        if parEmployeeAcceptanceComment is () {
            return error("Employee acceptance comment is required when updating the employee acceptance status.",
                code = types:ERR_PAR_RATING_UPDATE_FORBIDDEN);
        }
        optionalParRating.parEmployeeAcceptanceStatus = parEmployeeAcceptanceStatus;
        optionalParRating.parEmployeeAcceptanceComment = parEmployeeAcceptanceComment;
    }
    if utils:isUpdatedString(existingParRating.parAdminComment, parAdminComment) {
        optionalParRating.parAdminComment = parAdminComment;
    }
    if utils:isUpdatedString(existingParRating.parPerformanceNoticeAck, parPerformanceNoticeAck) {
        optionalParRating.parPerformanceNoticeAck = parPerformanceNoticeAck;
    }
    optionalParRating.parRatingUpdatedBy = invoker.email;

    check database:updateParRating(optionalParRating);

    if sendParLeadSharedNotification {
        check createParLeadSharedNotificationRequests(parCycleId, email, types:PROCESSING);
    }
    if sendParEmployeeSharedNotification {
        check createEmployeeSharedNotificationRequests(parCycleId, email, existingParRating.parTeamId, types:PROCESSING);
    }
}

# Check whether ParRating is in a valid modifiable state.
#
# + existingParRating - The existing ParRating record
# + parRatingModify - The modified ParRating record
# + isAdmin - Indicates whether the user is an admin
# + isLead - Indicates whether the lead is updating the rating
# + isSelf - Indicates whether the user is updating their own rating
# + return - An error if the operation failed or null otherwise
isolated function checkForUnmodifiableStates(database:ParRating existingParRating,
        types:ParRatingModify parRatingModify, boolean isAdmin, boolean isLead, boolean isSelf) returns error? {
    if isSelf {
        if existingParRating.parEmployeeStatus is types:SHARED &&
                (parRatingModify.parEmployeeStatus !is types:DRAFT || parRatingModify.parEmployeeComment !is ()) &&
                    parRatingModify.parF2fStatus is () {
            return error("Employees are only allowed to unshare their PAR while it is in the shared state.",
                code = types:ERR_PAR_RATING_UPDATE_FORBIDDEN);
        }
        if existingParRating.parEmployeeStatus is types:SHARED_BLOCKED &&
                (parRatingModify.parEmployeeStatus !is () || parRatingModify.parEmployeeComment !is ()) {
            return error("Employees are not allowed to modify their PAR after the lead has reviewed it.",
                code = types:ERR_PAR_RATING_UPDATE_FORBIDDEN);
        }
    }
    if !isAdmin && isLead {
        if parRatingModify.parLeadStatus is types:SHARED && (existingParRating.parEmployeeStatus !is types:SHARED &&
                existingParRating.parEmployeeStatus !is types:SHARED_BLOCKED) {
            return error("Leads are not allowed to share PAR ratings before the employee has shared it.",
                code = types:ERR_PAR_RATING_UPDATE_FORBIDDEN);
        }
        if existingParRating.parLeadStatus is types:SHARED && (parRatingModify.parF2fStatus is () ||
                parRatingModify.parLeadComment !is () || parRatingModify.parRating !is () ||
                parRatingModify.parSpecialRating !is ()) {
            return error("Leads are not allowed to modify the PAR rating, special rating, or lead comment after sharing.",
                code = types:ERR_PAR_RATING_UPDATE_FORBIDDEN);
        }
    }
    if !isAdmin {
        if existingParRating.parF2fStatus is types:COMPLETED && parRatingModify.parF2fDate !is () {
            return error("Cannot modify the F2F status or date as it is already marked as completed.",
                code = types:ERR_PAR_RATING_UPDATE_FORBIDDEN);
        }
        if existingParRating.parEmployeeAcceptanceStatus is types:REJECTED &&
                parRatingModify.parEmployeeAcceptanceStatus !is () {
            return error("Cannot modify the employee acceptance status after it is rejected.",
                code = types:ERR_PAR_RATING_UPDATE_FORBIDDEN);
        }
    }
}

# Check if the given leadEmail belongs to the lead of the given employee in the active PAR cycle.
#
# + leadEmail - The email of the lead
# + employeeEmail - The email of the employee
# + return - Returns true if the lead is the lead of the employee, false otherwise
public isolated function isLeadOfEmployeeInActiveParCycle(string leadEmail, string employeeEmail) returns boolean {
    string|error leadInActiveParCycle = database:getLeadOfEmployeeInActiveParCycle(employeeEmail);
    if leadInActiveParCycle is error {
        string errorMessage = string `Error occurred while retrieving the lead for the employee ${employeeEmail} ` +
            string `in the active par cycle`;
        log:printError(errorMessage, leadInActiveParCycle);
        return false;
    }
    return leadEmail == leadInActiveParCycle;
}

# Get the details of a PAR team.
#
# + parCycleId - The ID of the PAR cycle for which the team is to be retrieved
# + leadEmail - The email of the lead of the team
# + return - The details of the PAR team or an error if the operation failed
public isolated function getParTeamSummary(int parCycleId, string? leadEmail) returns types:ParTeamSummary[]|error {
    database:ParTeamSummary[] parTeamSummaries = check database:getParTeamSummary(parCycleId, leadEmail);
    return from database:ParTeamSummary parTeamSummary in parTeamSummaries
        select check getParTeamSummaryFrom(parTeamSummary);
}

# Whether the given leadEmail is the lead of a team in the given PAR cycle.
#
# + parCycleId - The ID of the PAR cycle
# + leadEmail - The email of the lead
# + return - Returns true if the leadEmail belongs to a lead of a team in the given PAR cycle, false otherwise
public isolated function isLeadInParCycle(int parCycleId, string leadEmail) returns boolean {
    database:ParTeam[]|error parTeams = database:getParTeamsOfLead(parCycleId, leadEmail);
    if parTeams is error {
        log:printError(string `Error occurred while retrieving the PAR teams of the lead. ` +
                string `PAR cycle: ${parCycleId}, leadEmail: ${leadEmail}`, parTeams);
        return false;
    }
    return parTeams.length() > 0;
}

# Check if the given leadEmail is the lead of a team in the active PAR cycle.
#
# + leadEmail - The email of the lead
# + return - Returns true if the given email belongs to a lead of a team in the active PAR cycle, false otherwise
public isolated function isLeadInActiveParCycle(string leadEmail) returns boolean {
    database:ParCycle|error activeParCycle = getActiveParCycle();
    if activeParCycle is error {
        return false;
    }
    int? parCycleId = activeParCycle.parCycleId;
    if parCycleId is () {
        return false;
    }
    return isLeadInParCycle(parCycleId, leadEmail);
}

# Convert a database ParTeamSummary record to a ParTeamSummary record.
#
# + parTeamSummary - The database ParTeamSummary record to be converted
# + return - The converted ParTeamSummary record
public isolated function getParTeamSummaryFrom(database:ParTeamSummary parTeamSummary)
        returns types:ParTeamSummary|error =>
    let database:ParTeamSummary {parTeamId, parCycleId, parBusinessUnit, parDepartment, parTeam,
            parSubTeam, parLeadEmail, parTeamCount, parEmployeeCompletedCount, parLeadCompletedCount,
            parF2fCompletedCount, parSpecialRatingGroupId} = parTeamSummary,
        types:ParSpecialRatingQuota {top5pQuota, top20pQuota} = getParSpecialRatingQuota(parCycleId,
            parSpecialRatingGroupId),
        types:ParCurrentSpecialRating {top5pCount, top20pCount} = getParCurrentSpecialRatings(parCycleId, parTeamId,
            parSpecialRatingGroupId)
    in {
        parTeamId,
        parCycleId,
        parBusinessUnit,
        parDepartment,
        parTeam,
        parSubTeam,
        parLeadEmail,
        numberOfTeamMembers: parTeamCount,
        numberOf5pSlots: top5pQuota,
        numberOf20pSlots: top20pQuota,
        available5pSlots: top5pQuota - top5pCount,
        available20pSlots: top20pQuota - top20pCount,
        summary: {
            employeeParCompletedCount: parEmployeeCompletedCount,
            leadsReviewCompletedCount: parLeadCompletedCount,
            f2fCompletedCount: parF2fCompletedCount
        }
    };

# Get details about the progress of the team in the given PAR cycle.
#
# + parCycleId - The ID of the PAR cycle
# + parTeamId - The ID of the team
# + return - The details of the team progress or an error if the operation failed
public isolated function getParTeamDetails(int parCycleId, int parTeamId) returns types:ParTeamDetails|error =>
    getParTeamDetailsFrom(check database:getParTeamSummaryByTeamId(parCycleId, parTeamId),
        check database:getParRatingsOfTeam(parCycleId, parTeamId));

# Create ParTeamDetails from ParTeamSummary and ParRatings.
#
# + parTeamSummary - The par team summary
# + parRatings - The par ratings of the team members
# + return - The ParTeamDetails or an error if the operation failed
public isolated function getParTeamDetailsFrom(database:ParTeamSummary parTeamSummary, database:ParRating[] parRatings)
returns types:ParTeamDetails|error {

    database:ParTeamSummary {
        parTeamId,
        parCycleId,
        parBusinessUnit,
        parDepartment,
        parTeam,
        parSubTeam,
        parLeadEmail,
        parTeamCount,
        parEmployeeCompletedCount,
        parLeadCompletedCount,
        parF2fCompletedCount,
        parSpecialRatingGroupId
    } = parTeamSummary;

    types:ParSpecialRatingQuota {top5pQuota, top20pQuota} =
        getParSpecialRatingQuota(parCycleId, parSpecialRatingGroupId);

    types:ParCurrentSpecialRating {top5pCount, top20pCount} =
        getParCurrentSpecialRatings(parCycleId, parTeamId, parSpecialRatingGroupId);

    boolean isFlexibleOne = top5pQuota == 1 && top20pQuota == 0;
    int available5pSlots;
    int available20pSlots;

    if isFlexibleOne && top5pCount == 0 && top20pCount == 1 {
        available5pSlots = 0;
        available20pSlots = 0;
    } else {
        available5pSlots = top5pQuota - top5pCount;
        available20pSlots = top20pQuota - top20pCount;
    }

    return {
        parTeamId,
        parCycleId,
        parBusinessUnit,
        parDepartment,
        parTeam,
        parSubTeam,
        parLeadEmail,
        numberOfTeamMembers: parTeamCount,
        numberOf5pSlots: top5pQuota,
        numberOf20pSlots: top20pQuota,
        available5pSlots,
        available20pSlots,
        summary: {
            employeeParCompletedCount: parEmployeeCompletedCount,
            leadsReviewCompletedCount: parLeadCompletedCount,
            f2fCompletedCount: parF2fCompletedCount
        },
        details: check getParRatingsFrom(parRatings)
    };
}

# Convert a ParRating array to a ParRatingMinimal array.
#
# + parRatings - The ParRating array
# + return - The ParRatingMinimal array or an error if the operation failed
public isolated function getParRatingsFrom(database:ParRating[] parRatings)
        returns types:ParRatingMinimal[]|error => from var rating in parRatings
    let database:ParRating {parRatingId, parCycleId, parEmployeeEmail, parEmployeeName, parTeamId, parRating,
        parSpecialRating, parEmployeeStatus, parLeadStatus, parF2fStatus, parEmployeeAcceptanceStatus} = rating
    let types:Par360ReviewCounts {requestedReviewCount, sharedReviewCount} =
        check getPar360ReviewCounts(parCycleId, parEmployeeEmail)
    let types:Par360ReviewStatus par360ReviewStatus = requestedReviewCount > 0 &&
            requestedReviewCount == sharedReviewCount ? types:SHARED : types:PENDING
    select {
        parRatingId: parRatingId ?: 0,
        parCycleId,
        parEmployeeEmail,
        parEmployeeName,
        parTeamId,
        parRating,
        parSpecialRating,
        parEmployeeStatus,
        parLeadStatus,
        par360ReviewStatus,
        par360ReviewCounts: {requestedReviewCount, sharedReviewCount},
        parF2fStatus,
        parEmployeeAcceptanceStatus
    };

# Get information about an employee.
#
# + employeeWorkEmail - The work email of the employee
# + return - The information about the employee or an error if the operation failed
public isolated function getEmployeeInfo(string employeeWorkEmail) returns types:EmployeeInfo|error {
    database:ParCycle|error parCycle = getActiveParCycle();
    if parCycle is error {
        return getEmployeeInfoFromHrEntity(employeeWorkEmail);
    }

    types:EmployeeInfo mappingResult = let boolean isTeamLead = isLeadInActiveParCycle(employeeWorkEmail)
        in let types:ParRating {parLeadEmail, parLocation, parBusinessUnit, parDepartment, parTeam} =
            check getParRating(check parCycle.parCycleId.ensureType(), employeeWorkEmail)
            in let entity:Employee {firstName, lastName, workEmail, startDate, jobRole, employeeThumbnail, lead} =
                check entity:getEmployee(employeeWorkEmail)
                in {
                    employeeName: string `${firstName} ${lastName}`,
                    workEmail,
                    startDate,
                    jobRole,
                    location: parLocation,
                    businessUnit: parBusinessUnit,
                    department: parDepartment,
                    team: parTeam,
                    leadEmail: parLeadEmail,
                    isTeamLead: isTeamLead,
                    employeeThumbnail,
                    lead
                };
    if !mappingResult.isTeamLead {
        entity:Employee[] employeesAsAdditionalManager =
            check entity:getAllActiveEmployees((), employeeWorkEmail);
        if employeesAsAdditionalManager.length() > 0 {
            mappingResult.isTeamLead = true;
        }
    }

    return mappingResult;
}

# if  Get employee information from the HR entity.
#
# + employeeWorkEmail - The work email of the employee
# + return - The information about the employee or an error if the operation failed
public isolated function getEmployeeInfoFromHrEntity(string employeeWorkEmail) returns types:EmployeeInfo|error =>
        let entity:Employee {firstName, lastName, workEmail, startDate, jobRole, location, businessUnit, department,
            team, managerEmail, employeeThumbnail, lead} = check entity:getEmployee(employeeWorkEmail)
    in {
        employeeName: string `${firstName} ${lastName}`,
        workEmail,
        startDate,
        jobRole,
        location,
        businessUnit,
        department,
        team,
        leadEmail: managerEmail,
        isTeamLead: isLeadInActiveParCycle(employeeWorkEmail),
        employeeThumbnail,
        lead
    };

# Get 360 reviewers for an employee in a PAR cycle.
# If an employee is requesting the reviewers for themselves, only the reviewers requested by the employee are returned.
# For admins and leads, all reviewers are returned.
#
# + parCycleId - The ID of the PAR cycle
# + employeeEmail - The email of the employee
# + isSelf - Indicates whether the employee is requesting the reviewers for themselves
# + return - The 360 reviewers or an error if the operation failed
public isolated function getPar360Reviewers(int parCycleId, string employeeEmail, boolean isSelf)
        returns types:Par360Reviewer[]|error {
    database:Par360Review[] par360Reviews = check database:getPar360Reviews(parCycleId, employeeEmail);
    if isSelf {
        return from database:Par360Review par360Review in par360Reviews
            where par360Review.isEmployeeRequested
            select {
                reviewerEmail: par360Review.parReviewerEmail,
                reviewStatus: types:SANITIZED,
                isLeadRequested: par360Review.isLeadRequested,
                isEmployeeRequested: par360Review.isEmployeeRequested
            };
    }
    return from database:Par360Review par360Review in par360Reviews
        select getPar360ReviewerFrom(par360Review);
}

# Convert a `database:Par360Review` record to a `types:Par360Reviewer` record.
#
# + par360Review - The database Par360Review record
# + return - The converted Par360Reviewer record
public isolated function getPar360ReviewerFrom(database:Par360Review par360Review) returns types:Par360Reviewer =>
    let database:Par360Review {parReviewerEmail, par360Status, isLeadRequested, isEmployeeRequested} = par360Review
    in {
        reviewerEmail: parReviewerEmail,
        reviewStatus: par360Status,
        isLeadRequested: isLeadRequested,
        isEmployeeRequested
    };

# Create a 360 review request for an employee.
#
# + invokerDetails - The details of the user who invoked the function
# + parCycleId - The ID of the PAR cycle
# + parEmployeeEmail - The email of the employee
# + par360ReviewRequestCreate - The details of the 360 review request
# + isLead - Indicates whether the lead is requesting the reviewers for the employee
# + isSelf - Indicates whether the employee is requesting the reviewers for themselves
# + emailTriggerType - The type of the email trigger
# + return - An error if the operation failed or null otherwise
public isolated function create360Requests(types:InvokerDetails invokerDetails, int parCycleId,
        string parEmployeeEmail, types:Par360ReviewRequestCreate par360ReviewRequestCreate,
        boolean isLead, boolean isSelf, types:EmailTriggerType emailTriggerType) returns error? {
    types:ParRating parRating = check getParRating(parCycleId, parEmployeeEmail);
    if parRating.parLeadStatus is types:SHARED {
        return error("Cannot request 360 reviews for an employee whose PAR rating is shared by the lead.",
            code = types:ERR_PAR_360_REVIEW_CANNOT_BE_PROCESSED);
    }
    string invokerEmail = invokerDetails.email;
    foreach string parReviewerEmail in par360ReviewRequestCreate.reviewerEmails {
        database:Par360Review par360Review = {
            parEmployeeEmail,
            parReviewerEmail,
            parCycleId,
            par360Rating: types:NOT_ASSIGNED,
            par360Status: types:PENDING,
            par360CreatedBy: invokerEmail,
            par360UpdatedBy: invokerEmail,
            isEmployeeRequested: isSelf,
            isLeadRequested: isLead
        };
        _ = check database:createOrUpdate360Request(par360Review);

        check schedule360ReviewNotificationEmail(parCycleId, parEmployeeEmail, emailTriggerType, invokerEmail,
                parReviewerEmail, par360Review);
    }
}

# Schedule a 360 review notification email.
#
# + parCycleId - The ID of the PAR cycle
# + parEmployeeEmail - The email of the employee
# + emailTriggerType - The type of the email trigger
# + invokerEmail - The email of the user who invoked the function
# + parReviewerEmail - The email of the reviewer
# + par360Review - The 360 review record
# + return - An error if the operation failed or nil otherwise
isolated function schedule360ReviewNotificationEmail(int parCycleId, string parEmployeeEmail,
        types:EmailTriggerType emailTriggerType, string invokerEmail, string parReviewerEmail,
        database:Par360Review par360Review) returns error? {
    database:Par360Review updatedPar360Review = check database:getPar360Review(parCycleId, parEmployeeEmail,
            parReviewerEmail);
    if updatedPar360Review.isEmployeeRequested != updatedPar360Review.isLeadRequested {
        database:ParCycle {parCycleName, parThreeSixtyRatingDeadline} = check getActiveParCycle();
        database:EmailNotification emailNotifications = check getEmailNotification(
                parCycleId,
                parCycleName,
                parReviewerEmail,
                types:THREE_SIXTY_NOTIFICATION,
                check getEmailTriggerDetailsWithInvokerEmail(
                        emailTriggerType,
                        parThreeSixtyRatingDeadline,
                        invokerEmail),
                string `${types:EMAIL_SUBJECT_360_NOTIFICATION}`,
                types:EMAIL_TITLE_360_NOTIFICATION,
                parThreeSixtyRatingDeadline,
                check getBasicInformationOfReviewee(par360Review));
        check database:insertEmailNotificationsBulk([emailNotifications]);
    }
}

# Update the 360 review of an employee.
#
# + invoker - The details of the user who invoked the function
# + parCycleId - The ID of the PAR cycle
# + employeeEmail - The email of the employee
# + reviewUpdate - The details of the 360 review update
# + return - An error if the operation failed or null otherwise
public isolated function updatePar360Review(types:InvokerDetails invoker, int parCycleId, string employeeEmail,
        types:Par360ReviewUpdate reviewUpdate) returns error? {
    string invokerEmail = invoker.email;
    boolean isAdmin = invoker.isAdmin;
    string reviewerEmail = reviewUpdate.reviewerEmail ?: invokerEmail;
    database:Par360Review par360Review = check database:getPar360Review(parCycleId, employeeEmail, reviewerEmail);
    if (par360Review.par360Status is types:SHARED|types:REJECTED && !isAdmin) {
        return error("Shared or declined 360 reviews cannot be modified by employees.",
            code = types:ERR_PAR_360_REVIEW_CANNOT_BE_PROCESSED);
    }

    types:Par360ReviewUpdate {reviewRating, reviewComment, par360ReviewStatus} = reviewUpdate;
    if par360ReviewStatus is types:SHARED && reviewRating is () && par360Review.par360Rating == types:NOT_ASSIGNED {
        return error("The 360 review rating is required before sharing the 360 review.",
            code = types:ERR_PAR_360_REVIEW_CANNOT_BE_PROCESSED);
    }

    par360Review.par360Status = par360ReviewStatus !is () ? par360ReviewStatus : types:DRAFT;
    if utils:isUpdatedString(par360Review.par360Rating, reviewRating) {
        par360Review.par360Rating = check reviewRating.ensureType();
    }
    par360Review.par360Comment = reviewComment;
    par360Review.par360UpdatedBy = invokerEmail;
    _ = check database:update360Review(par360Review);
}

# Get 360 review requests received by an employee.
#
# + parCycleId - The ID of the PAR cycle
# + reviewerEmail - The email of the reviewer
# + return - The 360 review requests or an error if the operation failed
public isolated function getPar360ReviewRequests(int parCycleId, string reviewerEmail)
        returns types:Par360ReviewRequest[]|error {
    database:Par360Review[] par360Reviews = check database:getPar360ReviewRequests(parCycleId, reviewerEmail);
    return from database:Par360Review par360Review in par360Reviews
        select check getPar360ReviewRequestFrom(par360Review);
}

# Convert a database:Par360Review to a types:Par360ReviewRequest.
#
# + par360Review - The Par360Review record
# + return - The Par360ReviewRequest record or an error if the operation failed
public isolated function getPar360ReviewRequestFrom(database:Par360Review par360Review)
        returns types:Par360ReviewRequest|error =>
    let database:Par360Review {parEmployeeEmail, par360Status, isEmployeeRequested, isLeadRequested} = par360Review
    in {
        employeeEmail: parEmployeeEmail,
        reviewStatus: par360Status,
        isEmployeeRequested,
        isLeadRequested
    };

# Get 360 reviews given for an employee which are in the shared state.
#
# + parCycleId - The ID of the PAR cycle
# + employeeEmail - The email of the employee
# + return - The 360 reviews or an error if the operation failed
public isolated function getPar360Reviews(int parCycleId, string employeeEmail)
        returns types:Par360Review[]|error {
    database:Par360Review[] par360Reviews = check database:getPar360Reviews(parCycleId, employeeEmail);
    return from database:Par360Review par360Review in par360Reviews
        where par360Review.par360Status is types:SHARED|types:REJECTED
        select getPar360ReviewFrom(par360Review);
}

# Get the 360 review given by a reviewer for an employee.
#
# + parCycleId - The ID of the PAR cycle
# + employeeEmail - The email of the employee
# + reviewerEmail - The email of the reviewer
# + return - The 360 review or an error if the operation failed
public isolated function getPar360Review(int parCycleId, string employeeEmail, string reviewerEmail)
        returns types:Par360Review|error {
    database:Par360Review par360Review = check database:getPar360Review(parCycleId, employeeEmail, reviewerEmail);
    return getPar360ReviewFrom(par360Review);
}

# Get the number of 360 reviews requested and shared for an employee.
#
# + parCycleId - The ID of the PAR cycle
# + employeeEmail - The email of the employee
# + return - The 360 review counts or an error if the operation failed
public isolated function getPar360ReviewCounts(int parCycleId, string employeeEmail)
        returns types:Par360ReviewCounts|error {
    database:Par360Review[] requestedPar360Reviews = check database:getPar360Reviews(parCycleId, employeeEmail);
    database:Par360Review[] sharedPar360Reviews = from database:Par360Review par360Review in requestedPar360Reviews
        where par360Review.par360Status is types:SHARED
        select par360Review;
    return {
        requestedReviewCount: requestedPar360Reviews.length(),
        sharedReviewCount: sharedPar360Reviews.length()
    };
}

# Convert a database:Par360Review record to a types:Par360Review record.
#
# + par360Review - The database Par360Review record
# + return - The converted Par360Review record
public isolated function getPar360ReviewFrom(database:Par360Review par360Review) returns types:Par360Review =>
    let database:Par360Review {parReviewerEmail, par360Rating, par360Comment, par360Status} = par360Review
    in {
        reviewerEmail: parReviewerEmail,
        reviewRating: par360Rating,
        reviewComment: par360Comment,
        reviewStatus: par360Status
    };

# Validate the 360 review request.
#
# + par360ReviewRequestCreate - The 360 review request
# + invokerEmail - The email of the invoker
# + employeeEmail - The email of the employee
# + userTimezoneOffset - User's timezone offset
# + return - An error if the operation failed or null otherwise
public isolated function validate360Request(types:Par360ReviewRequestCreate par360ReviewRequestCreate,
        string invokerEmail, string employeeEmail, decimal userTimezoneOffset) returns error? {

    database:ParCycle activeParCycle = check getActiveParCycle();
    if !check isFutureDate(activeParCycle.parThreeSixtyRatingDeadline, userTimezoneOffset) {
        return error(string `The 360 requests cannot be created as the 360 reviews deadline has passed.`,
            code = types:ERR_PAR_360_REVIEW_FORBIDDEN);
    }
    foreach var email in par360ReviewRequestCreate.reviewerEmails {
        if email == invokerEmail || email == employeeEmail {
            return error("A reviewer cannot be the employee or the invoker of the request.",
                code = types:ERR_PAR_360_REVIEW_FORBIDDEN);
        }
        if isLeadOfEmployeeInActiveParCycle(email, invokerEmail) {
            return error("Cannot request 360 reviews from the lead of the employee.",
                code = types:ERR_PAR_360_REVIEW_FORBIDDEN);
        }
        if !isValidEmployeeEmail(email) {
            return error(string `The provided email address '${email}' is not a valid employee email address.`,
                code = types:ERR_PAR_360_REVIEW_FORBIDDEN);
        }
    }
}

# Get special rating quotas for a team based on the special rating group.
#
# + parCycleId - The ID of the PAR cycle
# + parSpecialRatingGroupId - The ID of the special rating group
# + return - The special rating quota or an error if the operation failed
public isolated function getParSpecialRatingQuota(int parCycleId, int parSpecialRatingGroupId)
        returns types:ParSpecialRatingQuota {
    database:ParSpecialRatingQuota|error parSpecialRatingQuota = database:getParSpecialRatingQuota(parCycleId,
            parSpecialRatingGroupId);
    if parSpecialRatingQuota is error {
        return {};
    }
    return {
        specialRatingQuotaId: parSpecialRatingQuota.parQuotaId ?: 0,
        top5pQuota: parSpecialRatingQuota.parTop5Quota,
        top20pQuota: parSpecialRatingQuota.parTop20Quota
    };
}

# Get the current number of special ratings assigned to a team.
#
# + parCycleId - The ID of the PAR cycle
# + parTeamId - The ID of the team
# + parSpecialRatingGroupId - The ID of the special rating group
# + return - The current special ratings count or an error if the operation failed
public isolated function getParCurrentSpecialRatings(int parCycleId, int parTeamId, int parSpecialRatingGroupId)
        returns types:ParCurrentSpecialRating {
    database:ParCurrentSpecialRatings|error parCurrentSpecialRatings = database:getParCurrentSpecialRatings(parCycleId,
            parTeamId, parSpecialRatingGroupId);
    if parCurrentSpecialRatings is error {
        return {};
    }
    return {
        teamId: parTeamId,
        parCycleId: parCurrentSpecialRatings.parCycleId,
        specialRatingGroupId: parSpecialRatingGroupId,
        specialRatingQuotaId: parCurrentSpecialRatings.parSpecialRatingQuotaId,
        top5pCount: parCurrentSpecialRatings.parTop5Count,
        top20pCount: parCurrentSpecialRatings.parTop20Count
    };
}

# Get the details about all employees.
#
# + leadEmail - Optional The lead's email
# + return - An array of basic employee information or an error if the operation failed
public isolated function getBasicEmployeesInfo(string? leadEmail = ())
        returns types:BasicEmployeeInfo[]|error {

    lock {
        return from entity:Employee entityEmployee in check entity:getAllActiveEmployees(leadEmail)
            select getBasicEmployeeInfoFrom(entityEmployee);
    }
}

# Get the details of an employee by their email.
#
# + email - The email of the employee
# + return - The details of the employee or an error if the operation failed
public isolated function getBasicEmployee(string email) returns types:BasicEmployeeInfo|error =>
    getBasicEmployeeInfoFrom(check entity:getEmployee(email));

# Get details of the reviewees for given Par360Review records.
#
# + par360Reviews - An array of Par360Review records
# + return - An array of BasicEmployeeInfo records or an error if the operation failed
public isolated function getBasicInformationOfReviewees(database:Par360Review[] par360Reviews)
        returns types:BasicEmployeeInfo[]|error => from database:Par360Review par360Review in par360Reviews
    select check getBasicEmployee(par360Review.parEmployeeEmail);

# Get details of the reviewee for the given Par360Review record.
#
# + par360Review - A Par360Review record
# + return - A BasicEmployeeInfo record or an error if the operation failed
public isolated function getBasicInformationOfReviewee(database:Par360Review par360Review)
        returns types:BasicEmployeeInfo|error =>
    check getBasicEmployee(par360Review.parEmployeeEmail);

# Get the name of an employee by their email.
#
# + email - The email of the employee
# + return - The name of the employee or nil if name cannot be found
public isolated function getEmployeeName(string email) returns string? {
    types:BasicEmployeeInfo|error employee = getBasicEmployee(email);
    if employee is error {
        log:printWarn(string `Error occurred while retrieving the employee details for ${email}.`, employee);
        return;
    }
    return employee.employeeName;
}

# Convert an entity:Employee record to a types:EmployeeInfo record with minimal information.
#
# + employee - The Employee record
# + return - The converted EmployeeInfo record or an error if the operation failed
public isolated function getBasicEmployeeInfoFrom(entity:Employee employee) returns types:BasicEmployeeInfo =>
    let entity:Employee {firstName, lastName, workEmail, employeeThumbnail, lead, managerEmail} = employee
    in {
        employeeName: string `${firstName} ${lastName}`,
        workEmail,
        employeeThumbnail,
        isLead: lead,
        managerEmail
    };

# Check if the given email is a valid employee email.
#
# + email - The email to be checked
# + return - Returns true if the email is a valid employee email, false otherwise
public isolated function isValidEmployeeEmail(string email) returns boolean {
    types:BasicEmployeeInfo|error employee = getBasicEmployee(email);
    if employee is error {
        log:printWarn(string `Error occurred while retrieving the employee details for ${email}.`, employee);
        return false;
    }
    return true;
}

# Get details of the active PAR cycle.
#
# + return - The details of the active PAR cycle or an error if the operation failed
public isolated function getActiveParCycle() returns database:ParCycle|error {
    database:ParCycle[] parCycles = check database:getParCyclesByStatus([types:OPEN]);
    if parCycles.length() != 1 {
        return error("There should be exactly one active PAR cycle.");
    }
    return parCycles[0];
}

# Get par cycle configurations for the active PAR cycle.
#
# + return - The par cycle configurations or an error if the operation failed
public isolated function getActiveParCycleConfigurations() returns types:ParCycleConfigurations|error =>
    (check getActiveParCycle()).parCycleConfigurations.fromJsonStringWithType();

# Validate the given PAR rating modify request.
#
# + rating - he PAR rating modify request
# + isLead - Indicates whether the lead is modifying the rating
# + isSelf - Indicates whether the user is modifying their own rating
# + userTimezoneOffset - User's timezone offset
# + return - An error if the validation failed or null otherwise
public isolated function validateParRatingModify(types:ParRatingModify rating, boolean isLead, boolean isSelf,
        decimal userTimezoneOffset) returns error? {

    types:ParRatingModify {parRating, parLeadComment, parLeadStatus, parSpecialRating,
        parEmployeeComment, parEmployeeStatus, parPerformanceNoticeAck} = rating;
    database:ParCycle activeParCycle = check getActiveParCycle();
    if isLead {
        if (!utils:isNilOrEmpty(parRating) || !utils:isNilOrEmpty(parLeadComment) || parLeadStatus !is ()) &&
                !check isFutureDate(activeParCycle.parLeadDeadline, userTimezoneOffset) {
            return error(string `Leads are not allowed to modify the PAR rating after the deadline.`,
            code = types:ERR_PAR_RATING_UPDATE_FORBIDDEN);
        }
        if !utils:isNilOrEmpty(parSpecialRating) &&
                !check isFutureDate(activeParCycle.parSpecialRatingDeadline, userTimezoneOffset) {
            return error(string `Special ratings are not allowed to be modified after the deadline.`,
            code = types:ERR_PAR_RATING_UPDATE_FORBIDDEN);
        }
        if !utils:isNilOrEmpty(parPerformanceNoticeAck) &&
                !check isFutureDate(activeParCycle.parLeadDeadline, userTimezoneOffset) {
            return error(string `Acknowledgement proof is not allowed to be modified after the deadline.`,
            code = types:ERR_PAR_RATING_UPDATE_FORBIDDEN);
        }
    }
    if isSelf {
        if (!utils:isNilOrEmpty(parEmployeeComment) || parEmployeeStatus !is ()) &&
                !check isFutureDate(activeParCycle.parEmployeeDeadline, userTimezoneOffset) {
            return error(string `Employees are not allowed to modify the PAR rating after the deadline.`,
            code = types:ERR_PAR_RATING_UPDATE_FORBIDDEN);
        }
    }

    types:ParCycleConfigurations activeParCycleConfigurations = check getActiveParCycleConfigurations();
    if parRating !is () && activeParCycleConfigurations.parRatings.indexOf(parRating) is () {
        return error(string `The provided PAR rating is not valid. Valid ratings: [` +
            string:'join(", ", ...activeParCycleConfigurations.parRatings) + string `]`);
    }

    if parSpecialRating !is () && parSpecialRating !is types:ParSpecialRatings
        && parSpecialRating !is types:NOT_ASSIGNED {
        return error(string `The provided special rating is not valid. ` +
            string `Valid ratings: [${types:TOP5P}, ${types:TOP20P}]`);
    }
}

# Checks whether the deadlines are in future with user's timezone offset.
#
# + dbStoredDate - The date stored in database to be checked
# + userTimezoneOffset - User's timezone offset
# + return - Returns true if the date is in the future, false otherwise
public isolated function isFutureDate(string dbStoredDate, decimal userTimezoneOffset) returns boolean|error {
    time:Utc deadlineUtc = check time:utcFromString(dbStoredDate + "T23:59:59.00Z");
    time:Utc userLocal = time:utcAddSeconds(time:utcNow(), userTimezoneOffset * 3600);
    return time:utcDiffSeconds(deadlineUtc, userLocal) >= 0d;
}

# Checks whether the given date is today or in the past.
#
# + date - The date to be checked
# + return - Returns true if the date is today or in the past, false otherwise
public isolated function isTodayOrPastDate(string date) returns boolean|error =>
    time:utcDiffSeconds(check getDateTodayUtc(), check getDateUtc(date)) >= 0d;

# Validate the given 360 review update request.
#
# + par360Review - The 360 review update request
# + userTimezoneOffset - User's timezone offset
# + return - An error if the validation failed or null otherwise
public isolated function validatePar360ReviewUpdate(types:Par360ReviewUpdate par360Review, decimal userTimezoneOffset)
    returns error? {

    database:ParCycle activeParCycle = check getActiveParCycle();
    if !check isFutureDate(activeParCycle.parThreeSixtyRatingDeadline, userTimezoneOffset) {
        return error(string `The 360 requests cannot be updated as the 360 reviews deadline has passed.`,
            code = types:ERR_PAR_360_REVIEW_FORBIDDEN);
    }
    types:ParCycleConfigurations activeParCycleConfigurations = check getActiveParCycleConfigurations();
    types:Par360ReviewUpdate {reviewRating} = par360Review;
    if reviewRating !is () && activeParCycleConfigurations.threeSixtyReviewRatings.indexOf(reviewRating) is () {
        return error(string `The provided 360 review rating is not valid. Rating: ${reviewRating}`);
    }
}

# Get PAR cycle configurations.
#
# + return - The PAR cycle configurations or an error if the operation failed
public isolated function getParCycleConfigurations() returns types:ParCycleConfigurations|error {
    database:ParConfiguration parConfiguration = check database:getParConfiguration(types:PAR_CYCLE_CONFIGURATIONS);
    return parConfiguration.parConfigValue.fromJsonStringWithType();
}

# Create or update the PAR cycle configurations.
#
# + invoker - The details of the user who invoked the function
# + parCycleConfigurations - The PAR cycle configurations
# + return - An error if the operation failed or null otherwise
public isolated function createOrUpdateParCycleConfigurations(types:InvokerDetails invoker,
        types:ParCycleConfigurations parCycleConfigurations) returns error? {
    string invokerEmail = invoker.email;
    _ = check database:createOrUpdateParConfiguration({
        parConfigKey: types:PAR_CYCLE_CONFIGURATIONS,
        parConfigValue: parCycleConfigurations.toJsonString(),
        parConfigCreatedBy: invokerEmail,
        parConfigUpdatedBy: invokerEmail
    });
}

# Create PAR special rating quotas for a PAR cycle.
#
# + invoker - The details of the user who invoked the function
# + parCycleId - The ID of the PAR cycle
# + parSpecialRatingGroupQuota - The special rating group quotas
# + return - An error if the operation failed or nil otherwise
isolated function createParSpecialQuotas(types:InvokerDetails invoker, int parCycleId,
        types:ParSpecialRatingGroupQuota parSpecialRatingGroupQuota) returns error? {
    types:ParSpecialRatingGroupQuota {parSpecialRatingGroups, specialRatingQuotas} = parSpecialRatingGroupQuota;
    transaction {
        foreach types:ParSpecialRatingQuotaWithName specialRatingQuota in specialRatingQuotas {
            int newSRQuotaId = check database:createParSpecialRatingQuota(
                    mapToDatabaseParSpecialRatingQuota(specialRatingQuota, parCycleId, invoker.email));
            foreach types:ParSpecialRatingGroup {specialRatingQuotaId, specialRatingGroupId} in parSpecialRatingGroups {
                if specialRatingQuotaId == specialRatingQuota.specialRatingQuotaId {
                    check database:updateParSpecialRatingGroupQuotaId(parCycleId, specialRatingGroupId, newSRQuotaId);
                }
            }
        }
        check commit;
    }
}

# Map the special rating quota to the database record.
#
# + parSpecialRatingQuota - The special rating quota
# + parCycleId - The ID of the PAR cycle
# + invokerEmail - The email of the invoker
# + return - The database ParSpecialRatingQuota record
isolated function mapToDatabaseParSpecialRatingQuota(types:ParSpecialRatingQuotaWithName parSpecialRatingQuota,
        int parCycleId, string invokerEmail) returns database:ParSpecialRatingQuota =>
    let types:ParSpecialRatingQuotaWithName {specialRatingQuotaName, top5pQuota, top20pQuota, allocatedLeads} = parSpecialRatingQuota
    in {
        parCycleId,
        parQuotaName: specialRatingQuotaName,
        parTop5Quota: top5pQuota,
        parTop20Quota: top20pQuota,
        parSrQuotaCreatedBy: invokerEmail,
        parSrQuotaUpdatedBy: invokerEmail,
        allocatedLeads
    };

# Get existing special rating group IDs for a PAR cycle.
#
# + parCycleId - The ID of the PAR cycle
# + return - The special rating group IDs or an error if the operation failed
isolated function getExistingParSpecialRatingGroupIds(int parCycleId)
        returns int[]|error => from database:ParSpecialRatingGroup parSpecialRatingGroup
    in check database:getParSpecialRatingGroups(parCycleId)
    select check parSpecialRatingGroup.parSpecialRatingGroupId.ensureType();

# Schedule reminders for leads to complete the PARs.
#
# + emailTriggerType - The email trigger type
# + return - An error if the operation failed or nil otherwise
public isolated function scheduleLeadReminders(types:EmailTriggerType emailTriggerType) returns error? {
    database:ParCycle activeParCycle = check getActiveParCycle();
    int parCycleId = check activeParCycle.parCycleId.ensureType();
    types:EmailType emailType = types:LEAD_REMINDER;
    string emailSubject = string `${types:EMAIL_SUBJECT_LEAD_PAR_DEADLINE}`;
    string emailTitle = types:EMAIL_TITLE_LEAD_PAR_DEADLINE;
    if check getRemainingDays(check getDateUtc(activeParCycle.parLeadDeadline)) < 0 {
        emailType = types:LEAD_REMINDER_OVERDUE;
        emailSubject = string `${types:EMAIL_SUBJECT_LEAD_PAR_DEADLINE_OVERDUE}`;
        emailTitle = types:EMAIL_TITLE_LEAD_PAR_DEADLINE_OVERDUE;
    }
    database:ParTeamSummary[] pendingTeamSummaries = from database:ParTeamSummary parTeamSummary in
            check database:getParTeamSummary(parCycleId, ())
        where parTeamSummary.parLeadCompletedCount < parTeamSummary.parTeamCount
        select parTeamSummary;
    database:EmailNotification[] emailNotifications = from database:ParTeamSummary parTeamSummary in pendingTeamSummaries
        let string? parLeadEmail = parTeamSummary.parLeadEmail
        where parLeadEmail !is () && parLeadEmail != ""
        group by parLeadEmail
        select check getEmailNotification(parCycleId, activeParCycle.parCycleName, parLeadEmail,
                emailType, check getEmailTriggerDetails(emailTriggerType, activeParCycle.parLeadDeadline),
                emailSubject, emailTitle, activeParCycle.parLeadDeadline, [parTeamSummary]);
    check database:insertEmailNotificationsBulk(emailNotifications);
}

# Schedule reminders for employees to complete the PARs.
#
# + emailTriggerType - The email trigger type
# + return - An error if the operation failed or nil otherwise
public isolated function scheduleEmployeeReminders(types:EmailTriggerType emailTriggerType) returns error? {
    database:ParCycle activeParCycle = check getActiveParCycle();
    int parCycleId = check activeParCycle.parCycleId.ensureType();
    database:EmailNotification[] emailNotifications = from database:ParRating parRating in
            check database:getParRatingsWithoutComments(parCycleId)
        where parRating.parEmployeeStatus is types:PENDING|types:DRAFT
        select check getEmailNotification(parCycleId, activeParCycle.parCycleName,
                parRating.parEmployeeEmail, types:EMPLOYEE_REMINDER,
                check getEmailTriggerDetails(emailTriggerType, activeParCycle.parEmployeeDeadline),
                string `${types:EMAIL_SUBJECT_EMPLOYEE_PAR_DEADLINE}`,
                types:EMAIL_TITLE_EMPLOYEE_PAR_DEADLINE, activeParCycle.parEmployeeDeadline, additionalData = ());
    check database:insertEmailNotificationsBulk(emailNotifications);
}

# Schedule reminders for leads to complete the 360 reviews.
#
# + leadEmail - The email of the lead
# + emailTriggerType - The email trigger type
# + return - An error if the operation failed or nil otherwise
public isolated function schedule360Reminders(string leadEmail, types:EmailTriggerType emailTriggerType)
        returns error? {
    database:ParCycle activeParCycle = check getActiveParCycle();
    int parCycleId = check activeParCycle.parCycleId.ensureType();
    database:ParTeam[] parTeamsOfLead = check database:getParTeamsOfLead(parCycleId, leadEmail);
    database:EmailNotification[] emailNotifications = from database:ParTeam {parTeamId} in parTeamsOfLead
        where parTeamId !is ()
        let types:ParTeamDetails parTeamDetails = check getParTeamDetails(parCycleId, parTeamId)
        let types:ParRatingMinimal[]? parRatingMinimal = parTeamDetails.details
        where parRatingMinimal !is ()
        from types:ParRatingMinimal {parEmployeeEmail} in parRatingMinimal
        from database:Par360Review par360Review in check database:getPar360Reviews(parCycleId, parEmployeeEmail)
        let string parReviewerEmail = par360Review.parReviewerEmail
        where par360Review.par360Status !is types:SHARED
        group by parReviewerEmail
        select check getEmailNotification(parCycleId, activeParCycle.parCycleName, parReviewerEmail,
                types:THREE_SIXTY_REMINDER, check getEmailTriggerDetailsWithInvokerEmail(emailTriggerType,
                        activeParCycle.parThreeSixtyRatingDeadline, leadEmail),
                string `${types:EMAIL_SUBJECT_360_REVIEW_DEADLINE}`,
                types:EMAIL_TITLE_360_REVIEW_DEADLINE, activeParCycle.parThreeSixtyRatingDeadline,
                check getBasicInformationOfReviewees([par360Review]));
    check database:insertEmailNotificationsBulk(emailNotifications);
}

# Schedule reminders for leads to complete the special ratings.
#
# + emailTriggerType - The email trigger type
# + return - An error if the operation failed or nil otherwise
public isolated function scheduleSpecialRatingReminders(types:EmailTriggerType emailTriggerType) returns error? {
    database:ParCycle activeParCycle = check getActiveParCycle();
    int parCycleId = check activeParCycle.parCycleId.ensureType();
    database:ParTeamSummary[] parTeamSummaries = check database:getParTeamSummary(parCycleId, ());
    database:EmailNotification[] emailNotifications = from database:ParTeamSummary {parLeadEmail} in parTeamSummaries
        where parLeadEmail !is () && parLeadEmail != ""
        group by parLeadEmail
        select check getEmailNotification(parCycleId, activeParCycle.parCycleName, parLeadEmail,
                types:SPECIAL_RATING_REMINDER,
                check getEmailTriggerDetails(emailTriggerType, activeParCycle.parSpecialRatingDeadline),
                string `${types:EMAIL_SUBJECT_SPECIAL_RATING_DEADLINE} '${activeParCycle.parCycleName}'`,
                types:EMAIL_TITLE_SPECIAL_RATING_DEADLINE, activeParCycle.parSpecialRatingDeadline, additionalData = ());
    check database:insertEmailNotificationsBulk(emailNotifications);
}

# Create the par ready notification requests.
#
# + parCycleId - The ID of the PAR cycle
# + email - The email of the employee
# + emailTriggerType - The email trigger type
# + return - An error if the operation failed or nil otherwise
isolated function createParLeadSharedNotificationRequests(int parCycleId, string email,
        types:EmailTriggerType emailTriggerType) returns error? {
    database:ParCycle {parCycleName} = check database:getParCycle(parCycleId);
    database:EmailNotification[] emailNotifications = [
        check getEmailNotification(parCycleId, parCycleName, email,
                types:PAR_LEAD_SHARED_NOTIFICATION, check getEmailTriggerDetails(emailTriggerType, ()),
                string `${types:EMAIL_SUBJECT_EMPLOYEE_PAR_READY}`,
                types:EMAIL_TITLE_EMPLOYEE_PAR_READY, deadline = (),
                additionalData = ())
    ];
    check database:insertEmailNotificationsBulk(emailNotifications);
}

# Create employee PAR shared notification.
#
# + parCycleId - The ID of the PAR cycle
# + email - The email of the employee
# + teamId - The ID of the team
# + emailTriggerType - The email trigger type
# + return - An error if the operation failed or nil otherwise
isolated function createEmployeeSharedNotificationRequests(int parCycleId, string email, int teamId,
        types:EmailTriggerType emailTriggerType) returns error? {
    database:ParCycle {parCycleName} = check database:getParCycle(parCycleId);
    string leadEmail = check database:getLeadOfEmployeeInActiveParCycle(email);
    types:BasicEmployeeInfo {employeeName, workEmail} = check getBasicEmployee(email);
    database:EmailNotification[] emailNotifications = [
        check getEmailNotification(parCycleId, parCycleName, leadEmail,
                types:PAR_EMPLOYEE_SHARED_NOTIFICATION, check getEmailTriggerDetails(emailTriggerType, ()),
                string `${types:EMAIL_SUBJECT_EMPLOYEE_SHARED} - ${employeeName}`,
                types:EMAIL_TITLE_EMPLOYEE_SHARED, deadline = (),
                additionalData = {employeeName, workEmail, teamId})
    ];
    check database:insertEmailNotificationsBulk(emailNotifications);
}

# Create PAR cycle invitation requests.
#
# + parCycleId - The ID of the PAR cycle
# + employeeEmails - The emails of the employees in the PAR cycle
# + emailTriggerType - The email trigger type
# + return - An error if the operation failed or nil otherwise
isolated function createParCycleInvitationRequests(int parCycleId, string[] employeeEmails,
        types:EmailTriggerType emailTriggerType) returns error? {
    database:ParCycle {parCycleName, parCycleStartDate, parCycleEndDate, parEvaluationStartDate, parEvaluationEndDate,
        parSpecialRatingDeadline, parThreeSixtyRatingDeadline, parEmployeeDeadline, parLeadDeadline, parF2FDeadline} =
        check database:getParCycle(parCycleId);
    types:ParCycleDates parCycleDates = {
        parCycleStartDate,
        parCycleEndDate,
        parEvaluationStartDate,
        parEvaluationEndDate,
        parSpecialRatingDeadline,
        parF2FDeadline,
        parThreeSixtyRatingDeadline,
        parEmployeeDeadline,
        parLeadDeadline
    };
    database:EmailNotification[] emailNotifications = [];
    foreach string employeeEmail in employeeEmails {
        emailNotifications.push(check getEmailNotification(parCycleId, parCycleName, employeeEmail,
                types:EMPLOYEE_INVITATION, check getEmailTriggerDetails(emailTriggerType, ()),
                string `${types:EMAIL_SUBJECT_EMPLOYEE_PAR_INVITATION} ${parCycleName}`,
                types:EMAIL_TITLE_EMPLOYEE_PAR_INVITATION, (), parCycleDates));
    }
    check database:insertEmailNotificationsBulk(emailNotifications);
}

# Send email reminders for the pending email notifications.
#
# + return - An error if the operation failed or nil otherwise
public isolated function sendReminders() returns error? {
    database:EmailNotification[] emailNotifications = [];
    transaction {
        emailNotifications = check database:getEmailNotifications(types:PENDING, emailBatchSize);
        if emailNotifications.length() > 0 {
            int[] notificationIds = from database:EmailNotification {parEmailId} in emailNotifications
                where parEmailId !is ()
                select parEmailId;
            check database:updateEmailNotifications(notificationIds, types:PROCESSING);
        }
        check commit;
    }

    foreach database:EmailNotification emailNotification in emailNotifications {
        string|error emailContent = email:generateEmailContent(emailNotification);
        if emailContent is error {
            log:printError("Error occurred while generating the email content.", emailContent);
            check database:updateEmailNotifications([check emailNotification.parEmailId.ensureType()], types:FAILED);
            continue;
        }
        email:EmailTemplateData emailTemplateData = check emailNotification.emailTemplateData.fromJsonStringWithType();
        error? sendEmailResult = email:sendEmail({
            to: [emailNotification.recipientEmail],
            subject: emailTemplateData.subject,
            templateId: "genericTemplate",
            contentKeyValPairs: {
                TITLE: emailTemplateData.title,
                SUB_TITLE: emailTemplateData.parCycleName,
                EMAIL_BODY: emailContent,
                CLOSING_AND_SIGNATURE: types:EMAIL_CLOSING_AND_SIGNATURE
            }
        });
        if sendEmailResult is error {
            log:printError("Error occurred while sending the email.", sendEmailResult);
            check database:updateEmailNotifications([check emailNotification.parEmailId.ensureType()], types:FAILED);
            continue;
        }
        check database:updateEmailNotifications([check emailNotification.parEmailId.ensureType()], types:SENT);
    }
}

# Schedule auto reminders for the PAR cycle deadlines.
#
# + return - An error if the operation failed or nil otherwise
public isolated function scheduleAutoReminders() returns error? {
    database:ParCycle {parEmployeeDeadline, parLeadDeadline, parSpecialRatingDeadline} = check getActiveParCycle();
    if isAutoReminderEligible(check getDateUtc(parEmployeeDeadline)) {
        check scheduleEmployeeReminders(types:SCHEDULER);
    }
    if isAutoReminderEligible(check getDateUtc(parLeadDeadline)) {
        check scheduleLeadReminders(types:SCHEDULER);
    }
    if isAutoReminderEligible(check getDateUtc(parSpecialRatingDeadline)) {
        check scheduleSpecialRatingReminders(types:SCHEDULER);
    }
}

# Check if the auto reminder is eligible for the given date.
#
# + dateUtc - The date in UTC
# + return - True if the auto reminder is eligible, false otherwise
public isolated function isAutoReminderEligible(time:Utc dateUtc) returns boolean {
    int|error diffSeconds = getRemainingSeconds(dateUtc);
    if diffSeconds is error {
        log:printDebug("Unable to get the difference in seconds.");
        return false;
    }
    return utils:isOneDayBefore(diffSeconds) || utils:isThreeDaysBefore(diffSeconds) ||
        utils:isSevenDaysBefore(diffSeconds);
}

# Get the remaining seconds for the given date.
#
# + dateUtc - The date in UTC
# + return - The remaining seconds or an error if the operation failed
public isolated function getRemainingSeconds(time:Utc dateUtc) returns int|error {
    time:Utc dateTodayUtc = check getDateTodayUtc();
    time:Seconds utcDiffSeconds = time:utcDiffSeconds(dateUtc, dateTodayUtc);
    return check int:fromString(utcDiffSeconds.toString());
}

# Get the remaining days for the given date.
#
# + dateUtc - The date in UTC
# + return - The remaining days or an error if the operation failed
public isolated function getRemainingDays(time:Utc dateUtc) returns int|error {
    int diffSeconds = check getRemainingSeconds(dateUtc);
    return diffSeconds / types:SECONDS_FOR_ONE_DAY;
}

# Get today's date in UTC.
#
# + return - Today's date in UTC or an error if the operation failed
public isolated function getDateTodayUtc() returns time:Utc|error =>
    time:utcFromString(time:utcToString(time:utcNow()).substring(0, 10) +
        types:DEFAULT_TIME_OF_DAY);

# Get date in UTC for the given date.
#
# + date - The date in the format 'yyyy-MM-dd'
# + return - The date in UTC or an error if the operation failed
public isolated function getDateUtc(string date) returns time:Utc|error =>
    time:utcFromString(date + types:DEFAULT_TIME_OF_DAY);

# Function to get the number of days within a date range.
#
# + startDate - Start date
# + endDate - End date
# + return - Return number of days
public isolated function getNumberOfDaysFromRange(time:Utc startDate, time:Utc endDate) returns float {
    return <float>time:utcDiffSeconds(endDate, startDate) / types:SECONDS_FOR_ONE_DAY;
}

# Get the basic email template data.
#
# + subject - The subject of the email
# + title - The title of the email
# + parCycleName - The name of the PAR cycle
# + deadline - The deadline which the email is related to
# + return - The basic email template data or an error if the operation failed
public isolated function getBasicEmailTemplateData(string subject, string title, string parCycleName, string? deadline)
        returns email:EmailTemplateData|error {
    email:EmailTemplateData emailTemplateData = {
        subject,
        title,
        parCycleName
    };
    if deadline !is () {
        emailTemplateData.deadline = deadline;
        emailTemplateData.remainingDays = check getRemainingDays(check getDateUtc(deadline));
    }
    return emailTemplateData;
}

# Get the email notification.
#
# + parCycleId - The ID of the PAR cycle
# + parCycleName - The name of the PAR cycle
# + recipientEmail - The email of the recipient
# + emailType - The type of the email
# + emailTriggerDetails - The email trigger details
# + emailSubject - The subject of the email
# + emailTitle - The title of the email
# + deadline - The deadline which the email is related to
# + additionalData - Additional data to be included in the email
# + return - The email notification or an error if the operation failed
public isolated function getEmailNotification(int parCycleId, string parCycleName, string recipientEmail,
        types:EmailType emailType, string emailTriggerDetails, string emailSubject, string emailTitle, string? deadline,
        anydata? additionalData)
        returns database:EmailNotification|error {
    email:EmailTemplateData emailTemplateData = check getBasicEmailTemplateData(emailSubject, emailTitle, parCycleName,
            deadline);
    if additionalData !is () {
        emailTemplateData.content[types:EMAIL_ADDITIONAL_DATA] = additionalData;
    }
    return {
        parCycleId,
        recipientEmail,
        recipientName: getEmployeeName(recipientEmail) ?: recipientEmail,
        emailType,
        emailTriggerDetails,
        emailStatus: types:PENDING,
        emailTemplateData: emailTemplateData.toString()
    };
}

# Get the email trigger details.
#
# + emailTriggerType - The email trigger type
# + deadline - The deadline referred in the email trigger
# + return - The email trigger details
public isolated function getEmailTriggerDetails(types:EmailTriggerType emailTriggerType, string? deadline)
        returns string|error {
    if emailTriggerType == types:SCHEDULER && deadline !is () && deadline.trim() != "" {
        return string `${types:SCHEDULER}_${check getRemainingDays(check getDateUtc(deadline))}`;
    }
    return string `${types:SERVICE}_${time:utcNow()[0]}`;
}

# Get the email trigger details with the invoker email.
#
# + emailTriggerType - The email trigger type
# + deadline - The deadline referred in the email trigger
# + invokerEmail - The email of the invoker
# + return - The email trigger details
public isolated function getEmailTriggerDetailsWithInvokerEmail(types:EmailTriggerType emailTriggerType,
        string? deadline, string invokerEmail) returns string|error =>
    string `${check getEmailTriggerDetails(emailTriggerType, deadline)}_${invokerEmail}`;

# The Job class for sending reminders.
class SendRemindersJob {
    *task:Job;

    public function execute() {
        error? sendRemindersResult = sendReminders();
        if sendRemindersResult is error {
            log:printWarn("Error occurred while sending reminders.", sendRemindersResult);
        }
    }
}

# Get indirect and direct reports from the given email.
#
# + parCycleId - The ID of the PAR cycle
# + leadEmail - The email of the lead
# + return - The email trigger details
public isolated function getLeadsDirectAndIndirectEmployeesPar(int parCycleId, string leadEmail)
    returns types:AdditionalReportsParRating[]|error {

    entity:Employee[] allEmployees = check entity:getAllActiveEmployees((), leadEmail);
    string[] employeeEmails = from entity:Employee employee in allEmployees
        select employee.workEmail;
    if employeeEmails.length() == 0 {
        return [];
    }
    database:AdditionalReportsParRating[] employees = check database:getDirectAndIndirectEmployees(parCycleId, employeeEmails);

    return from database:AdditionalReportsParRating rating in employees
        let types:Par360ReviewCounts {requestedReviewCount, sharedReviewCount} =
            check getPar360ReviewCounts(parCycleId, rating.parEmployeeEmail)
        let types:Par360ReviewStatus par360ReviewStatus = requestedReviewCount > 0 &&
            requestedReviewCount == sharedReviewCount ? types:SHARED : types:PENDING
        select {
            parRatingId: rating.parRatingId,
            parCycleId: rating.parCycleId,
            parEmployeeEmail: rating.parEmployeeEmail,
            parEmployeeName: rating.parEmployeeName,
            parTeamId: rating.parTeamId,
            parRating: rating.parRating,
            parSpecialRating: rating.parSpecialRating,
            parEmployeeStatus: rating.parEmployeeStatus,
            parLeadStatus: rating.parLeadStatus,
            par360ReviewStatus,
            par360ReviewCounts: {
                requestedReviewCount,
                sharedReviewCount
            },
            parF2fStatus: rating.parF2fStatus,
            parEmployeeAcceptanceStatus: rating.parEmployeeAcceptanceStatus,
            reportingType: rating.reportType,
            parDirectLead: rating.employeeLead ?: ""
        };
}

# Get pars of the direct subordinates for a given lead email.
#
# + parCycleId - The ID of the PAR cycle
# + leadEmail - The email of the lead
# + return - The email trigger details
public isolated function getDirectParRatingsOfEmployees(int parCycleId, string leadEmail)
    returns types:ChainReportsParRating[]|error {
    database:ParRatingWithLevels[] employees = check database:getDirectParRatingsOfEmployees(parCycleId, leadEmail);

    return from database:ParRatingWithLevels rating in employees
        let types:Par360ReviewCounts {requestedReviewCount, sharedReviewCount} =
            check getPar360ReviewCounts(parCycleId, rating.parEmployeeEmail)
        let types:Par360ReviewStatus par360ReviewStatus = requestedReviewCount > 0 &&
            requestedReviewCount == sharedReviewCount ? types:SHARED : types:PENDING
        select {
            parRatingId: rating.parRatingId,
            parCycleId: rating.parCycleId,
            parDepartment: rating.parDepartment,
            parEmployeeEmail: rating.parEmployeeEmail,
            parEmployeeName: rating.parEmployeeName,
            parTeamId: rating.parTeamId,
            parTeam: rating.parTeam ?: "",
            parRating: rating.parRating,
            parSpecialRating: rating.parSpecialRating ?: types:NOT_ASSIGNED,
            parEmployeeStatus: rating.parEmployeeStatus,
            parLeadStatus: rating.parLeadStatus,
            par360ReviewStatus,
            par360ReviewCounts: {
                requestedReviewCount,
                sharedReviewCount
            },
            parF2fStatus: rating.parF2fStatus,
            parEmployeeAcceptanceStatus: rating.parEmployeeAcceptanceStatus,
            isEmployeeALead: rating.isEmployeeALead,
            parSubTeam: rating.parSubTeam ?: "",
            parLeadEmail: rating.parLeadEmail,
            parBusinessUnit: rating.parBusinessUnit
        };
}

# Check if the given leadEmail belongs to the additional lead of the given employee.
#
# + leadEmail - The email of the lead
# + employeeEmail - The email of the employee
# + return - Returns true if the lead is the lead of the employee, false otherwise
public isolated function isAdditionalLeadOfEmployee(string leadEmail, string employeeEmail) returns boolean {
    boolean|error result = database:checkIsAdditionalLeadOfEmployee(employeeEmail, leadEmail);
    if result is error {
        log:printError(
                string `Error occurred while retrieving the additional lead for the employee ${employeeEmail}`,
                result
        );
        return false;
    }
    return result;
}

# Check if the given leadEmail belongs to the additional lead of the given employee.
#
# + employeeEmail - The email of the employee
# + return - Returns true if the lead is the lead of the employee, false otherwise
public isolated function isLead(string employeeEmail) returns boolean {
    entity:Employee|error result = entity:getEmployee(employeeEmail);
    if result is error {
        log:printError(
                string `Error occurred while getting employee information to verify lead access ${employeeEmail}`,
                result
        );
        return false;
    }
    return result.lead ? result.lead : false;
}

# The Job class for scheduling auto reminders.
class ScheduleAutoRemindersJob {
    *task:Job;

    public function execute() {
        error? scheduleAutoRemindersResult = scheduleAutoReminders();
        if scheduleAutoRemindersResult is error {
            log:printWarn("Error occurred while scheduling auto reminders.", scheduleAutoRemindersResult);
        }
    }
}

# Function to get the participants of a PAR cycle.
#
# + parCycleId - The ID of the PAR cycle for which the team is to be retrieved
# + leadEmail - The email of the lead
# + return - Participants or an error if the operation failed
public isolated function getParticipantsOfParCycle(int parCycleId, string? leadEmail) returns types:Participant[]|error {
    database:Participant[] participants = check database:getParticipantsOfTheParCycle(parCycleId, leadEmail);
    return participants;
}

# Function to get all the rejected reviews for a given par cycle ID.
#
# + parCycleId - The ParCycle ID
# + return - A list of RejectedReview objects or an error if the operation failed
public isolated function getAllRejectedReviews(int parCycleId) returns
types:RejectedReview[]|error =>
    check database:getRejectedReviews(parCycleId);

# Helper Function to get the lead of a employee in active par cycle before the F2F date.
#
# + employeeEmail - The email of the employee
# + userTimezoneOffset - User's timezone offset
# + return - Lead's email of the given employee or an error if the F2F deadline passed or error while retrieving lead
public isolated function validateCalendarRequestAndGetLead(string employeeEmail, decimal userTimezoneOffset)
    returns string|error {

    database:ParCycle activeParCycle = check getActiveParCycle();

    if !check isFutureDate(activeParCycle.parF2FDeadline, userTimezoneOffset) {
        return error("Request cannot process since the F2F deadline has passed.");
    }
    string|error leadEmail = database:getLeadOfEmployeeInActiveParCycle(employeeEmail);
    if leadEmail is error {
        return error("An error occurred while getting the lead of the employee.", leadEmail);
    }
    return leadEmail;
}

# Function to get busy time periods of the employee and the lead.
#
# + employeeEmail - The email of the employee
# + date - The date which checks against availability
# + userTimezoneOffset - User's timezone offset
# + return - A FreeBusy response or an error
public isolated function getBusyTimeSlots(string employeeEmail, string date, decimal userTimezoneOffset)
    returns gcalendar:FreeBusyResponse|error {

    string|error leadEmail = validateCalendarRequestAndGetLead(employeeEmail, userTimezoneOffset);

    if leadEmail is error {
        return leadEmail;
    }
    return check calendar:checkCalendarAvailability(employeeEmail, leadEmail, date);
}

# Function to schedule a F2F meeting with the employee and the lead.
#
# + employeeEmail - The email of the employee
# + request - The ScheduleMeetingRequest type with meeting information
# + userTimezoneOffset - User's timezone offset
# + return - A FreeBusy response or an error
public isolated function scheduleF2FMeeting(string employeeEmail, types:ScheduleMeetingRequest request,
        decimal userTimezoneOffset) returns meet:CreateCalendarEventResponse|error {

    string|error leadEmail = validateCalendarRequestAndGetLead(employeeEmail, userTimezoneOffset);
    if leadEmail is error {
        return leadEmail;
    }

    // Attempt to create the meeting.
    meet:CreateCalendarEventResponse|error calendarCreateEventResponse = meet:createMeeting({
        title: request.title,
        description: request.description,
        startTime: request.startTime,
        endTime: request.endTime,
        timeZone: userTimezoneOffset.toString(),
        participant: leadEmail
    }, employeeEmail);

    error? updateError = database:updateParRating({
        parRatingId: request.parRatingId,
        parF2fStatus: types:SCHEDULED,
        parRatingUpdatedBy: employeeEmail
    });

    if updateError is error {
        log:printError("Error occurred while updating the par rating with F2F status.", updateError);
    }

    return calendarCreateEventResponse;
}

# Function to sync an employee to the system.
#
# + employeeEmail - The email of the employee
# + cycleId - The ID of the par cycle
# + return - A FreeBusy response or an error
# + invokerEmail - The invoker of the process
public isolated function validateAndSyncEmployeeInformation(string employeeEmail, int cycleId, string invokerEmail)
    returns error? {
    //Check is the cycle is valid or not
    database:ParCycle|error parCycle = getActiveParCycle();
    if parCycle is error {
        return parCycle;
    }
    if parCycle.parCycleId !== cycleId {
        return error("Unable to sync employee details of an inactive par cycle");
    }
    // Get latest employee info from the entity
    entity:Employee|error latestEmployeeInfo = entity:getEmployee(employeeEmail);
    if latestEmployeeInfo is error {
        return latestEmployeeInfo;
    }

    if latestEmployeeInfo.managerEmail !is string {
        return error("Employee manager email cannot be a null value");
    }
    //Get the currently assigned team info of the employee
    types:ParTeamBasic existingTeamDetails =
        convertFromDbParTeam(check database:getTeamDetailsOfEmployee(employeeEmail, cycleId));
    // Check wether the system and the entity records are matches or not
    if latestEmployeeInfo.managerEmail !== existingTeamDetails.parLeadEmail ||
        latestEmployeeInfo.businessUnit !== existingTeamDetails.parBusinessUnit ||
        latestEmployeeInfo.department !== existingTeamDetails.parDepartment ||
        latestEmployeeInfo.team !== existingTeamDetails.parTeam {
        string employeeNewLead = check latestEmployeeInfo.managerEmail.ensureType();
        string employeeNewDepartment = check latestEmployeeInfo.department.ensureType();
        string employeeNewBU = check latestEmployeeInfo.businessUnit.ensureType();

        // Check is a team exists in the system with the combination of updated lead, BU, department and team
        database:BasicParTeam|error teamToBeAssigned =
            database:getTeamDetailsOfLead(employeeNewLead, cycleId, employeeNewDepartment, employeeNewBU,
                    latestEmployeeInfo.team ?: "");
        if teamToBeAssigned is error {

            //If no teams found under that combination, get the info of employees lead
            entity:Employee|error updatedLeadInfo = entity:getEmployee(employeeNewLead);
            if updatedLeadInfo is error {
                return updatedLeadInfo;
            }
            if updatedLeadInfo.managerEmail !is string {
                return error("Updated manager's manager email cannot be a null value");
            }

            // Ge the special rating group ID for that BU and department combination
            int|error parSpecialRatingGroupId = getParSpecialRatingGroupId(
                    check database:getParSpecialRatingGroups(cycleId), updatedLeadInfo.businessUnit, updatedLeadInfo.department,
                    updatedLeadInfo.team ?: "");
            if parSpecialRatingGroupId is error {
                return parSpecialRatingGroupId;
            }

            database:ParTeam[] newTeamsToCreate = [
                {
                    parCycleId: cycleId,
                    parBusinessUnit: employeeNewBU,
                    parDepartment: employeeNewDepartment,
                    parTeam: latestEmployeeInfo.team ?: "",
                    parSubTeam: latestEmployeeInfo.subTeam ?: "",
                    parLeadEmail: employeeNewLead,
                    parTeamCreatedBy: invokerEmail,
                    parTeamUpdatedBy: invokerEmail,
                    parSpecialRatingGroupId: parSpecialRatingGroupId
                },
                {
                    parCycleId: cycleId,
                    parBusinessUnit: updatedLeadInfo.businessUnit,
                    parDepartment: updatedLeadInfo.department,
                    parTeam: updatedLeadInfo.team ?: "",
                    parSubTeam: updatedLeadInfo.subTeam ?: "",
                    parLeadEmail: updatedLeadInfo.managerEmail,
                    parTeamCreatedBy: invokerEmail,
                    parTeamUpdatedBy: invokerEmail,
                    parSpecialRatingGroupId: parSpecialRatingGroupId
                }
            ];

            // Create new team, one for lead and one for employee
            error? insertParTeamsBulk = database:insertParTeamsBulk(newTeamsToCreate);
            if insertParTeamsBulk is error {
                return insertParTeamsBulk;
            }
            // Get the newly created employee team
            database:BasicParTeam|error newTeamOfEmployee =
            database:getTeamDetailsOfLead(employeeNewLead, cycleId, employeeNewDepartment, employeeNewBU,
                    latestEmployeeInfo.team ?: "");
            if newTeamOfEmployee is error {
                return newTeamOfEmployee;
            }
            // Update the employee's par rating record with new team ID
            int|error employeeTeamUpdateResult =
            database:updateParTeamIdOfEmployee(newTeamOfEmployee.parTeamId, employeeEmail, cycleId);
            if employeeTeamUpdateResult is error {
                return employeeTeamUpdateResult;
            }
            // Get the newly created lead team
            database:BasicParTeam|error newTeamOfLead =
            database:getTeamDetailsOfLead(<string>updatedLeadInfo.managerEmail, cycleId, updatedLeadInfo.department,
                    updatedLeadInfo.businessUnit, updatedLeadInfo.team ?: "");
            if newTeamOfLead is error {
                return newTeamOfLead;
            }
            // Update the lead's par rating record with new team ID
            int|error updateResultOfNewLeadTeam =
            database:updateParTeamIdOfEmployee(newTeamOfLead.parTeamId, employeeNewLead, cycleId);
            if updateResultOfNewLeadTeam is error {
                return updateResultOfNewLeadTeam;
            }
            int|error headCountOfTeam = database:getHeadCountOfTeam(existingTeamDetails.parTeamId);
            if headCountOfTeam is int && headCountOfTeam === 0 {
                error? parTeam = database:deleteParTeam(existingTeamDetails.parTeamId);
                if parTeam is error {
                    return parTeam;
                }
            }
        }
        if teamToBeAssigned is database:BasicParTeam {
            // If an team exists  assign the employee to that team
            int|error updateResult =
                database:updateParTeamIdOfEmployee(teamToBeAssigned.parTeamId, employeeEmail, cycleId);
            if updateResult is error {
                return updateResult;
            }
            if updateResult === 0 {
                return error("Failed to update the employee record with the new team ID.");
            }
            int|error headCountOfTeam = database:getHeadCountOfTeam(existingTeamDetails.parTeamId);
            if headCountOfTeam is int && headCountOfTeam === 0 {
                error? parTeam = database:deleteParTeam(existingTeamDetails.parTeamId);
                if parTeam is error {
                    return parTeam;
                }
            }
        }
    }
}

# Converts a database BasicTeamInfo record to a types BasicTeamInfo record.
#
# + BasicTeamInfo - The database BasicTeamInfo record to be converted
# + return - The converted BasicTeamInfo record
public isolated function convertFromDbParTeam(database:BasicParTeam BasicTeamInfo) returns types:ParTeamBasic =>
    let database:BasicParTeam {parTeamId, parLeadEmail, parDepartment, parBusinessUnit, parTeam, parCycleId} = BasicTeamInfo
    in {parTeamId, parCycleId, parLeadEmail, parDepartment, parBusinessUnit, parTeam};

# Function to get PAR summaries of an employee.
#
# + employeeEmail - The email of the employee
# + return - Participants or an error if the operation failed
public isolated function getParSummariesOfEmployee(string employeeEmail) returns types:EmployeeParSummary[]|error {
    return check database:getEmployeeParSummaries(employeeEmail);
}

# Query to get special rating allocation for the active cycle.
#
# + parCycleId - The ID of the PAR cycle
# + leadEmail - The email of the lead
# + return - The execution result
public isolated function getSpecialRatingAllocations(int parCycleId, string? leadEmail)
    returns types:SpecialRatingAllocation[]|error {
    database:SpecialRatingAllocation[] dbAllocations = check database:getSpecialRatingAllocations(parCycleId, leadEmail);
    return from database:SpecialRatingAllocation allocation in dbAllocations
        select {
            parBusinessUnit: allocation.parBusinessUnit,
            parDepartment: allocation.parDepartment,
            parTeam: allocation.parTeam,
            parQuotaId: allocation.parQuotaId,
            parSpecialQuotaName: allocation.parSpecialQuotaName,
            parTop5Quota: allocation.parTop5Quota,
            parTop20Quota: allocation.parTop20Quota
        };
}

# Checks if the invoker is in the upward reporting chain of the given employee.
#
# + invokerEmail - The email of the invoker
# + employeeEmail - The email of the target employee
# + return - Returns true if the invoker is found in the management chain, false otherwise
public isolated function isEmployeeInReportingChain(string invokerEmail, string employeeEmail) returns boolean {
    string currentEmail = employeeEmail;
    int currentDepth = 0;

    while currentDepth < reportingChainMaxDepth {
        entity:Employee|error employee = entity:getEmployee(currentEmail);

        if employee is error {
            log:printWarn("Failed to fetch employee details.");
            return false;
        }
        string? managerEmail = employee.managerEmail;

        if managerEmail is () || managerEmail == "" {
            log:printInfo("Reporting chain validation reached top of hierarchy.");
            return false;
        }

        if managerEmail == invokerEmail {
            return true;
        }

        currentEmail = managerEmail;
        currentDepth += 1;
    }

    return false;
}
