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
    # end year
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
    # job title
    string job_title;
    # start date
    string start_date;
    # end date 
    string end_date?;
    # currently working at this position
    boolean current?;
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
    @sql:Column {name: "firstName"}
    string firstName;
    # Last name of the applicant
    @sql:Column {name: "lastName"}
    string lastName;
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
    @sql:Column {name: "professionalLinks"}
    ProfessionalLinks[] professionalLinks;
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
    # Profile picture as byte array
    @sql:Column {name: "userThumbnail"}
    byte[]? userThumbnail;
    # Resume as byte array
    @sql:Column {name: "resume"}
    byte[]? resume;
    # user who created the profile
    @sql:Column {name: "createdBy"}
    string? createdBy;
    # user who last updated the profile
    @sql:Column {name: "updatedBy"}
    string? updatedBy;
|};

# Applicant profile record.
public type ApplicantProfile record {|
    *CreateApplicantProfile;
    # Unique identifier for the applicant profile
    int id;
    # Timestamp when the profile was created
    string createdAt;
    # Timestamp when the profile was last updated
    string updatedAt;
|};

# Database record type for applicant profile.
type ApplicantProfileDB record {|
    # Unique identifier for the applicant profile
    @sql:Column {name: "id"}
    int id;
    # First name of the applicant
    @sql:Column {name: "firstName"}
    string firstName;
    # Last name of the applicant
    @sql:Column {name: "lastName"}
    string lastName;
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
    @sql:Column {name: "professionalLinks"}
    string professionalLinks;
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
    # Profile picture as byte array
    @sql:Column {name: "userThumbnail"}
    byte[]? userThumbnail;
    # Resume as byte array
    @sql:Column {name: "resume"}
    byte[]? resume;
    # user who created the profile
    @sql:Column {name: "createdBy"}
    string? createdBy;
    # user who last updated the profile
    @sql:Column {name: "updatedBy"}
    string? updatedBy;
    # Timestamp when the profile was created
    @sql:Column {name: "createdAt"}
    string createdAt;
    # Timestamp when the profile was last updated
    @sql:Column {name: "updatedAt"}
    string updatedAt;
|};

# Partial update for applicant profile.
public type UpdateApplicantProfile record {|
    # First name of the applicant
    string firstName;
    # Last name of the applicant
    string lastName;
    # Email address of the applicant
    string email;
    # Phone number of the applicant
    string phone?;
    # Postal address of the applicant
    string address?;
    # Country of residence
    string country?;
    # Current status 
    string status?;
    # List of professional links
    ProfessionalLinks[] professionalLinks?;
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
    # Profile picture as byte array
    byte[]? userThumbnail?;
    # Resume as byte array
    byte[]? resume?;
    # user who last updated the profile
    string updatedBy?;
|};

# Request payload for updating applicant profile.
public type UpdateApplicantProfileRequest record {|
    # First name of the applicant
    string firstName;
    # Last name of the applicant
    string lastName;
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
    ProfessionalLinks[] professionalLinks?;
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
    # Bytestring encoded profile photo
    byte[] userThumbnail?;
    # Profile photo file name
    string profile_photo_file_name?;
    # Bytestring encoded CV
    byte[] resume?;
    # CV file name
    string cv_file_name?;
    # Email of the user who updated the profile
    string updatedBy?;
|};
