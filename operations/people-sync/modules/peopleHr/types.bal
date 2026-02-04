// Copyright (c) 2026, WSO2 LLC. (http://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 Inc. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

# People HR configuration.
public type PeopleHrConfig record {|
    # People HR Endpoint
    string endpoint;
    # Api Key
    string apiKey;
|};

# Response from People HR.
public type PeopleHrResponse record {|
    # Is error or not
    boolean isError;
    # Status of the response
    int Status;
    # Message of the response
    string Message;
    # Result array
    Employee[] Result;
    json...;
|};

# Employee information.
public type Employee record {|
    # Employee ID on People HR
    string Employee\ Id;

    # Title
    string? Title;
    # First name
    string First\ Name;
    # Last name
    string Last\ Name;
    # Gender
    string Gender;

    # Work email
    string? Work\ Email;
    # Work phone number
    string? Work\ Phone\ Number;

    # Employee's company WSO2 LK, US..etc
    string? Company;
    # Employee location (country)
    string? Location;

    # Business unit
    string? BU\ \(Business\ Unit\);
    # Department
    string Department;
    # Team
    string? Team\ \(Team\ and\ Sub\ Team\)?;
    # Sub Team
    string? Sub\ Team\ \(Team\ and\ Sub\ Team\)?;

    # Current job band
    string? System1\ ID?;
    # Current job role
    string Job\ Role;
    # Employment type (i.e: PERMANENT, INTERNSHIP, PROBATION etc.)
    string? Employment\ Type;
    # Employee Status (i.e: Left, Active, Marked leaver)
    string Employee\ Status;

    # EPF
    string? EPF\ Number\ \(EPF\);

    # Manager email
    string? Manager\ Email;
    # Additional managers (comma separated array of names)
    string? Additional\ Manager;

    # Work start date
    string Start\ Date;
    # Initial joined date
    string? Initial\ date\ of\ joining\ \(Actual\ Start\ Date\)?;
    # Continuous Service date
    string? Continuous\ Service\ Date;

    # Resignation date
    string? Resignation\ Date;
    # Final day in office
    string? Final\ Day\ in\ Office;
    # Final day of employment
    string? Final\ Day\ of\ Employment;
    # Relocation status
    string? Relocation\ \(Relocation\);
    # Resignation reason
    string? Reason\ for\ Resignation\ \(Resignation\ Reasons\)?;

    # Personal phone number
    string? Personal\ Phone\ Number;
    # Personal email
    string? Personal\ Email;

    // TODO: check and enable if required
    // # Reports to lead name
    // string? Reports\ To;
    // # Length of service
    // string? Length\ Of\ Service;
    // # Employee's lead email (Mainly use as approver email)
    // string? Email\ \(Lead\ Email\ ID\)?;

    json...;
|};
