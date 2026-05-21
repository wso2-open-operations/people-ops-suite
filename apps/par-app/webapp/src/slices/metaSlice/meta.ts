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

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { HttpStatusCode } from "axios";

import { AppConfig } from "@config/config";
import { SnackMessage, sliceErrorMessages } from "@config/constant";
import { enqueueSnackbarMessage } from "@slices/commonSlice/common";
import { RootState } from "@slices/store";
import { ApiService } from "@utils/apiService";
import { ParConfigurations, RequestState } from "@utils/types";
import { getErrorMessage } from "@utils/utils";

export interface Employee {
  workEmail: string;
  employeeName: string;
  employeeThumbnail?: string;
  isLead?: boolean;
  managerEmail?: string;
}
interface ConfigState {
  globalConfig: ParConfigurations;
  employeeMap: {
    [key: string]: { employeeName: string; employeeThumbnail: string };
  };
  employeeArray: Employee[];
  participantsArray: Employee[];
  subordinatesArray: Employee[];
  configStatus: RequestState;
  employeeStatus: RequestState;
  participantState: RequestState;
  subordinatesState: RequestState;
}

const initialState: ConfigState = {
  globalConfig: {
    employeeParQuestion: "",
    threeSixtyReviewQuestion: "",
    parRatings: [],
    threeSixtyReviewRatings: [],
  },
  employeeMap: {},
  employeeArray: [],
  participantsArray: [],
  subordinatesArray: [],
  configStatus: RequestState.IDLE,
  employeeStatus: RequestState.IDLE,
  participantState: RequestState.IDLE,
  subordinatesState: RequestState.IDLE,
};

export const fetchConfigurations = createAsyncThunk(
  "globalConfig/fetchConfigurations",
  async (_, { dispatch }) => {
    try {
      const resp = await ApiService.getInstance().get(AppConfig.serviceUrls.configurations);
      if (resp.status === HttpStatusCode.Ok) {
        return resp.data;
      } else {
        throw new Error(resp.data?.message || sliceErrorMessages.metaSlice.fetchConfigs);
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error, SnackMessage.error.fetchGlobalParConfigs);
      dispatch(
        enqueueSnackbarMessage({
          message: errorMessage,
          type: "error",
        }),
      );
      throw error;
    }
  },
);

export const updateConfigurations = createAsyncThunk(
  "globalConfig/updateConfigurations",
  async (payload: ParConfigurations, { dispatch }) => {
    try {
      const resp = await ApiService.getInstance().put(
        AppConfig.serviceUrls.configurations,
        payload,
      );
      const message =
        resp.status === HttpStatusCode.Ok
          ? SnackMessage.success.updateGlobalParConfigs
          : SnackMessage.error.updateGlobalParConfigs;
      const type = resp.status === HttpStatusCode.Ok ? "success" : "error";
      dispatch(enqueueSnackbarMessage({ message, type }));

      if (resp.status === HttpStatusCode.Ok) {
        return resp.data;
      } else {
        throw new Error(resp.data?.message || sliceErrorMessages.metaSlice.postConfigs);
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error, SnackMessage.error.updateGlobalParConfigs);
      dispatch(
        enqueueSnackbarMessage({
          message: errorMessage,
          type: "error",
        }),
      );
      throw error;
    }
  },
);

export const fetchEmployees = createAsyncThunk(
  "globalConfig/fetchEmployees",
  async (_, { dispatch }) => {
    try {
      const resp = await ApiService.getInstance().get(AppConfig.serviceUrls.employees);
      if (resp.status === HttpStatusCode.Ok) {
        return resp.data;
      } else {
        throw new Error(resp.data?.message || sliceErrorMessages.metaSlice.fetchEmployees);
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error, SnackMessage.error.fetchEmployeesData);
      dispatch(
        enqueueSnackbarMessage({
          message: errorMessage,
          type: "error",
        }),
      );
      throw error;
    }
  },
);

export const fetchParticipants = createAsyncThunk(
  "employee/fetchParticipants",
  async (
    { parCycleId, leadEmail }: { parCycleId: number; leadEmail: string | null },
    { dispatch },
  ) => {
    try {
      const url = new URL(`${AppConfig.serviceUrls.parCycles}/${parCycleId}/participants`);
      if (leadEmail) {
        url.searchParams.append("leadEmail", leadEmail);
      }
      const resp = await ApiService.getInstance().get(url.toString());
      if (resp.status === HttpStatusCode.Ok) {
        return resp.data;
      } else {
        throw new Error(resp.data?.message || sliceErrorMessages.metaSlice.fetchEmployees);
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error, SnackMessage.error.fetchEmployeesData);
      dispatch(
        enqueueSnackbarMessage({
          message: errorMessage,
          type: "error",
        }),
      );
      throw error;
    }
  },
);

