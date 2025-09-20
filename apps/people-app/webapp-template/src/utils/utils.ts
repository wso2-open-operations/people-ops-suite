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

type NullableDate = Date | null;
type DateParts = { year: number; month: number; day: number };

export function toYmdString(d: DateParts | null): string {
  if (!d) return "";
  const y = String(d.year).padStart(4, "0");
  const m = String(d.month).padStart(2, "0");
  const day = String(d.day).padStart(2, "0");
  return `${y} ${m} ${day}`;
}

export function fromYmdString(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return { year: y, month: m, day: d };
}

export const fromYmd = (s: string): NullableDate => {
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? { year: +m[1], month: +m[2], day: +m[3] } : null;
};

type Start = { year: number; month: number; day: number } | Date | undefined;

export const yearsOfService = (start: Start, now = new Date()) => {
  if (!start) return 0;
  const y = start instanceof Date ? start.getFullYear() : start.year;
  const m = start instanceof Date ? start.getMonth() + 1 : start.month;
  const d = start instanceof Date ? start.getDate() : start.day;

  let yrs = now.getFullYear() - y;
  if (now.getMonth() + 1 < m || (now.getMonth() + 1 === m && now.getDate() < d)) yrs--;
  return Math.max(0, yrs);
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
