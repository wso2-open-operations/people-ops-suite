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

import { PayloadAction, createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { Job, State } from "@/types/types";
import {
  OrgStructure,
  VacancyDetail,
  fetchOrgStructure,
  fetchVacancies,
  fetchVacancyDetail,
} from "@utils/vacancyService";

interface CareersState {
  jobs: Job[];
  jobsState: State;
  jobDetails: Record<string, VacancyDetail>;
  orgStructure: OrgStructure;
  orgStructureState: State;
  savedJobIds: string[];
}

const initialState: CareersState = {
  jobs: [],
  jobsState: State.idle,
  jobDetails: {},
  orgStructure: { locations: [], teams: [] },
  orgStructureState: State.idle,
  // Save state is local/in-memory only -- not yet persisted to the backend,
  // so it resets on refresh.
  savedJobIds: [],
};

export const loadJobs = createAsyncThunk("careers/loadJobs", async (accessToken: string) => {
  return await fetchVacancies(accessToken);
});

export const loadOrgStructure = createAsyncThunk("careers/loadOrgStructure", async (accessToken: string) => {
  return await fetchOrgStructure(accessToken);
});

export const loadJobDetail = createAsyncThunk(
  "careers/loadJobDetail",
  async ({ accessToken, jobId }: { accessToken: string; jobId: string }) => {
    return await fetchVacancyDetail(jobId, accessToken);
  },
);

export const CareersSlice = createSlice({
  name: "careers",
  initialState,
  reducers: {
    toggleSaveJob: (state, action: PayloadAction<string>) => {
      const idx = state.savedJobIds.indexOf(action.payload);
      if (idx >= 0) {
        state.savedJobIds.splice(idx, 1);
      } else {
        state.savedJobIds.push(action.payload);
      }
    },
    // A token that could not be obtained means the loads never started, so whatever was waiting to load has failed.
    loadFailed: (state) => {
      if (state.jobsState === State.idle) state.jobsState = State.failed;
      if (state.orgStructureState === State.idle) state.orgStructureState = State.failed;
    },
    // Puts failed loads back to idle so the shell, which owns loading, tries them again.
    retryLoad: (state) => {
      if (state.jobsState === State.failed) state.jobsState = State.idle;
      if (state.orgStructureState === State.failed) state.orgStructureState = State.idle;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadJobs.pending, (state) => {
        state.jobsState = State.loading;
      })
      .addCase(loadJobs.fulfilled, (state, action) => {
        state.jobs = action.payload;
        state.jobsState = State.success;
      })
      .addCase(loadJobs.rejected, (state) => {
        state.jobsState = State.failed;
      })
      .addCase(loadOrgStructure.pending, (state) => {
        state.orgStructureState = State.loading;
      })
      .addCase(loadOrgStructure.fulfilled, (state, action) => {
        state.orgStructure = action.payload;
        state.orgStructureState = State.success;
      })
      .addCase(loadOrgStructure.rejected, (state) => {
        state.orgStructureState = State.failed;
        state.orgStructure = { locations: [], teams: [] };
      })
      .addCase(loadJobDetail.fulfilled, (state, action) => {
        state.jobDetails[action.payload.id] = action.payload;
      });
  },
});

export const { toggleSaveJob, loadFailed, retryLoad } = CareersSlice.actions;
export default CareersSlice.reducer;
