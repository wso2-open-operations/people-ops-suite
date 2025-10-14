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

# Represent the name and email address of a support team.
public type SupportTeamEmail record {|
    # Name of the support team
    string team;
    # Email address of the support team
    string email;
|};

# List of App Configurations.
public type AppConfig record {|
    # List of support team emails
    SupportTeamEmail[] supportTeamEmails;
|};

# Professional links
public type ProfessionalLinks record {
    # link.
    @constraint:String {
        pattern: {
            value: re `${REGEX_URL}`,
            message: "Link must be a valid URL."
        }
    }
    string link;
    # title.
    @constraint:String {
        pattern: {
            value: re `${NONE_EMPTY_PRINTABLE_STRING_REGEX}`,
            message: "Title must be a non-empty printable string"
        }
    }
    string title;
};

# Educations
public type Educations record {
    # degree.
    @constraint:String {
        pattern: {
            value: re `${NONE_EMPTY_PRINTABLE_STRING_REGEX}`,
            message: "Degree must be a non-empty printable string"
        }
    }
    string degree;
    # End year.
    int end_year;
    # location
    @constraint:String {
        pattern: {
            value: re `${NONE_EMPTY_PRINTABLE_STRING_REGEX}`,
            message: "location must be a non-empty printable string"
        }
    }
    string location;
    # GPA z-score
    float gpa_zscore;
    # start year
    int start_year;
    # institution
    @constraint:String {
        pattern: {
            value: re `${NONE_EMPTY_PRINTABLE_STRING_REGEX}`,
            message: "Institution must be a non-empty printable string"
        }
    }
    string institution;
};

# Experiences
public type Experiences record {
    # company
    @constraint:String {
        pattern: {
            value: re `${NONE_EMPTY_PRINTABLE_STRING_REGEX}`,
            message: "Company must be a non-empty printable string."
        }
    }
    string company;
    # location
    @constraint:String {
        pattern: {
            value: re `${NONE_EMPTY_PRINTABLE_STRING_REGEX}`,
            message: "Location must be a non-empty printable string."
        }
    }
    string location;
    # job tilte
    @constraint:String {
        pattern: {
            value: re `${NONE_EMPTY_PRINTABLE_STRING_REGEX}`,
            message: "Job title must be a non-empty printable string."
        }
    }
    string job_title;
    # start date
    @constraint:String {
        pattern: {
            value: re `${NONE_EMPTY_PRINTABLE_STRING_REGEX}`,
            message: "Start date must be a non-empty printable string."
        }
    }
    string start_date;
    # end date
    @constraint:String {
        pattern: {
            value: re `${NONE_EMPTY_PRINTABLE_STRING_REGEX}`,
            message: "End date must be a non-empty printable string."
        }
    }
    string end_date;
};

# Certifications
public type Certifications record {
    # name
    @constraint:String {
        pattern: {
            value: re `${NONE_EMPTY_PRINTABLE_STRING_REGEX}`,
            message: "Name must be a non-empty printable string."
        }
    }
    string name;
    # issued by
    @constraint:String {
        pattern: {
            value: re `${NONE_EMPTY_PRINTABLE_STRING_REGEX}`,
            message: "Issuer must be a non-empty printable string."
        }
    }
    string issued_by;
    # year
    int year;
    # link
    @constraint:String {
        pattern: {
            value: re `${REGEX_URL}`,
            message: "Must be a valid URL."
        }
    }
    string link;
};

# Projects
public type Projects record {
    # name
    @constraint:String {
        pattern: {
            value: re `${NONE_EMPTY_PRINTABLE_STRING_REGEX}`,
            message: "Project name must be a non-empty printable string."
        }
    }
    string name;
    # description
    @constraint:String {
        pattern: {
            value: re `${NONE_EMPTY_PRINTABLE_STRING_REGEX}`,
            message: "Description must be a non-empty printable string."
        }
    }
    string description;
    # technologies
    @constraint:Array {
        minLength: {
            value: 1,
            message: "Technologies should be a non-empty string array."
        }
    }
    string[] technologies;
    # github
    @constraint:String {
        pattern: {
            value: re `${REGEX_URL}`,
            message: "GitHub link must be a valid URL."
        }
    }
    string github;
};

