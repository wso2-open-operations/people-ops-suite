// Copyright (c) 2025, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.
# Job requisition employment type.
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
