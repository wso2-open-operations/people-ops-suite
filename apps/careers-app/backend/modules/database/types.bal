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

import ballerina/sql;
import ballerinax/mysql;

# [Configurable] database configs.
type DatabaseConfig record {|
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
    sql:ConnectionPool connectionPool;
|};

# Database config record.
type DatabaseClientConfig record {|
    *DatabaseConfig;
    # Additional configurations related to the MySQL database connection
    mysql:Options? options;
|};

# Professional links.
public type ProfessionalLinks record {
    # link.
    string link;
    # title.
    string title;
};

# Educations.
public type Educations record {
    # degree.
    string degree;
    # link.
    int end_year;
    # location
    string location;
    # GPA z-score
    float gpa_zscore;
    # start year
    int start_year;
    # institution
    string institution;
};

# Experiences.
public type Experiences record {
    # company
    string company;
    # location
    string location;
    # job tilte
    string job_title;
    # start date
    string start_date;
    # end date
    string end_date;
};

# Certifications.
public type Certifications record {
    # name
    string name;
    # issued by
    string issued_by;
    # year
    int year;
    # link
    string link;
};

# Projects.
public type Projects record {
    # name
    string name;
    # description
    string description;
    # technologies
    string[] technologies;
    # github
    string github;
};

# Languages.
public type Languages record {
    # language
    string language;
    # proficiency
    string proficiency;
};

# Skills.
public type Skills string[];

# Interests.
public type Interests string[];

# create a new applicant profile.
public type CreateApplicantProfile record {|
    # First name of the applicant
    @sql:Column {name: "first_name"}
    string first_name;
    # Last name of the applicant
    @sql:Column {name: "last_name"}
    string last_name;
    # Email address of the applicant
    @sql:Column {name: "email"}
    string email;
    # Phone number of the applicant
    @sql:Column {name: "phone"}
    string phone;
    # Address of the applicant
    @sql:Column {name: "address"}
    string address;
    # Country of residence
    @sql:Column {name: "country"}
    string country;
    # Current status 
    @sql:Column {name: "status"}
    string status;
    # List of professional links
    @sql:Column {name: "professional_links"}
    ProfessionalLinks[] professional_links;
    # Educational background
    @sql:Column {name: "educations"}
    Educations[] educations;
    # Work experience details 
    @sql:Column {name: "experiences"}
    Experiences[] experiences;
    # Skill set 
    @sql:Column {name: "skills"}
    Skills skills;
    # Professional certifications 
    @sql:Column {name: "certifications"}
    Certifications[] certifications;
    # Project details 
    @sql:Column {name: "projects"}
    Projects[] projects;
    # Languages known 
    @sql:Column {name: "languages"}
    Languages[] languages;
    # Personal interests 
    @sql:Column {name: "interests"}
    Interests interests;
    # Link to the profile picture in Google Drive
    @sql:Column {name: "user_thumbnail"}
    string? user_thumbnail;
    # Link to the resume in Google Drive
    @sql:Column {name: "resume_link"}
    string? resume_link;
    # user who created the profile
    @sql:Column {name: "created_by"}
    string? created_by;
    # user who last updated the profile
    @sql:Column {name: "updated_by"}
    string? updated_by;

|};

# applicant profile .
public type ApplicantProfile record {|
    *CreateApplicantProfile;
    # Unique identifier for the applicant profile
    int id;
    # Timestamp when the profile was created
    string created_at;
    # Timestamp when the profile was last updated
    string updated_at;
|};

# Database record type for applicant profile.
type ApplicantProfileDB record {|
    # Unique identifier for the applicant profile
    @sql:Column {name: "id"}
    int id;
    # First name of the applicant
    @sql:Column {name: "first_name"}
    string first_name;
    # Last name of the applicant
    @sql:Column {name: "last_name"}
    string last_name;
    # Email address of the applicant
    @sql:Column {name: "email"}
    string email;
    # Phone number of the applicant
    @sql:Column {name: "phone"}
    string phone;
    # Postal address of the applicant
    @sql:Column {name: "address"}
    string address;
    # Country of residence
    @sql:Column {name: "country"}
    string country;
    # Current status 
    @sql:Column {name: "status"}
    string status;
    # List of professional links
    @sql:Column {name: "professional_links"}
    string professional_links;
    # Educational background
    @sql:Column {name: "educations"}
    string educations;
    # Work experience details
    @sql:Column {name: "experiences"}
    string experiences;
    # Skill set
    @sql:Column {name: "skills"}
    string skills;
    # Professional certifications
    @sql:Column {name: "certifications"}
    string certifications;
    # Project details
    @sql:Column {name: "projects"}
    string projects;
    # Languages known
    @sql:Column {name: "languages"}
    string languages;
    # Personal interests
    @sql:Column {name: "interests"}
    string interests;
    # Link to the profile picture in Google Drive
    @sql:Column {name: "user_thumbnail"}
    string? user_thumbnail;
    # Link to the resume in Google Drive
    @sql:Column {name: "resume_link"}
    string? resume_link;
    # user who created the profile
    @sql:Column {name: "created_by"}
    string? created_by;
    # user who last updated the profile
    @sql:Column {name: "updated_by"}
    string? updated_by;
    # Timestamp when the profile was created
    @sql:Column {name: "created_at"}
    string created_at;
    # Timestamp when the profile was last updated
    @sql:Column {name: "updated_at"}
    string updated_at;
|};

# Partial update for applicant profile.
public type UpdateApplicantProfile record {|
    # First name of the applicant
    string first_name?;
    # Last name of the applicant
    string last_name?;
    # Email address of the applicant
    string email?;
    # Phone number of the applicant
    string phone?;
    # Postal address of the applicant
    string address?;
    # Country of residence
    string country?;
    # Current status 
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

