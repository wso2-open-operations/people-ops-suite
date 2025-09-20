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
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios, { HttpStatusCode } from "axios";

import { AppConfig } from "@config/config";
import { SnackMessage } from "@config/constant";
import type { UserState } from "@slices/authSlice/auth";
import { enqueueSnackbarMessage } from "@slices/commonSlice/common";
import { APIService } from "@utils/apiService";

import { State } from "../../types/types";

interface Date {
  year: number;
  month: number;
  day: number;
}

type NullableDate = Date | null;

export interface EmployeeInfo {
  id: string;
  lastName: string;
  firstName: string;
  wso2Email: string;
  workPhoneNumber: string;
  epf: string;
  workLocation: string | null;
  employeeLocation: string;
  startDate: Date;
  jobRole: string;
  jobBand: number;
  managerEmail: string;
  reportToEmail: string;
  additionalManagerEmail: string | null;
  additionalReportToEmail: string | null;
  employeeStatus: string;
  lengthOfService: number;
  relocationStatus: string;
  employeeThumbnail: string;
  subordinateCount: number;
  timestamp: [number, number];
  probationEndDate: Date;
  agreementEndDate: NullableDate;
  employmentType: string;
  company: string;
  office: string;
  businessUnit: number;
  team: number;
  subTeam: number;
  unit: number;
}

export interface UpdateEmployeeInfoPayload {
  id: string;
  lastName?: string;
  firstName?: string;
  wso2Email?: string;
  workPhoneNumber?: string;
  epf?: string;
  workLocation?: string | null;
  employeeLocation?: string;
  startDate?: Date;
  jobRole?: number;
  jobBand?: string;
  managerEmail?: string;
  reportToEmail?: string;
  additionalManagerEmail?: string | null;
  additionalReportToEmail?: string | null;
  employeeStatus?: string;
  lengthOfService?: number;
  relocationStatus?: string;
  employeeThumbnail?: string;
  subordinateCount?: number;
  timestamp?: [number, number];
  probationEndDate?: Date;
  agreementEndDate?: NullableDate;
  employmentType?: string;
  company?: string;
  office?: string;
  businessUnit?: number;
  team?: number;
  subTeam?: number;
  unit?: number;
}

export interface EmployeeInfoState {
  state: State;
  stateMessage: string | null;
  errorMessage: string | null;
  employee: EmployeeInfo | null;
}

const initialState: EmployeeInfoState = {
  state: State.idle,
  stateMessage: null,
  errorMessage: null,
  employee: null,
};

export const fetchEmployeeInfo = createAsyncThunk(
  "employee/fetchEmployeeInfo",
  async (_, { getState, dispatch, rejectWithValue }) => {
    APIService.getCancelToken().cancel();
    const newCancelTokenSource = APIService.updateCancelToken();

    const { userInfo } = (getState() as { user: UserState }).user;
    return new Promise<EmployeeInfo>((resolve, reject) => {
      APIService.getInstance()
        .get(`${AppConfig.serviceUrls.employee_info}/${userInfo?.workEmail}`, {
          cancelToken: newCancelTokenSource.token,
        })
        .then((response) => {
          resolve(response.data);
        })
        .catch((error) => {
          if (axios.isCancel(error)) {
            return rejectWithValue("Request canceled");
          }
          dispatch(
            enqueueSnackbarMessage({
              message:
                error.response?.status === HttpStatusCode.InternalServerError
                  ? SnackMessage.error.fetchEmployees
                  : "An unknown error occurred.",
              type: "error",
            }),
          );
          reject(error.response.data.message);
        });
    });
  },
);

export const updateEmployeeInfo = createAsyncThunk(
  "employee/updateEmployeeInfo",
  async (
    payload: UpdateEmployeeInfoPayload,

    { rejectWithValue, dispatch },
  ) => {
    return new Promise<UpdateEmployeeInfoPayload>((resolve, reject) => {
      APIService.getInstance()
        .patch(`${AppConfig.serviceUrls.employee_info}/${payload.wso2Email}`, payload)
        .then((response) => {
          resolve(response.data);
        })
        .catch((error) => {
          if (axios.isCancel(error)) {
            return rejectWithValue("Request canceled");
          }
          dispatch(
            enqueueSnackbarMessage({
              message:
                error.response?.status === HttpStatusCode.InternalServerError
                  ? SnackMessage.error.fetchEmployees
                  : "An unknown error occurred.",
              type: "error",
            }),
          );
          reject(error.response.data.message);
        });
    });
  },
);

const EmployeeSlice = createSlice({
  name: "employee",
  initialState,
  reducers: {
    resetSubmitState(state) {
      state.state = State.idle;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEmployeeInfo.pending, (state) => {
        state.state = State.loading;
        state.stateMessage = "Fetching employee data...";
      })
      .addCase(fetchEmployeeInfo.fulfilled, (state, action) => {
        state.state = State.success;
        state.stateMessage = "Successfully fetched!";
        state.employee = action.payload;
      })
      .addCase(fetchEmployeeInfo.rejected, (state) => {
        state.state = State.failed;
        state.stateMessage = "Failed to fetch!";
      })
      .addCase(updateEmployeeInfo.pending, (state) => {
        state.state = State.loading;
        state.stateMessage = "Updating employee data...";
      })
      .addCase(updateEmployeeInfo.fulfilled, (state) => {
        state.state = State.success;
        state.stateMessage = "Successfully updated!";
      })
      .addCase(updateEmployeeInfo.rejected, (state) => {
        state.state = State.failed;
        state.stateMessage = "Failed to update!";
      });
  },
});

export const { resetSubmitState } = EmployeeSlice.actions;
export default EmployeeSlice.reducer;
