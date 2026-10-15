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

# ATS connection details.
public type AtsConfig record {|
    string baseUrl;
    string tokenUrl;
    string clientId;
    string clientSecret;
|};

const string STATUS_PUBLISHED = "PUBLISHED";

const string EMPLOYMENT_INTERNSHIP = "Internship";

# The ATS employment type that is shown as EMPLOYMENT_FULL_TIME.
const string EMPLOYMENT_PERMANENT = "Permanent";
const string EMPLOYMENT_FULL_TIME = "Full Time";

const string MODE_REMOTE = "Remote";
const string MODE_HYBRID = "Hybrid";

const string CANDIDATE_STATUS_CREATED = "CREATED";
const string APPLIED_FROM_CAREER_SITE = "Career Site";

# The address recorded for an internship.
const string ADDRESS_NOT_APPLICABLE = "N/A";

# The name used when an org id has no match.
const string UNKNOWN_NAME = "Unknown";

# An ATS reply with a status other than 200.
type UpstreamError distinct error<record {|int status;|}>;

# A vacancy as the ATS returns it.
type AtsVacancy record {
    int id;
    string title;
    int designationId;
    int businessUnitId;
    int departmentId;
    int? officeId = ();
    string employmentType;
    string modeOfWork;
    string[] hiringLocations;
    string visibility;
    json jdHtmlObject = ();
    string status;
    string? publishedOn = ();
};

type AtsVacancyResponse record {
    AtsVacancy[] vacancies;
};

type AtsDepartment record {
    int id;
    string department;
};

type AtsBusinessUnit record {
    int id;
    AtsDepartment[]? departments = ();
};

type AtsOffice record {
    int id;
    string office;
};

type AtsCompany record {
    string location;
    AtsOffice[] offices;
};

type AtsDesignation record {
    int id;
    string designation;
};

type AtsCareerFunction record {
    AtsDesignation[] designations;
};

type AtsCustomHiringLocation record {
    string location;
    string[] customMap;
};

type AtsAppConfig record {
    string globalHiringTitle;
    AtsCustomHiringLocation[] customHiringLocationMap = [];
};

# The sections of a vacancy's job description.
type JdContent record {
    string mainContent = "";
    string? taskInformation = ();
    string? additionalContent = ();
};

# A candidate as the ATS accepts it.
type AtsCandidate record {|
    *CandidateApplication;
    int vacancyId;
    string status;
    string appliedFrom;
|};

# A vacancy in the job list, in the shape the web app reads.
type VacancyBasicInfo record {|
    int id;
    string title;
    string publish_status;
    string[] country;
    string job_type;
    string team;
    string published_on;
|};

# One vacancy's detail, in the shape the web app reads.
type JobDetail record {|
    int id;
    string title;
    string designation;
    string team;
    string[] country;
    string job_type;
    boolean allow_remote;
    map<string> office_locations;
    string publish_status;
    string? published_on;
    string mainContent;
    string? taskInformation;
    string? additionalContent;
    VacancyBasicInfo[] similar_job_listing;
|};

# Team and hiring location names, keyed by their position in the list.
type OrgStructure record {|
    map<string> location_list;
    map<string> team_list;
|};

# Candidate details from the application form. `resume` holds the CV's bytes.
public type CandidateApplication record {|
    string firstName;
    string lastName;
    string personalEmail;
    string contactNo;
    string address;
    byte[] resume;
    string taskInfo?;
    string university?;
    string wso2Email?;
|};

type TokenResponse record {
    string access_token;
    int expires_in;
};
