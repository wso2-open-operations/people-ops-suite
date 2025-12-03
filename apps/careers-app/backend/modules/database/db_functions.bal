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
public isolated function createApplicant(CreateApplicantProfile ApplicantProfile) returns int|error {

    sql:ExecutionResult|error result = check dbClient->execute(
        createapplicantProfileQuery(ApplicantProfile));
    if result is error {
        return result;
    }
    return <int>result.lastInsertId;
}

# Retrieves an applicant profile by email.
#
# + email - Email of the applicant
# + return - ApplicantProfile | error
public isolated function getApplicant(string email) returns ApplicantProfile|error {
    ApplicantProfileDB|sql:Error dbResult = dbClient->queryRow(getApplicantByEmailQuery(email));

    if dbResult is sql:NoRowsError {
        return error("No applicant found with email: " + email);
    }
    if dbResult is sql:Error {
        string errorMsg = string `An error occurred when retrieving applicant profile with email ${email}!`;
        log:printError(errorMsg, dbResult);
        return error(errorMsg);
    }

    // Transform JSON fields to typed arrays
    ProfessionalLinks[]|error professionalLinks = dbResult.professionalLinks.fromJsonStringWithType();
    if professionalLinks is error {
        string errorMsg = string `Error parsing professionalLinks for applicant ${email}!`;
        log:printError(errorMsg, professionalLinks);
        return error(errorMsg);
    }

    Educations[]|error educations = dbResult.educations.fromJsonStringWithType();
    if educations is error {
        string errorMsg = string `Error parsing educations for applicant ${email}!`;
        log:printError(errorMsg, educations);
        return error(errorMsg);
    }

    Experiences[]|error experiences = dbResult.experiences.fromJsonStringWithType();
    if experiences is error {
        string errorMsg = string `Error parsing experiences for applicant ${email}!`;
        log:printError(errorMsg, experiences);
        return error(errorMsg);
    }

    Skills|error skills = dbResult.skills.fromJsonStringWithType();
    if skills is error {
        string errorMsg = string `Error parsing skills for applicant ${email}!`;
        log:printError(errorMsg, skills);
        return error(errorMsg);
    }

    Certifications[]|error certifications = dbResult.certifications.fromJsonStringWithType();
    if certifications is error {
        string errorMsg = string `Error parsing certifications for applicant ${email}!`;
        log:printError(errorMsg, certifications);
        return error(errorMsg);
    }

    Projects[]|error projects = dbResult.projects.fromJsonStringWithType();
    if projects is error {
        string errorMsg = string `Error parsing projects for applicant ${email}!`;
        log:printError(errorMsg, projects);
        return error(errorMsg);
    }

    Languages[]|error languages = dbResult.languages.fromJsonStringWithType();
    if languages is error {
        string errorMsg = string `Error parsing languages for applicant ${email}!`;
        log:printError(errorMsg, languages);
        return error(errorMsg);
    }

    Interests|error interests = dbResult.interests.fromJsonStringWithType();
    if interests is error {
        string errorMsg = string `Error parsing interests for applicant ${email}!`;
        log:printError(errorMsg, interests);
        return error(errorMsg);
    }

    return {
        id: dbResult.id,
        firstName: dbResult.firstName,
        lastName: dbResult.lastName,
        email: dbResult.email,
        phone: dbResult.phone,
        address: dbResult.address,
        country: dbResult.country,
        status: dbResult.status,
        professionalLinks: professionalLinks,
        educations: educations,
        experiences: experiences,
        skills: skills,
        certifications: certifications,
        projects: projects,
        languages: languages,
        interests: interests,
        userThumbnail: dbResult.userThumbnail,
        resume: dbResult.resume,
        createdBy: dbResult.createdBy,
        createdAt: dbResult.createdAt,
        updatedBy: dbResult.updatedBy,
        updatedAt: dbResult.updatedAt
    };
}

# Updates an applicant profile by email.
#
# + email - Email of the applicant profile
# + updateData - Partial applicant profile details to update
# + return - Updated ApplicantProfile | error
public isolated function updateApplicant(string email, UpdateApplicantProfileRequest updateData) returns ApplicantProfile|error {
    sql:ExecutionResult|error result = check dbClient->execute(
        updateApplicantProfileByEmailQuery(email, updateData));

    if result is error {
        return result;
    }

    // Check if any rows were updated
    if result.affectedRowCount == 0 {
        return error("No applicant found with email: " + email);
    }

    // Fetch and return the updated profile
    return check getApplicant(email);
}

