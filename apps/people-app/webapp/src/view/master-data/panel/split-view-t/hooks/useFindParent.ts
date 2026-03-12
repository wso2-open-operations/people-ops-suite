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
  UnitState,
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

export function useFindParentTwo(
  orgItems: OrganizationInfo | null,
  parentId: string,
): string | null {
  if (!orgItems) return null;

  if (orgItems.company.id === parentId) {
    return parentId;
  }

  const allChildren: OrgStructureState[] = [
    ...orgItems.businessUnits,
    ...orgItems.teams,
    ...orgItems.subTeams,
  ];

  const t = allChildren.find((node) => node.id === parentId) ?? null;

  if (!t) return null;

  let selectedId: string | null = null;

  switch (t.type) {
    case NodeType.Company:
      selectedId = t.id;
      break;
    case NodeType.BusinessUnit:
      selectedId = t.id;
      break;
    case NodeType.Team:
      selectedId = (t as TeamState).mappingId;
      break;
    case NodeType.SubTeam:
      selectedId = (t as SubTeamState).mappingId;
      break;
    case NodeType.Unit:
      selectedId = (t as UnitState).mappingId;
      break;
    default:
      selectedId = null;
  }

  return selectedId;
}
