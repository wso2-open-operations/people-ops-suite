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
import careers_app.ats;

import ballerina/cache;
import ballerina/http;
import ballerina/lang.array;
import ballerina/log;
import ballerina/time;

public configurable AppConfig appConfig = ?;

isolated cache:Cache orgDetailsCache = new (capacity = 100, defaultMaxAge = 3600, evictionFactor = 0.25,
    cleanupInterval = 3600
);
isolated cache:Cache companiesCache = new (capacity = 100, defaultMaxAge = 3600, evictionFactor = 0.25,
    cleanupInterval = 3600
);

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
        if authorization:checkPermissions([authorization:authorizedRoles.CANDIDATE], userInfo.groups) {
            privileges.push(authorization:CANDIDATE_PRIVILEGE);
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
        int|error applicantId = database:createApplicant(dbPayload);
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

        database:ApplicantProfile|error applicant = database:getApplicant(email);

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

        // Set the updatedBy field to the invoker's email
        applicant.updatedBy = actor;

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
            string applicantFolderName = string `${applicant.firstName}_${applicant.lastName}`;
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

            applicant.userThumbnail = photoBytes;
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
            string applicantFolderName = string `${applicant.firstName}_${applicant.lastName}`;
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

            applicant.resume = cvBytes;
        }

        // Update profile in database
        database:ApplicantProfile|error updatedProfile = database:updateApplicant(email, applicant);
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

        database:ApplicantProfile[]|error applicants = database:getApplicants();
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

    # Get org details.
    #
    # + return - Org details or error
    resource function get org\-structure() returns ats:OrgStructure|http:InternalServerError {
        people:Company[]|error companies = getCompanies();
        if companies is error {
            string cusError = "Error while retrieving companies.";
            log:printError(cusError, companies);
            return {
                body: {
                    message: cusError
                }
            };
        }

        string[] locations = from people:Company c in companies
            select c.location;

        map<string> locationMap = {};
        foreach int i in 0 ..< locations.length() {
            locationMap[i.toString()] = locations[i];
        }

        people:BusinessUnit[]|error businessUnits = getOrgDetails();
        if businessUnits is error {
            string cusError = "Error while retrieving org details.";
            log:printError(cusError, businessUnits);
            return {
                body: {
                    message: cusError
                }
            };
        }

        string[] teamNames = from people:BusinessUnit bu in businessUnits
            let var departments = bu.departments
            where departments !is ()
            from people:Department dept in departments
            select dept.department;

        map<string> teamMap = {};
        foreach int i in 0 ..< teamNames.length() {
            teamMap[i.toString()] = teamNames[i];
        }

        ats:OrgStructure orgStructure = {
            location_list: locationMap,
            team_list: teamMap
        };

        return orgStructure.cloneReadOnly();
    }

    # Get basic info for vacancies.
    #
    # + depId - Department ID
    # + visibility - Visibility status
    # + officeId - Office ID
    # + designationId - Designation ID
    # + employmentType - Employment type
    # + return - Vacancies array or error
    resource function get vacancies/basic\-info(int? depId, string[]? visibility, int? officeId, int? designationId,
            string[]? employmentType) returns ats:VacancyBasicInfo[]|http:InternalServerError {

        ats:AtsVacancy[]|error rawVacancies = ats:getVacanciesBasicInfo(

                (), depId, visibility, officeId, designationId, employmentType);

        if rawVacancies is error {
            string cusError = "Error while retrieving vacancy basic info.";
            log:printError(cusError, rawVacancies);
            return {
                body: {
                    message: cusError
                }
            };
        }

        people:BusinessUnit[]|error businessUnits = getOrgDetails();
        if businessUnits is error {
            string cusError = "Error while retrieving org details.";
            log:printError(cusError, businessUnits);
            return {
                body: {
                    message: cusError
                }
            };
        }

        ats:VacancyBasicInfo[] basicInfos = [];
        foreach var v in rawVacancies {
            string? departmentName = from var bu in businessUnits
                where bu.id == v.businessUnitId
                from var dept in bu.departments ?: []
                where dept.id == v.departmentId
                select dept.department;
            if departmentName is () {
                log:printWarn(string `Department name not found for vacancy ID: ${v.id}, using "Unknown".`);
                departmentName = "Unknown";
            }
            basicInfos.push({
                id: v.id,
                title: v.title,
                publish_status: v.visibility,
                country: v.hiringLocations,
                job_type: v.employmentType,
                team: <string>departmentName,
                published_on: <string>v.publishedOn
            });
        }
        return basicInfos;
    }

    # Get a vacancy for the given ID.
    #
    # + return - Vacancy
    resource function get vacancies/[int id]() returns ats:Vacancy|http:BadRequest|http:InternalServerError {
        ats:AtsVacancy|error atsVacancy = ats:getVacancy(id);
        if atsVacancy is error {
            string cusError = string `Error while retrieving vacancy data for id: ${id}.`;
            log:printError(cusError, atsVacancy);
            return <http:InternalServerError>{
                body: {
                    message: cusError
                }
            };
        }
        ats:JdContent|error jd = atsVacancy.jdHtmlObject.fromJsonWithType();
        if jd is error {
            string cusError = string `Error while parsing job description for vacancy id: ${id}.`;
            log:printError(cusError, jd);
            return <http:InternalServerError>{
                body: {
                    message: cusError
                }
            };
        }

        people:Company[]|error companies = getCompanies();
        if companies is error {
            string cusError = string `Error while retrieving company details for vacancy id: ${id}.`;
            log:printError(cusError, companies);
            return <http:InternalServerError>{
                body: {
                    message: cusError
                }
            };
        }

        string? officeName = from var company in companies
            from var office in company.offices
            where office.id == atsVacancy.officeId
            select office.office;
        if officeName is () {
            log:printWarn(string `Office name not found for vacancy ID: ${atsVacancy.id}, office ID: ${atsVacancy.officeId}, using "Unknown".`);
            officeName = "Unknown";
        }

        people:BusinessUnit[]|error businessUnits = getOrgDetails();
        if businessUnits is error {
            string cusError = string `Error while retrieving org details for vacancy id: ${id}.`;
            log:printError(cusError, businessUnits);
            return <http:InternalServerError>{
                body: {
                    message: cusError
                }
            };
        }

        string? departmentName = from var bu in businessUnits
            where bu.id == atsVacancy.businessUnitId
            from var dept in bu.departments ?: []
            where dept.id == atsVacancy.departmentId
            select dept.department;
        if departmentName is () {
            log:printWarn(string `Department name not found for vacancy ID: ${atsVacancy.id}, using "Unknown".`);
            departmentName = "Unknown";
        }

        string|error designation = getDesignationById(atsVacancy.designationId);
        if designation is error {
            string cusError = string `Error while retrieving designation for vacancy id: ${id}.`;
            log:printError(cusError, designation);
            return <http:InternalServerError>{
                body: {
                    message: cusError
                }
            };
        }

        ats:AtsVacancy[]|error allVacancies = ats:getVacanciesBasicInfo(designationId = atsVacancy.designationId,
                employmentType = [atsVacancy.employmentType]);
        if allVacancies is error {
            string cusError = string `Error while retrieving similar vacancies for vacancy id: ${id}.`;
            log:printError(cusError, allVacancies);
            return <http:InternalServerError>{
                body: {
                    message: cusError
                }
            };
        }

        string[] sortedCurrentLocations = array:sort(atsVacancy.hiringLocations.clone());

        ats:VacancyBasicInfo[] similarVacancies = [];
        foreach var v in allVacancies {
            if v.id != id {
                string[] sortedVLocations = array:sort(v.hiringLocations.clone());
                if sortedVLocations == sortedCurrentLocations {
                    string? similarDepartmentName = from var bu in businessUnits
                        where bu.id == v.businessUnitId
                        from var dept in bu.departments ?: []
                        where dept.id == v.departmentId
                        select dept.department;
                    if similarDepartmentName is () {
                        log:printWarn(string `Department name not found for vacancy ID: ${v.id}, using "Unknown".`);
                        similarDepartmentName = "Unknown";
                    }
                    similarVacancies.push({
                        id: v.id,
                        title: v.title,
                        publish_status: v.visibility,
                        country: v.hiringLocations,
                        job_type: v.employmentType,
                        team: <string>similarDepartmentName,
                        published_on: v.publishedOn ?: ""
                    });
                }
            }
        }

        ats:Vacancy vacancy = {
            id: atsVacancy.id,
            title: atsVacancy.title,
            country: atsVacancy.hiringLocations,
            team: <string>departmentName,
            designation: designation,
            job_type: atsVacancy.employmentType,
            allow_remote: atsVacancy.modeOfWork === ats:REMOTE ? true : false,
            office_locations: {"0": <string>officeName},
            publish_status: atsVacancy.visibility,
            published_on: atsVacancy.publishedOn,
            mainContent: jd.mainContent,
            taskInformation: jd.taskInformation,
            additionalContent: jd.additionalContent,
            similar_job_listing: similarVacancies
        };

        return vacancy;
    }

    # Apply for a vacancy.
    #
    # + id - Vacancy ID
    # + candidate - Candidate details
    # + return - Success response or error
    resource function post vacancies/[int id]/apply(ats:Candidate candidate)
        returns http:Ok|http:InternalServerError|http:BadRequest {

        ats:AtsVacancy|error vacancy = ats:getVacancy(id);
        if vacancy is error {
            string cusError = string `Error while retrieving vacancy data for id: ${id}.`;
            log:printError(cusError, vacancy);
            return <http:InternalServerError>{
                body: {
                    message: cusError
                }
            };
        }

        string|error applicationResponse = ats:insertCandidate(candidate, id);
        if applicationResponse is error {
            log:printError(applicationResponse.message(), applicationResponse);
            return <http:InternalServerError>{
                body: {
                    message: applicationResponse.message()
                }
            };
        }
        return <http:Ok>{
            body: {
                message: applicationResponse
            }
        };
    }
}
