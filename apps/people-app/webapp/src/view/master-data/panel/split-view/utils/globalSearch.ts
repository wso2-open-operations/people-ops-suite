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
  OrganizationInfo,
  SubTeamState,
  TeamState,
  UnitState,
} from "@slices/organizationSlice/organizationStructure";

export type MatchSearch = {
  type: NodeType;
  buId: string | null;
  teamId: string | null;
  subTeamId: string | null;
  unitId: string | null;
};

type OrgItem = BusinessUnitState | TeamState | SubTeamState | UnitState;

const itemToMatchSearchByType: Record<
  NodeType,
  (org: OrganizationInfo, i: OrgItem) => MatchSearch
> = {
  [NodeType.Company]: () => ({ type: NodeType.Company, buId: null, ...NULL_IDS }),
  [NodeType.BusinessUnit]: (_, i) => ({
    type: NodeType.BusinessUnit,
    buId: i.id,
    ...NULL_IDS,
  }),
  [NodeType.Team]: (_, i) => ({
    type: NodeType.Team,
    buId: i.parentId,
    teamId: i.id,
    subTeamId: null,
    unitId: null,
  }),
  [NodeType.SubTeam]: (org, i) => {
    const team = org.teams.find((t) => t.id === i.parentId);
    return {
      type: NodeType.SubTeam,
      buId: team?.parentId ?? null,
      teamId: i.parentId,
      subTeamId: i.id,
      unitId: null,
    };
  },
  [NodeType.Unit]: (org, i) => {
    const subTeam = org.subTeams.find((s) => s.id === i.parentId);
    const team = subTeam ? org.teams.find((t) => t.id === subTeam.parentId) : undefined;
    return {
      type: NodeType.Unit,
      buId: team?.parentId ?? null,
      teamId: subTeam?.parentId ?? null,
      subTeamId: i.parentId,
      unitId: i.id,
    };
  },
};

/** Maps an org item (BU, Team, SubTeam, Unit) to a MatchSearch. O(1) dispatch via strategy map. */
export function itemToMatchSearch(orgItems: OrganizationInfo, item: OrgItem): MatchSearch {
  return itemToMatchSearchByType[item.type](orgItems, item);
}
