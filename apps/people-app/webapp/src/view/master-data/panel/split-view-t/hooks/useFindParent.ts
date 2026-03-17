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
import { NodeType } from "@utils/types";
import type {
  BusinessUnitState,
  CompanyState,
  OrganizationInfo,
  SubTeamState,
  TeamState,
  UnitState,
} from "@slices/organizationSlice/organizationStructure";

export type OrgStructureState = BusinessUnitState | TeamState | SubTeamState;

export function useFindNodeById(
  orgItems: OrganizationInfo | null,
  id: string,
  nodeType: NodeType,
): CompanyState | OrgStructureState | UnitState | null {
  if (!orgItems) return null;

  switch (nodeType) {
    case NodeType.Company:
      return orgItems.company.id === id ? orgItems.company : null;

    case NodeType.BusinessUnit:
      return orgItems.businessUnits.find((node) => node.id === id) ?? null;

    case NodeType.Team:
      return orgItems.teams.find((node) => node.id === id) ?? null;

    case NodeType.SubTeam:
      return orgItems.subTeams.find((node) => node.id === id) ?? null;

    case NodeType.Unit:
      return orgItems.units.find((node) => node.id === id) ?? null;

    default:
      return null;
  }
}

export function useFindParent(
  orgItems: OrganizationInfo | null,
  id: string,
  nodeType: NodeType,
): CompanyState | OrgStructureState | null {
  if (!orgItems) return null;

  switch (nodeType) {
    case NodeType.BusinessUnit:
      return orgItems.company;

    case NodeType.Team: {
      const bu = orgItems.businessUnits.find((node) => node.id === id) ?? null;
      return bu ? bu : null;
    }

    case NodeType.SubTeam: {
      const team = orgItems.teams.find((node) => node.id === id) ?? null;
      return team ? team : null;
    }

    case NodeType.Unit: {
      const subTeam = orgItems.subTeams.find((node) => node.id === id) ?? null;
      return subTeam ? subTeam : null;
    }

    default:
      return null;
  }
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
