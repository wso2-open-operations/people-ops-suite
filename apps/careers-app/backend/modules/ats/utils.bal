// Copyright (c) 2024, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.
import careers_app.people;

# Get team name by org details.
#
# + businessUnitId - Business unit ID
# + departmentId - Department ID 
# + teamId - Team Id
# + return - Team name or error
public isolated function getTeamNameByOrgDetails(int businessUnitId, int departmentId, int teamId)
    returns string|error {

    people:BusinessUnit[] orgDetails = check people:getOrgDetails();
    string[] teamNames = from people:BusinessUnit bu in orgDetails
        let people:Department[]? departments = bu.departments
        where departments !is ()
        from people:Department dept in departments
        let people:Team[]? teams = dept.teams
        where teams !is ()
        from people:Team team1 in teams
        where team1.id == teamId && dept.id == departmentId && bu.id == businessUnitId
        select dept.department;

    if teamNames.length() === 0 {
        return error(string `No team found for ${teamId}, ${departmentId}, ${businessUnitId}`);
    }
    if teamNames.length() > 1 {
        return error(string `Multiple teams found for ${teamId}, ${departmentId}, ${businessUnitId}`);
    }

    return teamNames[0];
}

# Get location details by office ID.
#
# + officeId - Office ID
# + return - Location details or error
public isolated function getLocationByOfficeId(int officeId) returns Location|error {
    Location[] locations = from people:Company company in check people:getCompanies()
        let people:Office[] offices = company.offices
        from people:Office office in offices
        where office.id == officeId
        select {country: company.location, office: office.office};

    if locations.length() === 0 {
        return error(string `No location details found for ${officeId}`);
    }
    if locations.length() > 1 {
        return error(string `Multiple location details found for ${officeId}`);
    }

    return locations[0];
}

# Get office ID list by country name.
#
# + country - Country name
# + return - Office ID array or error
public isolated function getOfficeIdByCountryName(string country) returns int[]|error {
    people:Company[] companies = check people:getCompanies();
    int[] officeIdArray = from people:Company c in companies
        let people:Office[] offices = c.offices
        from people:Office office in offices
        where c.location === country
        select office.id;

    if officeIdArray.length() === 0 {
        return error(string `No office ID found for ${country}`);
    }

    return officeIdArray;
}
