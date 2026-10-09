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

import axios from "axios";

import { AppConfig, UseMockProfile } from "@config/config";
import { GuestApplicationDetails, Job } from "@/types/types";

interface VacancyBasicInfo {
  id: number;
  title: string;
  team: string;
  country: string[];
  job_type: string;
  publish_status: string;
  published_on: string;
}

export interface OrgStructure {
  locations: string[];
  teams: string[];
}

export interface VacancyDetail {
  id: string;
  title: string;
  designation: string;
  team: string;
  country: string[];
  officeLocations: string[];
  jobType: string;
  publishStatus: string;
  postedDate: string;
  allowRemote: boolean;
  mainContent: string | null;
  taskInformation: string | null;
  additionalContent: string | null;
}

// Guests have no token, so they send no credentials at all.
function authHeader(accessToken: string) {
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
}

export async function fetchVacancies(accessToken: string): Promise<Job[]> {
  const response = await axios.get<VacancyBasicInfo[]>(AppConfig.serviceUrls.jobs, {
    headers: authHeader(accessToken),
  });

  return response.data.map((v) => ({
    id: String(v.id),
    title: v.title,
    team: v.team,
    country: v.country,
    jobType: v.job_type,
    publishStatus: v.publish_status,
    postedDate: v.published_on,
  }));
}

export async function fetchVacancyDetail(id: string, accessToken: string): Promise<VacancyDetail> {
  const response = await axios.get<{
    id: number;
    title: string;
    designation: string;
    team: string;
    country: string[];
    office_locations: Record<string, string>;
    job_type: string;
    publish_status: string;
    published_on: string;
    allow_remote: boolean;
    mainContent: string | null;
    taskInformation: string | null;
    additionalContent: string | null;
  }>(`${AppConfig.serviceUrls.jobs}/${id}`, {
    headers: authHeader(accessToken),
  });

  const v = response.data;
  return {
    id: String(v.id),
    title: v.title,
    designation: v.designation,
    team: v.team,
    country: v.country,
    officeLocations: Object.values(v.office_locations ?? {}),
    jobType: v.job_type,
    publishStatus: v.publish_status,
    postedDate: v.published_on,
    allowRemote: v.allow_remote,
    mainContent: v.mainContent,
    taskInformation: v.taskInformation,
    additionalContent: v.additionalContent,
  };
}

export async function fetchOrgStructure(accessToken: string): Promise<OrgStructure> {
  const response = await axios.get<{ location_list: Record<string, string>; team_list: Record<string, string> }>(
    `${AppConfig.serviceUrls.jobs}/org-structure`,
    { headers: authHeader(accessToken) },
  );

  return {
    locations: Object.values(response.data.location_list),
    teams: Object.values(response.data.team_list),
  };
}

// Sends an application and its CV in one multipart request. With mock data on, nothing is sent.
export async function submitApplicationForm(
  accessToken: string,
  jobId: string,
  details: GuestApplicationDetails,
  cv: File,
): Promise<void> {
  if (UseMockProfile) {
    await new Promise((resolve) => setTimeout(resolve, 600));
    return;
  }
  const form = new FormData();
  Object.entries(details).forEach(([key, value]) => form.append(key, String(value)));
  form.append("cv", cv);
  // No Content-Type here: the browser adds it with the multipart boundary.
  await axios.post(`${AppConfig.serviceUrls.jobs}/${jobId}/apply`, form, {
    headers: authHeader(accessToken),
  });
}
