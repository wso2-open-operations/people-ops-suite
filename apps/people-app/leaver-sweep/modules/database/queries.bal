import ballerina/sql;

# Fetch employees whose Marked-leaver final day of employment has arrived (today or earlier).
#
# + return - Query to select employees pending auto-transition to Left
isolated function getExpiredLeaversQuery() returns sql:ParameterizedQuery =>
    `SELECT
        e.employee_id,
        e.first_name,
        e.last_name,
        e.work_email,
        r.final_day_of_employment
    FROM employee e
    JOIN resignation r ON r.employee_id = e.id
    WHERE e.employee_status = 'Marked leaver'
        AND r.final_day_of_employment IS NOT NULL
        AND r.final_day_of_employment <= CURDATE();`;

# Transition employees whose Marked-leaver final day of employment has arrived (today or earlier) to Left.
#
# + actor - System actor performing the update
# + return - Query to update matching employees' status to Left
isolated function transitionExpiredLeaversQuery(string actor) returns sql:ParameterizedQuery =>
    `UPDATE employee e
    JOIN resignation r ON r.employee_id = e.id
    SET e.employee_status = 'Left', e.updated_by = ${actor}
    WHERE e.employee_status = 'Marked leaver'
        AND r.final_day_of_employment IS NOT NULL
        AND r.final_day_of_employment <= CURDATE();`;
