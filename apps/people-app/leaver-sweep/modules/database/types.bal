import ballerina/sql;

# Row mapping for an employee whose Marked-leaver period has ended and who should transition to Left.
public type LeaverTransition record {|
    # External employee ID
    @sql:Column {name: "employee_id"}
    string employeeId;
    # First name
    @sql:Column {name: "first_name"}
    string firstName;
    # Last name
    @sql:Column {name: "last_name"}
    string lastName;
    # Work email
    @sql:Column {name: "work_email"}
    string workEmail;
    # Final day of employment
    @sql:Column {name: "final_day_of_employment"}
    string finalDayOfEmployment;
|};
