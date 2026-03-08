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
  CompanyState,
  BusinessUnitState,
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

export function normalizeCompanyToOrganizationState(companyDto: Company): OrganizationInfo {
  const businessUnits: BusinessUnitState[] = [];
  const teams: TeamState[] = [];
  const subTeams: SubTeamState[] = [];
  const units: UnitState[] = [];
  const company: CompanyState = {...companyDto, type: NodeType.Company};

  for (const bu of company.businessUnits) {
    businessUnits.push({ ...bu, parentId: company.id, type: NodeType.BusinessUnit });

    for (const team of bu.teams) {
      teams.push({ ...team, parentId: bu.id, type: NodeType.Team });

      for (const subTeam of team.subTeams) {
        subTeams.push({ ...subTeam, parentId: team.id, type: NodeType.SubTeam });

        for (const unit of subTeam.units) {
          units.push({ ...unit, parentId: subTeam.id, type: NodeType.Unit });
        }
      }
    }
  }

  return {
    company,
    businessUnits,
    teams,
    subTeams,
    units,
  };
}
