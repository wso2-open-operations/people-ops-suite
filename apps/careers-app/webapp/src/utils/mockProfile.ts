// Copyright (c) 2026 WSO2 LLC. (https://www.wso2.com).
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

import { Application, CandidateProfile, EditableProfileFields, OfferAnswer } from "@/types/types";
import { ApplicationStatus, OFFER_CONFLICT_ERROR, OFFER_EXPIRED_ERROR } from "@config/constant";
import { isValidE164 } from "@utils/phone";

// In-memory stand-in for the backend, used when USE_MOCK_PROFILE is "true".

const LATENCY_MS = 250;
const EDITABLE_FIELDS: (keyof EditableProfileFields)[] = [
  "firstName",
  "lastName",
  "gender",
  "contactNo",
  "address",
  "university",
];

let profile: CandidateProfile = {
  firstName: "Alice",
  lastName: "Bob",
  gender: "Female",
  personalEmail: "bob@gmail.com",
  contactNo: "+94771234567",
  address: "45 Galle Road, Colombo 03, Sri Lanka",
  university: "University of Moratuwa",
};

const delay = () => new Promise<void>((resolve) => setTimeout(resolve, LATENCY_MS));

export async function fetchProfile(): Promise<CandidateProfile> {
  await delay();
  return structuredClone(profile);
}

export async function saveProfile(changes: Partial<EditableProfileFields>): Promise<CandidateProfile> {
  await delay();
  if (changes.contactNo !== undefined && !isValidE164(changes.contactNo)) {
    throw new Error("Enter the phone number.");
  }
  const allowed = Object.fromEntries(
    Object.entries(changes).filter(([key]) => EDITABLE_FIELDS.includes(key as keyof EditableProfileFields)),
  );
  profile = { ...profile, ...allowed };
  return structuredClone(profile);
}

const daysFromNow = (days: number) => new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);

const applications: Application[] = [
  {
    id: "a1",
    jobId: "228",
    jobTitle: "Intern - Customer Success",
    department: "Customer Success",
    appliedDate: "2026-10-05",
    status: ApplicationStatus.Applied,
    timeline: [{ stage: ApplicationStatus.Applied, date: "2026-10-05" }],
  },
  {
    id: "a2",
    jobId: "228",
    jobTitle: "Administration Officer - People Operations",
    department: "People Operations",
    appliedDate: "2026-09-28",
    status: ApplicationStatus.Screening,
    timeline: [
      { stage: ApplicationStatus.Applied, date: "2026-09-28" },
      { stage: ApplicationStatus.Screening, date: "2026-10-02" },
    ],
  },
  {
    id: "a3",
    jobId: "240",
    jobTitle: "Senior Software Engineer - Identity",
    department: "Engineering",
    appliedDate: "2026-09-10",
    status: ApplicationStatus.Interview,
    timeline: [
      { stage: ApplicationStatus.Applied, date: "2026-09-10" },
      { stage: ApplicationStatus.Screening, date: "2026-09-14" },
      { stage: ApplicationStatus.Interview, date: "2026-09-20" },
    ],
    interviews: [
      {
        id: "i1",
        round: "Technical Interview",
        dateTime: "2026-11-05T11:00:00",
        mode: "Video",
        location: "https://meet.example.com/technical",
        status: "Upcoming",
      },
    ],
  },
  {
    id: "a4",
    jobId: "245",
    jobTitle: "Solutions Architect",
    department: "Sales Engineering",
    appliedDate: "2026-08-20",
    status: ApplicationStatus.Offer,
    offerExpiresOn: daysFromNow(7),
    timeline: [
      { stage: ApplicationStatus.Applied, date: "2026-08-20" },
      { stage: ApplicationStatus.Interview, date: "2026-09-08" },
      { stage: ApplicationStatus.Offer, date: "2026-09-25" },
    ],
  },
  {
    id: "a5",
    jobId: "250",
    jobTitle: "Associate Technical Writer",
    department: "Engineering",
    appliedDate: "2026-08-02",
    status: ApplicationStatus.Rejected,
    timeline: [
      { stage: ApplicationStatus.Applied, date: "2026-08-02" },
      { stage: ApplicationStatus.Screening, date: "2026-08-09" },
      { stage: ApplicationStatus.Rejected, date: "2026-08-16" },
    ],
  },
  {
    id: "a7",
    jobId: "260",
    jobTitle: "Business Analyst",
    department: "Business Operations",
    appliedDate: "2026-07-01",
    status: ApplicationStatus.OfferDeclined,
    timeline: [
      { stage: ApplicationStatus.Applied, date: "2026-07-01" },
      { stage: ApplicationStatus.Interview, date: "2026-07-20" },
      { stage: ApplicationStatus.Offer, date: "2026-08-01" },
      { stage: ApplicationStatus.OfferDeclined, date: "2026-08-05" },
    ],
  },
];

export async function submitFeedback(): Promise<void> {
  await delay();
}

export async function respondToOffer(applicationId: string, answer: OfferAnswer): Promise<Application> {
  await delay();
  const application = applications.find((a) => a.id === applicationId);
  if (!application || application.status !== ApplicationStatus.Offer) {
    throw Object.assign(new Error("There is no offer to answer."), { name: OFFER_CONFLICT_ERROR });
  }
  if (application.offerExpiresOn && application.offerExpiresOn < daysFromNow(0)) {
    throw Object.assign(new Error("This offer has expired."), { name: OFFER_EXPIRED_ERROR });
  }
  const acceptedElsewhere = applications.some((a) => a.status === ApplicationStatus.OfferAccepted);
  if (answer.response === "accepted" && acceptedElsewhere) {
    throw Object.assign(new Error("Another offer was already accepted."), { name: OFFER_CONFLICT_ERROR });
  }
  application.status = answer.response === "accepted" ? ApplicationStatus.OfferAccepted : ApplicationStatus.OfferDeclined;
  application.timeline = [
    ...(application.timeline ?? []),
    { stage: application.status, date: new Date().toISOString().slice(0, 10) },
  ];
  return structuredClone(application);
}

export async function fetchApplications(): Promise<Application[]> {
  await delay();
  return structuredClone(applications);
}
