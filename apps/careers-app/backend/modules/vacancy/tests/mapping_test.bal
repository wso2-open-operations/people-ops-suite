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

import ballerina/http;
import ballerina/test;

final AtsBusinessUnit[] & readonly UNITS = [
    {id: 1, departments: [{id: 10, department: "Engineering"}, {id: 11, department: "People"}]},
    {id: 2}
];

final AtsCompany[] & readonly COMPANIES = [
    {location: "Sri Lanka", offices: [{id: 5, office: "Colombo"}]},
    {location: "USA", offices: [{id: 6, office: "Mountain View"}]}
];

final AtsCareerFunction[] & readonly CAREER_FUNCTIONS = [
    {designations: [{id: 100, designation: "Software Engineer"}, {id: 101, designation: "Tech Lead"}]}
];

function vacancy(int id, string[] locations = ["Sri Lanka"], string employmentType = "Permanent",
        string mode = "Office") returns AtsVacancy => {
    id,
    title: "Engineer",
    designationId: 100,
    businessUnitId: 1,
    departmentId: 10,
    officeId: 5,
    employmentType,
    modeOfWork: mode,
    hiringLocations: locations,
    visibility: "All",
    jdHtmlObject: {mainContent: "<p>Main</p>", taskInformation: "Task"},
    status: "PUBLISHED",
    publishedOn: "2026-01-01"
};

function application(string address = "1 Main Street", string? university = ()) returns CandidateApplication {
    CandidateApplication candidate = {
        firstName: "Ada",
        lastName: "Lovelace",
        personalEmail: "ada@example.test",
        contactNo: "+94771234567",
        address,
        resume: [1, 2, 3]
    };
    if university is string {
        candidate.university = university;
    }
    return candidate;
}

@test:Config {}
function aRefusedRequestKeepsTheAtsStatus() {
    http:Response|error reply = failedReply(error UpstreamError("refused", status = 409), "test-request");
    test:assertTrue(reply is http:Response && reply.statusCode == 409);
}

@test:Config {}
function anUnreadableReplyBecomesBadGateway() {
    http:Response|error reply = failedReply(error("unreadable"), "test-request");
    test:assertTrue(reply is http:Response && reply.statusCode == 502);
}

@test:Config {}
function permanentIsShownAsFullTime() {
    test:assertEquals(jobTypeOf("Permanent"), "Full Time");
    test:assertEquals(jobTypeOf("Internship"), "Internship");
}

@test:Config {}
function departmentNameFallsBackToUnknown() {
    test:assertEquals(departmentNameOf(UNITS, 1, 11), "People");
    test:assertEquals(departmentNameOf(UNITS, 1, 99), "Unknown");
    test:assertEquals(departmentNameOf(UNITS, 2, 10), "Unknown");
    test:assertEquals(departmentNameOf(UNITS, 3, 10), "Unknown");
}

@test:Config {}
function basicInfoUsesTheOrgNamesAndAnEmptyDateWhenUnpublished() {
    AtsVacancy unpublished = vacancy(1);
    unpublished.publishedOn = ();
    VacancyBasicInfo info = basicInfoOf(unpublished, UNITS);
    test:assertEquals(info.team, "Engineering");
    test:assertEquals(info.job_type, "Full Time");
    test:assertEquals(info.publish_status, "All");
    test:assertEquals(info.published_on, "");
}

@test:Config {}
function similarListingsShareTheSameLocationsInAnyOrder() {
    AtsVacancy current = vacancy(1, ["Sri Lanka", "USA"]);
    AtsVacancy[] sameDesignation = [
        current,
        vacancy(2, ["USA", "Sri Lanka"]),
        vacancy(3, ["Sri Lanka"])
    ];
    VacancyBasicInfo[] similar = similarListings(current, sameDesignation, UNITS);
    test:assertEquals(similar.length(), 1);
    test:assertEquals(similar[0].id, 2);
}

@test:Config {}
function designationMustBeFoundOnce() {
    test:assertEquals(designationNameOf(CAREER_FUNCTIONS, 101), "Tech Lead");
    test:assertTrue(designationNameOf(CAREER_FUNCTIONS, 999) is error);
    AtsCareerFunction[] duplicated = [...CAREER_FUNCTIONS, ...CAREER_FUNCTIONS];
    test:assertTrue(designationNameOf(duplicated, 101) is error);
}

