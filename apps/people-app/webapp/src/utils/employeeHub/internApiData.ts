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

// Sources the Interns tab's full roster from people-app's real backend
// (GET /intern-profiles). Only university comes from the
// `internship` table; everything else is the intern's `employee` row.
// Maps each row into the same InternRow shape (both the original
// header-style keys, e.g. "Joined Date", and the camelCase ones, e.g.
// joinedDate) so nothing downstream that consumes InternRow needs to change.

import { APIService } from "@utils/apiService";
import { AppConfig } from "@config/config";
import { parseDate, type InternRow } from "./dateHelpers";

export interface InternHubData {
  interns: InternRow[];
  inProgressInterns: InternRow[];
}

// Mirrors database:InternProfile in the backend (modules/database/types.bal).
interface InternProfileApiRow {
  id: number;
  employeeId: string | null;
  email: string | null;
  name: string | null;
  gender: string | null;
  university: string | null;
  mentorEmail: string | null;
  businessUnit: string | null;
  team: string | null;
  subTeam: string | null;
  joinedDate: string | null;
  endDate: string | null;
  employeeStatus: string | null;
  employmentType: string | null;
}

// Whole months between two dates, rounded - e.g. 2025-01-01 -> 2025-07-01 is 6.
function monthsBetween(start: Date | null, end: Date | null): string {
  if (!start || !end || end < start) return "";
  const days = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
  return String(Math.round(days / 30.44));
}

// Someone whose employment type is no longer INTERNSHIP has moved on to a
// permanent/probation role, so their internship is over. Their start/agreement
// end dates on that row belong to the new role, not the internship.
function isStillInternshipRow(row: InternProfileApiRow): boolean {
  return (row.employmentType || "").toUpperCase() === "INTERNSHIP";
}

// An internship is active only while today is between its start and end
// dates. employee_status isn't always flipped to "Left" once the agreement
// end date passes, so the date alone decides that the internship is over.
function statusFor(row: InternProfileApiRow, joinedDate: Date | null, endDate: Date | null): string {
  if (!isStillInternshipRow(row)) return "Ended";
  if ((row.employeeStatus || "").toLowerCase() === "left") return "Ended";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (endDate && endDate < today) return "Ended";
  if (joinedDate && joinedDate > today) return "Not Started";
  return "In Progress";
}

function mapInternProfileToRow(row: InternProfileApiRow, idx: number): InternRow {
  const name = row.name || "";
  const email = row.email || "";
  const gender = row.gender || "";
  const mentorEmail = row.mentorEmail || "";
  const bu = row.businessUnit || "";
  const team = row.team || "";
  const subTeam = row.subTeam || "";
  const university = row.university || "";
  const internshipRow = isStillInternshipRow(row);
  const joinedRaw = internshipRow ? row.joinedDate || "" : "";
  const endRaw = internshipRow ? row.endDate || "" : "";
  const joinedDate = parseDate(joinedRaw);
  const endDate = parseDate(endRaw);
  const duration = monthsBetween(joinedDate, endDate);
  const status = statusFor(row, joinedDate, endDate);
  const id = String(row.id);
  const employeeId = row.employeeId || "";

  return {
    __raw: row,
    id,
    stableId: id,
    employeeId,
    rowIndex: String(idx),
    Name: name,
    "Email ID": email,
    Gender: gender,
    Mentor: mentorEmail,
    BU: bu,
    "Sub-Team": subTeam,
    Team: team,
    University: university,
    "Duration (Months)": duration,
    "Joined Date": joinedRaw,
    "End Date": endRaw,
    Status: status,
    name,
    emailId: email,
    gender,
    mentor: mentorEmail,
    bu,
    subTeam,
    team,
    university,
    duration,
    // Kept as the API's date strings, not Date objects - Redux state must
    // stay serializable. Every consumer parses them with parseDate().
    joinedDate: joinedRaw,
    endDate: endRaw,
    status,
  };
}

/** Fetches the full intern roster from GET /intern-profiles and splits it:
 * currently-running internships go to `inProgressInterns`, everything else
 * (Ended/Not Started) goes to `interns`. */
export async function loadInternHubDataFromApi(): Promise<InternHubData> {
  const response = await APIService.getInstance().get(AppConfig.serviceUrls.internProfiles);
  const rows = (response.data || []) as InternProfileApiRow[];

  const interns: InternRow[] = [];
  const inProgressInterns: InternRow[] = [];

  rows.forEach((row, idx) => {
    const mapped = mapInternProfileToRow(row, idx);
    if (mapped.Status === "In Progress") {
      inProgressInterns.push(mapped);
    } else {
      interns.push(mapped);
    }
  });

  return { interns, inProgressInterns };
}
