// Copyright (c) 2023, WSO2 Inc. (http://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 Inc. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.
import ballerinax/mysql;

# Record type Employee which maps with the employee data comes from PeopleHR
#
# + Employee\ Id - Employee Id on People HR  
# + Title - Employee title  
# + EPF\ Number\ \(EPF\) - Employee EPF  
# + First\ Name - Employee First name  
# + Last\ Name - Employee Last name  
# + Work\ Email - Employee work email  
# + Gender - Employee Gender  
# + Start\ Date - Employee work start date  
# + Job\ Role - Employee current job role  
# + Company - Employee's company WSO2 LK, US..etc  
# + Location - Employee country  
# + Department - Employee's current department  
# + Reports\ To - Reports to lead name  
# + Manager\ Email - Reports to lead email
# + Email\ \(Lead\ Email\ ID\) - Employee's lead email (Mainly use as approver email) 
# + Team\ \(Team\ and\ Sub\ Team\) - Employee's Current team  
# + Sub\ Team\ \(Team\ and\ Sub\ Team\) - Employee's Current sub team  
# + Employment\ Type - Probation, Permanent etc.  
# + Resignation\ Date - Employee's resignations date  
# + Final\ Day\ in\ Office - Employee's final date  
# + Final\ Day\ of\ Employment - Employee's final day of employment  
# + Employee\ Status - Left, Active, Marked leaver  
# + Support\ Lead\ \(Lead\ Role\ Status\) - Support Lead status  
# + QSP\ Lead\ \(Lead\ Role\ Status\) - QSP Lead status  
# + Reason\ for\ Resignation\ \(Resignation\ Reasons\) - Resignation reason  
# + Personal\ Phone\ Number - Personal phone number  
# + Work\ Phone\ Number - Work phone number  
# + Continuous\ Service\ Date - Service date  
# + Initial\ date\ of\ joining\ \(Actual\ Start\ Date\) - Joined date  
# + Additional\ Manager - Additional manager  
# + Length\ Of\ Service - Length of service  
# + BU\ \(Business\ Unit\) - Business unit  
# + Personal\ Email - Personal email  
# + System1\ ID - Current Job band  
# + Relocation\ \(Relocation\) - Relocation status
public type Employee record {
    string Employee\ Id;
    string? Title;
    string? EPF\ Number\ \(EPF\);
    string First\ Name;
    string Last\ Name;
    string? Work\ Email;
    string Gender;
    string Start\ Date;
    string Job\ Role;
    string? Company;
    string? Location;
    string Department;
    string? Reports\ To;
    string? Manager\ Email;
    string? Email\ \(Lead\ Email\ ID\)?;
    string? Team\ \(Team\ and\ Sub\ Team\)?;
    string? Sub\ Team\ \(Team\ and\ Sub\ Team\)?;
    string? Employment\ Type;
    string? Resignation\ Date;
    string? Final\ Day\ in\ Office;
    string? Final\ Day\ of\ Employment;
    string Employee\ Status;
    string? Support\ Lead\ \(Lead\ Role\ Status\)?;
    string? QSP\ Lead\ \(Lead\ Role\ Status\)?;
    string? Reason\ for\ Resignation\ \(Resignation\ Reasons\)?;
    string? Personal\ Phone\ Number;
    string? Work\ Phone\ Number;
    string? Continuous\ Service\ Date;
    string? Initial\ date\ of\ joining\ \(Actual\ Start\ Date\)?;
    string? Additional\ Manager;
    string? Length\ Of\ Service;
    string? BU\ \(Business\ Unit\);
    string? Personal\ Email;
    string? System1\ ID?;
    string? Relocation\ \(Relocation\);
};

# Type corresponding to people hr api config on toml
#
# + endpoint - the value for the people hr api endpoint string  
# + apiKey - the value for the apiKey string  
public type PeopleHrConfig record {
    string endpoint;
    string apiKey;
};

# PEOPLE_HR_QUERY_NAME - Value of the query configured on PeopleHr
#
public enum PeopleHrQuery {
    PEOPLE_HR_QUERY_NAME = "Internal Apps Data Sync"
}

# Database connection pool.
public type ConnectionPool record {|
    # Maximum number of open connections
    int maxOpenConnections;
    # Maximum lifetime of a connection
    decimal maxConnectionLifeTime;
    # Minimum number of open connections
    int minIdleConnections;
|};

# [Configurable] database configs.
public type DatabaseConfig record {|
    # Database User 
    string user;
    # Database Password
    string password;
    # Database Name
    string database;
    # Database Host
    string host;
    # Database port
    int port;
    # Database connection pool
    ConnectionPool connectionPool;
|};

# Database config record with sql options.
public type DatabaseConfigMySql record {|
    *DatabaseConfig;
    # Additional configurations related to the MySQL database connection
    mysql:Options? options;
|};

# Foreign key-value record.
public type ForeignTableData record {|
    # ID of the record 
    int id;
    # Corresponding value
    string value;
|};
