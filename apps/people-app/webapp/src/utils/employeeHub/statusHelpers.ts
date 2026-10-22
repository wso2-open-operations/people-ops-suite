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

import { parseDate } from "./dateHelpers";

export type NormalizedInternStatus = "active" | "ended" | "not_started" | "unknown";

export function normalizeStatus(rawStatus: unknown): NormalizedInternStatus {
  const status = String(rawStatus || "").trim().toLowerCase();

  if (status === "in progress" || status === "active" || status === "extended") return "active";
  if (status === "ended" || status === "completed" || status === "resigned" || status === "terminated") return "ended";
  if (status === "not started") return "not_started";
  return "unknown";
}

export function getStatusDisplay(rawStatus: unknown): { label: string; colorKey: NormalizedInternStatus } {
  const normalized = normalizeStatus(rawStatus);

  if (normalized === "active") {
    const label = String(rawStatus || "").trim().toLowerCase() === "extended" ? "Extended" : "In Progress";
    return { label, colorKey: "active" };
  }
  if (normalized === "ended") {
    return { label: "Ended", colorKey: "ended" };
  }
  if (normalized === "not_started") {
    return { label: "Not Started", colorKey: "not_started" };
  }
  return { label: rawStatus ? String(rawStatus).trim() : "Unknown", colorKey: "unknown" };
}

export function isCurrentStatus(rawStatus: unknown): boolean {
  return normalizeStatus(rawStatus) === "active";
}

export function isEndedStatus(rawStatus: unknown): boolean {
  return normalizeStatus(rawStatus) === "ended";
}

export function deriveInternStatus({
  status,
  joinedDate,
  endDate,
  assumeInProgress = false,
}: {
  status?: unknown;
  joinedDate?: string | Date | null;
  endDate?: string | Date | null;
  assumeInProgress?: boolean;
} = {}): string {
  const raw = String(status || "").trim();
  if (raw) {
    const lower = raw.toLowerCase();
    if (lower === "in progress" || lower === "active") return "In Progress";
    if (lower === "ended" || lower === "completed") return "Ended";
    if (lower === "not started") return "Not Started";
    if (lower === "extended") return "Extended";
    if (lower === "resigned") return "Resigned";
    if (lower === "terminated") return "Terminated";
    return raw;
  }

  if (assumeInProgress) return "In Progress";

  const joined = joinedDate instanceof Date ? joinedDate : parseDate(joinedDate);
  const end = endDate instanceof Date ? endDate : parseDate(endDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (joined && joined > today) return "Not Started";
  if (end && end < today) return "Ended";
  if (joined) return "In Progress";
  return "Ended";
}

export function statusMatchesFilter(rawStatus: unknown, filterValue: string): boolean {
  if (!filterValue || filterValue === "All") return true;

  const filter = String(filterValue).toLowerCase();
  const raw = String(rawStatus || "").trim().toLowerCase();

  if (filter === "in progress") return normalizeStatus(rawStatus) === "active" && raw !== "extended";
  if (filter === "extended") return raw === "extended";
  if (filter === "ended") return normalizeStatus(rawStatus) === "ended";
  if (filter === "not started") return normalizeStatus(rawStatus) === "not_started";
  if (filter === "resigned") return raw === "resigned";
  if (filter === "terminated") return raw === "terminated";

  return raw === filter;
}

export const STATUS_FILTER_OPTIONS = [
  "All",
  "In Progress",
  "Ended",
  "Not Started",
];
