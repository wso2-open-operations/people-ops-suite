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

import ballerina/log;
import ballerina/sql;

# Creates a new applicants profile.
#
# + ApplicantProfile - applicant profile details
# + return - ID of the applicant profile | Error
public isolated function createProfile(CreateApplicantProfile ApplicantProfile) returns int|error {

    sql:ExecutionResult|error result = check dbClient->execute(
        createapplicantProfileQuery(ApplicantProfile));
    if result is error {
        return result;
    }
    return <int>result.lastInsertId;
}

# Retrieves a applicant profile by ID.
#
# + id - ID of the applicant profile
# + return - ApplicantProfile | error 
public isolated function getapplicantProfileById(int id) returns ApplicantProfile|error {
    ApplicantProfileDB|sql:Error dbResult = dbClient->queryRow(getapplicantProfileByIdQuery(id));

    if dbResult is sql:NoRowsError {
        return error("No applicant found with ID: " + id.toString());
    }
    if dbResult is sql:Error {
        string errorMsg = string `An error occurred when retrieving applicant profile with ID ${id}!`;
        log:printError(errorMsg, dbResult);
        return error(errorMsg);
    }

    // Transform database record to API type with JSON deserialization
    ProfessionalLinks[]|error professionalLinks = dbResult.professional_links.fromJsonStringWithType();
    if professionalLinks is error {
        string errorMsg = string `An error occurred when parsing professional_links for applicant ${id}!`;
        log:printError(errorMsg, professionalLinks);
        return error(errorMsg);
    }

    Educations[]|error educations = dbResult.educations.fromJsonStringWithType();
    if educations is error {
        string errorMsg = string `An error occurred when parsing educations for applicant ${id}!`;
        log:printError(errorMsg, educations);
        return error(errorMsg);
    }

    Experiences[]|error experiences = dbResult.experiences.fromJsonStringWithType();
    if experiences is error {
        string errorMsg = string `An error occurred when parsing experiences for applicant ${id}!`;
        log:printError(errorMsg, experiences);
        return error(errorMsg);
    }

    Skills|error skills = dbResult.skills.fromJsonStringWithType();
    if skills is error {
        string errorMsg = string `An error occurred when parsing skills for applicant ${id}!`;
        log:printError(errorMsg, skills);
        return error(errorMsg);
    }

    Certifications[]|error certifications = dbResult.certifications.fromJsonStringWithType();
    if certifications is error {
        string errorMsg = string `An error occurred when parsing certifications for applicant ${id}!`;
        log:printError(errorMsg, certifications);
        return error(errorMsg);
    }

    Projects[]|error projects = dbResult.projects.fromJsonStringWithType();
    if projects is error {
        string errorMsg = string `An error occurred when parsing projects for applicant ${id}!`;
        log:printError(errorMsg, projects);
        return error(errorMsg);
    }

    Languages[]|error languages = dbResult.languages.fromJsonStringWithType();
    if languages is error {
        string errorMsg = string `An error occurred when parsing languages for applicant ${id}!`;
        log:printError(errorMsg, languages);
        return error(errorMsg);
    }

    Interests|error interests = dbResult.interests.fromJsonStringWithType();
    if interests is error {
        string errorMsg = string `An error occurred when parsing interests for applicant ${id}!`;
        log:printError(errorMsg, interests);
        return error(errorMsg);
    }

    return {
        id: dbResult.id,
        first_name: dbResult.first_name,
        last_name: dbResult.last_name,
        email: dbResult.email,
        phone: dbResult.phone,
        address: dbResult.address,
        country: dbResult.country,
        status: dbResult.status,
        professional_links: professionalLinks,
        educations: educations,
        experiences: experiences,
        skills: skills,
        certifications: certifications,
        projects: projects,
        languages: languages,
        interests: interests,
        user_thumbnail: dbResult.user_thumbnail,
        resume_link: dbResult.resume_link,
        created_by: dbResult.created_by,
        created_at: dbResult.created_at,
        updated_by: dbResult.updated_by,
        updated_at: dbResult.updated_at
    };
}

# Updates a applicant profile.
#
# + id - ID of the applicant profile
# + updateData - Partial applicant profile details to update
# + return - Updated applicantProfile | error
public isolated function updateProfile(int id, UpdateApplicantProfile updateData) returns ApplicantProfile|error {
    sql:ExecutionResult|error result = check dbClient->execute(
        updateapplicantProfileQuery(id, updateData));

    if result is error {
        return result;
    }

    // Fetch and return the updated profile
    return check getapplicantProfileById(id);
}



