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
import { PayloadAction, createSlice } from "@reduxjs/toolkit";

import { NodeType } from "@root/src/utils/types";
import { normalizeCompanyToOrganizationState } from "@root/src/utils/utils";
import type { BusinessUnit, Company, SubTeam, Team, Unit } from "@services/organization";
import { organizationApi } from "@services/organization";
import { State } from "@slices/authSlice/auth";

export interface CompanyState extends Company {
  uniqueId: string;
  type: NodeType;
}

export interface BusinessUnitState extends BusinessUnit {
  uniqueId: string;
  parentId: string;
  type: NodeType;
  teams: TeamState[];
}

export interface TeamState extends Team {
  uniqueId: string;
  parentId: string;
  type: NodeType;
  subTeams: SubTeamState[];
}

export interface SubTeamState extends SubTeam {
  uniqueId: string;
  parentId: string;
  type: NodeType;
  units: UnitState[];
}

export interface UnitState extends Unit {
  uniqueId: string;
  parentId: string;
  type: NodeType;
}

export type OrgStructureState =
  | BusinessUnitState
  | TeamState
  | SubTeamState
  | UnitState;

export interface OrganizationInfo {
  units: UnitState[];
  subTeams: SubTeamState[];
  teams: TeamState[];
  businessUnits: BusinessUnitState[];
  company: CompanyState;
}

export interface OrganizationState {
  state: State;
  stateMessage: string | null;
  errorMessage: string | null;
  organizationInfo: OrganizationInfo | null;
}

const initialState: OrganizationState = {
  state: State.Idle,
  stateMessage: null,
  errorMessage: null,
  organizationInfo: null,
};

const organizationStructureSlice = createSlice({
  name: "organizationStructure",
  initialState: initialState,
  reducers: {
    setOrganizationStructure(state, action: PayloadAction<Company>) {
      state.organizationInfo = normalizeCompanyToOrganizationState(
        action.payload,
      );
      state.state = State.Success;
      state.stateMessage = "Successfully fetched organization data";
      state.errorMessage = null;
    },
    clearOrganizationStructure(state) {
      state.organizationInfo = null;
      state.state = State.Idle;
      state.stateMessage = null;
      state.errorMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addMatcher(
        organizationApi.endpoints.getOrgStructure.matchPending,
        (state) => {
          state.state = State.Loading;
          state.stateMessage = "Fetching organization data...";
          state.errorMessage = null;
        },
      )
      .addMatcher(
        organizationApi.endpoints.getOrgStructure.matchFulfilled,
        (state, action) => {
          state.organizationInfo = normalizeCompanyToOrganizationState(
            action.payload,
          );
          state.state = State.Success;
          state.stateMessage = "Successfully fetched organization data";
          state.errorMessage = null;
        },
      )
      .addMatcher(
        organizationApi.endpoints.getOrgStructure.matchRejected,
        (state, action) => {
          state.state = State.Failed;
          state.errorMessage = action.error.message as string;
          state.stateMessage = null;
        },
      );
  },
});

export const { setOrganizationStructure, clearOrganizationStructure } =
  organizationStructureSlice.actions;
export default organizationStructureSlice.reducer;
