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
import { NodeType } from "@root/src/utils/types";
import type {
  BusinessUnitState,
  CompanyState,
  OrganizationInfo,
  SubTeamState,
  TeamState,
} from "@slices/organizationSlice/organizationStructure";

export type OrgStructureState = BusinessUnitState | TeamState | SubTeamState;

export default function useFindParent(
  orgItems: OrganizationInfo | null,
  parentId: string,
): CompanyState | OrgStructureState | null {
  if (!orgItems) return null;

  if (orgItems.company.id === parentId) {
    return orgItems.company;
  }

  const allChildren: OrgStructureState[] = [
    ...orgItems.businessUnits,
    ...orgItems.teams,
    ...orgItems.subTeams,
  ];

  return allChildren.find((node) => node.id === parentId) ?? null;
}

export function useFindMappingId(
  orgItems: OrganizationInfo | null,
  parentId: string,
  nodeType: NodeType,
): string | null {
  if (!orgItems) return null;

  switch (nodeType) {
    case NodeType.BusinessUnit:
      // Parent is the company; its id is the mapping reference
      return orgItems.company.id === parentId ? orgItems.company.id : null;

    case NodeType.Team: {
      // Parent is a BusinessUnit → BU has no mappingId, use its id
      const bu = orgItems.businessUnits.find((node) => node.id === parentId) ?? null;
      return bu ? bu.id : null;
    }

    case NodeType.SubTeam: {
      // Parent is a Team → Team has a mappingId
      const team = orgItems.teams.find((node) => node.id === parentId) ?? null;
      return team ? team.mappingId : null;
    }

    case NodeType.Unit: {
      // Parent is a SubTeam → SubTeam has a mappingId
      const subTeam = orgItems.subTeams.find((node) => node.id === parentId) ?? null;
      return subTeam ? subTeam.mappingId : null;
    }

    default:
      return null;
  }
}

export function useFindParentMappingId(
  orgItems: OrganizationInfo,
  id: string,
  nodeType: NodeType,
): string | null {
  switch (nodeType) {
    case NodeType.Company:
      return orgItems.company.id;

    case NodeType.BusinessUnit:
      return orgItems.company.id;

    case NodeType.Team:
      const s = [...orgItems.businessUnits].find((node) => node.id === id) ?? null;
      return (s as BusinessUnitState).id ?? null;

    case NodeType.SubTeam:
      const d = [...orgItems.teams].find((node) => node.id === id) ?? null;
      return (d as TeamState).id ?? null;

    case NodeType.Unit:
      const a = [...orgItems.subTeams].find((node) => node.id === id) ?? null;
      return (a as SubTeamState).id ?? null;

    default:
      return null;
  }
}
