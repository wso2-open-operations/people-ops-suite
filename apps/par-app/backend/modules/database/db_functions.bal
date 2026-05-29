// Copyright (c) 2025, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.
import par_app.types;

import ballerina/sql;

# Create a new ParCycle.
#
# + parCycle - Par cycle object
# + return - The ID of the created par cycle or an error if the operation failed
public isolated function createParCycle(*ParCycle parCycle) returns int|error {
    sql:ExecutionResult result = check dbClient->execute(createParCycleQuery(parCycle));
    return result.lastInsertId.ensureType();
}

# Get ParCycles by status and email.
#
# + status - Par cycle status
# + email - Email of the user
# + return - A list of ParCycle objects or an error if the operation failed
public isolated function getParCycles(types:ParCycleStatus? status, string? email) returns ParCycle[]|error {
    stream<ParCycle, error?> resultStream = dbClient->query(getParCyclesByStatusAndEmailQuery(status, email));
    return from ParCycle parCycle in resultStream
        select parCycle;
}

# Get ParCycles by status.
#
# + status - Par cycle status array
# + return - A list of ParCycle objects or an error if the operation failed
public isolated function getParCyclesByStatus(types:ParCycleStatus[] status) returns ParCycle[]|error {
    stream<ParCycle, error?> resultStream = dbClient->query(getParCyclesByStatusQuery(status));
    return from ParCycle parCycle in resultStream
        select parCycle;
}

# Get ParCycle by Par cycle ID.
#
# + parCycleId - Par cycle Id
# + return - ParCycle object or an error if the operation failed
public isolated function getParCycle(int parCycleId) returns ParCycle|error {
    ParCycle|sql:Error queryRow = dbClient->queryRow(getParCycleByIdQuery(parCycleId));
    if queryRow is sql:NoRowsError {
        return error(string `ParCycle not found for the given parCycleId: ${parCycleId.toString()}`,
            code = types:ERR_PAR_CYCLE_NOT_FOUND);
    }
    if queryRow is sql:Error {
        return error(string `An error occurred while retrieving ParCycle ${queryRow.toString()}`);
    }
    return queryRow;
}

# Update ParCycle.
#
# + parCycle - Optionalized ParCycle object
# + return - An error if the operation failed
public isolated function updateParCycle(ParCycleOptionalized parCycle) returns error? {
    _ = check dbClient->execute(updateParCycleQuery(parCycle));
}

# Insert default ParRatings in bulk.
#
# + parRatings - ParRating array
# + return - An error if the operation failed
public isolated function insertDefaultParRatingsBulk(ParRating[] parRatings) returns error? {
    check batchExecute(bulkInsertParRatingQuery(parRatings));
}

# This function is used to execute a given SQL query.
#
# + sqlQuery - SQL query to be executed
# + return - The result of the execution or an error if the operation failed
public isolated function execute(sql:ParameterizedQuery sqlQuery) returns sql:ExecutionResult|sql:Error {
    return dbClient->execute(sqlQuery);
}

# This function is used to execute a given SQL query and return the result as a stream.
#
# + sqlQuery - SQL query to be executed
# + rowType - The type of the rows in the result stream
# + return - The result of the execution as a stream or an error if the operation failed
public isolated function query(sql:ParameterizedQuery sqlQuery, typedesc<record {}> rowType)
    returns stream<record {}, sql:Error?> {
    return dbClient->query(sqlQuery, rowType);
}

# Create a new PAR special rating quota.
#
# + parSpecialRatingQuota - Par special rating quota object
# + return - The ID of the created par special rating quota or an error if the operation failed
public isolated function createParSpecialRatingQuota(ParSpecialRatingQuota parSpecialRatingQuota) returns int|error {
    sql:ExecutionResult result = check dbClient->execute(createParSpecialRatingQuotaQuery(parSpecialRatingQuota));
    return result.lastInsertId.ensureType();
}

