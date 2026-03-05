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
public enum JrEmploymentType {
    INTERNSHIP = "Internship",
    PERMANENT = "Permanent",
    CONSULTANCY = "Consultancy"
};

# Mode of work.
public enum ModeOfWork {
    REMOTE = "Remote",
    OFFICE = "Office",
    HYBRID = "Hybrid"
};

# Vacancy visibility.
public enum VacancyVisibility {
    WITHOUT_LISTING = "Without Listing",
    ALL = "All",
    EXTERNAL_ONLY = "External Only",
    INTERNAL_ONLY = "Internal Only"
};

# Vacancy status.
public enum VacancyStatus {
    CREATED,
    REJECTED,
    IN_REVIEW,
    REQUEST_CHANGE,
    APPROVED,
    PUBLISHED,
    CLOSED,
    DELETED
};

# Gender.
public enum Gender {
    MALE = "Male",
    FEMALE = "Female",
    OTHER = "Other"
};

# Candidate applied from.
public enum CandidateAppliedFrom {
    INTERNAL = "Internal",
    LINKEDIN = "LinkedIn",
    CAREER_SITE = "Career Site"
};

# Candidate vacancy Status.
public enum CandidateVacancyStatus {
    CREATED,
    IN_REVIEW,
    INTERVIEW_IN_PROGRESS,
    INTERVIEW_COMPLETED,
    HIRED,
    REJECTED,
    DELETED
};