@test:Config {}
function remoteVacancyHasNoOfficeAndAllowsRemote() {
    JobDetail|error detail = detailOf(vacancy(1, mode = "Remote"), COMPANIES, UNITS, CAREER_FUNCTIONS, []);
    if detail is error {
        test:assertFail(detail.message());
    }
    test:assertEquals(detail.office_locations, {});
    test:assertTrue(detail.allow_remote);
    test:assertEquals(detail.designation, "Software Engineer");
    test:assertEquals(detail.mainContent, "<p>Main</p>");
    test:assertEquals(detail.taskInformation, "Task");
    test:assertEquals(detail.additionalContent, ());
}

@test:Config {}
function officeVacancyNamesItsOffice() {
    JobDetail|error detail = detailOf(vacancy(1), COMPANIES, UNITS, CAREER_FUNCTIONS, []);
    if detail is error {
        test:assertFail(detail.message());
    }
    test:assertEquals(detail.office_locations, {"0": "Colombo"});
    test:assertFalse(detail.allow_remote);

    JobDetail|error hybrid = detailOf(vacancy(1, mode = "Hybrid"), COMPANIES, UNITS, CAREER_FUNCTIONS, []);
    test:assertTrue(hybrid is JobDetail && hybrid.allow_remote);
}

@test:Config {}
function aMissingDescriptionIsEmpty() {
    AtsVacancy withoutDescription = vacancy(1);
    withoutDescription.jdHtmlObject = ();
    JobDetail|error detail = detailOf(withoutDescription, COMPANIES, UNITS, CAREER_FUNCTIONS, []);
    if detail is error {
        test:assertFail(detail.message());
    }
    test:assertEquals(detail.mainContent, "");
    test:assertEquals(detail.taskInformation, ());
}

@test:Config {}
function aDescriptionSentAsAJsonStringIsRead() {
    AtsVacancy asString = vacancy(1);
    asString.jdHtmlObject = "{\"mainContent\": \"<p>Main</p>\", \"additionalContent\": \"More\"}";
    JobDetail|error detail = detailOf(asString, COMPANIES, UNITS, CAREER_FUNCTIONS, []);
    if detail is error {
        test:assertFail(detail.message());
    }
    test:assertEquals(detail.mainContent, "<p>Main</p>");
    test:assertEquals(detail.additionalContent, "More");
}

@test:Config {}
function detailFailsWhenTheDescriptionCannotBeRead() {
    AtsVacancy unreadable = vacancy(1);
    unreadable.jdHtmlObject = "not an object";
    test:assertTrue(detailOf(unreadable, COMPANIES, UNITS, CAREER_FUNCTIONS, []) is error);
}

@test:Config {}
function orgStructureWithoutConfigListsCompanyLocationsAsTheyAre() {
    OrgStructure org = orgStructureOf(COMPANIES, UNITS, ());
    test:assertEquals(org.location_list, {"0": "Sri Lanka", "1": "USA"});
    test:assertEquals(org.team_list, {"0": "Engineering", "1": "People"});
}

@test:Config {}
function orgStructureWithConfigPutsTheGlobalTitleFirstAndRemovesDuplicates() {
    AtsAppConfig config = {
        globalHiringTitle: "Global",
        customHiringLocationMap: [{location: "Europe", customMap: ["Germany", " usa "]}]
    };
    OrgStructure org = orgStructureOf(COMPANIES, UNITS, config);
    test:assertEquals(org.location_list, {"0": "GLOBAL", "1": "EUROPE", "2": "GERMANY", "3": "SRI LANKA", "4": "USA"});
}

@test:Config {}
function internshipNeedsAUniversityAndTakesNoAddress() {
    test:assertEquals(atsCandidateOf(application(), "Internship", 7), "University is required for internship applications.");
    test:assertEquals(atsCandidateOf(application(university = "  "), "Internship", 7),
        "University is required for internship applications.");

    AtsCandidate|string candidate = atsCandidateOf(application(university = "State University"), "Internship", 7);
    if candidate is string {
        test:assertFail(candidate);
    }
    test:assertEquals(candidate.address, "N/A");
    test:assertEquals(candidate?.university, "State University");
}

@test:Config {}
function otherVacanciesNeedAnAddressAndTakeNoUniversity() {
    test:assertEquals(atsCandidateOf(application(address = " "), "Permanent", 7), "Address is required for this vacancy.");

    AtsCandidate|string candidate = atsCandidateOf(application(university = "State University"), "Permanent", 7);
    if candidate is string {
        test:assertFail(candidate);
    }
    test:assertEquals(candidate.address, "1 Main Street");
    test:assertEquals(candidate?.university, ());
    test:assertEquals(candidate.vacancyId, 7);
    test:assertEquals(candidate.status, "CREATED");
    test:assertEquals(candidate.appliedFrom, "Career Site");
}
