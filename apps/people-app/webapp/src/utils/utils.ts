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
import { differenceInMonths, differenceInYears, isAfter, isMatch, isValid, parse } from "date-fns";

import { BusinessUnit, Company, SubTeam, Team, Unit } from "@services/organization";
import type {
  BusinessUnitState,
  CompanyState,
  OrganizationInfo,
  SubTeamState,
  TeamState,
  UnitState,
} from "@slices/organizationSlice/organizationStructure";

import { DATE_FMT } from "../config/constant";
import { ServiceLength } from "../types/types";
import { NodeType } from "./types";

export function isIncludedRole(roles: string[], allowedRoles: string[]) {
  return roles.some((role) => allowedRoles.includes(role));
}

const parseStrictYyyyMmDd = (s: string): Date | null => {
  const v = s.trim();
  if (!isMatch(v, DATE_FMT)) return null;

  const d = parse(v, DATE_FMT, new Date());
  return isValid(d) ? d : null;
};

export const calculateAge = (dob: string, now: Date = new Date()): number | null => {
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

  return {
    years: Math.floor(totalMonths / 12),
    months: totalMonths % 12,
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

export const toSentenceCase = (value: string): string => {
  if (!value) return value;
  return value
    .replace(/[_-]/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

export const sortAndFormatOptions = <T>(options: T[], getLabel: (option: T) => string): T[] => {
  return [...options].sort((a, b) => {
    const aLabel = getLabel(a);
    const bLabel = getLabel(b);
    return aLabel.localeCompare(bLabel, undefined, { sensitivity: "base" });
  });
};

export function getEmployeeStatusColor(
  status: string,
): "default" | "success" | "warning" | "error" {
  switch (status?.toLowerCase()) {
    case "active":
      return "success";
    case "marked leaver":
      return "warning";
    case "left":
      return "error";
    default:
      return "default";
  }
}

export const markAllFieldsTouched = (errors: any) => {
  const touched: any = {};
  const markTouched = (obj: any, touchedObj: any) => {
    Object.keys(obj).forEach((key) => {
      if (typeof obj[key] === "object" && obj[key] !== null && !Array.isArray(obj[key])) {
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

// Format date function
export const formatDate = (dateString?: string | null) => {
  if (!dateString) return null;
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  } catch {
    return dateString;
  }
};

export enum UnitType {
  Company = "COMPANY",
  BusinessUnit = "BUSINESS_UNIT",
  Team = "TEAM",
  SubTeam = "SUB_TEAM",
  Unit = "UNIT",
}

export const UnitTypeLabel: Record<UnitType, string> = {
  [UnitType.Company]: "Company",
  [UnitType.BusinessUnit]: "Business Unit",
  [UnitType.Team]: "Team",
  [UnitType.SubTeam]: "Sub Team",
  [UnitType.Unit]: "Unit",
};

// Union type for all organization items
export type OrganizationItem = Company | BusinessUnit | Team | SubTeam | Unit;

// Union type for child items
export type ChildItem = BusinessUnit | Team | SubTeam | Unit;

// Child type labels
export type ChildTypeLabel = "Business Units" | "Teams" | "Sub-Teams" | "Units";

export const generateOrgNodeUniqueId = (nodeType: NodeType, segments: Array<string | number>) =>
  [nodeType, ...segments].join(":");

export function normalizeCompanyToOrganizationState(companyDto: Company): OrganizationInfo {
  const businessUnits: BusinessUnitState[] = [];
  const teams: TeamState[] = [];
  const subTeams: SubTeamState[] = [];
  const units: UnitState[] = [];
  const companyUniqueId = generateOrgNodeUniqueId(NodeType.Company, [companyDto.id]);
  const company: CompanyState = {
    ...companyDto,
    uniqueId: companyUniqueId,
    type: NodeType.Company,
  };

  for (const bu of companyDto.businessUnits) {
    const transformedTeams: TeamState[] = [];
    const buUniqueId = generateOrgNodeUniqueId(NodeType.BusinessUnit, [bu.id]);

    for (const team of bu.teams) {
      const transformedSubTeams: SubTeamState[] = [];
      const teamUniqueId = generateOrgNodeUniqueId(NodeType.Team, [bu.id, team.id]);

      for (const subTeam of team.subTeams) {
        const transformedUnits: UnitState[] = [];
        const subTeamUniqueId = generateOrgNodeUniqueId(NodeType.SubTeam, [
          bu.id,
          team.id,
          subTeam.id,
        ]);

        for (const unit of subTeam.units) {
          const unitUniqueId = generateOrgNodeUniqueId(NodeType.Unit, [
            bu.id,
            team.id,
            subTeam.id,
            unit.id,
          ]);
          const transformedUnit: UnitState = {
            ...unit,
            uniqueId: unitUniqueId,
            parentId: subTeamUniqueId,
            type: NodeType.Unit,
          };
          transformedUnits.push(transformedUnit);
          units.push(transformedUnit);
        }

        const transformedSubTeam: SubTeamState = {
          ...subTeam,
          uniqueId: subTeamUniqueId,
          parentId: teamUniqueId,
          type: NodeType.SubTeam,
          units: transformedUnits,
        };
        transformedSubTeams.push(transformedSubTeam);
        subTeams.push(transformedSubTeam);
      }

      const transformedTeam: TeamState = {
        ...team,
        uniqueId: teamUniqueId,
        parentId: buUniqueId,
        type: NodeType.Team,
        subTeams: transformedSubTeams,
      };
      transformedTeams.push(transformedTeam);
      teams.push(transformedTeam);
    }

    const transformedBU: BusinessUnitState = {
      ...bu,
      uniqueId: buUniqueId,
      parentId: companyUniqueId,
      type: NodeType.BusinessUnit,
      teams: transformedTeams,
    };
    businessUnits.push(transformedBU);
  }

  return {
    company,
    businessUnits,
    teams,
    subTeams,
    units,
  };
}

export const convertDataTypeToLabel = (dataType: NodeType) => {
  switch (dataType) {
    case NodeType.BusinessUnit:
      return "Business Unit";
    case NodeType.Team:
      return "Team";
    case NodeType.SubTeam:
      return "Sub Team";
    case NodeType.Unit:
      return "Unit";
    default:
      return "";
  }
};