# Update special rating quota of special rating group.
#
# + ParCycleId - The ParCycle ID
# + specialRatingGroupId - The special rating group ID
# + specialRatingQuotaId - The special rating quota ID
# + return - An error if the operation failed or nil if successful
public isolated function updateParSpecialRatingGroupQuotaId(int ParCycleId, int specialRatingGroupId,
        int specialRatingQuotaId) returns error? {
    _ = check dbClient->execute(updateParSpecialRatingGroupQuotaIdQuery(ParCycleId, specialRatingGroupId,
            specialRatingQuotaId));
}

# Gets the lead of the active ParCycle for a given employee.
#
# + email - Email of the employee
# + return - The email of the lead or an error if the operation failed
public isolated function getLeadOfEmployeeInActiveParCycle(string email) returns string|error {
    string|sql:Error queryRow = dbClient->queryRow(getLeadOfEmployeeInActiveParCycleQuery(email));
    if queryRow is sql:NoRowsError {
        return error(string `Lead not found for employee ${email}`, code = types:ERR_PAR_CYCLE_LEAD_NOT_FOUND);
    }
    if queryRow is error {
        return error(string `An error occurred while retrieving the lead's email ${queryRow.toString()}`);
    }
    return queryRow;
}

# Gets the ParRatings for a given ParCycle.
#
# + parCycleId - Par cycle ID
# + email - Email of the employee
# + return - The ParRating object or an error if the operation failed
public isolated function getParRating(int parCycleId, string email) returns ParRating|error {
    ParRating|sql:Error queryRow = dbClient->queryRow(getParRatingQuery(parCycleId, email));
    if queryRow is sql:NoRowsError {
        return error(string `ParRating not found for the given parCycleId: ${parCycleId.toString()}, email:${email}`,
            code = types:ERR_PAR_RATING_NOT_FOUND);
    }
    if queryRow is error {
        return error(string `An error occurred while retrieving ParRating ${queryRow.toString()}`);
    }
    return queryRow;
}

# Get ParRatings without comments for a given ParCycle.
#
# + parCycleId - The ParCycle ID
# + return - A list of ParRating objects or an error if the operation failed
public isolated function getParRatingsWithoutComments(int parCycleId) returns ParRating[]|error {
    stream<ParRating, error?> resultStream = dbClient->query(getParRatingsWithoutCommentsQuery(parCycleId));
    return from ParRating parRating in resultStream
        select parRating;
}

# Updates a given ParRating.
#
# + parRating - Optionalized ParRating object
# + return - An error if the operation failed
public isolated function updateParRating(ParRatingOptionalized parRating) returns error? {
    _ = check dbClient->execute(updateParRatingQuery(parRating));
}

# Insert given ParSpecialRatingGroups in bulk.
#
# + parSpecialRatingGroups - ParSpecialRatingGroup array
# + return - An error if the operation failed or nil if successful
public isolated function insertParSpecialRatingGroupsBulk(ParSpecialRatingGroup[] parSpecialRatingGroups)
        returns error? {
    check batchExecute(insertParSpecialRatingGroupsQuery(parSpecialRatingGroups));
}

# Get ParSpecialRatingGroups for a given ParCycle.
#
# + parCycleId - The ParCycle ID
# + return - A list of ParSpecialRatingGroup objects or an error if the operation failed
public isolated function getParSpecialRatingGroups(int parCycleId) returns ParSpecialRatingGroup[]|error {
    stream<ParSpecialRatingGroup, error?> resultStream = dbClient->query(getParSpecialRatingGroupsQuery(parCycleId));
    return from ParSpecialRatingGroup parSpecialRatingGroup in resultStream
        select parSpecialRatingGroup;
}

