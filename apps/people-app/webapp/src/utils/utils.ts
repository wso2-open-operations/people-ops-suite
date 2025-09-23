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
import type {
  BusinessUnit,
  Company,
  Office,
  SubTeam,
  Team,
  Unit,
} from "@root/src/slices/api/apiSlice";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

import { EmployeeInfo, UpdateEmployeeInfoPayload } from "../slices/employeeSlice/employee";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const isIncludedRole = (a: string[], b: string[]): boolean => {
  return [...getCrossItems(a, b), ...getCrossItems(b, a)].length > 0;
};

function getCrossItems<Role>(a: Role[], b: Role[]): Role[] {
  return a.filter((element) => {
    return b.includes(element);
  });
}

export function formatKey(key: string): string {
  return key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase());
}

export function hexToRgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

interface Date {
  year: number;
  month: number;
  day: number;
}

export function toYmdString(d: { year: number; month: number; day: number } | null): string {
  if (!d) return "";
  return `${d.year}-${String(d.month).padStart(2, "0")}-${String(d.day).padStart(2, "0")}`;
}

export function fromYmdString(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return { year: y, month: m, day: d };
}

type Start = { year: number; month: number; day: number } | Date | undefined;

export const yearsOfService = (
  start: Start,
  now = new Date(),
): { label: string; value: number } => {
  if (!start) return { label: "year", value: 0 };

  const y = start instanceof Date ? start.getFullYear() : start.year;
  const m = start instanceof Date ? start.getMonth() + 1 : start.month;
  const d = start instanceof Date ? start.getDate() : start.day;

  let yrs = now.getFullYear() - y;
  if (now.getMonth() + 1 < m || (now.getMonth() + 1 === m && now.getDate() < d)) yrs--;

  if (yrs <= 0) {
    let months = (now.getFullYear() - y) * 12 + (now.getMonth() + 1 - m);
    if (now.getDate() < d) months--;
    months = Math.max(0, months);
    months === 0 ? (months = 1) : months;
    const monthLabel = months <= 1 ? "Month" : "Months";
    return { label: monthLabel, value: months };
  }

  return { label: "year", value: Math.max(0, yrs) };
};

export const getChangedFields = (
  prev: EmployeeInfo,
  cur: UpdateEmployeeInfoPayload,
): Partial<UpdateEmployeeInfoPayload> => {
  const changes: Partial<UpdateEmployeeInfoPayload> = {};

  changes.id = prev.id;
  changes.wso2Email = prev.wso2Email;

  for (const [key, prevVal] of Object.entries(prev)) {
    const curVal = (cur as any)[key];

    if (curVal === undefined) continue;

    if (curVal !== prevVal) {
      (changes as any)[key] = curVal;
    }
  }

  return changes;
};

const isLeap = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
const daysInMonth = (y: number, m: number) =>
  [31, isLeap(y) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1];

const STRICT = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

type YMD = { year: number; month: number; day: number } | null;

export function fromYmdStringStrict(s: string): YMD {
  if (s === "" || !STRICT.test(s)) return null; // shape + 01..12 / 01..31
  const [y, m, d] = s.split("-").map(Number);
  if (m < 1 || m > 12) return null;
  const dim = daysInMonth(y, m);
  if (d < 1 || d > dim) return null;
  return { year: y, month: m, day: d };
}

interface divideOrgStructure {
  businessUnits: BusinessUnit[];
  teams: Team[];
  subTeams: SubTeam[];
  units: Unit[];
}

export function divideOrgStructure(businessUnits: BusinessUnit[] | undefined) {
  if (!businessUnits) return;

  const teams = businessUnits.flatMap((bu) => bu.teams);

  return { businessUnits, teams };
}

type ComboOption = { label: string; value: number };

export function stringnizeOrgData(businessUnits: BusinessUnit[] | undefined): ComboOption[] {
  if (!businessUnits) return [];

  const dbu = businessUnits.map((bu) => ({
    label: bu.businessUnit,
    value: bu.id,
  }));

  return dbu;
}

export function findTeamsInBu(
  id: number | undefined,
  businessUnits: BusinessUnit[] | undefined,
): ComboOption[] {
  if (!id || !businessUnits) return [];

  const bu = businessUnits.find((bu) => bu.id === id);
  if (!bu) return [];

  const teams = bu.teams.map((t) => ({
    label: t.team,
    value: t.id,
  }));

  return teams;
}

export function findSubTeamsInTeams(
  id: number | undefined,
  teams: Team[] | undefined,
): ComboOption[] {
  if (!id || !teams) return [];

  const t = teams.flatMap((t) => t).find((t) => t.id === id);

  if (!t || !t.subTeams) return [];

  const subTeams = t.subTeams.map((st) => ({
    label: st.subTeam,
    value: st.id,
  }));

  return subTeams;
}

export function findOfficesInCompany(
  id: number | undefined,
  offices: Office[] | undefined,
): ComboOption[] {
  if (!id || !offices) return [];

  const sOffices = offices
    .filter((c) => c.companyId === id)
    .map((c) => ({
      label: c.office,
      value: c.id,
    }));

  return sOffices;
}

export function hasAdminAccess(arr: string[]): boolean {
  return arr.includes("ADMIN");
}

export function getALlTheCompanies(c: Company[] | undefined): ComboOption[] {
  if (!c) return [];

  const companies = c.map((c) => ({
    label: c.name,
    value: c.id,
  }));

  return companies;
}

export function diff<T extends Record<string, any>>(initial: T, current: T) {
  const out: Partial<T> = {};
  for (const k of Object.keys(current) as (keyof T)[]) {
    const a = initial[k];
    const b = current[k];

    if (JSON.stringify(a) !== JSON.stringify(b)) out[k] = b;
  }
  return out;
}

export const getNameInitials = (userName: string | undefined) =>
  typeof userName === "string"
    ? userName
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase()
    : "name";

export const fieldClass = (disabled: boolean) =>
  `border-st-border-light text-right w-72 ${
    disabled
      ? [
          "text-st-200",
          "placeholder:text-st-200",
          "disabled:placeholder:text-st-200",
          "disabled:opacity-100",
          "disabled:border-0 disabled:shadow-none disabled:bg-transparent",
          "focus-visible:ring-0 focus-visible:border-transparent",
          "disabled:px-0 disabled:py-0 ",
        ].join(" ")
      : "text-st-300 p-m px-3 py-1"
  }`;
