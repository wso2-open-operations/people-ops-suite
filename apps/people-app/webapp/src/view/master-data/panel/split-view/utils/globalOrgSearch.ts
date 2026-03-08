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

import { BusinessUnit } from "@services/organization";

export type OrgNodeType = "business_unit" | "team" | "sub_team" | "unit";

export interface OrgSearchNode {
  id: string;
  type: OrgNodeType;
  name: string;
  headName: string;
  headEmail: string;
  leadName: string;
  leadEmail: string;
  businessUnitId: string;
  teamId?: string;
  subTeamId?: string;
}

const normalize = (value: string | undefined) => (value || "").toLowerCase();

export const buildGlobalOrgSearchIndex = (businessUnits: BusinessUnit[]): OrgSearchNode[] => {
  const nodes: OrgSearchNode[] = [];

  businessUnits.forEach((bu) => {
    nodes.push({
      id: bu.id,
      type: "business_unit",
      name: bu.name,
      headName: normalize(bu.head?.name),
      headEmail: normalize(bu.head?.email),
      leadName: normalize(bu.functionalLead?.name),
      leadEmail: normalize(bu.functionalLead?.email),
      businessUnitId: bu.id,
    });

    bu.teams.forEach((team) => {
      nodes.push({
        id: team.id,
        type: "team",
        name: team.name,
        headName: normalize(team.head?.name),
        headEmail: normalize(team.head?.email),
        leadName: normalize(team.functionalLead?.name),
        leadEmail: normalize(team.functionalLead?.email),
        businessUnitId: bu.id,
        teamId: team.id,
      });

      team.subTeams.forEach((subTeam) => {
        nodes.push({
          id: subTeam.id,
          type: "sub_team",
          name: subTeam.name,
          headName: normalize(subTeam.head?.name),
          headEmail: normalize(subTeam.head?.email),
          leadName: normalize(subTeam.functionalLead?.name),
          leadEmail: normalize(subTeam.functionalLead?.email),
          businessUnitId: bu.id,
          teamId: team.id,
          subTeamId: subTeam.id,
        });

        subTeam.units.forEach((unit) => {
          nodes.push({
            id: unit.id,
            type: "unit",
            name: unit.name,
            headName: normalize(unit.head?.name),
            headEmail: normalize(unit.head?.email),
            leadName: normalize(unit.functionalLead?.name),
            leadEmail: normalize(unit.functionalLead?.email),
            businessUnitId: bu.id,
            teamId: team.id,
            subTeamId: subTeam.id,
          });
        });
      });
    });
  });

  return nodes;
};

export const runGlobalOrgSearch = (index: OrgSearchNode[], query: string): OrgSearchNode[] => {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];

  return index.filter((node) => {
    return (
      node.name.toLowerCase().includes(normalized) ||
      node.headName.includes(normalized) ||
      node.headEmail.includes(normalized) ||
      node.leadName.includes(normalized) ||
      node.leadEmail.includes(normalized)
    );
  });
};