# Get ParSpecialRatingGroupWithHeadCounts for a given ParCycle.
#
# + parCycleId - The ParCycle ID
# + return - A list of ParSpecialRatingGroupWithHeadCount objects or an error if the operation failed
public isolated function getParSpecialRatingGroupsWithHeadCount(int parCycleId)
        returns ParSpecialRatingGroupWithHeadCount[]|error {
    stream<ParSpecialRatingGroupWithHeadCount, error?> resultStream =
        dbClient->query(getParSpecialRatingGroupsWithHeadCountQuery(parCycleId));
    return from ParSpecialRatingGroupWithHeadCount parSpecialRatingGroupWithHeadCount in resultStream
        select parSpecialRatingGroupWithHeadCount;
}

# Insert ParTeams in bulk.
#
# + parTeams - ParTeam array
# + return - An error if the operation failed or nil if successful
public isolated function insertParTeamsBulk(ParTeam[] parTeams) returns error? {
    check batchExecute(insertParTeamsQuery(parTeams));
}

# Get ParTeams for a given ParCycle.
#
# + parCycleId - The ParCycle ID
# + return - A list of ParTeam objects or an error if the operation failed
public isolated function getParTeams(int parCycleId) returns ParTeam[]|error {
    stream<ParTeam, error?> resultStream = dbClient->query(getParTeamsQuery(parCycleId));
    return from ParTeam parTeam in resultStream
        select parTeam;
}

# Get ParTeam by ParTeam ID.
#
# + parTeamId - The ParTeam ID
# + return - The ParTeam object or an error if the operation failed
public isolated function getParTeam(int parTeamId) returns ParTeam|error {
    ParTeam|sql:Error queryRow = dbClient->queryRow(getParTeamQuery(parTeamId));
    if queryRow is sql:NoRowsError {
        return error(string `ParTeam not found for the given parTeamId: ${parTeamId}`,
            code = types:ERR_PAR_TEAM_NOT_FOUND);
    }
    if queryRow is sql:Error {
        return error(string `An error occurred while retrieving ParTeam ${queryRow.toString()}`);
    }
    return queryRow;
}

isolated function batchExecute(sql:ParameterizedQuery[] queries) returns error? {
    int index = 0;
    int length = queries.length();
    while index < length {
        int safeLastIndexForBatch = int:min(index + types:BATCH_SIZE, length);
        sql:ParameterizedQuery[] chunk = queries.slice(index, safeLastIndexForBatch);
        _ = check dbClient->batchExecute(chunk);
        index = safeLastIndexForBatch;
    }
}

# Get ParTeamSummary for a given ParCycle and lead email.
#
# + parCycleId - The ParCycle ID
# + leadEmail - The email of the lead
# + return - A list of ParTeamSummary objects or an error if the operation failed
public isolated function getParTeamSummary(int parCycleId, string? leadEmail) returns ParTeamSummary[]|error {
    stream<ParTeamSummary, error?> resultStream = dbClient->query(getParTeamSummaryQuery(parCycleId, leadEmail, ()));
    return from ParTeamSummary parTeamSummary in resultStream
        select parTeamSummary;
}

# Get ParTeamSummary for a given ParCycle and team ID.
#
# + parCycleId - The ParCycle ID
# + parTeamId - The ParTeam ID
# + return - The ParTeamSummary object or an error if the operation failed
public isolated function getParTeamSummaryByTeamId(int parCycleId, int parTeamId) returns ParTeamSummary|error {
    ParTeamSummary|sql:Error queryRow = dbClient->queryRow(getParTeamSummaryQuery(parCycleId, (), parTeamId));
    if queryRow is sql:NoRowsError {
        return error(string `ParTeamSummary not found for the given parCycleId: ${parCycleId}, parTeamId:${parTeamId}`,
            code = types:ERR_PAR_TEAM_SUMMARY_NOT_FOUND);
    }
    if queryRow is sql:Error {
        return error(string `An error occurred while retrieving ParTeamSummary ${queryRow.toString()}`);
    }
    return queryRow;
}

