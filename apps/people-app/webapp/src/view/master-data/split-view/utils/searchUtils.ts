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
// KIND, either express or implied. See the License for the
// specific language governing permissions and limitations
// under the License.

import { BusinessUnit, SubTeam, Team, Unit } from "@services/organization";

export const searchOrgItem = <T extends { name: string; head?: { name: string; email: string }; functionalLead?: { name: string; email: string } }>(
  item: T,
  query: string
): boolean => {
  if (!query.trim()) return true;

  const lowerQuery = query.toLowerCase().trim();
  const name = item.name?.toLowerCase() || "";
  const headName = item.head?.name?.toLowerCase() || "";
  const headEmail = item.head?.email?.toLowerCase() || "";
  const leadName = item.functionalLead?.name?.toLowerCase() || "";
  const leadEmail = item.functionalLead?.email?.toLowerCase() || "";
  
  return (
    name.includes(lowerQuery) ||
    headName.includes(lowerQuery) ||
    headEmail.includes(lowerQuery) ||
    leadName.includes(lowerQuery) ||
    leadEmail.includes(lowerQuery)
  );
};

export const filterBusinessUnits = (businessUnits: BusinessUnit[], searchQuery: string): BusinessUnit[] => {
  if (!searchQuery.trim()) return businessUnits;
  return businessUnits.filter((bu) => searchOrgItem(bu, searchQuery));
};

export const filterTeams = (teams: Team[], searchQuery: string): Team[] => {
  if (!searchQuery.trim()) return teams;
  return teams.filter((team) => searchOrgItem(team, searchQuery));
};

export const filterSubTeams = (subTeams: SubTeam[], searchQuery: string): SubTeam[] => {
  if (!searchQuery.trim()) return subTeams;
  return subTeams.filter((subTeam) => searchOrgItem(subTeam, searchQuery));
};

export const filterUnits = (units: Unit[], searchQuery: string): Unit[] => {
  if (!searchQuery.trim()) return units;
  return units.filter((unit) => searchOrgItem(unit, searchQuery));
};

export interface GlobalSearchResult {
  businessUnit?: BusinessUnit;
  team?: Team;
  subTeam?: SubTeam;
  unit?: Unit;
  type: "business_unit" | "team" | "sub_team" | "unit";
}

export const globalSearchOrgStructure = (
  businessUnits: BusinessUnit[],
  query: string
): GlobalSearchResult[] => {
  if (!query.trim()) return [];

  const results: GlobalSearchResult[] = [];

  businessUnits.forEach((bu) => {
    if (searchOrgItem(bu, query)) {
      results.push({ businessUnit: bu, type: "business_unit" });
    }

    bu.teams?.forEach((team) => {
      if (searchOrgItem(team, query)) {
        results.push({ businessUnit: bu, team, type: "team" });
      }

      team.subTeams?.forEach((subTeam) => {
        if (searchOrgItem(subTeam, query)) {
          results.push({ businessUnit: bu, team, subTeam, type: "sub_team" });
        }

        subTeam.units?.forEach((unit) => {
          if (searchOrgItem(unit, query)) {
            results.push({ businessUnit: bu, team, subTeam, unit, type: "unit" });
          }
        });
      });
    });
  });

  return results;
};
