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

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { HttpStatusCode, isCancel } from "axios";
import { State } from "@/types/types";
import { RootState } from "@slices/store";
import { enqueueSnackbarMessage } from "@slices/commonSlice/common";
import { loadInternHubDataFromApi } from "@utils/employeeHub/internApiData";
import { loadEmployeeHubDataFromApi } from "@utils/employeeHub/employeeApiData";
import type { EmployeeRow, JobBandRow } from "@utils/employeeHub/employeeApiData";
import type { InternRow } from "@utils/employeeHub/dateHelpers";

export interface EmployeeHubState {
  interns: InternRow[];
  inProgressInterns: InternRow[];
  // The two raw sources behind `inProgressInterns` (see mergeInProgressInterns
  // below), kept separately so either fetch can resolve independently, in
  // either order, without clobbering the other one's contribution.
  internProfileInProgress: InternRow[];
  liveOnlyInProgress: InternRow[];
  state: State;
  errorMessage: string | null;
  // Populated from GET /employee-hub/employees for the Dashboard's
  // "Permanent Employees" tab - not people-app's real `employee` slice.
  // Empty until that fetch succeeds.
  employees: EmployeeRow[];
  // Non-intern employees with status "Left" (see employeeApiData.ts).
  leavers: EmployeeRow[];
  // Team + job band per current non-intern employee, from the backend's
  // per-team counts - feeds the job band charts.
  jobBandRows: JobBandRow[];
  employeesState: State;
  employeesErrorMessage: string | null;
  // True once the employee fetch has succeeded, so the UI can explain an
  // empty employee list instead of silently showing an empty state.
  employeesIsLive: boolean;
}

const initialState: EmployeeHubState = {
  interns: [],
  inProgressInterns: [],
  internProfileInProgress: [],
  liveOnlyInProgress: [],
  state: State.idle,
  errorMessage: null,
  employees: [],
  leavers: [],
  jobBandRows: [],
  employeesState: State.idle,
  employeesErrorMessage: null,
  employeesIsLive: false,
};

// `inProgressInterns` is fed by two independent async fetches that resolve
// in an unpredictable order:
//  - fetchInternHubData (GET /intern-profiles) - the authoritative source,
//    with university/mentor/duration data.
//  - fetchEmployeeHubData (GET /employee-hub/employees) - catches any employee
//    whose employmentType is "INTERNSHIP"; these rows carry no university.
// Both results are merged by email, preferring the /intern-profiles row when
// the same person appears in both, so whichever fetch finishes last doesn't
// overwrite the other's data.
function keyForInternRow(row: InternRow): string {
  const email = String(row.emailId || row["Email ID"] || "").trim().toLowerCase();
  return email ? `email:${email}` : `id:${row.id}`;
}

// Only ever *adds* live-only rows whose email isn't already covered by an
// /intern-profiles row - it never drops or collapses rows within
// `fromProfiles` itself.
function mergeInProgressInterns(fromProfiles: InternRow[], fromLiveEmployees: InternRow[]): InternRow[] {
  const profileKeys = new Set(fromProfiles.map(keyForInternRow));
  const liveOnlyExtras = fromLiveEmployees.filter((row) => !profileKeys.has(keyForInternRow(row)));
  return [...fromProfiles, ...liveOnlyExtras];
}

// Fetches the intern roster from the real backend's GET /intern-profiles
// endpoint (backed by the `internship` table) - see internApiData.ts.
// Both fetches page through the whole roster, so they run once and the result
// is kept in the store: switching between the Permanent and Interns pages (or
// coming back from a profile) remounts the dashboard, and without this check
// every remount re-downloaded everything. `force` (the Refresh button) skips
// the cache; nothing ever starts a second copy while one is already running.
type HubFetchArg = { force?: boolean } | void;

export const fetchInternHubData = createAsyncThunk(
  "employeeHub/fetchAll",
  async (_: HubFetchArg, { dispatch, rejectWithValue }) => {
    try {
      return await loadInternHubDataFromApi();
    } catch (error: any) {
      if (isCancel(error)) return rejectWithValue("cancelled");
      const errorMessage =
        error.response?.status === HttpStatusCode.InternalServerError
          ? "Error fetching intern data"
          : error.response?.data?.message ||
            error.message ||
            "An unknown error occurred while fetching intern data.";
      dispatch(
        enqueueSnackbarMessage({
          message: errorMessage,
          type: "error",
        }),
      );
      return rejectWithValue(errorMessage);
    }
  },
  {
    condition: (arg, { getState }) => {
      const current = (getState() as RootState).employeeHub.state;
      if (current === State.loading) return false;
      return !!arg?.force || current !== State.success;
    },
  },
);

// Sources both the "Permanent Employees" tab and the live half of the
// Interns tab's hybrid roster from GET /employee-hub/employees - see
// employeeApiData.ts. Admin-only.
export const fetchEmployeeHubData = createAsyncThunk(
  "employeeHub/fetchEmployees",
  async (_: HubFetchArg) => loadEmployeeHubDataFromApi(),
  {
    condition: (arg, { getState }) => {
      const current = (getState() as RootState).employeeHub.employeesState;
      if (current === State.loading) return false;
      return !!arg?.force || current !== State.success;
    },
  },
);

const employeeHubSlice = createSlice({
  name: "employeeHub",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchInternHubData.pending, (state) => {
        state.state = State.loading;
        state.errorMessage = null;
      })
      .addCase(fetchInternHubData.fulfilled, (state, action) => {
        state.state = State.success;
        state.interns = action.payload.interns;
        state.internProfileInProgress = action.payload.inProgressInterns;
        state.inProgressInterns = mergeInProgressInterns(state.internProfileInProgress, state.liveOnlyInProgress);
      })
      .addCase(fetchInternHubData.rejected, (state, action) => {
        state.state = State.failed;
        state.errorMessage = (action.payload as string) || "Failed to load intern data";
      })
      .addCase(fetchEmployeeHubData.pending, (state) => {
        state.employeesState = State.loading;
        state.employeesErrorMessage = null;
      })
      .addCase(fetchEmployeeHubData.fulfilled, (state, action) => {
        state.employeesState = State.success;
        state.employeesErrorMessage = null;
        state.employeesIsLive = true;
        state.employees = action.payload.employees;
        state.leavers = action.payload.leavers;
        state.jobBandRows = action.payload.jobBandRows;
        state.liveOnlyInProgress = action.payload.inProgressInterns;
        state.inProgressInterns = mergeInProgressInterns(state.internProfileInProgress, state.liveOnlyInProgress);
      })
      .addCase(fetchEmployeeHubData.rejected, (state) => {
        // Settles with an empty `employees` list; employeesIsLive stays false,
        // so the Permanent page shows a "could not be loaded" banner with Retry.
        state.employeesState = State.success;
      });
  },
});

export default employeeHubSlice.reducer;

export const selectInternHubState = (state: RootState) => state.employeeHub.state;
export const selectInterns = (state: RootState) => state.employeeHub.interns;
export const selectInProgressInterns = (state: RootState) => state.employeeHub.inProgressInterns;
export const selectEmployeeHubState = (state: RootState) => state.employeeHub.employeesState;
export const selectEmployeeHub = (state: RootState) => state.employeeHub.employees;
