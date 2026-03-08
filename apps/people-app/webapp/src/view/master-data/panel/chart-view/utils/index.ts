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
import { BusinessUnit, Company, SubTeam, Unit, Team } from "@root/src/services/organization";
import { ChildItem, ChildTypeLabel, OrganizationItem, UnitType } from "@root/src/utils/utils";

// Type guards
export function isCompany(item: OrganizationItem): item is Company {
  return "businessUnits" in item;
}

export function isBusinessUnit(item: OrganizationItem): item is BusinessUnit {
  return "teams" in item && !("businessUnits" in item);
}

export function isTeam(item: OrganizationItem): item is Team {
  return "subTeams" in item;
}

export function isSubTeam(item: OrganizationItem): item is SubTeam {
  return "units" in item && !("subTeams" in item);
}

export function isUnit(item: OrganizationItem): item is Unit {
  return (
    !("businessUnits" in item) && !("teams" in item) && !("subTeams" in item) && !("units" in item)
  );
}

// Helper to get children from an organization item
export function getChildren(item: OrganizationItem): ChildItem[] {
  if (isCompany(item)) {
    return item.businessUnits || [];
  }
  if (isBusinessUnit(item)) {
    return item.teams || [];
  }
  if (isTeam(item)) {
    return item.subTeams || [];
  }
  if (isSubTeam(item)) {
    return item.units || [];
  }
  return [];
}

// Helper to get child type label
export function getChildTypeLabel(item: OrganizationItem): ChildTypeLabel {
  if (isCompany(item)) {
    return "Business Units";
  }
  if (isBusinessUnit(item)) {
    return "Teams";
  }
  if (isTeam(item)) {
    return "Sub-Teams";
  }
  if (isSubTeam(item)) {
    return "Units";
  }
  return "Units";
}

// Helper to get the entity type name
export function getEntityTypeName(item: OrganizationItem): UnitType | null {
  if (isCompany(item)) {
    return UnitType.Company;
  }
  if (isBusinessUnit(item)) {
    return UnitType.BusinessUnit;
  }
  if (isTeam(item)) {
    return UnitType.Team;
  }
  if (isSubTeam(item)) {
    return UnitType.SubTeam;
  }
  if (isUnit(item)) {
    return UnitType.Unit;
  }
  return null;
}

// Helper function to truncate name if too long
export const truncateName = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
};
