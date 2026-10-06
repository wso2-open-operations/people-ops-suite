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

export const SnackMessage = {
  success: {
    applicationSubmitted: "Application submitted successfully!",
    profileUpdated: "Profile updated successfully!",
    jobSaved: "Job saved to your list.",
    resumeUploaded: "Resume uploaded successfully!",
    offerAccepted: "You accepted the offer. Please upload the required documents.",
    offerDeclined: "You declined the offer.",
    documentUploaded: "Document uploaded.",
    documentsSubmitted: "Documents submitted. HR will contact you with the next steps.",
  },
  error: {
    fetchJobs: "Unable to retrieve job listings.",
    fetchApplications: "Unable to retrieve your applications.",
    fetchProfile: "Unable to retrieve your profile.",
    submitApplication: "Failed to submit application. Please try again.",
    saveProfile: "Unable to save your changes. Please try again.",
    respondToOffer: "Unable to record your response to the offer. Please try again.",
    offerAlreadyAccepted: "You have already accepted an offer, so you can't accept another one.",
    uploadDocument: "Unable to upload the document. Please try again.",
    submitDocuments: "Unable to submit your documents. Please try again.",
    insufficientPrivileges: "Insufficient Privileges",
    fetchPrivileges: "Failed to fetch Privileges",
  },
  warning: {},
};

export enum ApplicationStatus {
  Applied = "Applied",
  Screening = "Screening",
  Interview = "Interview",
  Offer = "Offer",
  OfferAccepted = "Offer Accepted",
  OfferDeclined = "Offer Declined",
  Rejected = "Rejected",
}
