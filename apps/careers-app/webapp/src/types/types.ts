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

import { ApplicationStatus } from "@config/constant";

export enum State {
  failed = "failed",
  success = "success",
  loading = "loading",
  idle = "idle",
}

export enum ThemeMode {
  Light = "light",
  Dark = "dark",
}

export interface PreLoaderProps {
  message?: string;
  isLoading?: boolean;
}

// A candidate's profile.
export interface CandidateProfile {
  firstName: string;
  lastName: string;
  gender: string;
  personalEmail: string;
  contactNo: string;
  address: string | null;
  university: string | null;
}

// The details a candidate can change themselves.
export type EditableProfileFields = Pick<
  CandidateProfile,
  "firstName" | "lastName" | "gender" | "contactNo" | "address" | "university"
>;

export interface Job {
  id: string;
  title: string;
  team: string;
  country: string[];
  jobType: string;
  publishStatus: string;
  postedDate: string;
}

// What an applicant submits alongside their CV.
export interface GuestApplicationDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  authorizedToWork: boolean;
}

export interface ApplicationTimelineEvent {
  stage: ApplicationStatus;
  date: string;
}

export interface ApplicationInterview {
  id: string;
  round: string;
  // ISO date-time of the interview.
  dateTime: string;
  mode: "Video" | "Phone" | "Onsite";
  // A meeting link for video interviews, a number for phone, an address for onsite.
  location: string;
  status: "Upcoming" | "Completed" | "Cancelled";
}

// A candidate's application and its progress.
export interface Application {
  id: string;
  jobId: string;
  jobTitle: string;
  department: string;
  appliedDate: string;
  status: ApplicationStatus;
  // The last day the candidate can answer an offer.
  offerExpiresOn?: string;
  // True once the candidate has sent feedback about this application.
  feedbackSubmitted?: boolean;
  timeline?: ApplicationTimelineEvent[];
  interviews?: ApplicationInterview[];
}

// A candidate's answer to an offer; a declined offer carries the reason.
export interface OfferAnswer {
  response: "accepted" | "declined";
  reason?: string;
  comment?: string;
}

// What a candidate tells us about their application experience.
export interface ApplicationFeedback {
  rating: number | null;
  comment: string;
}
