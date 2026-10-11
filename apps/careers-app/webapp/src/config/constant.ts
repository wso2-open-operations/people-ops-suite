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
    profileUpdated: "Profile updated successfully!",
    offerDeclined: "You declined the offer.",
    feedbackSent: "Thank you for your feedback.",
  },
  error: {
    fetchApplications: "Unable to retrieve your applications.",
    fetchProfile: "Unable to retrieve your profile.",
    submitApplication: "Failed to submit application. Please try again.",
    saveProfile: "Unable to save your changes. Please try again.",
    respondToOffer: "Unable to record your response to the offer. Please try again.",
    sendFeedback: "Unable to send your feedback. Please try again.",
    offerConflict: "This offer was already answered, or you have already accepted another offer.",
    offerExpired: "This offer has expired. Please contact the recruitment team if you still want to join.",
  },
  warning: {},
};

// The names of the errors raised when the backend refuses an offer answer.
export const OFFER_CONFLICT_ERROR = "OfferConflictError";
export const OFFER_EXPIRED_ERROR = "OfferExpiredError";

export enum ApplicationStatus {
  Applied = "Applied",
  Screening = "Screening",
  Interview = "Interview",
  Offer = "Offer",
  OfferAccepted = "Offer Accepted",
  OfferDeclined = "Offer Declined",
  Rejected = "Rejected",
}
