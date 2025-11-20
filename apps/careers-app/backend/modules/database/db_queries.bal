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
        firstName,
        lastName, 
        email, 
        phone, 
        address, 
        country, 
        status,
        professionalLinks, 
        educations, 
        experiences, 
        skills, 
        certifications, 
        projects, 
        languages, 
        interests,
        userThumbnail,
        resume,
        createdBy,
        updatedBy
    ) VALUES (
        ${applicant.firstName}, 
        ${applicant.lastName}, 
        ${applicant.email}, 
        ${applicant.phone}, 
        ${applicant.address},
        ${applicant.country}, 
        ${applicant.status},
        ${applicant.professionalLinks.toString()}, 
        ${applicant.educations.toString()}, 
        ${applicant.experiences.toString()},
        ${applicant.skills.toString()}, 
        ${applicant.certifications.toString()}, 
        ${applicant.projects.toString()},
        ${applicant.languages.toString()}, 
        ${applicant.interests.toString()},
        ${applicant.userThumbnail},
        ${applicant.resume},
        ${applicant.createdBy},
        ${applicant.updatedBy}
    )`;

# Retrieve applicant profile by email.
#
# + email - Email of the applicant to retrieve
# + return - sql:ParameterizedQuery - Select query for the applicants table
isolated function getApplicantByEmailQuery(string email) returns sql:ParameterizedQuery => `
    SELECT
        id AS 'id',
        firstName AS 'firstName',
        lastName AS 'lastName',
        email AS 'email',
        phone AS 'phone',
        address AS 'address',
        country AS 'country',
        status AS 'status',
        professionalLinks AS 'professionalLinks',
        educations AS 'educations',
        experiences AS 'experiences',
        skills AS 'skills',
        certifications AS 'certifications',
        projects AS 'projects',
        languages AS 'languages',
        interests AS 'interests',
        userThumbnail AS 'userThumbnail',
        resume AS 'resume',
        createdBy AS 'createdBy',
        updatedBy AS 'updatedBy',
        DATE_FORMAT(createdAt, '%Y-%m-%d %H:%i:%s') AS 'createdAt',
        DATE_FORMAT(updatedAt, '%Y-%m-%d %H:%i:%s') AS 'updatedAt'
    FROM applicants
    WHERE email = ${email}
    LIMIT 1;
`;

# Builds query to update an applicants profile by email.
#
# + email - Email of the applicants profile
# + applicant - Partial applicant profile to update
# + return - sql:ParameterizedQuery - Update query for the applicants table
isolated function updateApplicantProfileByEmailQuery(string email, UpdateApplicantProfile applicant)
    returns sql:ParameterizedQuery {

    sql:ParameterizedQuery mainQuery = `UPDATE applicants SET `;
    sql:ParameterizedQuery subQuery = ` WHERE email = ${email} LIMIT 1`;
    sql:ParameterizedQuery[] filters = [];

    if applicant.firstName is string {
        filters.push(`firstName = ${applicant.firstName}`);
    }
    if applicant.lastName is string {
        filters.push(`lastName = ${applicant.lastName}`);
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
    if applicant.professionalLinks is ProfessionalLinks[] {
        string jsonStr = applicant.professionalLinks.toJsonString();
        filters.push(`professionalLinks = ${jsonStr}`);
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
    byte[]? userThumbnail = applicant?.userThumbnail;
    if userThumbnail is byte[] {
        filters.push(`userThumbnail = ${userThumbnail}`);
    }
    byte[]? resumeLink = applicant?.resume;
    if resumeLink is byte[] {
        filters.push(`resume = ${resumeLink}`);
    }
    if applicant.updatedBy is string {
        filters.push(`updatedBy = ${applicant.updatedBy}`);
    }

    // Always update `updatedAt` field
    filters.push(`updatedAt = current_timestamp`);

    mainQuery = buildSqlUpdateQuery(mainQuery, filters);

    return sql:queryConcat(mainQuery, subQuery);
}

# Builds query to retrieve all applicant profiles.
#
# + return - sql:ParameterizedQuery - Select all applicants query
isolated function getAllApplicantsQuery() returns sql:ParameterizedQuery =>
    `SELECT
        id AS 'id',
        firstName AS 'firstName',
        lastName AS 'lastName',
        email AS 'email',
        phone AS 'phone',
        address AS 'address',
        country AS 'country',
        status AS 'status',
        professionalLinks AS 'professionalLinks',
        educations AS 'educations',
        experiences AS 'experiences',
        skills AS 'skills',
        certifications AS 'certifications',
        projects AS 'projects',
        languages AS 'languages',
        interests AS 'interests',
        userThumbnail AS 'userThumbnail',
        resume AS 'resume',
        createdBy AS 'createdBy',
        DATE_FORMAT(createdAt, '%Y-%m-%d %H:%i:%s') AS 'createdAt',
        updatedBy AS 'updatedBy',
        DATE_FORMAT(updatedAt, '%Y-%m-%d %H:%i:%s') AS 'updatedAt'
     FROM applicants`;
