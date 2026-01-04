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

# Generates a common SQL query to fetch leave records from the database.
#
# + return - Select query
isolated function getCommonLeaveQuery() returns sql:ParameterizedQuery => `
    SELECT 
        ls.id, 
        ls.email, 
        ls.leave_type,
        ls.leave_period_type,
        ls.copy_email_list,
        ls.notify_everyone,
        ls.submit_note,
        ls.cancel_note,
        ls.created_date,
        ls.updated_date,
        ls.email_id,
        ls.email_subject,
        ls.active,
        ls.start_date,
        ls.end_date,
        ls.start_half,
        ls.end_half,
        ls.canceled_date,
        ls.num_days,
        ls.public_submit_note,
        ls.calendar_event_id,
        ls.location
    FROM leave_app.leave_submissions ls LEFT JOIN leave_app.leave_approval la ON ls.id = la.leave_submission_id
`;

# Query to fetch leaves from the database.
#
# + filter - Query filter  
# + 'limit - Maximum records limit  
# + offset - Offset value
# + return - Select query fetch leaves
isolated function getLeavesQuery(LeaveFilter filter, int? 'limit = (), int? offset = ())
    returns sql:ParameterizedQuery {

    sql:ParameterizedQuery mainQuery = getCommonLeaveQuery();

    sql:ParameterizedQuery[] filterQueries = [];
    // Include only approved sabbatical leaves
    filterQueries.push(` (ls.leave_type <> ${SABBATICAL_LEAVE} OR (ls.leave_type = ${SABBATICAL_LEAVE} AND 
    la.approval_status = ${APPROVED}) ) `);

    string[]? emails = filter?.emails;
    if emails is string[] && emails.length() > 0 {
        filterQueries.push(sql:queryConcat(`ls.email IN (`, sql:arrayFlattenQuery(emails), `)`));
    }
    string? startDate = filter?.startDate;
    string? endDate = filter?.endDate;
    if startDate is string && endDate is string {
        filterQueries.push(`((ls.start_date BETWEEN ${startDate} AND ${endDate}) 
            OR (ls.end_date BETWEEN ${startDate} AND ${endDate}) 
            OR (ls.start_date < ${startDate} AND ls.end_date > ${endDate}))`);
    } else if startDate is string {
        filterQueries.push(
            `(ls.start_date >= ${startDate} OR (ls.end_date >= ${startDate} AND ls.start_date < ${startDate}))`
        );
    } else if endDate is string {
        filterQueries.push(`(ls.end_date <= ${endDate} OR (ls.start_date <= ${endDate} AND ls.end_date > ${endDate}))`);
    }

    if filter?.isActive is boolean {
        boolean isActive = <boolean>filter?.isActive;
        filterQueries.push(`ls.active = ${isActive ? 1 : 0}`);
    }

    string[]? leaveTypes = filter?.leaveTypes;
    if leaveTypes is string[] && leaveTypes.length() != 0 {
        filterQueries.push(sql:queryConcat(`ls.leave_type IN (`, sql:arrayFlattenQuery(leaveTypes), `)`));
    }

    sql:ParameterizedQuery sqlQuery = buildSqlQuery(mainQuery, filterQueries);
    sql:ParameterizedQuery orderBy = filter?.orderBy == ASC ? `ASC` : `DESC`;
    return sql:queryConcat(sqlQuery, ` ORDER BY ls.created_date `, orderBy,
            ` LIMIT ${'limit ?: MAXIMUM_LIMIT_VALUE} OFFSET ${offset ?: 0}`);
}

# Query to insert leave to the database.
#
# + input - Leave input data  
# + numberOfDays - Number of days for the leave  
# + location - Employee location
# + return - Insert Query
isolated function insertLeaveQuery(LeaveInput input, float numberOfDays, string location)
    returns sql:ParameterizedQuery {

    boolean? isMorningLeave = input.isMorningLeave;
    sql:ParameterizedQuery insertQuery = `
        INSERT INTO leave_app.leave_submissions (
            email,
            leave_type,
            leave_period_type,
            copy_email_list,
            notify_everyone,
            submit_note,
            cancel_note,
            created_date,
            email_id,
            email_subject,
            active,
            start_date,
            end_date,
            start_half,
            num_days,
            public_submit_note,
            calendar_event_id,
            location
        ) VALUES (
            ${input.email},
            ${input.leaveType},
            ${input.periodType},
            ${string:'join(",", ...input.emailRecipients)},
            0,
            ${input?.comment ?: ""},
            '',
            NOW(),
            ${input.emailId ?: ""},
            ${input.emailSubject},
            1,
            TIMESTAMP(${input.startDate}, ${isMorningLeave is boolean ? (isMorningLeave ? "00:00:00" : "13:00:00") : "00:00:00"}),
            TIMESTAMP(${input.endDate}, ${isMorningLeave is boolean ? (isMorningLeave ? "13:00:00" : "23:59:00") : "23:59:00"}),
            ${isMorningLeave is boolean ? !isMorningLeave : ()},
            ${numberOfDays},
            ${input?.isPublicComment ?: false},
            ${input?.calendarEventId},
            ${location})
    `;

    return insertQuery;
}

# Query to get sabbatical leave approval status records (for leads).
#
# + leadEmail - Email of the lead
# + status - List of approval statuses to filter (APPROVED, REJECTED, PENDING)
# + return - Select query to get sabbatical leave approval status
isolated function getLeaveApprovalStatusListQuery(string leadEmail, string[] status)
    returns sql:ParameterizedQuery {
    sql:ParameterizedQuery query = sql:queryConcat(`
        SELECT 
            la.id as id,
            la.approval_status as approvalStatus,
            ls.email as email,
            ls.start_date as startDate,
            ls.end_date as endDate,
            ls.submit_note as submitNote
        FROM leave_approval la INNER JOIN leave_submissions ls ON la.leave_submission_id = ls.id
        WHERE la.approver_email = ${leadEmail} AND la.approval_status IN (`,
            sql:arrayFlattenQuery(status), `)`);

    return query;
}

# Query to get Leave Approver Email by Leave Approval ID.
#
# + approvalId - Leave approval ID
# + return - Query to get leave approver email
isolated function getLeaveApproverEmailByIdQuery(string approvalId) returns sql:ParameterizedQuery {
    sql:ParameterizedQuery query = `
        SELECT 
            approver_email
        FROM leave_approval
        WHERE id = ${approvalId}
    `;
    return query;
}

# Query to approve or reject a sabbatical leave application (for leads).
#
# + approvalStatus - Status of the leave to be set (APPROVED, REJECTED)
# + applicationId - ID of the sabbatical leave approval record from leave_approval table
# + return - Update query to approve or reject sabbatical leave application
isolated function setLeaveApprovalStatusQuery(ApprovalStatus approvalStatus, string applicationId)
    returns sql:ParameterizedQuery {
    sql:ParameterizedQuery query = `
        UPDATE leave_approval
        SET approval_status = ${approvalStatus}
        WHERE id = ${applicationId}
    `;

    return query;
}

# Query to get leave submission info by leave approval ID.
#
# + approvalId - ID of the leave approval record
# + return - Query to get leave submission info
isolated function getLeaveSubmissionInfoByApprovalIdQuery(string approvalId)
    returns sql:ParameterizedQuery {
    sql:ParameterizedQuery query = `
        SELECT 
            ls.email,
            ls.start_date as startDate,
            ls.end_date as endDate
        FROM leave_submissions ls INNER JOIN leave_approval la ON ls.id = la.leave_submission_id
        WHERE la.id = ${approvalId}
    `;

    return query;
}

# Query to get the end date of the last approved sabbatical leave for an employee.
#
# + employeeEmail - Email of the employee
# + return - Query to get the end date of the last sabbatical leave
isolated function getLastSabbaticalLeaveEndDateQuery(string employeeEmail) returns sql:ParameterizedQuery {
    sql:ParameterizedQuery query = `
        SELECT 
            end_date
        FROM leave_submissions ls INNER JOIN leave_approval la ON ls.id = la.leave_submission_id
        WHERE ls.email = ${employeeEmail} AND ls.leave_type = ${SABBATICAL_LEAVE} AND la.approval_status = ${APPROVED}
        ORDER BY end_date DESC
        LIMIT 1
    `;
    return query;
}

# Query to insert leave approval record for a sabbatical leave application.
#
# + id - Leave approval ID
# + leavesSubmissionId - Leave submission ID
# + approverEmail - Email of the approver
# + return - Insert query to add leave approval record
isolated function insertLeaveApprovalQuery(string id, int leavesSubmissionId, string approverEmail)
returns sql:ParameterizedQuery {
    sql:ParameterizedQuery query = `
            INSERT INTO leave_approval (
                id,
                leave_submission_id,
                approver_email,
                comment,
                approval_status,
                created_at
            ) VALUES (
                ${id},
                ${leavesSubmissionId},
                ${approverEmail},
                'NO COMMENT',
                ${PENDING},
                NOW()
            )
            `;
    return query;
}

# Query to get subordinates count on sabbatical leave.
#
# + leadEmail - Email of the lead
# + return - Select query to get count of subordinates on sabbatical leave
isolated function getSubordinateCountOnSabbaticalLeaveQuery(string leadEmail) returns sql:ParameterizedQuery {
    sql:ParameterizedQuery query = `
        SELECT COUNT(la.id)
        FROM leave_approval la INNER JOIN leave_submissions ls ON la.leave_submission_id = ls.id 
        WHERE
        la.approver_email = ${leadEmail} AND la.approval_status = ${APPROVED} AND
        ls.leave_type = ${SABBATICAL_LEAVE} AND ls.start_date <= UTC_TIMESTAMP() AND ls.end_date >= UTC_TIMESTAMP()
    `;
    return query;
}

# Query to get most recent email notification recipient list (general leave) for a leave applicant.
#
# + applicantEmail - Email of the leave applicant
# + return - Select query to get email notification list
isolated function getEmailNotificationRecipientListQuery(string applicantEmail) returns sql:ParameterizedQuery {
    sql:ParameterizedQuery query = `
        SELECT copy_email_list
        FROM leave_submissions
        WHERE email = ${applicantEmail} AND leave_type <> ${SABBATICAL_LEAVE}
        ORDER BY created_date DESC
        LIMIT 1
    `;
    return query;
};

# Query to set the calendar event ID for a sabbatical leave record.
#
# + approvalStatusId - Leave approval status ID
# + calendarEventId - Calendar event ID
# + return - Update query to set calendar event ID
isolated function setSabbaticalLeaveCalendarEventIdQuery(string approvalStatusId, string calendarEventId)
    returns sql:ParameterizedQuery {
    sql:ParameterizedQuery query = `
        UPDATE leave_submissions ls
        INNER JOIN leave_approval la ON ls.id = la.leave_submission_id
        SET ls.calendar_event_id = ${calendarEventId}
        WHERE la.id = ${approvalStatusId}
    `;
    return query;
}
