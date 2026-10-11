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

import axios, { type AxiosResponse } from "axios";

import {
  Application,
  ApplicationFeedback,
  CandidateProfile,
  EditableProfileFields,
  OfferAnswer,
} from "@/types/types";
import { AppConfig, UseMockProfile } from "@config/config";
import { OFFER_CONFLICT_ERROR, OFFER_EXPIRED_ERROR } from "@config/constant";
import * as mockProfile from "@utils/mockProfile";

const REQUEST_TIMEOUT_MS = 15_000;

// The name of the error thrown when the backend refuses the access token.
export const SESSION_EXPIRED_ERROR = "SessionExpiredError";

// The bearer token and timeout every signed-in request carries.
const requestOptions = (accessToken: string) => ({
  headers: { Authorization: `Bearer ${accessToken}` },
  timeout: REQUEST_TIMEOUT_MS,
});

// Waits for a request and returns its data; a 401 becomes a session expired error so the app can ask for sign-in.
async function send<T>(request: Promise<AxiosResponse<T>>): Promise<T> {
  try {
    return (await request).data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      const expired = new Error("Your session has ended.");
      expired.name = SESSION_EXPIRED_ERROR;
      throw expired;
    }
    throw error;
  }
}

// The signed-in candidate's own profile.
export async function fetchProfile(accessToken: string): Promise<CandidateProfile> {
  if (UseMockProfile) return mockProfile.fetchProfile();
  return send(axios.get<CandidateProfile>(`${AppConfig.serviceUrls.candidates}/me`, requestOptions(accessToken)));
}

// Saves the changes to the candidate's editable details.
export async function saveProfile(
  accessToken: string,
  changes: Partial<EditableProfileFields>,
): Promise<CandidateProfile> {
  if (UseMockProfile) return mockProfile.saveProfile(changes);
  return send(
    axios.patch<CandidateProfile>(`${AppConfig.serviceUrls.candidates}/me`, changes, requestOptions(accessToken)),
  );
}

// Sends the candidate's feedback about one of their applications.
export async function submitFeedback(
  accessToken: string,
  applicationId: string,
  feedback: ApplicationFeedback,
): Promise<void> {
  if (UseMockProfile) return mockProfile.submitFeedback(applicationId);
  await send(
    axios.post(
      `${AppConfig.serviceUrls.applications}/${encodeURIComponent(applicationId)}/feedback`,
      feedback,
      requestOptions(accessToken),
    ),
  );
}

const refused = (name: string, message: string) => Object.assign(new Error(message), { name });

// Records the candidate's answer to an offer and returns the updated application. A 409 (already answered, or another
// offer accepted) and a 410 (expired) become errors of their own.
export async function respondToOffer(
  accessToken: string,
  applicationId: string,
  answer: OfferAnswer,
): Promise<Application> {
  if (UseMockProfile) return mockProfile.respondToOffer(applicationId, answer);
  try {
    return await send(
      axios.post<Application>(
        `${AppConfig.serviceUrls.applications}/${encodeURIComponent(applicationId)}/offer-response`,
        answer,
        requestOptions(accessToken),
      ),
    );
  } catch (error) {
    const status = axios.isAxiosError(error) ? error.response?.status : undefined;
    if (status === 409) throw refused(OFFER_CONFLICT_ERROR, "The offer cannot be answered.");
    if (status === 410) throw refused(OFFER_EXPIRED_ERROR, "The offer has expired.");
    throw error;
  }
}

// The signed-in candidate's own applications.
export async function fetchApplications(accessToken: string): Promise<Application[]> {
  if (UseMockProfile) return mockProfile.fetchApplications();
  return send(axios.get<Application[]>(AppConfig.serviceUrls.applications, requestOptions(accessToken)));
}
