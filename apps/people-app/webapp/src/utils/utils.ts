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
import { BusinessUnit, Company, SubTeam, Team, Unit } from "@services/organization";
import type {
  BusinessUnitState,
  CompanyState,
  OrganizationInfo,
  SubTeamState,
  TeamState,
  UnitState,
} from "@slices/organizationSlice/organizationStructure";

import { NodeType } from "./types";

export function isIncludedRole(roles: string[], allowedRoles: string[]) {
  return roles.some((role) => allowedRoles.includes(role));
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
        const subTeamUniqueId = generateOrgNodeUniqueId(NodeType.SubTeam, [bu.id, team.id, subTeam.id]);

        for (const unit of subTeam.units) {
          const unitUniqueId = generateOrgNodeUniqueId(NodeType.Unit, [bu.id, team.id, subTeam.id, unit.id]);
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