# Get ParTeams of a given lead in a given ParCycle.
#
# + parCycleId - The ParCycle ID
# + leadEmail - The email of the lead
# + return - A list of ParTeam objects or an error if the operation failed
public isolated function getParTeamsOfLead(int parCycleId, string leadEmail) returns ParTeam[]|error {
    stream<ParTeam, error?> resultStream = dbClient->query(getParTeamsOfLeadQuery(parCycleId, leadEmail));
    return from ParTeam parTeam in resultStream
        select parTeam;
}

# Get ParRatings of a given team in a given ParCycle.
#
# + parCycleId - The ParCycle ID
# + parTeamId - The ParTeam ID
# + return - A list of ParRating objects or an error if the operation failed
public isolated function getParRatingsOfTeam(int parCycleId, int parTeamId) returns ParRating[]|error {
    stream<ParRating, error?> resultStream = dbClient->query(getParRatingsOfTeamQuery(parCycleId, parTeamId));
    return from ParRating parRating in resultStream
        select parRating;
}

# Get ParCycleEmployeeEmails for a given ParCycle.
#
# + parCycleId - The ParCycle ID
# + return - A list of employee emails or an error if the operation failed
public isolated function getParCycleEmployeeEmails(int parCycleId) returns string[]|error {
    stream<record {string email;}, error?> resultStream = dbClient->query(getParCycleEmployeeEmailsQuery(parCycleId));
    return from var result in resultStream
        select result.email;
}

# Get Par360Reviews given for a given employee in a given ParCycle.
#
# + parCycleId - The ParCycle ID
# + employeeEmail - The email of the employee
# + return - A list of Par360Review objects or an error if the operation failed
public isolated function getPar360Reviews(int parCycleId, string employeeEmail) returns Par360Review[]|error {
    stream<Par360Review, error?> resultStream = dbClient->query(getPar360ReviewsQuery(parCycleId, employeeEmail));
    return from Par360Review par360Review in resultStream
        select par360Review;
}

# Get Par360Reviews given by a given reviewer in a given ParCycle for a given employee.
#
# + parCycleId - The ParCycle ID
# + employeeEmail - The email of the employee
# + reviewerEmail - The email of the reviewer
# + return - The Par360Review object or an error if the operation failed
public isolated function getPar360Review(int parCycleId, string employeeEmail, string reviewerEmail)
        returns Par360Review|error {
    Par360Review|sql:Error queryRow = dbClient->queryRow(getPar360ReviewQuery(parCycleId, employeeEmail, reviewerEmail));
    if queryRow is sql:NoRowsError {
        return error(string `Par360Review not found for the given parCycleId: ${parCycleId.toString()}, ` +
                string `employeeEmail:${employeeEmail}, reviewerEmail:${reviewerEmail}`,
            code = types:ERR_PAR_360_REVIEW_NOT_FOUND);
    }
    if queryRow is sql:Error {
        return error(string `An error occurred while retrieving Par360Review ${queryRow.toString()}`);
    }
    return queryRow;
}

# Create or update a Par360Review entry.
#
# + par360Review - The Par360Review object
# + return - An error if the operation failed or nil if successful
public isolated function createOrUpdate360Request(Par360Review par360Review) returns error? {
    _ = check dbClient->execute(createOrUpdate360RequestQuery(par360Review));
}

# Update a given Par360Review.
#
# + par360Review - The Par360Review object
# + return - An error if the operation failed or nil if successful
public isolated function update360Review(Par360Review par360Review) returns error? {
    _ = check dbClient->execute(update360ReviewQuery(par360Review));
}

# Get Par360Review requests for a given reviewer in a given ParCycle.
#
# + parCycleId - The ParCycle ID
# + reviewerEmail - The email of the reviewer
# + return - A list of Par360Review objects or an error if the operation failed
public isolated function getPar360ReviewRequests(int parCycleId, string reviewerEmail) returns Par360Review[]|error {
    stream<Par360Review, error?> resultStream = dbClient->query(getPar360ReviewRequestsQuery(parCycleId, reviewerEmail));
    return from Par360Review par360Review in resultStream
        select par360Review;
}

