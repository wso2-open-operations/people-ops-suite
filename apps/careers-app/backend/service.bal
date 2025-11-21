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
        error? photoSizeErr = validateFileSize(applicant.userThumbnail);
        if photoSizeErr is error {
            string errorMessage = "Profile photo exceeds 10 MB limit";
            log:printError(errorMessage, photoSizeErr);
            return <http:BadRequest>{
                body: {
                    message: errorMessage
                }
            };
        }

        error? cvSizeErr = validateFileSize(applicant.resume);
        if cvSizeErr is error {
            string errorMessage = "CV exceeds 10 MB limit";
            log:printError(errorMessage, cvSizeErr);
            return <http:BadRequest>{
                body: {
                    message: errorMessage
                }
            };
        }

        string applicantFolderName = string `${applicant.firstName}_${applicant.lastName}`;
        string applicantEmail = applicant.email;

        // Construct unique file names
        string ts = time:utcToString(time:utcNow());

        string photoExt = getFileExtension(applicant.profile_photo_file_name);
        string photoFileName = string `${applicantFolderName}_profile.${photoExt}_${ts}`;

        string cvExt = getFileExtension(applicant.cv_file_name);
        string cvFileName = string `${applicantFolderName}_resume.${cvExt}_${ts}`;

        // Upload profile photo
        byte[]|error photoBytes = gdrive:uploadApplicantPhoto(applicant.userThumbnail, photoFileName, applicantEmail);
        if photoBytes is gdrive:InvalidFileTypeError {
            string errorMessage = "Invalid profile photo type. Must be an image.";
            log:printError(errorMessage, photoBytes);
            return <http:BadRequest>{
                body: {
                    message: errorMessage
                }
            };
        }
        if photoBytes is error {
            string errorMessage = "Failed to upload profile photo.";
            log:printError(errorMessage, photoBytes);
            return <http:InternalServerError>{
                body: {
                    message: errorMessage
                }
            };
        }

        // Upload CV
        byte[]|error cvBytes = gdrive:uploadApplicantCv(applicant.resume, cvFileName, applicantEmail);
        if cvBytes is gdrive:InvalidFileTypeError {
            string errorMessage = "Invalid CV type. Must be PDF.";
            log:printError(errorMessage, cvBytes);
            return <http:BadRequest>{
                body: {
                    message: errorMessage
                }
            };
        }
        if cvBytes is error {
            string errorMessage = "Failed to upload CV.";
            log:printError(errorMessage, cvBytes);
            return <http:InternalServerError>{
                body: {
                    message: errorMessage
                }
            };
        }

        // Build DB payload with byte arrays + audit
        database:CreateApplicantProfile dbPayload = {
            firstName: applicant.firstName,
            lastName: applicant.lastName,
            email: applicant.email,
            phone: applicant.phone,
            address: applicant.address,
            country: applicant.country,
            status: applicant.status,
            professionalLinks: applicant.professionalLinks,
            educations: applicant.educations,
            experiences: applicant.experiences,
            skills: applicant.skills,
            certifications: applicant.certifications,
            projects: applicant.projects,
            languages: applicant.languages,
            interests: applicant.interests,

            userThumbnail: photoBytes,
            resume: cvBytes,
            createdBy: actor,
            updatedBy: actor
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

    # Retrieve an applicant profile by email.
    #
    # + email - Email of the applicant (passed as path param)
    # + return - ApplicantProfile if found, else 404 if not
    resource function get applicants/[string email](http:RequestContext ctx)
        returns database:ApplicantProfile|http:NotFound|http:InternalServerError {

        log:printInfo(string `Checking applicant profile for email: ${email}`);

        database:ApplicantProfile|error applicant = database:getApplicantProfileByEmail(email);

        if applicant is error {
            if applicant.message().startsWith("No applicant found with email:") {
                string notFoundMsg = "Applicant profile not found for email: " + email;
                log:printInfo(notFoundMsg);
                return <http:NotFound>{
                    body: {
                        message: notFoundMsg
                    }
                };
            }

            string errMsg = "Error occurred while retrieving applicant profile for email: " + email;
            log:printError(errMsg, applicant);
            return <http:InternalServerError>{
                body: {
                    message: errMsg
                }
            };
        }

        return applicant;
    }

    # Update a applicant profile.
    #
    # + email - Email of the applicant
    # + applicant - Partial applicant profile details to update
    # + return - Updated applicantProfile|Errors
    resource function patch applicants/[string email](http:RequestContext ctx, UpdateApplicantProfileRequest applicant)
        returns database:ApplicantProfile|http:BadRequest|http:InternalServerError|http:NotFound {

        log:printInfo(string `Updating applicant profile for email: ${email}`);

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

        // Build the database update payload
        database:UpdateApplicantProfile dbPayload = {
            firstName: applicant.firstName,
            lastName: applicant.lastName,
            email: applicant.email,
            phone: applicant.phone,
            address: applicant.address,
            country: applicant.country,
            status: applicant.status,
            professionalLinks: applicant.professionalLinks,
            educations: applicant.educations,
            experiences: applicant.experiences,
            skills: applicant.skills,
            certifications: applicant.certifications,
            projects: applicant.projects,
            languages: applicant.languages,
            interests: applicant.interests,
            updatedBy: actor
        };

        // Handle profile photo update if provided
        byte[]? byteArrayPhoto = applicant?.userThumbnail;
        if byteArrayPhoto is byte[] && byteArrayPhoto.length() > 0 {
            // Validate file size
            error? photoSizeErr = validateFileSize(byteArrayPhoto);
            if photoSizeErr is error {
                string errorMessage = "Profile photo exceeds 10 MB limit";
                log:printError(errorMessage, photoSizeErr);
                return <http:BadRequest>{
                    body: {
                        message: errorMessage
                    }
                };
            }

            // Construct unique file name
            string applicantFolderName = string `${applicant?.firstName ?: email}_${applicant?.lastName ?: ""}`;
            string ts = time:utcToString(time:utcNow());
            string photoExt = getFileExtension(applicant?.profile_photo_file_name);
            string photoFileName = string `${applicantFolderName}_profile.${photoExt}_${ts}`;

            // Upload profile photo
            byte[]|error photoBytes = gdrive:uploadApplicantPhoto(byteArrayPhoto, photoFileName, email);
            if photoBytes is gdrive:InvalidFileTypeError {
                string errorMessage = "Invalid profile photo type. Must be an image.";
                log:printError(errorMessage, photoBytes);
                return <http:BadRequest>{
                    body: {
                        message: errorMessage
                    }
                };
            }
            if photoBytes is error {
                string errorMessage = "Failed to upload profile photo.";
                log:printError(errorMessage, photoBytes);
                return <http:InternalServerError>{
                    body: {
                        message: errorMessage
                    }
                };
            }

            dbPayload.userThumbnail = photoBytes;
        }

        // Handle CV update if provided
        byte[]? byteArrayCv = applicant?.resume;
        if byteArrayCv is byte[] && byteArrayCv.length() > 0 {
            // Validate file size
            error? cvSizeErr = validateFileSize(byteArrayCv);
            if cvSizeErr is error {
                string errorMessage = "CV exceeds 10 MB limit";
                log:printError(errorMessage, cvSizeErr);
                return <http:BadRequest>{
                    body: {
                        message: errorMessage
                    }
                };
            }

            // Construct unique file name
            string applicantFolderName = string `${applicant?.firstName ?: email}_${applicant?.lastName ?: ""}`;
            string ts = time:utcToString(time:utcNow());
            string cvExt = getFileExtension(applicant?.cv_file_name);
            string cvFileName = string `${applicantFolderName}_resume.${cvExt}_${ts}`;

            // Upload CV
            byte[]|error cvBytes = gdrive:uploadApplicantCv(byteArrayCv, cvFileName, email);
            if cvBytes is gdrive:InvalidFileTypeError {
                string errorMessage = "Invalid CV type. Must be PDF.";
                log:printError(errorMessage, cvBytes);
                return <http:BadRequest>{
                    body: {
                        message: errorMessage
                    }
                };
            }
            if cvBytes is error {
                string errorMessage = "Failed to upload CV.";
                log:printError(errorMessage, cvBytes);
                return <http:InternalServerError>{
                    body: {
                        message: errorMessage
                    }
                };
            }

            dbPayload.resume = cvBytes;
        }

        // Update profile in database
        database:ApplicantProfile|error updatedProfile = database:updateProfileByEmail(email, dbPayload);
        if updatedProfile is error {
            if updatedProfile.message().startsWith("No applicant found with email:") {
                string notFoundMsg = "Applicant profile not found for email: " + email;
                log:printInfo(notFoundMsg);
                return <http:NotFound>{
                    body: {
                        message: notFoundMsg
                    }
                };
            }
            string errorMessage = "Failed to update applicant profile.";
            log:printError(errorMessage, updatedProfile);
            return <http:InternalServerError>{
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