# Languages
public type Languages record {
    # language
    @constraint:String {
        pattern: {
            value: re `${NONE_EMPTY_PRINTABLE_STRING_REGEX}`,
            message: "Language must be a non-empty printable string."
        }
    }
    string language;
    # proficiency
    @constraint:String {
        pattern: {
            value: re `${NONE_EMPTY_PRINTABLE_STRING_REGEX}`,
            message: "Proficiency must be a non-empty printable string."
        }
    }
    string proficiency;
};

# Skills
@constraint:Array {
    minLength: {
        value: 1,
        message: "Skills array must contain at least one skill."
    }
}
public type Skills string[];

# Interests
@constraint:Array {
    minLength: {
        value: 1,
        message: "Interests array must contain at least one interest."
    }
}
public type Interests string[];

# create a new applicant profile.
public type CreateApplicantProfile record {|
    # First name of the applicant
    @constraint:String {
        pattern: {
            value: re `${NONE_EMPTY_PRINTABLE_STRING_REGEX}`,
            message: "First name must be a non-empty printable string"
        }
    }
    string first_name;
    # Last name of the applicant
    @constraint:String {
        pattern: {
            value: re `${NONE_EMPTY_PRINTABLE_STRING_REGEX}`,
            message: "Last name must be a non-empty printable string"
        }
    }
    string last_name;
    # Email address of the applicant
    @constraint:String {
        pattern: {
            value: re `${REGEX_EMAIL}`,
            message: "Invalid email format"
        }
    }
    string email;
    # Phone number of the applicant
    @constraint:String {
        pattern: {
            value: re `${REGEX_PHONE_NUMBER}`,
            message: "Phone number must be 9–15 digits"
        }
    }
    string phone;
    # Address of the applicant
    @constraint:String {
        pattern: {
            value: re `${NONE_EMPTY_PRINTABLE_STRING_REGEX}`,
            message: "Address must be a non-empty printable string"
        }
    }
    string address;
    # Country of residence
    @constraint:String {
        pattern: {
            value: re `${NONE_EMPTY_PRINTABLE_STRING_REGEX}`,
            message: "Country must be a non-empty printable string"
        }
    }
    string country;
    # Current status 
    @constraint:String {
        pattern: {
            value: re `${NONE_EMPTY_PRINTABLE_STRING_REGEX}`,
            message: "Status must be a non-empty printable string"
        }
    }
    string status;
    # List of professional links
    ProfessionalLinks[] professional_links;
    # Educational background
    Educations[] educations;
    # Work experience details 
    Experiences[] experiences;
    # Skill set 
    Skills skills;
    # Professional certifications 
    Certifications[] certifications;
    # Project details 
    Projects[] projects;
    # Languages known 
    Languages[] languages;
    # Personal interests 
    Interests interests;
    # Link to the profile picture in Google Drive
    string user_thumbnail;
    # Link to the resume in Google Drive
    string resume_link;
    # user who created the profile
    string created_by;
    # user who last updated the profile
    string updated_by;
|};

