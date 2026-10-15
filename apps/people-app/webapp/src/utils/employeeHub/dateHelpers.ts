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

import { isCurrentStatus, isEndedStatus } from "./statusHelpers";

export type InternRow = Record<string, any>;

/**
 * Resilient to the mixed date formats found in the source data (YYYY-MM-DD,
 * DD-MMM-YYYY, MMM YYYY, DD/MM/YYYY, DD-MM-YYYY).
 */
export const parseDate = (dateStr: unknown): Date | null => {
  if (!dateStr) return null;
  if (dateStr instanceof Date) return dateStr;

  const str = String(dateStr).trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
  }

  if (/^\d{1,2}-[A-Za-z]{3}-\d{4}$/.test(str)) {
    const parts = str.split("-");
    const day = parseInt(parts[0], 10);
    const monthStr = parts[1];
    const year = parseInt(parts[2], 10);
    const month = new Date(`${monthStr} 1, ${year}`).getMonth();
    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      const d = new Date(year, month, day);
      return isNaN(d.getTime()) ? null : d;
    }
  }

  if (/^[A-Za-z]{3,9}\s+\d{4}$/.test(str)) {
    const parts = str.split(" ");
    const month = new Date(`${parts[0]} 1, ${parts[1]}`).getMonth();
    const year = parseInt(parts[1], 10);
    if (!isNaN(month) && !isNaN(year)) {
      const d = new Date(year, month, 1);
      return isNaN(d.getTime()) ? null : d;
    }
  }

  const slashParts = str.split("/");
  if (slashParts.length === 3) {
    const day = parseInt(slashParts[0], 10);
    const month = parseInt(slashParts[1], 10) - 1;
    const year = parseInt(slashParts[2], 10);
    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      const d = new Date(year, month, day);
      return isNaN(d.getTime()) ? null : d;
    }
  }

  const dashParts = str.split("-");
  if (dashParts.length === 3 && dashParts[0].length <= 2) {
    const day = parseInt(dashParts[0], 10);
    const month = parseInt(dashParts[1], 10) - 1;
    const year = parseInt(dashParts[2], 10);
    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      const d = new Date(year, month, day);
      return isNaN(d.getTime()) ? null : d;
    }
  }

  const fallback = new Date(str);
  return isNaN(fallback.getTime()) ? null : fallback;
};

export const formatDate = (date: unknown): string => {
  const parsed = parseDate(date);
  if (!parsed) return "";
  return parsed.toISOString().split("T")[0];
};

const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTH_FULL = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// Tiny stand-in for date-fns's `format()`, covering only the handful of
// tokens this app's dashboard actually uses (yyyy, yy, MMMM, MMM, MM, dd, d).
// date-fns v4's shipped .d.ts files use TS 5-only `.ts`-extension relative
// imports internally, which people-app's TS 4.9 + moduleResolution:"node"
// setup can't resolve - rather than touching that project-wide config, this
// avoids depending on date-fns's types at all.
export const formatDateToken = (date: Date, pattern: string): string => {
  const yyyy = String(date.getFullYear());
  const yy = yyyy.slice(-2);
  const MMMM = MONTH_FULL[date.getMonth()];
  const MMM = MONTH_ABBR[date.getMonth()];
  const MM = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const d = String(date.getDate());
  const tokens: Record<string, string> = { yyyy, yy, MMMM, MMM, MM, dd, d };
  return pattern.replace(/yyyy|yy|MMMM|MMM|MM|dd|d/g, (match) => tokens[match]);
};

export const isDateToday = (date: Date): boolean => {
  const today = new Date();
  return date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth() && date.getDate() === today.getDate();
};

