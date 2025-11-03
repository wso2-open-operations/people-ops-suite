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

# Constant for active status
public const string ACTIVE = "active";

# Builds query to add a applicants profile.
#
# + applicant - applicants profile to be added
# + return - sql:ParameterizedQuery - Insert query for the applicantss table
isolated function createapplicantProfileQuery(CreateApplicantProfile applicant) returns sql:ParameterizedQuery =>
    `INSERT INTO applicants (
        first_name,
        last_name, 
        email, 
        phone, 
        address, 
        country, 
        status,
        professional_links, 
        educations, 
        experiences, 
        skills, 
        certifications, 
        projects, 
        languages, 
        interests,
        user_thumbnail,
        resume_link,
        created_by,
        updated_by
    ) VALUES (
        ${applicant.first_name}, 
        ${applicant.last_name}, 
        ${applicant.email}, 
        ${applicant.phone}, 
        ${applicant.address},
        ${applicant.country}, 
        ${applicant.status},
        ${applicant.professional_links.toString()}, 
        ${applicant.educations.toString()}, 
        ${applicant.experiences.toString()},
        ${applicant.skills.toString()}, 
        ${applicant.certifications.toString()}, 
        ${applicant.projects.toString()},
        ${applicant.languages.toString()}, 
        ${applicant.interests.toString()},
        ${applicant.user_thumbnail},
        ${applicant.resume_link},
        ${applicant.created_by},
        ${applicant.updated_by}
    )`;

# Retrieve applicant profile by email.
#
# + email - Email of the applicant to retrieve
# + return - sql:ParameterizedQuery - Select query for the applicants table
isolated function getApplicantByEmailQuery(string email) returns sql:ParameterizedQuery => `
    SELECT
        id AS 'id',
        first_name AS 'first_name',
        last_name AS 'last_name',
        email AS 'email',
        phone AS 'phone',
        address AS 'address',
        country AS 'country',
        status AS 'status',
        professional_links AS 'professional_links',
        educations AS 'educations',
        experiences AS 'experiences',
        skills AS 'skills',
        certifications AS 'certifications',
        projects AS 'projects',
        languages AS 'languages',
        interests AS 'interests',
        user_thumbnail AS 'user_thumbnail',
        resume_link AS 'resume_link',
        created_by AS 'created_by',
        updated_by AS 'updated_by',
        DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') AS 'created_at',
        DATE_FORMAT(updated_at, '%Y-%m-%d %H:%i:%s') AS 'updated_at'
    FROM applicants
    WHERE email = ${email}
    LIMIT 1
`;

# Builds query to update an applicants profile by email.
#
# + email - Email of the applicants profile
# + applicant - Partial applicant profile to update
# + return - sql:ParameterizedQuery - Update query for the applicants table
isolated function updateApplicantProfileByEmailQuery(string email, UpdateApplicantProfile applicant)
    returns sql:ParameterizedQuery {

    sql:ParameterizedQuery mainQuery = `UPDATE applicants SET `;
    sql:ParameterizedQuery subQuery = ` WHERE email = ${email}`;
    sql:ParameterizedQuery[] filters = [];

    if applicant.first_name is string {
        filters.push(`first_name = ${applicant.first_name}`);
    }
    if applicant.last_name is string {
        filters.push(`last_name = ${applicant.last_name}`);
    }
    if applicant.email is string {
        filters.push(`email = ${applicant.email}`);
    }
    if applicant.phone is string {
        filters.push(`phone = ${applicant.phone}`);
    }
    if applicant.address is string {
        filters.push(`address = ${applicant.address}`);
    }
    if applicant.country is string {
        filters.push(`country = ${applicant.country}`);
    }
    if applicant.status is string {
        filters.push(`status = ${applicant.status}`);
    }
    if applicant.professional_links is ProfessionalLinks[] {
        string jsonStr = applicant.professional_links.toJsonString();
        filters.push(`professional_links = ${jsonStr}`);
    }
    if applicant.educations is Educations[] {
        string jsonStr = applicant.educations.toJsonString();
        filters.push(`educations = ${jsonStr}`);
    }
    if applicant.experiences is Experiences[] {
        string jsonStr = applicant.experiences.toJsonString();
        filters.push(`experiences = ${jsonStr}`);
    }
    if applicant.skills is Skills {
        string jsonStr = applicant.skills.toJsonString();
        filters.push(`skills = ${jsonStr}`);
    }
    if applicant.certifications is Certifications[] {
        string jsonStr = applicant.certifications.toJsonString();
        filters.push(`certifications = ${jsonStr}`);
    }
    if applicant.projects is Projects[] {
        string jsonStr = applicant.projects.toJsonString();
        filters.push(`projects = ${jsonStr}`);
    }
    if applicant.languages is Languages[] {
        string jsonStr = applicant.languages.toJsonString();
        filters.push(`languages = ${jsonStr}`);
    }
    if applicant.interests is Interests {
        string jsonStr = applicant.interests.toJsonString();
        filters.push(`interests = ${jsonStr}`);
    }
    if applicant.user_thumbnail is string {
        filters.push(`user_thumbnail = ${applicant.user_thumbnail}`);
    }
    if applicant.resume_link is string {
        filters.push(`resume_link = ${applicant.resume_link}`);
    }
    if applicant.updated_by is string {
        filters.push(`updated_by = ${applicant.updated_by}`);
    }

    // Always update `updated_at` field
    filters.push(`updated_at = current_timestamp`);

    mainQuery = buildSqlUpdateQuery(mainQuery, filters);

    return sql:queryConcat(mainQuery, subQuery);
}

# Builds query to retrieve all applicant profiles.
#
# + return - sql:ParameterizedQuery - Select all applicants query
isolated function getAllApplicantsQuery() returns sql:ParameterizedQuery =>
    `SELECT
        id AS 'id',
        first_name AS 'first_name',
        last_name AS 'last_name',
        email AS 'email',
        phone AS 'phone',
        address AS 'address',
        country AS 'country',
        status AS 'status',
        professional_links AS 'professional_links',
        educations AS 'educations',
        experiences AS 'experiences',
        skills AS 'skills',
        certifications AS 'certifications',
        projects AS 'projects',
        languages AS 'languages',
        interests AS 'interests',
        user_thumbnail AS 'user_thumbnail',
        resume_link AS 'resume_link',
        created_by AS 'created_by',
        DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') AS 'created_at',
        updated_by AS 'updated_by',
        DATE_FORMAT(updated_at, '%Y-%m-%d %H:%i:%s') AS 'updated_at'
     FROM applicants`;
