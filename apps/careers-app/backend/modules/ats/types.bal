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
import ballerina/constraint;

// Due to a limitation of Choreo, OAuth2PasswordGrantConfig cannot be used directly. 
//Case: https://support.wso2.com/support?id=csm_ticket&table=sn_customerservice_case&sys_id=a341fa45c3ccba90af2f4045990131b8&view=csp&spa=1
# Client configuration record type. 
public type ClientConfig record {|
    # Token URL
    string tokenUrl;
    # Username
    string username;
    # Password
    string password;
    # Client ID
    string clientId?;
    # Client Secret
    string clientSecret?;
    # Scopes
    string|string[] scopes?;
|};

# ATS Vacancy record type.
public type AtsVacancy record {|
    # Vacancy id
    readonly int id;
    # Vacancy title
    string title;
    # Job requisition id
    int jobRequisitionId;
    # Designation id
    int designationId;
    # Business unit id
    int businessUnitId;
    # Department id
    int departmentId;
    # Team id
    int teamId;
    # Office id
    int officeId;
    # Job type
    JrEmploymentType employmentType;
    # Mode of work
    ModeOfWork modeOfWork;
    # Hiring locations
    string[] hiringLocations;
    # Job description URL
    string jobDescriptionUrl;
    # Vacancy visibility
    VacancyVisibility visibility;
    # Vacancy note
    string? note = ();
    # Vacancy interview
    VacancyInterview[]|string interview;
    # Vacancy number of seats
    int noOfSeats;
    # Vacancy hired count
    int hiredCount;
    # Vacancy jd html object
    json|string? jdHtmlObject = ();
    # Vacancy status
    VacancyStatus status;
    # Additional information
    AdditionalInfo? additionalInfo = ();
    # Vacancy published on
    string? publishedOn;
    # Vacancy created on 
    string createdOn;
    # Vacancy created by
    string createdBy;
    # Vacancy updated on
    string updatedOn;
    # Vacancy updated by
    string updatedBy;
|};

# Vacancy record type.
# Note: snake_case is used for field names where required for mapping purposes.
public type Vacancy record {|
    # Vacancy id
    readonly int id;
    # Vacancy title
    string title;
    # Designation name
    string designation;
    # Team name
    string team;
    # Country
    string[] country;
    # Job type
    JrEmploymentType job_type;
    # Allow remote
    boolean allow_remote;
    # Office location
    map<string> office_locations;
    # Vacancy visibility
    VacancyVisibility publish_status;
    # Vacancy published on
    string? published_on;
    # Main content
    string mainContent;
    # Task Information
    string? taskInformation;
    # Additional content
    string? additionalContent;
    # Similar job listing
    VacancyBasicInfo[] similar_job_listing;
|};

# Job Description Content record type.
public type JdContent record {|
    # Main content
    string mainContent;
    # Task Information
    string? taskInformation;
    # Additional content
    string? additionalContent;
|};

# Vacancy record type.
# Note: snake_case is used for field names where required for mapping purposes.
public type VacancyBasicInfo record {
    # Vacancy id
    readonly int id;
    # Vacancy title
    string title;
    # Team name
    string team;
    # Country
    string[] country;
    # Job type
    JrEmploymentType job_type;
    # Vacancy visibility
    VacancyVisibility publish_status;
    # Vacancy published on
    string published_on;
};

# Org structure record type.
# Note: snake_case is used for field names where required for mapping purposes.
public type OrgStructure record {|
    # Location list mapped with string indices
    map<string> location_list;
    # Team list mapped with string indices
    map<string> team_list;
|};

# Vacancy Interview record type.
public type VacancyInterview record {|
    # Interview ID
    int? id = ();
    # Interviewer Name
    string interviewer;
    # Interview socre card titles
    string[] scoreCardTitles;
|};

# Additional info record type.
public type AdditionalInfo record {|
    # Type of additional information
    VacancyStatus additionalInfoKey;
    # Additional information
    string note;
    # Author of the additional information
    string author;
    # Date of the additional information added
    string date;
|};

# Location record type.
public type Location record {|
    # Country
    string country;
    # Office
    string office;
|};

# Location record type.
public type LocationId record {|
    # Country Id
    int countryId;
    # Office Id
    int officeId;
|};

# Candidate create record type.
public type CareerPageCandidate record {|
    # Vacancy ID
    @constraint:Int {minValue: 1}
    int vacancyId;
    # Candidate first name
    string firstName;
    # Candidate last name
    string lastName;
    # Candidate personal email
    string personalEmail;
    # Candidate country code
    string countryCode;
    # Candidate contact number
    string contactNo;
    # Candidate address
    string address;
    # Candidate country
    string country;
    # Gender
    Gender gender;
    # Candidate-vacancy resume
    byte[]|string resume;
|};

# Candidate create record type.
public type Candidate record {|
    # Candidate first name
    string firstName;
    # Candidate last name
    string lastName;
    # Candidate personal email
    string personalEmail;
    # Candidate WSO2 email
    string wso2Email?;
    # Candidate contact number
    @constraint:String {
        pattern: {
            value: INTERNATIONAL_CONTACT_NUMBER_REGEX,
            message: "The contact number should be in valid international format."
        }
    }
    string contactNo;
    # Candidate address
    string address;
    # Candidate-vacancy resume
    byte[] resume;
|};

# Payload for applying to a vacancy.
public type VacancyApplicationPayload record {|
    *Candidate;
    # Vacancy ID
    int vacancyId;
|};

# Error response record type.
public type AtsErrorResponse record {|
    # Error message
    string message;
|};

# Vacancy response type from ATS backend.
public type VacancyResponse record {|
    # Vacancies array
    AtsVacancy[] vacancies;
    # Total number of vacancies
    int totalCount;
|};
