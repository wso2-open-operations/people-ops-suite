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

import {
  differenceInMonths,
  differenceInYears,
  isAfter,
  isMatch,
  isValid,
  parse,
} from "date-fns";
import {
  BusinessUnit,
  Company,
  SubTeam,
  Team,
  Unit,
} from "@services/organization";
import {
  BusinessUnit as RawBusinessUnit,
  SubTeam as RawSubTeam,
  Team as RawTeam,
  Unit as RawUnit,
} from "@slices/organizationSlice/organization";
import type {
  BusinessUnitState,
  CompanyState,
  OrgStructureState,
  OrganizationInfo,
  SubTeamState,
  TeamState,
  UnitState,
} from "@slices/organizationSlice/organizationStructure";

import { format } from "date-fns";
import { NodeType, UnitType } from "./types";

import { DATE_FMT } from "../config/constant";
import { RouteObjectWithRole, ServiceLength } from "@/types/types";
import { AddOption } from "../view/master-data/panel/split-view/SplitView";

export const isIncludedRole = (a: string[], b: string[]): boolean => {
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

export const formatDate = (
  isoDate?: string | null,
  fallback?: string | null,
): string | null => {
  if (!isoDate) return fallback ?? null;
  const parsedDate = parseStrictYyyyMmDd(isoDate);
  if (!parsedDate) return fallback ?? null;
  return format(parsedDate, "dd/MM/yyyy");
};

export const isPresentOrFuture = (isoDate?: string | null): boolean => {
  if (!isoDate) return false;
  const parsedDate = parseStrictYyyyMmDd(isoDate);
  if (!parsedDate) return false;
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  parsedDate.setHours(0, 0, 0, 0);
  return parsedDate >= todayStart;
};

export const toSentenceCase = (value: string): string => {
  if (!value) return value;
  return value
    .replace(/[_-]/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

export const sortAndFormatOptions = <T>(
  options: T[],
  getLabel: (option: T) => string,
): T[] => {
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

/**
 * Checks whether a route is active for the given user roles.
 *
 * A route is active when at least one role matches `allowRoles`
 * and none of the roles match `excludeRoles`.
 */
export function isRouteActive(
  routeObj: RouteObjectWithRole,
  roles: string[],
): boolean {
  return (
    isIncludedRole(roles, routeObj.allowRoles) &&
    !(routeObj.excludeRoles && isIncludedRole(roles, routeObj.excludeRoles))
  );
}

/**
 * Joins a parent and child route path into a normalized absolute path.
 *
 * If `childPath` is already absolute, it is returned as-is.
 */
export function joinRoutePaths(parentPath: string, childPath: string): string {
  if (!childPath) return parentPath;
  if (childPath.startsWith("/")) return childPath;

  const normalizedParent = parentPath.endsWith("/")
    ? parentPath.slice(0, -1)
    : parentPath;
  const normalizedChild = childPath.startsWith("/")
    ? childPath.slice(1)
    : childPath;

  return `${normalizedParent}/${normalizedChild}`;
}

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

  return {
    years: Math.floor(totalMonths / 12),
    months: totalMonths % 12,
  };
};

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

export const generateOrgNodeUniqueId = (
  nodeType: NodeType,
  segments: Array<string | number>,
) => [nodeType, ...segments].join(":");

export function normalizeCompanyToOrganizationState(
  companyDto: Company,
): OrganizationInfo {
  const businessUnits: BusinessUnitState[] = [];
  const teams: TeamState[] = [];
  const subTeams: SubTeamState[] = [];
  const units: UnitState[] = [];
  const companyUniqueId = generateOrgNodeUniqueId(NodeType.Company, [
    companyDto.id,
  ]);
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
      const teamUniqueId = generateOrgNodeUniqueId(NodeType.Team, [
        bu.id,
        team.id,
      ]);

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

// Helper function to truncate name if too long
export const truncateName = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + " ...";
};

/**
 * Build add modal options by marking which items can be added.
 * Items that already exist as children are marked with canAdd: false.
 *
 * @param type - The node type being added
 * @param selectedNode - The parent node
 * @param orgItems - Available items to choose from
 * @returns Items with canAdd flag indicating if they can be added
 */
export function buildAddModalOptions(
  type: NodeType,
  selectedNode: OrgStructureState,
  orgItems: RawBusinessUnit[] | RawTeam[] | RawSubTeam[] | RawUnit[],
): AddOption[] {
  let existingIds: number[] = [];

  switch (type) {
    case NodeType.Team:
      existingIds =
        (selectedNode as BusinessUnitState).teams?.map((t) => t.id) ?? [];
      break;
    case NodeType.SubTeam:
      existingIds =
        (selectedNode as TeamState).subTeams?.map((st) => st.id) ?? [];
      break;
    case NodeType.Unit:
      existingIds =
        (selectedNode as SubTeamState).units?.map((u) => u.id) ?? [];
      break;
    case NodeType.BusinessUnit:
    default:
      existingIds = [];
      break;
  }

  // Mark items that already exist as canAdd: false
  return orgItems.map((item) => ({
    ...item,
    canAdd: !existingIds.includes(item.id),
  }));
}