export const formatReadableDate = (date: unknown): string => {
  const parsed = parseDate(date);
  if (!parsed) return "N/A";
  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const isSameMonthAndYear = (date: unknown, targetDate: unknown): boolean => {
  const d1 = parseDate(date);
  const d2 = parseDate(targetDate);
  if (!d1 || !d2) return false;
  return d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();
};

export const isPreviousMonthAndYear = (date: unknown, targetDate: unknown): boolean => {
  const d1 = parseDate(date);
  const d2 = parseDate(targetDate);
  if (!d1 || !d2) return false;

  let targetMonth = d2.getMonth() - 1;
  let targetYear = d2.getFullYear();
  if (targetMonth < 0) {
    targetMonth = 11;
    targetYear -= 1;
  }

  return d1.getMonth() === targetMonth && d1.getFullYear() === targetYear;
};

export const getLastDayOfMonth = (targetDate: unknown): Date | null => {
  const d = parseDate(targetDate);
  if (!d) return null;
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
};

// Returns relative time like "just now", "5 mins ago", "2 hrs ago"
export const getRelativeTimeString = (date: unknown): string => {
  if (!date) return "";
  const d = typeof date === "string" ? parseDate(date) : (date as Date);
  if (!d) return "";
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} mins ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hrs ago`;
  return d.toLocaleDateString("en-US");
};

export const getPreviousMonthInterns = (interns: InternRow[] = [], selectedDate: unknown): InternRow[] => {
  const sd = parseDate(selectedDate);
  if (!sd) return [];
  let targetMonth = sd.getMonth() - 1;
  let targetYear = sd.getFullYear();
  if (targetMonth < 0) {
    targetMonth = 11;
    targetYear -= 1;
  }
  return interns.filter((i) => {
    const jd = parseDate(i["Joined Date"]);
    if (!jd) return false;
    return jd.getMonth() === targetMonth && jd.getFullYear() === targetYear;
  });
};

export const getNewJoiners = (interns: InternRow[] = [], selectedDate: unknown): InternRow[] => {
  const sd = parseDate(selectedDate);
  if (!sd) return [];
  return interns.filter((i) => {
    const jd = parseDate(i["Joined Date"]);
    if (!jd) return false;
    return jd.getMonth() === sd.getMonth() && jd.getFullYear() === sd.getFullYear();
  });
};

export const getAccumulatedInterns = (interns: InternRow[] = [], selectedDate: unknown): InternRow[] => {
  const sd = parseDate(selectedDate);
  if (!sd) return [];
  return interns.filter((i) => {
    const jd = parseDate(i["Joined Date"]);
    const ed = parseDate(i["End Date"]);
    if (!jd || !ed) return false;
    return jd <= sd && ed >= sd;
  });
};

export const getResignations = (interns: InternRow[] = [], selectedDate: unknown): InternRow[] => {
  const sd = parseDate(selectedDate);
  if (!sd) return [];
  return interns.filter((i) => {
    if (!isEndedStatus(i["Status"])) return false;
    const ed = parseDate(i["End Date"]);
    if (!ed) return false;
    return ed.getMonth() === sd.getMonth() && ed.getFullYear() === sd.getFullYear();
  });
};

export const getProceedingNextMonth = (interns: InternRow[] = [], selectedDate: unknown): InternRow[] => {
  const sd = parseDate(selectedDate);
  if (!sd) return [];
  const lastDay = getLastDayOfMonth(sd);
  return interns.filter((i) => {
    const ed = parseDate(i["End Date"]);
    if (!ed || !lastDay) return false;
    return ed > lastDay;
  });
};

export const getTotalActive = (interns: InternRow[] = []): InternRow[] => {
  return interns.filter((i) => isCurrentStatus(i["Status"]));
};

/** Returns the progress percentage (0-100) of an internship, given its join/end dates. */
export const getInternshipProgress = (joinedDateStr: unknown, endDateStr: unknown): number => {
  const joined = parseDate(joinedDateStr);
  const end = parseDate(endDateStr);
  const today = new Date();

  if (!joined || !end) return 0;
  if (today < joined) return 0;
  if (today > end) return 100;

  const total = end.getTime() - joined.getTime();
  const elapsed = today.getTime() - joined.getTime();

  if (total <= 0) return 100;
  const pct = Math.round((elapsed / total) * 100);
  return Math.min(Math.max(pct, 0), 100);
};
