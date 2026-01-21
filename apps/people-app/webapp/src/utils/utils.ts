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

import { ServiceLength } from "../types/types";
import { DATE_FMT } from "../config/constant";
import {
  differenceInMonths,
  differenceInYears,
  isAfter,
  isMatch,
  isValid,
  parse,
} from "date-fns";

export const isIncludedRole = (a: string[], b: string[]): boolean => {
  // TODO: Temporarily allow all roles. Remove this after the roles are finalized.
  return true;
  return [...getCrossItems(a, b), ...getCrossItems(b, a)].length > 0;
};

function getCrossItems<Role>(a: Role[], b: Role[]): Role[] {
  return a.filter((element) => {
    return b.includes(element);
  });
}

export const markAllFieldsTouched = (errors: any) => {
  const touched: any = {};
  const markTouched = (obj: any, touchedObj: any) => {
    Object.keys(obj).forEach((key) => {
      if (
        typeof obj[key] === "object" &&
        obj[key] !== null &&
        !Array.isArray(obj[key])
      ) {
        touchedObj[key] = {};
        markTouched(obj[key], touchedObj[key]);
      } else if (Array.isArray(obj[key])) {
        touchedObj[key] = obj[key].map((item: any) =>
          typeof item === "object" && item !== null ? {} : true,
        );
        obj[key].forEach((item: any, index: number) => {
          if (typeof item === "object" && item !== null) {
            markTouched(item, touchedObj[key][index]);
          }
        });
      } else {
        touchedObj[key] = true;
      }
    });
  };
  markTouched(errors, touched);
  return touched;
};

const parseStrictYyyyMmDd = (s: string): Date | null => {
  const v = s.trim();
  if (!isMatch(v, DATE_FMT)) return null;

  const d = parse(v, DATE_FMT, new Date());
  return isValid(d) ? d : null;
};

export const calculateAge = (
  dob: string,
  now: Date = new Date(),
): number | null => {
  const d = parseStrictYyyyMmDd(dob);
  if (!d || isAfter(d, now)) return null;
  return differenceInYears(now, d);
};

export const calculateServiceLength = (
  startDate: string,
  now: Date = new Date(),
): ServiceLength | null => {
  const start = parseStrictYyyyMmDd(startDate);
  if (!start || isAfter(start, now)) return null;

  const totalMonths = differenceInMonths(now, start);
  const safeMonths = totalMonths < 0 ? 0 : totalMonths;

  return {
    years: Math.floor(safeMonths / 12),
    months: safeMonths % 12,
  };
};

export const formatServiceLength = (length: ServiceLength | null): string => {
  if (!length) return "—";

  const { years, months } = length;
  if (years === 0 && months === 0) return "Less than 1 month";

  if (years > 0 && months > 0) {
    return `${years} ${years === 1 ? "year" : "years"} ${months} ${
      months === 1 ? "month" : "months"
    }`;
  }

  if (years > 0) return `${years} ${years === 1 ? "year" : "years"}`;
  return `${months} ${months === 1 ? "month" : "months"}`;
};
