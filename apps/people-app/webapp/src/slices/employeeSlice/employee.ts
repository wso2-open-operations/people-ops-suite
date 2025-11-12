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
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
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

export interface EmployeeBasicInfo {
  id: number;
  firstName: string;
  lastName: string;
  workEmail: string;
  employeeThumbnail?: string;
  jobRole?: string;
}

export type CreatePersonalInfoPayload = {
  nicOrPassport: string;
  fullName: string;
  nameWithInitials?: string;
  firstName?: string;
  lastName?: string;
  title?: string;
  dob?: string;
  age?: number;
  personalEmail?: string;
  personalPhone?: string;
  homePhone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  stateProvince?: string;
  postalCode?: string;
  country?: string;
  nationality?: string;
  emergencyContacts?: {
    name: string | null;
    relationship: string | null;
    telephone: string | null;
    mobile: string | null;
  }[];
};

export type CreateEmployeePayload = {
  firstName: string;
  lastName: string;
  epf?: string;
  secondaryJobTitle: string;
  employmentLocation: string;
  workLocation: string;
  workEmail: string;
  workPhoneNumber?: string;
  startDate: string;
  managerEmail: string;
  additionalManagerEmails?: string[];
  employeeStatus: string;
  employeeThumbnail?: string;
  subordinateCount?: number;
  probationEndDate?: string;
  agreementEndDate?: string;
  employmentTypeId?: number;
  designationId: number;
  officeId: number;
  teamId: number;
  subTeamId?: number;
  businessUnitId: number;
  unitId?: number;
  personalInfo: CreatePersonalInfoPayload;
};

interface EmployeesState {
  state: State;
  stateMessage: string | null;
  errorMessage: string | null;
  employee: Employee | null;
  employeesBasicInfo: EmployeeBasicInfo[];
  createdEmployeeId: number | null;
}

const initialState: EmployeesState = {
  state: State.idle,
  stateMessage: null,
  errorMessage: null,
  employee: null,
  employeesBasicInfo: [],
  createdEmployeeId: null,
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

export const fetchEmployeesBasicInfo = createAsyncThunk(
  "employees/fetchEmployeesBasicInfo",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const resp = await APIService.getInstance().get(
        `${AppConfig.serviceUrls.employeesBasicInfo}`
      );
      return resp.data as EmployeeBasicInfo[];
    } catch (error: any) {
      const errorMessage =
        error.response?.status === HttpStatusCode.InternalServerError
          ? "Error fetching employees' basic information"
          : error.response?.data?.message ||
            "An unknown error occurred while fetching employees' basic information.";
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

export const createEmployee = createAsyncThunk(
  "employees/createEmployee",
  async (payload: CreateEmployeePayload, { dispatch, rejectWithValue }) => {
    try {
      const response = await APIService.getInstance().post(
        AppConfig.serviceUrls.createEmployee,
        payload
      );
      const employeeId = response.data as number;
      dispatch(
        enqueueSnackbarMessage({
          message: "Employee created successfully!",
          type: "success",
        })
      );
      return employeeId;
    } catch (error: any) {
      const errorMessage =
        error.response?.status === HttpStatusCode.InternalServerError
          ? SnackMessage.error.createEmployee
          : error.response?.data?.message ||
            "Failed to create employee. Please try again.";
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
      state.employeesBasicInfo = [];
      state.createdEmployeeId = null;
    },
    resetCreateEmployeeState(state) {
      state.state = State.idle;
      state.stateMessage = null;
      state.errorMessage = null;
      state.createdEmployeeId = null;
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
      })
      .addCase(fetchEmployeesBasicInfo.pending, (state) => {
        state.state = State.loading;
        state.stateMessage = "Fetching employees' basic information...";
        state.errorMessage = null;
      })
      .addCase(fetchEmployeesBasicInfo.fulfilled, (state, action) => {
        state.employeesBasicInfo = action.payload;
        state.state = State.success;
        state.stateMessage =
          "Employees' basic information fetched successfully";
        state.errorMessage = null;
      })
      .addCase(fetchEmployeesBasicInfo.rejected, (state, action) => {
        state.state = State.failed;
        state.errorMessage = action.payload as string;
        state.stateMessage = null;
      })
      .addCase(createEmployee.pending, (state) => {
        state.state = State.loading;
        state.stateMessage = "Creating employee...";
        state.errorMessage = null;
      })
      .addCase(
        createEmployee.fulfilled,
        (state, action: PayloadAction<number>) => {
          state.state = State.success;
          state.stateMessage = "Employee created successfully!";
          state.createdEmployeeId = action.payload;
          state.errorMessage = null;
        }
      )
      .addCase(createEmployee.rejected, (state, action) => {
        state.state = State.failed;
        state.stateMessage = "Failed to create employee.";
        state.errorMessage = action.payload as string;
        state.createdEmployeeId = null;
      });
  },
});

export const { resetSubmitState, resetEmployee, resetCreateEmployeeState } =
  EmployeeSlice.actions;
export default EmployeeSlice.reducer;
