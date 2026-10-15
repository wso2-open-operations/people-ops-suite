// Copyright (c) 2026 WSO2 LLC. (https://www.wso2.com).
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

import ballerina/lang.array;
import ballerina/lang.value;

isolated function jobTypeOf(string employmentType) returns string =>
    employmentType == EMPLOYMENT_PERMANENT ? EMPLOYMENT_FULL_TIME : employmentType;

isolated function departmentNameOf(AtsBusinessUnit[] units, int businessUnitId, int departmentId) returns string {
    foreach AtsBusinessUnit unit in units {
        if unit.id != businessUnitId {
            continue;
        }
        foreach AtsDepartment department in unit.departments ?: [] {
            if department.id == departmentId {
                return department.department;
            }
        }
    }
    return UNKNOWN_NAME;
}

isolated function officeNameOf(AtsCompany[] companies, int? officeId) returns string {
    foreach AtsCompany company in companies {
        foreach AtsOffice office in company.offices {
            if office.id === officeId {
                return office.office;
            }
        }
    }
    return UNKNOWN_NAME;
}

isolated function designationNameOf(AtsCareerFunction[] careerFunctions, int designationId) returns string|error {
    string[] names = [];
    foreach AtsCareerFunction careerFunction in careerFunctions {
        foreach AtsDesignation designation in careerFunction.designations {
            if designation.id == designationId {
                names.push(designation.designation);
            }
        }
    }
    if names.length() == 0 {
        return error(string `No designation found for ${designationId}`);
    }
    if names.length() > 1 {
        return error(string `Multiple designations found for ${designationId}`);
    }
    return names[0];
}

isolated function basicInfoOf(AtsVacancy vacancy, AtsBusinessUnit[] units) returns VacancyBasicInfo => {
    id: vacancy.id,
    title: vacancy.title,
    publish_status: vacancy.visibility,
    country: vacancy.hiringLocations,
    job_type: jobTypeOf(vacancy.employmentType),
    team: departmentNameOf(units, vacancy.businessUnitId, vacancy.departmentId),
    published_on: vacancy.publishedOn ?: ""
};

// The other vacancies with the same hiring locations.
isolated function similarListings(AtsVacancy current, AtsVacancy[] sameDesignation, AtsBusinessUnit[] units)
        returns VacancyBasicInfo[] {
    string[] currentLocations = array:sort(current.hiringLocations.clone());
    VacancyBasicInfo[] similar = [];
    foreach AtsVacancy vacancy in sameDesignation {
        if vacancy.id != current.id && array:sort(vacancy.hiringLocations.clone()) == currentLocations {
            similar.push(basicInfoOf(vacancy, units));
        }
    }
    return similar;
}

// The sections of the job description.
isolated function jdContentOf(json jdHtmlObject) returns JdContent|error {
    json content = jdHtmlObject is string ? check value:fromJsonString(jdHtmlObject) : jdHtmlObject;
    if content is () {
        return {};
    }
    return content.fromJsonWithType();
}

isolated function detailOf(AtsVacancy vacancy, AtsCompany[] companies, AtsBusinessUnit[] units,
        AtsCareerFunction[] careerFunctions, AtsVacancy[] sameDesignation) returns JobDetail|error {
    JdContent jd = check jdContentOf(vacancy.jdHtmlObject);
    string designation = check designationNameOf(careerFunctions, vacancy.designationId);
    boolean isRemote = vacancy.modeOfWork == MODE_REMOTE;
    return {
        id: vacancy.id,
        title: vacancy.title,
        designation,
        team: departmentNameOf(units, vacancy.businessUnitId, vacancy.departmentId),
        country: vacancy.hiringLocations,
        job_type: jobTypeOf(vacancy.employmentType),
        allow_remote: isRemote || vacancy.modeOfWork == MODE_HYBRID,
        office_locations: isRemote ? {} : {"0": officeNameOf(companies, vacancy.officeId)},
        publish_status: vacancy.visibility,
        published_on: vacancy.publishedOn,
        mainContent: jd.mainContent,
        taskInformation: jd.taskInformation,
        additionalContent: jd.additionalContent,
        similar_job_listing: similarListings(vacancy, sameDesignation, units)
    };
}

// Keys each value by its position in the list.
isolated function indexed(string[] values) returns map<string> {
    map<string> byIndex = {};
    foreach int i in 0 ..< values.length() {
        byIndex[i.toString()] = values[i];
    }
    return byIndex;
}

// The team names and hiring locations.
isolated function orgStructureOf(AtsCompany[] companies, AtsBusinessUnit[] units, AtsAppConfig? config)
        returns OrgStructure {
    string[] teams = [];
    foreach AtsBusinessUnit unit in units {
        foreach AtsDepartment department in unit.departments ?: [] {
            if teams.indexOf(department.department) is () {
                teams.push(department.department);
            }
        }
    }

    string[] companyLocations = from AtsCompany company in companies
        select company.location;
    string[] locations = companyLocations;
    if config is AtsAppConfig {
        map<string> unique = {};
        foreach AtsCustomHiringLocation custom in config.customHiringLocationMap {
            string location = custom.location.toUpperAscii().trim();
            unique[location] = location;
            foreach string mapped in custom.customMap {
                string mappedLocation = mapped.toUpperAscii().trim();
                unique[mappedLocation] = mappedLocation;
            }
        }
        foreach string companyLocation in companyLocations {
            string location = companyLocation.toUpperAscii().trim();
            unique[location] = location;
        }
        locations = [];
        if config.globalHiringTitle != "" {
            locations.push(config.globalHiringTitle.toUpperAscii().trim());
        }
        locations.push(...unique.toArray().sort());
    }
    return {location_list: indexed(locations), team_list: indexed(teams)};
}

// The candidate in the form the ATS takes, or the reason it cannot be accepted.
isolated function atsCandidateOf(CandidateApplication candidate, string employmentType, int vacancyId)
        returns AtsCandidate|string {
    AtsCandidate atsCandidate = {
        ...candidate,
        vacancyId,
        status: CANDIDATE_STATUS_CREATED,
        appliedFrom: APPLIED_FROM_CAREER_SITE
    };
    if employmentType == EMPLOYMENT_INTERNSHIP {
        string? university = candidate?.university;
        if university is () || university.trim() == "" {
            return "University is required for internship applications.";
        }
        atsCandidate.address = ADDRESS_NOT_APPLICABLE;
    } else {
        if candidate.address.trim() == "" {
            return "Address is required for this vacancy.";
        }
        _ = atsCandidate.removeIfHasKey("university");
    }
    return atsCandidate;
}
