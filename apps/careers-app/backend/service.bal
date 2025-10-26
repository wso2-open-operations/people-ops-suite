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
// under the License

import careers_app.authorization;
import careers_app.database;
import careers_app.gdrive;
import careers_app.people;

import ballerina/cache;
import ballerina/http;
import ballerina/log;
import ballerina/time;

public configurable AppConfig appConfig = ?;

final cache:Cache cache = new ({
    capacity: 2000,
    defaultMaxAge: 1800.0,
    cleanupInterval: 900.0
});

@display {
    label: "careers Backend Service",
    id: "people-ops/careers-app"
}

service class ErrorInterceptor {
    *http:ResponseErrorInterceptor;

    remote function interceptResponseError(error err, http:RequestContext ctx) returns http:BadRequest|error {

        // Handle data-binding errors.
        if err is http:PayloadBindingError {
            string customError = string `Payload binding failed: ${err.message()}`;
            log:printError(customError, err);
            return {
                body: {
                    message: customError
                }
            };
        }
        return err;
    }

}

service http:InterceptableService / on new http:Listener(9090) {

    # Request interceptor.
    #
    # + return - authorization:JwtInterceptor, ErrorInterceptor
    public function createInterceptors() returns http:Interceptor[] =>
        [new authorization:JwtInterceptor(), new ErrorInterceptor()];

    # Retrieve application configurations.
    #
    # + return - Application configuration object or error
    resource function get app\-config() returns AppConfig => appConfig;

    # Fetch user information of the logged in users.
    #
    # + ctx - Request object
    # + return - User information | Error
    resource function get user\-info(http:RequestContext ctx) returns UserInfoResponse|http:InternalServerError {

        // User information header.
        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            return <http:InternalServerError>{
                body: {
                    message: "User information header not found!"
                }
            };
        }

        // Check if the employees are already cached.
        if cache.hasKey(userInfo.email) {
            UserInfoResponse|error cachedUserInfo = cache.get(userInfo.email).ensureType();
            if cachedUserInfo is UserInfoResponse {
                return cachedUserInfo;
            }
        }

        // Fetch the user information from the people service.
        people:Employee|error loggedInUser = people:fetchEmployeesBasicInfo(userInfo.email);
        if loggedInUser is error {
            string customError = string `Error occurred while retrieving user data: ${userInfo.email}!`;
            log:printError(customError, loggedInUser);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        // Fetch the user's privileges based on the roles.
        int[] privileges = [];
        if authorization:checkPermissions([authorization:authorizedRoles.SALES_TEAM], userInfo.groups) {
            privileges.push(authorization:SALES_TEAM_PRIVILEGE);
        }
        if authorization:checkPermissions([authorization:authorizedRoles.SALES_ADMIN], userInfo.groups) {
            privileges.push(authorization:SALES_ADMIN_PRIVILEGE);
        }

        UserInfoResponse userInfoResponse = {...loggedInUser, privileges};

        error? cacheError = cache.put(userInfo.email, userInfoResponse);
        if cacheError is error {
            log:printError("An error occurred while writing user info to the cache", cacheError);
        }
        return userInfoResponse;
    }

    # Create a new applicant profile.
    #
    # + applicant - JSON payload with applicant details
    # + return - Created profile ID | Errors
    resource function post applicants(http:RequestContext ctx, CreateApplicantProfileRequest applicant)
        returns http:Created|http:BadRequest|http:InternalServerError {

        authorization:CustomJwtPayload|error invokerInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if invokerInfo is error {
            string errorMessage = "User information header not found!";
            log:printError(errorMessage, invokerInfo);
            return <http:InternalServerError>{
                body: {
                    message: errorMessage
                }
            };
        }

        string actor = invokerInfo.email;

        // Validate file sizes
        error? photoSizeErr = validateFileSize(applicant.base64_profile_photo);
        if photoSizeErr is error {
            string errorMessage = "Profile photo exceeds 10 MB limit";
            log:printError(errorMessage, photoSizeErr);
            return <http:BadRequest>{
                body: {
                    message: errorMessage
                }
            };
        }

        error? cvSizeErr = validateFileSize(applicant.base64_cv);
        if cvSizeErr is error {
            string errorMessage = "CV exceeds 10 MB limit";
            log:printError(errorMessage, cvSizeErr);
            return <http:BadRequest>{
                body: {
                    message: errorMessage
                }
            };
        }

        string applicantFolderName = string `${applicant.first_name}_${applicant.last_name}`;
        string applicantEmail      = applicant.email;

        // Construct unique file names
        string ts = time:utcToString(time:utcNow());

        string photoExt = getFileExtension(applicant.profile_photo_file_name);
        string photoFileName = string `${applicantFolderName}_profile.${photoExt}_${ts}`;

        string cvExt = getFileExtension(applicant.cv_file_name);
        string cvFileName = string `${applicantFolderName}_resume.${cvExt}_${ts}`;

        // Upload profile photo
        string|error photoLink = gdrive:uploadApplicantPhoto(applicant.base64_profile_photo, photoFileName, applicantEmail);
        if photoLink is gdrive:InvalidFileTypeError {
            string errorMessage = "Invalid profile photo type. Must be an image.";
            log:printError(errorMessage, photoLink);
            return <http:BadRequest>{
                body: {
                    message: errorMessage
                }
            };
        }
        if photoLink is error {
            string errorMessage = "Failed to upload profile photo.";
            log:printError(errorMessage, photoLink);
            return <http:InternalServerError>{
                body: {
                    message: errorMessage
                }
            };
        }

        // Upload CV
        string|error cvLink = gdrive:uploadApplicantCv(applicant.base64_cv, cvFileName, applicantEmail);
        if cvLink is gdrive:InvalidFileTypeError {
            string errorMessage = "Invalid CV type. Must be PDF.";
            log:printError(errorMessage, cvLink);
            return <http:BadRequest>{
                body: {
                    message: errorMessage
                }
            };
        }
        if cvLink is error {
            string errorMessage = "Failed to upload CV.";
            log:printError(errorMessage, cvLink);
            return <http:InternalServerError>{
                body: {
                    message: errorMessage
                }
            };
        }

        // Build DB payload with final links + audit
        database:CreateApplicantProfile dbPayload = {
            first_name: applicant.first_name,
            last_name: applicant.last_name,
            email: applicant.email,
            phone: applicant.phone,
            address: applicant.address,
            country: applicant.country,
            status: applicant.status,
            professional_links: applicant.professional_links,
            educations: applicant.educations,
            experiences: applicant.experiences,
            skills: applicant.skills,
            certifications: applicant.certifications,
            projects: applicant.projects,
            languages: applicant.languages,
            interests: applicant.interests,

            user_thumbnail: photoLink,
            resume_link: cvLink,
            created_by: actor,
            updated_by: actor
        };

        // Insert into database
        int|error applicantId = database:createProfile(dbPayload);
        if applicantId is error {
            string errorMessage = "Failed to create applicant profile.";
            log:printError(errorMessage, applicantId);
            return <http:InternalServerError>{
                body: {
                    message: errorMessage
                }
            };
        }

        return <http:Created>{
            body: {
                message: "applicant profile created successfully.",
                id: applicantId
            }
        };
    }

    # Get a applicant profile by ID.
    #
    # + id - ID of the applicant
    # + return - ApplicantProfile|Error
    resource function get applicants/[int id](http:RequestContext ctx)
        returns database:ApplicantProfile|http:InternalServerError|http:NotFound {

        // Fetch the applicant profile from the database.
        database:ApplicantProfile|error applicant = database:getapplicantProfileById(id);

        if applicant is error {
            // Check if the error is due to a non-existent applicant
            if applicant.message().startsWith("No applicant found with ID:") {
                string customError = "Applicant profile not found!";
                log:printError(customError, applicant);
                return <http:NotFound>{
                    body: {
                        message: customError
                    }
                };
            }

            // For other types of errors, return internal server error
            string customError = "Error occurred while retrieving the applicant profile!";
            log:printError(customError, applicant);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }
        return applicant;
    }

    # Update a applicant profile.
    #
    # + id - ID of the applicant
    # + applicant - Partial applicant profile details to update
    # + return - Updated applicantProfile|Errors
    resource function patch applicants/[int id](http:RequestContext ctx, UpdateApplicantProfile applicant)
        returns database:ApplicantProfile|http:BadRequest|http:InternalServerError|http:NotFound {

        // Update profile in database
        database:ApplicantProfile|error? updatedProfile = database:updateProfile(id, applicant);
        if updatedProfile is error {
            string errorMessage = "Failed to update applicant profile.";
            log:printError(errorMessage, updatedProfile);
            return <http:InternalServerError>{
                body: {
                    message: errorMessage
                }
            };
        }
        if updatedProfile is null {
            string errorMessage = "applicant profile not found.";
            log:printError(errorMessage);
            return <http:NotFound>{
                body: {
                    message: errorMessage
                }
            };
        }
        return updatedProfile;
    }

    # Get all applicant profiles.
    #
    # + return - List of applicant profiles | Errors
    resource function get applicants(http:RequestContext ctx)
        returns database:ApplicantProfile[]|http:InternalServerError {

        database:ApplicantProfile[]|error applicants = database:getAllApplicants();
        if applicants is error {
            string errMsg = "Failed to retrieve applicant profiles.";
            log:printError(errMsg, applicants);
            return <http:InternalServerError>{
                body: {
                    message: errMsg
                }
            };
        }
        return applicants;
    }
}