public type CreateApplicantProfileRequest record {|
    // Required user data
    @constraint:String {
        pattern: {
            value: re `${NONE_EMPTY_PRINTABLE_STRING_REGEX}`,
            message: "First name must be a non-empty printable string"
        }
    }
    string first_name;

    @constraint:String {
        pattern: {
            value: re `${NONE_EMPTY_PRINTABLE_STRING_REGEX}`,
            message: "Last name must be a non-empty printable string"
        }
    }
    string last_name;

    @constraint:String {
        pattern: {
            value: re `${REGEX_EMAIL}`,
            message: "Invalid email format"
        }
    }
    string email;

    @constraint:String {
        pattern: {
            value: re `${REGEX_PHONE_NUMBER}`,
            message: "Phone number must be 9–15 digits"
        }
    }
    string phone;

    @constraint:String {
        pattern: {
            value: re `${NONE_EMPTY_PRINTABLE_STRING_REGEX}`,
            message: "Address must be a non-empty printable string"
        }
    }
    string address;

    @constraint:String {
        pattern: {
            value: re `${NONE_EMPTY_PRINTABLE_STRING_REGEX}`,
            message: "Country must be a non-empty printable string"
        }
    }
    string country;

    @constraint:String {
        pattern: {
            value: re `${NONE_EMPTY_PRINTABLE_STRING_REGEX}`,
            message: "Status must be a non-empty printable string"
        }
    }
    string status;

    ProfessionalLinks[] professional_links;
    Educations[] educations;
    Experiences[] experiences;
    Skills skills;
    Certifications[] certifications;
    Projects[] projects;
    Languages[] languages;
    Interests interests;
    string base64_profile_photo;
    string profile_photo_file_name;
    string base64_cv;
    string cv_file_name;
|};

# Partial update for applicant profile
public type UpdateApplicantProfile record {|
    # First name of the applicant
    @constraint:String {
        pattern: {
            value: re `${NONE_EMPTY_PRINTABLE_STRING_REGEX}`,
            message: "First name must be a non-empty printable string"
        }
    }
    string first_name?;
    # Last name of the applicant
    @constraint:String {
        pattern: {
            value: re `${NONE_EMPTY_PRINTABLE_STRING_REGEX}`,
            message: "Last name must be a non-empty printable string"
        }
    }
    string last_name?;
    # Email address of the applicant
    @constraint:String {
        pattern: {
            value: re `${REGEX_EMAIL}`,
            message: "Invalid email format"
        }
    }
    string email?;
    # Phone number of the applicant
    @constraint:String {
        pattern: {
            value: re `${REGEX_PHONE_NUMBER}`,
            message: "Phone number must be 9–15 digits"
        }
    }
    string phone?;
    # Postal address of the applicant
    @constraint:String {
        pattern: {
            value: re `${NONE_EMPTY_PRINTABLE_STRING_REGEX}`,
            message: "Address must be a non-empty printable string"
        }
    }
    string address?;
    # Country of residence
    @constraint:String {
        pattern: {
            value: re `${NONE_EMPTY_PRINTABLE_STRING_REGEX}`,
            message: "Country must be a non-empty printable string"
        }
    }
    string country?;
    # Current status 
    @constraint:String {
        pattern: {
            value: re `${NONE_EMPTY_PRINTABLE_STRING_REGEX}`,
            message: "Status must be a non-empty printable string"
        }
    }
    string status?;
    # List of professional links
    ProfessionalLinks[] professional_links?;
    # Educational background
    Educations[] educations?;
    # Work experience details 
    Experiences[] experiences?;
    # Skill set 
    Skills skills?;
    # Professional certifications 
    Certifications[] certifications?;
    # Project details 
    Projects[] projects?;
    # Languages known 
    Languages[] languages?;
    # Personal interests 
    Interests interests?;
    # Link to the profile picture in Google Drive
    string user_thumbnail?;
    # Link to the resume in Google Drive
    string resume_link?;
    # user who last updated the profile
    string updated_by?;
|};

# Represents the response structure for retrieving user information.
public type UserInfoResponse record {|
    # Id of the employee
    string employeeId;
    # Email of the employee
    string workEmail;
    # First name of the employee
    string firstName;
    # Last name of the employee
    string lastName;
    # Job role
    string jobRole;
    # Thumbnail of the employee
    string? employeeThumbnail;
    # User Privileges
    int[] privileges;
|};
