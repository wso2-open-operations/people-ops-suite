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

// Sources the Dashboard's "Permanent Employees" tab, and the live half of
// the Interns tab's hybrid data, from GET /employee-hub/employees (admin-only),
// which also returns per-team job band counts for the job band charts.
//
// University comes from the `internship` table (via
// the LEFT JOIN in the backend's employee queries); mentor is the intern's
// manager_email. Any intern already returned by GET /intern-profiles is
// de-duplicated against these rows by email in employeeHubSlice.

import { APIService } from "@utils/apiService";
import { AppConfig } from "@config/config";
import type { InternRow } from "./dateHelpers";

export interface EmployeeRow {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  gender: string;
  designation: string;
  department: string;
  team: string;
  bu: string;
  reportingManager: string;
  joinDate: string;
  employmentType: string;
  // designation.job_band - null when the designation has no band set.
  jobBand: number | null;
  // Real employee_status: "Active", "Marked leaver" or "Left".
  status: string;
  location: string;
  skills: string;
  formerIntern: string;
  // From the `resignation` table - null for anyone who hasn't resigned.
  resignationDate: string | null;
  finalDayOfEmployment: string | null;
  probationEndDate: string | null;
}

// Mirrors database:EmployeeHubEmployee in the backend (modules/database/types.bal).
interface HubApiEmployee {
  employeeId: string;
  firstName: string | null;
  lastName: string | null;
  workEmail: string | null;
  gender: string | null;
  designation: string | null;
  jobBand: number | null;
  businessUnit: string | null;
  team: string | null;
  subTeam: string | null;
  managerEmail: string | null;
  workLocation: string | null;
  startDate: string | null;
  probationEndDate: string | null;
  agreementEndDate: string | null;
  employeeStatus: string | null;
  employmentType: string | null;
  university: string | null;
  resignationDate: string | null;
  finalDayOfEmployment: string | null;
}

// Mirrors database:EmployeeHubJobBandCount in the backend.
interface HubApiJobBandCount {
  team: string;
  jobBand: number | null;
  headcount: number;
}

// One entry per current, non-intern employee - just team and job band -
// built from the backend's per-team counts.
export interface JobBandRow {
  team: string;
  jobBand: number | null;
}

const INTERNSHIP_TYPE = "INTERNSHIP";

// employment_type.name is stored upper case ("PERMANENT", "CONSULTANCY",
// "ADVISORY CONSULTANT", "PART TIME CONSULTANCY", ...). Kept as the real
// value rather than collapsed into Full-time/Contract, just title-cased for
// display.
function formatEmploymentType(name: string | null | undefined): string {
  const s = (name || "").trim();
  if (!s) return "Unspecified";
  return s.toLowerCase().replace(/(^|[\s.-])(\w)/g, (_, sep, c) => sep + c.toUpperCase());
}

function mapToEmployeeRow(e: HubApiEmployee): EmployeeRow {
  return {
    id: e.employeeId,
    employeeId: e.employeeId,
    name: `${e.firstName || ""} ${e.lastName || ""}`.trim(),
    email: e.workEmail || "",
    gender: e.gender || "",
    designation: e.designation || "",
    // No "department" concept in the real org model - just Team, so the
    // Dashboard no longer shows a separate department grouping (see plan).
    // This field is kept only because EmployeeRow still declares it; nothing
    // reads it for API-sourced rows.
    department: "",
    team: e.team || "",
    bu: e.businessUnit || "",
    reportingManager: e.managerEmail || "",
    joinDate: e.startDate || "",
    employmentType: formatEmploymentType(e.employmentType),
    jobBand: e.jobBand ?? null,
    status: e.employeeStatus || "",
    location: e.workLocation || "",
    skills: "",
    // Not tracked anywhere in the real schema - see module note above.
    formerIntern: "",
    resignationDate: e.resignationDate || null,
    finalDayOfEmployment: e.finalDayOfEmployment || null,
    probationEndDate: e.probationEndDate || null,
  };
}

function mapToInternRow(e: HubApiEmployee, enrichment?: InternRow): InternRow {
  const name = `${e.firstName || ""} ${e.lastName || ""}`.trim();
  const email = e.workEmail || "";

  const university = e.university || enrichment?.University || "";
  const mentorEmail = e.managerEmail || enrichment?.Mentor || "";
  const endDate = e.agreementEndDate || "";

  return {
    ...(enrichment || {}),
    id: e.employeeId,
    stableId: e.employeeId,
    employeeId: e.employeeId,
    Name: name,
    name,
    "Email ID": email,
    emailId: email,
    Gender: e.gender || enrichment?.Gender || "",
    gender: e.gender || enrichment?.gender || "",
    Mentor: mentorEmail,
    mentor: mentorEmail,
    BU: e.businessUnit || "",
    bu: e.businessUnit || "",
    "Sub-Team": e.subTeam || "",
    subTeam: e.subTeam || "",
    Team: e.team || "",
    team: e.team || "",
    University: university,
    university: university,
    "Joined Date": e.startDate || "",
    joinedDate: e.startDate || "",
    "End Date": endDate,
    endDate,
    Status: "In Progress",
    status: "In Progress",
  };
}

export interface EmployeeHubApiData {
  employees: EmployeeRow[];
  // Non-intern employees with status "Left" - the source for resignation
  // counts and the historical headcount trend.
  leavers: EmployeeRow[];
  inProgressInterns: InternRow[];
  jobBandRows: JobBandRow[];
}

export async function loadEmployeeHubDataFromApi(): Promise<EmployeeHubApiData> {
  const response = await APIService.getInstance().get(AppConfig.serviceUrls.employeeHubEmployees);
  const apiEmployees = (response.data?.employees || []) as HubApiEmployee[];
  const apiLeavers = (response.data?.leavers || []) as HubApiEmployee[];
  const apiJobBandCounts = (response.data?.jobBandCounts || []) as HubApiJobBandCount[];

  const employees: EmployeeRow[] = [];
  const inProgressInterns: InternRow[] = [];

  apiEmployees.forEach((e) => {
    if (e.employmentType?.toUpperCase() === INTERNSHIP_TYPE) {
      inProgressInterns.push(mapToInternRow(e));
    } else {
      employees.push(mapToEmployeeRow(e));
    }
  });

  const jobBandRows: JobBandRow[] = [];
  apiJobBandCounts.forEach((c) => {
    for (let i = 0; i < c.headcount; i += 1) jobBandRows.push({ team: c.team || "", jobBand: c.jobBand ?? null });
  });

  return { employees, leavers: apiLeavers.map(mapToEmployeeRow), inProgressInterns, jobBandRows };
}
