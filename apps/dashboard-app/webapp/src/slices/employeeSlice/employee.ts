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
import axios, { HttpStatusCode } from "axios";

import { State } from "@/types/types";
import { AppConfig } from "@config/config";
import { SnackMessage } from "@config/constant";
import { enqueueSnackbarMessage } from "@slices/commonSlice/common";
import type { UserState } from "@slices/userSlice/user";
import { getAPIService } from "@utils/apiService";

interface Employee {
  firstName: string;
  lastName: string;
  workEmail: string;
  employeeThumbnail: string | null;
}

const isEmployee = (value: unknown): value is Employee => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<Employee>;
  return typeof candidate.workEmail === "string";
};

const isEmployeeArray = (value: unknown): value is Employee[] =>
  Array.isArray(value) && value.every(isEmployee);

interface EmployeesState {
  state: State;
  stateMessage: string | null;
  errorMessage: string | null;
  employees: Employee[] | null;
}

const initialState: EmployeesState = {
  state: State.idle,
  stateMessage: null,
  errorMessage: null,
  employees: null,
};

export const fetchEmployees = createAsyncThunk(
  "employee/fetchEmployees",
  async (_, { getState, dispatch, rejectWithValue }) => {
    const { userInfo } = (getState() as { user: UserState }).user;
    try {
      const response = await getAPIService().get(AppConfig.serviceUrls.employees);
      if (!isEmployeeArray(response.data)) {
        throw new Error("Invalid employees payload received from server");
      }

      const filteredEmployees = response.data.filter(
        (emp: Employee) => emp.workEmail !== userInfo?.workEmail,
      );
      return filteredEmployees;
    } catch (error) {
      if (axios.isCancel(error)) {
        return rejectWithValue("Request canceled");
      }

      const status = (error as { response?: { status?: number } }).response?.status;
      const errorMessage =
        (error as { response?: { data?: { message?: string } }; message?: string }).response?.data
          ?.message ??
        (error as { message?: string }).message ??
        "An unknown error occurred.";

      dispatch(
        enqueueSnackbarMessage({
          message:
            status === HttpStatusCode.InternalServerError
              ? SnackMessage.error.fetchEmployees
              : errorMessage,
          type: "error",
        }),
      );

      return rejectWithValue(errorMessage);
    }
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
      .addCase(fetchEmployees.pending, (state) => {
        state.state = State.loading;
        state.stateMessage = "Fetching employee data...";
      })
      .addCase(fetchEmployees.fulfilled, (state, action) => {
        state.state = State.success;
        state.stateMessage = "Successfully fetched!";
        state.employees = action.payload;
      })
      .addCase(fetchEmployees.rejected, (state, action) => {
        state.state = State.failed;
        state.stateMessage = "Failed to fetch!";
        state.errorMessage =
          (action.payload as string | undefined) ??
          action.error?.message ??
          "An unknown error occurred.";
      });
  },
});

export const { resetSubmitState } = EmployeeSlice.actions;
export default EmployeeSlice.reducer;
