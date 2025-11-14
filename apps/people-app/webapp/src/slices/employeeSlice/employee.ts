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
import { HttpStatusCode } from "axios";
import { APIService } from "@utils/apiService";
import { SnackMessage } from "@config/constant";
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { enqueueSnackbarMessage } from "@slices/commonSlice/common";

interface Employee {
  employeeId: string;
  firstName: string;
  lastName: string;
  workEmail: string;
  employeeThumbnail: string | null;
  secondaryJobTitle: string;
  epf: string;
  employmentLocation: string;
  workLocation: string;
  workPhoneNumber: string | null;
  startDate: string;
  managerEmail: string;
  additionalManagerEmails: string | null;
  employeeStatus: string;
  probationEndDate: string | null;
  agreementEndDate: string | null;
  employmentType: string;
  designation: string;
  office: string;
  businessUnit: string;
  team: string;
  subTeam: string;
  unit: string | null;  
}

interface EmployeesState {
  state: State;
  stateMessage: string | null;
  errorMessage: string | null;
  employee: Employee | null;
}

const initialState: EmployeesState = {
  state: State.idle,
  stateMessage: null,
  errorMessage: null,
  employee: null,
};

export const fetchEmployee = createAsyncThunk(
  "employees/fetchEmployee",
  async (employeeId: string, { dispatch, rejectWithValue }) => {
    try {
      const response = await APIService.getInstance().get(
        AppConfig.serviceUrls.employee(employeeId)
      );
      return response.data as Employee;
    } catch (error: any) {
      const errorMessage =
        error.response?.status === HttpStatusCode.InternalServerError
          ? SnackMessage.error.fetchEmployee
          : error.response?.data?.message ||
            "An unknown error occurred while fetching employee information.";

      dispatch(
        enqueueSnackbarMessage({
          message: errorMessage,
          type: "error",
        })
      );

      return rejectWithValue(errorMessage);
    }
  }
);

const EmployeeSlice = createSlice({
  name: "employee",
  initialState,
  reducers: {
    resetSubmitState(state) {
      state.state = State.idle;
    },
    resetEmployee(state) {
      state.state = State.idle;
      state.stateMessage = null;
      state.errorMessage = null;
      state.employee = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEmployee.pending, (state) => {
        state.state = State.loading;
        state.stateMessage = "Fetching employee data...";
      })
      .addCase(fetchEmployee.fulfilled, (state, action) => {
        state.state = State.success;
        state.stateMessage = "Successfully fetched employee information!";
        state.employee = action.payload;
        state.errorMessage = null;
      })
      .addCase(fetchEmployee.rejected, (state, action) => {
        state.state = State.failed;
        state.stateMessage = "Failed to fetch employee information!";
        state.errorMessage = action.payload as string;
        state.employee = null;
      });
  },
});

export const { resetSubmitState, resetEmployee } = EmployeeSlice.actions;
export default EmployeeSlice.reducer;
