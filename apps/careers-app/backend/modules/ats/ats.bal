// Copyright (c) 2025, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.
import careers_app.people;

import ballerina/http;

# Get vacancy basic information.
#
# + vacancyId - Vacancy ID
# + depId - Department ID
# + visibility - Visibility status
# + officeId - Office ID
# + designationId - Designation ID
# + employmentType - Employment type
# + return - Array of VacancyBasicInfo objects or error
public isolated function getVacanciesBasicInfo(int? vacancyId = (), int? depId = (), string[]? visibility = (),
        int? officeId = (), int? designationId = (), string[]? employmentType = ())
    returns AtsVacancy[]|error {

    map<string|string[]> authHeaders = check getSecurityHeaders();

    map<string|string[]> queryParams = {};

    queryParams["status"] = "PUBLISHED";

    if vacancyId is int {
        queryParams["vacancyId"] = vacancyId.toString();
    }
    if depId is int {
        queryParams["depId"] = depId.toString();
    }
    if visibility is string[] && visibility.length() > 0 {
        queryParams["visibility"] = visibility;
    }
    if officeId is int {
        queryParams["officeId"] = officeId.toString();
    }
    if designationId is int {
        queryParams["designationId"] = designationId.toString();
    }
    if employmentType is string[] && employmentType.length() > 0 {
        queryParams["employmentType"] = employmentType;
    }

    VacancyResponse vacancyResponse = check atsClient->/vacancies.get(headers = authHeaders, params = {...queryParams});
    AtsVacancy[] vacancies = vacancyResponse.vacancies;

    return vacancies;
};

# Get vacancy.
#
# + id - Vacancy ID
# + return - Vacancy object or error
public isolated function getVacancy(int id) returns AtsVacancy|error {
    map<string|string[]> authHeaders = check getSecurityHeaders();
    AtsVacancy atsVacancy = check atsClient->/vacancies/[id].get(headers = authHeaders);
    return atsVacancy;
};

# Get org details.
#
# + return - OrgStructure object or error
public isolated function getOrgDetails() returns OrgStructure|error {
    string[] locations = from people:Company c in check people:getCompanies()
        select c.location;
    string[] teamNames = from people:BusinessUnit bu in check people:getOrgDetails()
        let var departments = bu.departments
        where departments !is ()
        from people:Department dept in departments
        select dept.department;

    map<string> locationMap = map from [int, string] [index, location] in locations.enumerate()
        select [index.toString(), location];

    map<string> teamMap = {};
    foreach int i in 0 ..< teamNames.length() {
        teamMap[i.toString()] = teamNames[i];
    }

    return {
        location_list: locationMap,
        team_list: teamMap
    };
}

# Create candidate.
#
# + candidate - Candidate details
# + vacancyId - Vacancy ID
# + return - Success message string or error if the operation fails
public isolated function insertCandidate(Candidate candidate, int vacancyId) returns string|error {
    map<string|string[]> authHeaders = check getSecurityHeaders();
    http:Response response = check atsClient->/candidates.post(
        {...candidate, vacancyId, status: CREATED, appliedFrom: CAREER_SITE},
        headers = authHeaders
    );

    if response.statusCode == 201 {
        return "Application submitted successfully.";
    }
    if response.statusCode == 409 {
        return "You’ve already applied for this vacancy.";
    }

    json jsonBody = check response.getJsonPayload();
    AtsErrorResponse errorResponse = check jsonBody.fromJsonWithType();
    return error(errorResponse.message);

}
