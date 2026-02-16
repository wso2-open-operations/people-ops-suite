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

import { State } from "@/types/types";
import { AppConfig } from "@config/config";
import axios, { HttpStatusCode } from "axios";
import { APIService } from "@utils/apiService";
import { SnackMessage } from "@config/constant";
import { UserState } from "@slices/authSlice/auth";
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { enqueueSnackbarMessage } from "@slices/commonSlice/common";

interface Employee {
  firstName: string;
  lastName: string;
  workEmail: string;
  employeeThumbnail: string | null;
}

interface EmployeeInfoWithLead {
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
  state: State;
  stateMessage: string | null;
  errorMessage: string | null;
  employees: Employee[] | null;
  employeeHistory: EmployeeInfoWithLead | null
}

const initialState: EmployeesState = {
  state: State.idle,
  stateMessage: null,
  errorMessage: null,
  employees: null,
  employeeHistory: null,
};

export const fetchEmployees = createAsyncThunk(
  "employee/fetchEmployees",
  async (_, { getState, dispatch, rejectWithValue }) => {
    const { userInfo } = (getState() as { user: UserState }).user;
    APIService.getCancelToken().cancel();
    const newCancelTokenSource = APIService.updateCancelToken();
    return new Promise<Employee[]>((resolve, reject) => {
      APIService.getInstance()
        .get(AppConfig.serviceUrls.employees, {
          cancelToken: newCancelTokenSource.token,
        })
        .then((response) => {
          const filteredEmployees = response.data.filter((emp: Employee) => emp.workEmail !== userInfo?.workEmail);
          resolve(filteredEmployees);
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
            })
          );
          reject(error.response.data.message);
        });
    });
  }
);

export const fetchEmployeeHistory = createAsyncThunk(
  "employee/fetchEmployeeHistory",
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
    return new Promise<EmployeeInfoWithLead>((resolve, reject) => {
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
                  ? SnackMessage.error.fetchEmployees
                  : "An unknown error occurred.",
                type: "error",
              })
            );
          reject(error.response?.data?.message);
        });
    });
  }

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
      .addCase(fetchEmployees.pending, (state) => {
        state.state = State.loading;
        state.stateMessage = "Fetching employee data...";
      })
      .addCase(fetchEmployees.fulfilled, (state, action) => {
        state.state = State.success;
        state.stateMessage = "Successfully fetched!";
        state.employees = action.payload;
      })
      .addCase(fetchEmployees.rejected, (state) => {
        state.state = State.failed;
        state.stateMessage = "Failed to fetch!";
      })
      .addCase(fetchEmployeeHistory.pending, (state) => {
        state.state = State.loading;
        state.stateMessage = "Fetching employee history data...";
      })
      .addCase(fetchEmployeeHistory.fulfilled, (state, action) => {
        state.state = State.success;
        state.stateMessage = "Successfully fetched!";
        state.employeeHistory = action.payload;
      })
      .addCase(fetchEmployeeHistory.rejected, (state) => {
        state.state = State.failed;
        state.stateMessage = "Failed to fetch!";
      });
  },
});

export const { resetSubmitState } = EmployeeSlice.actions;
export default EmployeeSlice.reducer;