# Get ParSpecialRatingQuota for a given ParCycle and special rating group.
#
# + parCycleId - The ParCycle ID
# + parSpecialRatingGroupId - The ParSpecialRatingGroup ID
# + return - The ParSpecialRatingQuota object or an error if the operation failed
public isolated function getParSpecialRatingQuota(int parCycleId, int parSpecialRatingGroupId)
        returns ParSpecialRatingQuota|error {
    ParSpecialRatingQuota|sql:Error queryRow =
        dbClient->queryRow(getParSpecialRatingQuotaQuery(parCycleId, parSpecialRatingGroupId));
    if queryRow is sql:NoRowsError {
        return error(string `ParSpecialRatingQuota not found for the given parCycleId: ${parCycleId}, ` +
                string `parSpecialRatingGroupId:${parSpecialRatingGroupId}`,
            code = types:ERR_PAR_SPECIAL_RATING_QUOTA_NOT_FOUND);
    }
    if queryRow is sql:Error {
        return error(string `An error occurred while retrieving ParSpecialRatingQuota ${queryRow.toString()}`);
    }
    return queryRow;
}

# Get ParCurrentSpecialRatings for a given ParCycle, team and special rating group.
#
# + parCycleId - The ParCycle ID
# + parTeamId - The ParTeam ID
# + parSpecialRatingGroupId - The ParSpecialRatingGroup ID
# + return - The ParCurrentSpecialRatings object or an error if the operation failed
public isolated function getParCurrentSpecialRatings(int parCycleId, int parTeamId, int parSpecialRatingGroupId)
        returns ParCurrentSpecialRatings|error {
    ParCurrentSpecialRatings|sql:Error queryRow =
        dbClient->queryRow(getParCurrentSpecialRatingsQuery(parCycleId, parTeamId, parSpecialRatingGroupId));
    if queryRow is sql:NoRowsError {
        return error(string `ParCurrentSpecialRatings not found for the given parCycleId: ${parCycleId}, ` +
                string `parTeamId:${parTeamId}, parSpecialRatingGroupId:${parSpecialRatingGroupId}`,
            code = types:ERR_PAR_CURRENT_SPECIAL_RATING_NOT_FOUND);
    }
    if queryRow is sql:Error {
        return error(string `An error occurred while retrieving ParCurrentSpecialRatings ${queryRow.toString()}`);
    }
    return queryRow;
}

# Get ParConfiguration for a given configKey.
#
# + configKey - The configuration key
# + return - The ParConfiguration object or an error if the operation failed
public isolated function getParConfiguration(string configKey) returns ParConfiguration|error {
    ParConfiguration|sql:Error queryRow = dbClient->queryRow(getParConfigurationQuery(configKey));
    if queryRow is sql:NoRowsError {
        return error(string `ParConfiguration not found for the given configName: ${configKey}`,
            code = types:ERR_PAR_CONFIGURATION_NOT_FOUND);
    }
    if queryRow is sql:Error {
        return error(string `An error occurred while retrieving ParConfiguration ${queryRow.toString()}`);
    }
    return queryRow;
}

# Create or update a ParConfiguration entry.
#
# + parConfiguration - The ParConfiguration object
# + return - An error if the operation failed or nil if successful
public isolated function createOrUpdateParConfiguration(ParConfiguration parConfiguration) returns error? {
    _ = check dbClient->execute(createOrUpdateParConfigurationQuery(parConfiguration));
}

# Insert EmailNotifications in bulk.
#
# + emailNotifications - EmailNotification array
# + return - An error if the operation failed or nil if successful
public isolated function insertEmailNotificationsBulk(EmailNotification[] emailNotifications) returns error? =>
    emailNotifications.length() > 0 ? check batchExecute(insertEmailNotificationQuery(emailNotifications)) : ();