export const fetchEntityEmployees = createAsyncThunk(
  "employees/fetchEntityEmployees",
  async ({ leadEmail }: { leadEmail?: string } = {}, { dispatch }) => {
    try {
      const base = AppConfig.serviceUrls.userData;
      const url = leadEmail ? `${base}?leadEmail=${encodeURIComponent(leadEmail)}` : base;
      const resp = await ApiService.getInstance().get(url);
      if (resp.status === HttpStatusCode.Ok) {
        const list = (resp.data as any[]).map((e) => ({
          workEmail: e.workEmail,
          employeeName: e.employeeName,
          employeeThumbnail: e.employeeThumbnail,
          isLead: e.isLead,
        })) as Employee[];
        return list;
      }
      throw new Error(resp.data?.message ?? "Failed to load employees from Entity");
    } catch (err) {
      dispatch(
        enqueueSnackbarMessage({
          message: getErrorMessage(err, "Failed to load employees"),
          type: "error",
        }),
      );
      throw err;
    }
  },
);

const metaSlice = createSlice({
  name: "meta",
  initialState,
  reducers: {
    resetParticipants(state) {
      state.participantState = RequestState.IDLE;
      state.participantsArray = [];
    },
    resetSubordinates(state) {
      state.subordinatesArray = [];
      state.subordinatesState = RequestState.IDLE;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchConfigurations.pending, (state) => {
        state.configStatus = RequestState.LOADING;
      })
      .addCase(fetchConfigurations.fulfilled, (state, action) => {
        const payload = action.payload;
        state.globalConfig.employeeParQuestion = payload.employeeParQuestion;
        state.globalConfig.threeSixtyReviewQuestion = payload.threeSixtyReviewQuestion;
        state.globalConfig.parRatings = payload.parRatings;
        state.globalConfig.threeSixtyReviewRatings = payload.threeSixtyReviewRatings;
        state.configStatus = RequestState.SUCCEEDED;
      })
      .addCase(fetchConfigurations.rejected, (state) => {
        state.configStatus = RequestState.FAILED;
      })
      .addCase(fetchEmployees.pending, (state) => {
        state.employeeStatus = RequestState.LOADING;
      })
      .addCase(fetchEmployees.fulfilled, (state, action) => {
        const employees = action.payload as Employee[];
        state.employeeArray = employees.sort((a, b) => {
          const emailA = a.workEmail.toLowerCase();
          const emailB = b.workEmail.toLowerCase();
          if (emailA < emailB) return -1;
          if (emailA > emailB) return 1;
          return 0;
        });
        state.employeeMap = employees.reduce(
          (acc, employee) => {
            acc[employee.workEmail] = {
              employeeName: employee.employeeName,
              employeeThumbnail: employee.employeeThumbnail ?? "",
            };
            return acc;
          },
          {} as {
            [key: string]: {
              employeeName: string;
              employeeThumbnail: string;
            };
          },
        );
        state.employeeStatus = RequestState.SUCCEEDED;
      })
      .addCase(fetchEntityEmployees.pending, (state) => {
        state.subordinatesState = RequestState.LOADING;
      })
      .addCase(fetchEntityEmployees.fulfilled, (state, action) => {
        state.subordinatesArray = (action.payload as Employee[]).sort((a, b) =>
          a.workEmail.toLowerCase().localeCompare(b.workEmail.toLowerCase()),
        );
        state.subordinatesState = RequestState.SUCCEEDED;
      })
      .addCase(fetchEntityEmployees.rejected, (state) => {
        state.subordinatesState = RequestState.FAILED;
      })
      .addCase(fetchEmployees.rejected, (state) => {
        state.employeeStatus = RequestState.FAILED;
      })
      .addCase(fetchParticipants.pending, (state) => {
        state.participantState = RequestState.LOADING;
      })
      .addCase(fetchParticipants.fulfilled, (state, action) => {
        state.participantsArray = action.payload;
        state.participantState = RequestState.SUCCEEDED;
      })
      .addCase(fetchParticipants.rejected, (state) => {
        state.participantState = RequestState.FAILED;
      });
  },
});

export const selectGlobalConfig = (state: RootState) => state.meta.globalConfig;
export const selectConfigStatus = (state: RootState) => state.meta.configStatus;
export const selectEmployeeMap = (state: RootState) => state.meta.employeeMap;
export const selectEmployeeArray = (state: RootState) => state.meta.employeeArray;
export const selectEmployeeMapStatus = (state: RootState) => state.meta.employeeStatus;
export const selectParticipantsStatus = (state: RootState) => state.meta.participantState;
export const selectParticipants = (state: RootState) => state.meta.participantsArray;
export const selectSubordinatesArray = (state: RootState) => state.meta.subordinatesArray;
export const selectSubordinates = (state: RootState) => state.meta.subordinatesState;
export const selectManagerEmailSet = (state: RootState): Set<string> =>
  new Set(state.meta.employeeArray.map((e) => e.managerEmail).filter(Boolean) as string[]);

export const { resetParticipants, resetSubordinates } = metaSlice.actions;
export default metaSlice.reducer;