# Retrieves all applicant profiles.
#
# + return - Array of ApplicantProfile | error
public isolated function getApplicants() returns ApplicantProfile[]|error {
    stream<ApplicantProfileDB, sql:Error?> resultStream = dbClient->query(getAllApplicantsQuery());

    // Initialize an array to store the profiles
    ApplicantProfile[] profiles = [];

    // Process each record in the stream to handle null values properly
    record {|ApplicantProfileDB value;|}? result = check resultStream.next();
    while result is record {|ApplicantProfileDB value;|} {
        ApplicantProfileDB dbResult = result.value;

        // Initialize default empty values for potential null fields
        ProfessionalLinks[] professionalLinks = [];
        Educations[] educations = [];
        Experiences[] experiences = [];
        Skills skills = [];
        Certifications[] certifications = [];
        Projects[] projects = [];
        Languages[] languages = [];
        Interests interests = [];

        // Parse professionalLinks if not null or "null"
        if dbResult.professionalLinks != "" && dbResult.professionalLinks != "null" {
            ProfessionalLinks[]|error plResult = dbResult.professionalLinks.fromJsonStringWithType();
            if plResult is error {
                log:printError(string `Error parsing professionalLinks for applicant ${dbResult.id}`, plResult);
            } else {
                professionalLinks = plResult;
            }
        }

        // Parse educations if not null or "null"
        if dbResult.educations != "" && dbResult.educations != "null" {
            Educations[]|error eduResult = dbResult.educations.fromJsonStringWithType();
            if eduResult is error {
                log:printError(string `Error parsing educations for applicant ${dbResult.id}`, eduResult);
            } else {
                educations = eduResult;
            }
        }

        // Parse experiences if not null or "null"
        if dbResult.experiences != "" && dbResult.experiences != "null" {
            Experiences[]|error expResult = dbResult.experiences.fromJsonStringWithType();
            if expResult is error {
                log:printError(string `Error parsing experiences for applicant ${dbResult.id}`, expResult);
            } else {
                experiences = expResult;
            }
        }

        // Parse skills if not null or "null"
        if dbResult.skills != "" && dbResult.skills != "null" {
            Skills|error skillsResult = dbResult.skills.fromJsonStringWithType();
            if skillsResult is error {
                log:printError(string `Error parsing skills for applicant ${dbResult.id}`, skillsResult);
            } else {
                skills = skillsResult;
            }
        }

        // Parse certifications if not null or "null"
        if dbResult.certifications != "" && dbResult.certifications != "null" {
            Certifications[]|error certResult = dbResult.certifications.fromJsonStringWithType();
            if certResult is error {
                log:printError(string `Error parsing certifications for applicant ${dbResult.id}`, certResult);
            } else {
                certifications = certResult;
            }
        }

        // Parse projects if not null or "null"
        if dbResult.projects != "" && dbResult.projects != "null" {
            Projects[]|error projResult = dbResult.projects.fromJsonStringWithType();
            if projResult is error {
                log:printError(string `Error parsing projects for applicant ${dbResult.id}`, projResult);
            } else {
                projects = projResult;
            }
        }

        // Parse languages if not null or "null"
        if dbResult.languages != "" && dbResult.languages != "null" {
            Languages[]|error langResult = dbResult.languages.fromJsonStringWithType();
            if langResult is error {
                log:printError(string `Error parsing languages for applicant ${dbResult.id}`, langResult);
            } else {
                languages = langResult;
            }
        }

        // Parse interests if not null or "null"
        if dbResult.interests != "" && dbResult.interests != "null" {
            Interests|error intResult = dbResult.interests.fromJsonStringWithType();
            if intResult is error {
                log:printError(string `Error parsing interests for applicant ${dbResult.id}`, intResult);
            } else {
                interests = intResult;
            }
        }

        // Create and add the transformed profile to the array
        profiles.push({
            id: dbResult.id,
            firstName: dbResult.firstName,
            lastName: dbResult.lastName,
            email: dbResult.email,
            phone: dbResult.phone,
            address: dbResult.address,
            country: dbResult.country,
            status: dbResult.status,
            professionalLinks: professionalLinks,
            educations: educations,
            experiences: experiences,
            skills: skills,
            certifications: certifications,
            projects: projects,
            languages: languages,
            interests: interests,
            userThumbnail: dbResult.userThumbnail,
            resume: dbResult.resume,
            createdBy: dbResult.createdBy,
            updatedBy: dbResult.updatedBy,
            createdAt: dbResult.createdAt,
            updatedAt: dbResult.updatedAt
        });

        result = check resultStream.next();
    }

    check resultStream.close();

    return profiles;
}