# Get EmailNotifications for a given email status and count.
#
# + emailStatus - Email status
# + count - The count of the email notifications
# + return - A list of EmailNotification objects or an error if the operation failed
public isolated function getEmailNotifications(types:EmailStatus emailStatus, int count)
        returns EmailNotification[]|error {
    stream<EmailNotification, error?> resultStream = dbClient->query(getEmailNotificationsQuery(emailStatus, count));
    return from EmailNotification emailNotification in resultStream
        select emailNotification;
}

# Update the status of EmailNotifications.
#
# + notificationIds - The notification IDs
# + emailStatus - Email status
# + return - An error if the operation failed or nil if successful
public isolated function updateEmailNotifications(int[] notificationIds, types:EmailStatus emailStatus) returns error? {
    if notificationIds.length() > 0 {
        _ = check dbClient->execute(updateEmailNotificationsStateQuery(notificationIds, emailStatus));
    }
}

# Get ParTeamSummary for a given ParCycle and lead email.
#
# + parCycleId - The ParCycle ID
# + employeeEmails - The list of employee work emails
# + return - A list of ParTeamSummary objects or an error if the operation failed
public isolated function getDirectAndIndirectEmployees(int parCycleId, string[] employeeEmails)

    returns AdditionalReportsParRating[]|error {
    stream<AdditionalReportsParRating, error?> resultStream = dbClient->query(
            getDirectAndIndirectEmployeesOfLeadQuery(parCycleId, employeeEmails));
            
    return from AdditionalReportsParRating parEmployees in resultStream
        select parEmployees;
}

# Check if the invoker is a additional lead of a given employee.
#
# + employeeEmail - The email of the employee
# + leadEmail - The email of the lead
# + return - A list of ParTeamSummary objects or an error if the operation failed
public isolated function checkIsAdditionalLeadOfEmployee(string employeeEmail, string leadEmail) returns boolean|error {
    string|error result = dbClient->queryRow(
        getIndirectLeadOfEmployeeQuery(employeeEmail, leadEmail)
    );

    return result == "TRUE" ? true : false;
}

# Check if the invoker is a additional lead.
#
# + leadEmail - The email of the lead
# + return - A list of ParTeamSummary objects or an error if the operation failed
public isolated function checkIsAdditionalLead(string leadEmail) returns boolean|error {
    int|error result = dbClient->queryRow(
        getIndirectLeadQuery(leadEmail)
    );

    return result == 1 ? true : false;
}

# Get all direct Par Ratings for a given ParCycle and lead email.
#
# + parCycleId - The ParCycle ID
# + leadEmail - The email of the lead
# + return - A list of ParTeamSummary objects or an error if the operation failed
public isolated function getDirectParRatingsOfEmployees(int parCycleId, string leadEmail) returns
    ParRatingWithLevels[]|error {
    stream<ParRatingWithLevels, error?> resultStream =
        dbClient->query(getDirectParRatingsOfEmployeesQuery(parCycleId, leadEmail));
    return from ParRatingWithLevels parSummary in resultStream
        select parSummary;
}

# Get all the participants for a given par cycle ID.
#
# + parCycleId - The ParCycle ID
# + leadEmail - The email of the lead
# + return - A list of ParTeamSummary objects or an error if the operation failed
public isolated function getParticipantsOfTheParCycle(int parCycleId, string? leadEmail) returns Participant[]|error {
    stream<Participant, error?> resultStream = dbClient->query(getParticipantsOfTheParCycleQuery(parCycleId, leadEmail));
    return from Participant participants in resultStream
        select participants;
}

# Get all the rejected reviews for a given par cycle ID.
#
# + parCycleId - The ParCycle ID
# + return - A list of RejectedReviewRequest objects or an error if the operation failed
public isolated function getRejectedReviews(int parCycleId) returns RejectedReview[]|error {
    stream<RejectedReview, error?> resultStream = dbClient->query(getRejectedReviewsQuery(parCycleId));
    return from RejectedReview participants in resultStream
        select participants;
}

