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

import { State } from "@/types/types";
import { AppConfig } from "@config/config";
import axios, { HttpStatusCode } from "axios";
import { APIService } from "@utils/apiService";
import { SnackMessage } from "@config/constant";
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { enqueueSnackbarMessage } from "@slices/commonSlice/common";
import { PromotionRequest } from "@root/src/utils/types";

export interface EmployeeJoinedDetails {
  workEmail: string;
  startDate: string;
  jobBand: number | null;
  joinedJobRole: string | null;
  joinedBusinessUnit: string | null;
  joinedDepartment: string | null;
  joinedTeam: string | null;
  joinedLocation: string | null;
  lastPromotedDate: string | null;
  employeeThumbnail: string | null;
  reportingLead: string;
};



interface EmployeesState {
  employeeHistoryState: State;
  promotionsState: State;
  stateMessage: string | null;
  errorMessage: string | null;
  employeeHistory: EmployeeJoinedDetails | null;
  promotions: PromotionRequest[] | null;
}

const initialState: EmployeesState = {
  employeeHistoryState: State.idle,
  promotionsState: State.idle,
  stateMessage: null,
  errorMessage: null,
  employeeHistory: null,
  promotions: null,
};

export const fetchEmployeeHistory = createAsyncThunk(
  "timeline/fetchEmployeeHistory",
  async (
    {
      employeeWorkEmail,
    }: {
      employeeWorkEmail: string;
    },
    { dispatch, rejectWithValue }
  ) => {
    APIService.getCancelToken().cancel();
    const newCancelTokenSource = APIService.updateCancelToken();
    return new Promise<EmployeeJoinedDetails>((resolve, reject) => {
      APIService.getInstance()
        .get(AppConfig.serviceUrls.getEmployeeHistory, {
          params: {
            employeeWorkEmail,
          },
          cancelToken: newCancelTokenSource.token,
        })
        .then((response) => {
          resolve(response.data);
        })
        .catch((error) => {
          if (axios.isCancel(error)) {
            reject(rejectWithValue("Request canceled"));
            return;
          }
          dispatch(
            enqueueSnackbarMessage({
              message:
                error.response?.status === HttpStatusCode.InternalServerError
                  ? SnackMessage.error.fetchEmployeeHistory
                  : "An unknown error occurred.",
                type: "error",
              })
            );
          reject(error.response?.data?.message);
        });
    });
  }

);

export const fetchPromotions = createAsyncThunk(
  "promotion/fetchPromotions",
  async (
    {
      employeeEmail,
      statusArray,
      type,
      recommendedBy,
      enableBuFilter,
      cycleId
    }: {
      employeeEmail?: string;
      statusArray?: string[];
      type?: string;
      recommendedBy?: string;
      enableBuFilter?: boolean;
      cycleId?: number;
    },
    { dispatch, rejectWithValue }
  ) => {
    APIService.getCancelToken().cancel();
    const newCancelTokenSource = APIService.updateCancelToken();

    return new Promise<{ promotions: PromotionRequest[] }>((resolve, reject) => {
      APIService.getInstance()
        .get(AppConfig.serviceUrls.retrieveAllPromotionRequests, {
          params: {
            employeeEmail,
            type,
            recommendedBy,
            statusArray: statusArray?.join(","),
            enableBuFilter,
            cycleId,
          },
          cancelToken: newCancelTokenSource.token,
        })
        .then((response) => {
          resolve({
            promotions: response.data.promotionRequests,
          });
        })
        .catch((error) => {
          if (axios.isCancel(error)) {
            reject(rejectWithValue("Request canceled"));
            return;
          }
          dispatch(
            enqueueSnackbarMessage({
              message:
                error.response?.status === HttpStatusCode.InternalServerError
                  ? "Failed to fetch promotions."
                  : "An unknown error occurred.",
              type: "error",
            })
          );
          reject(error.response?.data?.message);
        });
    });
  }
);

const TimelineSlice = createSlice({
  name: "timeline",
  initialState,
  reducers: {
    resetSubmitState(state) {
      state.employeeHistoryState = State.idle;
      state.promotionsState = State.idle;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEmployeeHistory.pending, (state) => {
        state.employeeHistoryState = State.loading;
        state.stateMessage = "Fetching employee history data...";
      })
      .addCase(fetchEmployeeHistory.fulfilled, (state, action) => {
        state.employeeHistoryState = State.success;
        state.stateMessage = "Successfully fetched!";
        state.employeeHistory = action.payload;
      })
      .addCase(fetchEmployeeHistory.rejected, (state) => {
        state.employeeHistoryState = State.failed;
        state.stateMessage = "Failed to fetch!";
      })
      .addCase(fetchPromotions.pending, (state) => {
        state.promotionsState = State.loading;
        state.stateMessage = "Fetching employee history data...";
      })
      .addCase(fetchPromotions.fulfilled, (state, action) => {
            state.promotionsState = State.success;
            state.stateMessage = "Successfully fetched!";
            state.promotions = action.payload.promotions;
        })
      .addCase(fetchPromotions.rejected, (state) => {
        state.promotionsState = State.failed;
        state.stateMessage = "Failed to fetch!";
      });
  },
});

export const { resetSubmitState } = TimelineSlice.actions;
export default TimelineSlice.reducer;
