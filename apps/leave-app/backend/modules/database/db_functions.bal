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
import ballerina/uuid;
import ballerinax/mysql;

// Initializing Db client for leave database
final mysql:Client leaveDbClient = check initializeLeaveClient();

# Get leaves from database with the given filter.
#
# + filter - Leave filter 
# + 'limit - Maximum records limit  
# + offset - Offset value
# + return - List of Leaves or an error on failure
public isolated function getLeaves(LeaveFilter filter, int? 'limit = (), int? offset = ()) returns Leave[]|error {
    sql:ParameterizedQuery sqlQuery = getLeavesQuery(filter, getValidatedLimit('limit), getValidatedOffset(offset));
    stream<Leave, sql:Error?> resultStream = leaveDbClient->query(sqlQuery);
    return from Leave leave in resultStream
        select leave;
}

# Get a leave from database with the given id.
#
# + id - Leave ID
# + return - Requested leave or an error on failure
public isolated function getLeave(int id) returns Leave|error? {
    sql:ParameterizedQuery mainQuery = getCommonLeaveQuery();
    sql:ParameterizedQuery finalQuery = sql:queryConcat(mainQuery, ` WHERE ls.id = ${id}`);
    Leave|error leave = leaveDbClient->queryRow(finalQuery);
    if leave is sql:NoRowsError {
        return ();
    }
    if leave is error {
        return error("Error occurred while fetching leave!", leave);
    }

    return leave;
}

# Create a new leave in the database.
#
# + input - Input data for the leave
# + numDaysForLeave - Number of days for leave
# + location - Employee location
# + return - The inserted Leave record if successful; otherwise, an error
public isolated function insertLeave(LeaveInput input, float numDaysForLeave, string location) returns Leave|error {
    sql:ExecutionResult|error result = leaveDbClient->execute(insertLeaveQuery(input, numDaysForLeave, location));
    if result is error {
        return error("Error occurred while inserting leave!", result);
    }
    int lastInsertId = check result.lastInsertId.ensureType();
    Leave|error? insertedLeave = getLeave(lastInsertId);
    if insertedLeave is () {
        return error("Inserted leave not found after insertion");
    }
    if insertedLeave is error {
        return error("Error occurred while fetching inserted leave!", insertedLeave);
    }
    return insertedLeave;
}

# Cancel an existing active leave.
#
# + id - Leave ID  
# + return - Returns nil on success, error on failure
public isolated function cancelLeave(int id) returns error? {
    sql:ParameterizedQuery sqlQuery = `UPDATE leave_submissions SET active = 0 WHERE id = ${id}`;
    sql:ExecutionResult|sql:Error result = leaveDbClient->execute(sqlQuery);
    if result is error {
        return error("Error occurred while cancelling leave!", result);
    }
}

# Get sabbatical leave approval status records for leads.
#
# + leadEmail - Email of the lead
# + approvalStatus - List of approval statuses to filter (APPROVED, REJECTED, PENDING)
# + return - List of LeaveApprovalStatus records or an error on failure
public isolated function getLeaveApprovalStatusList(string leadEmail, string[] approvalStatus)
    returns LeaveApprovalStatus[]|error {
    sql:ParameterizedQuery sqlQuery = getLeaveApprovalStatusListQuery(leadEmail, approvalStatus);
    stream<LeaveApprovalStatus, sql:Error?> resultStream = leaveDbClient->query(sqlQuery);
    return check from LeaveApprovalStatus leaveApproval in resultStream
        select {
            id: leaveApproval.id,
            email: leaveApproval.email,
            startDate: leaveApproval.startDate.substring(0, 10),
            endDate: leaveApproval.endDate.substring(0, 10),
            submitNote: leaveApproval.submitNote,
            approvalStatus: leaveApproval.approvalStatus
        };
}

# Get sabbatical leave approver Email by Leave Approval ID.
#
# + approvalId - Leave approval ID
# + return - Email of the leave approver or an error on failure
public isolated function getLeaveApproverEmailById(string approvalId) returns string|error {
    sql:ParameterizedQuery sqlQuery = getLeaveApproverEmailByIdQuery(approvalId);
    string|error leaveApproverEmail = check leaveDbClient->queryRow(sqlQuery);
    if leaveApproverEmail is sql:NoRowsError {
        return error("No leave approver found for the given approval ID");
    }
    return leaveApproverEmail;
}

# Get sabbatical leave submission info by the leave approval id.
#
# + approvalId - Leave approval ID
# + return - Leave submission info or an error on failure
public isolated function getLeaveSubmissionInfoByApprovalId(string approvalId)
    returns LeaveSubmissionInfo|error {
    sql:ParameterizedQuery sqlQuery = getLeaveSubmissionInfoByApprovalIdQuery(approvalId);
    LeaveSubmissionInfo|error leaveSubmissionInfo = check leaveDbClient->queryRow(sqlQuery);
    if leaveSubmissionInfo is sql:NoRowsError {
        return error("No leave submission found for the given approval ID");
    }
    return leaveSubmissionInfo;
}

# Update leave approval status for a sabbatical leave application.
#
# + applicationId - ID of the sabbatical leave application
# + isApproved - Approval status to be set (APPROVED, REJECTED)
# + return - Nil on success, error on failure
public isolated function setLeaveApprovalStatus(string applicationId, boolean isApproved)
    returns sql:ExecutionResult|error {
    sql:ParameterizedQuery sqlQuery = setLeaveApprovalStatusQuery(isApproved ? APPROVED : REJECTED, applicationId);
    return check leaveDbClient->execute(sqlQuery);
}

# Get the end date of the last sabbatical leave for an employee.
#
# + employeeEmail - Email of the employee
# + return - End date of the last sabbatical leave or an error on failure
public isolated function getLastSabbaticalLeaveEndDate(string employeeEmail)
    returns string|error {
    sql:ParameterizedQuery sqlQuery = getLastSabbaticalLeaveEndDateQuery(employeeEmail);
    string|error lastSabbaticalEndDate = leaveDbClient->queryRow(sqlQuery);
    if lastSabbaticalEndDate is error {
        return "";

    }
    // format timestamp to date string YYYY-MM-DD
    string formattedDate = (<string>lastSabbaticalEndDate).toString().substring(0, 10);
    return formattedDate;
}

# Create Sabbatical Leave database record.
#
# + leaveInput - Leave submission details
# + days - Number of days for the leave
# + location - Employee location
# + leadEmail - Reporting lead email
# + return - The leave approval status ID if successful; otherwise, an error
public isolated function createSabbaticalLeaveRecord(LeaveInput leaveInput, float days, string location,
        string leadEmail) returns string|error {

    string leaveApprovalStatusID = uuid:createType4AsString();
    transaction {
        Leave leaveSubmission = check insertLeave(leaveInput, days, location);
        sql:ExecutionResult result = check leaveDbClient->execute(insertLeaveApprovalQuery(leaveApprovalStatusID,
                leaveSubmission.id, leadEmail));
        check commit;
    }
    return leaveApprovalStatusID;
}

# Get subordinate count who are on sabbatical leave under a specific lead.
#
# + leadEmail - Email of the lead
# + return - subordinate count or an error on failure
public isolated function getSubordinateCountOnSabbaticalLeave(string leadEmail) returns int|error {
    return check leaveDbClient->queryRow(getSubordinateCountOnSabbaticalLeaveQuery(leadEmail));
}

# Get most recent email notification recipient list (general leave) for a leave applicant.
#
# + applicantEmail - Email of the leave applicant
# + return - List of email recipients as a string, or an error on failure
public isolated function getEmailNotificationRecipientList(string applicantEmail) returns string|error {
    return check leaveDbClient->queryRow(getEmailNotificationRecipientListQuery(applicantEmail));
};

# Set calendar event ID for an approved sabbatical leave application.
#
# + leaveApprovalId - Leave approval status ID  
# + calendarEventId - Calendar event ID
# + return - SQL execution result or an error on failure
public isolated function setCalendarEventIdForSabbaticalLeave(string leaveApprovalId, string calendarEventId)
    returns sql:ExecutionResult|error {
    return check leaveDbClient->execute(setSabbaticalLeaveCalendarEventIdQuery(leaveApprovalId, calendarEventId));
}