# Get the team details of a given employee for a given par cycle ID.
#
# + employeeEmail - The email of the employee
# + parCycleId - The ParCycle ID
# + return - ParTeam object or an error if the operation failed
public isolated function getTeamDetailsOfEmployee(string employeeEmail, int parCycleId) returns BasicParTeam|error {
    BasicParTeam|sql:Error parTeam = dbClient->queryRow(getParTeamOfEmployeeQuery(employeeEmail, parCycleId));
    if parTeam is sql:NoRowsError {
        return error("No team found for the given employee");
    }
    if parTeam is sql:Error {
        return error("An sql error occurred while retrieving team of the employee ");
    }
    return parTeam;
}

# Get the team details of a given lead for a given par cycle ID.
#
# + leadEmail - The email of the employee
# + parCycleId - The ParCycle ID
# + parDepartment - The department which employee belongs to
# + parBusinessUnit - The business uni which employee belongs to
# + parTeam - The team which employee belongs to
# + return - ParTeam object or an error if the operation failed
public isolated function getTeamDetailsOfLead(string leadEmail, int parCycleId, string parDepartment,
        string parBusinessUnit, string parTeam) returns BasicParTeam|error {

    BasicParTeam|sql:Error parTeamDetails = dbClient->queryRow(getParTeamDetailsOfLeadQuery(leadEmail, parCycleId,
            parDepartment, parBusinessUnit, parTeam));

    if parTeamDetails is sql:NoRowsError {
        return error("No team found for the given lead");
    }
    if parTeamDetails is sql:Error {
        return error("An sql error occurred while retrieving team of the lead with given data ");
    }
    return parTeamDetails;
}

# Update a par team id of a employee
#
# + employeeEmail - The email of the employee
# + newTeamId - New id of the par team
# + parCycleId - Id of the par cycle
# + return - An error if the operation failed or affected row count if successful
public isolated function updateParTeamIdOfEmployee(int newTeamId, string employeeEmail, int parCycleId)
    returns int|error {

    sql:ExecutionResult|error executionResults =
        dbClient->execute(updateParTeamIdOfEmployeeQuery(newTeamId, employeeEmail, parCycleId));
    if executionResults is error {
        return executionResults;
    }
    return executionResults.affectedRowCount ?: 0;
}

# Get PAR summaries of a given employee.
#
# + employeeEmail - The email of the employee
# + return - PAR summaries or an error if the operation failed
public isolated function getEmployeeParSummaries(string employeeEmail) returns EmployeeParSummary[]|error {
    stream<EmployeeParSummary, error?> resultStream = dbClient->query(getParSummariesOfEmployeeQuery(employeeEmail));
    return from EmployeeParSummary summary in resultStream
        select summary;
}

# SQL query to get special rating allocation for the active cycle.
#
# + leadEmail - The email of the lead
# + parCycleId - The id of the par cycle
# + return - The execution result
public isolated function getSpecialRatingAllocations(int parCycleId, string? leadEmail) returns
    SpecialRatingAllocation[]|error {
    stream<SpecialRatingAllocation, error?> resultStream =
        dbClient->query(getSpecialRatingAllocationsQuery(parCycleId, leadEmail));
    return from SpecialRatingAllocation allocation in resultStream
        select allocation;
}

# Function to get headcount of a team.
#
# + teamId - The id of the team
# + return - The headcount or an error
public isolated function getHeadCountOfTeam(int teamId) returns int|error {
    int|error headCountOfTeam = dbClient->queryRow(getHeadCountOfTeamQuery(teamId));
    if headCountOfTeam is error {
        return headCountOfTeam;
    }
    return headCountOfTeam;
}

# Function to delete a PAR team.
#
# + teamId - New id of the par team
# + return - An error if the operation failed or affected row count if successful
public isolated function deleteParTeam(int teamId) returns error? {
    _ = check dbClient->execute(deleteParTeamQuery(teamId));
}
