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
import { EmergencyContact } from "@/types/types";

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
  subTeam: string | null;
  unit: string | null;
}

export interface EmployeeBasicInfo {
  employeeId: string;
  firstName: string;
  lastName: string;
  workEmail: string;
  employeeThumbnail?: string;
}

export type CreatePersonalInfoPayload = {
  nicOrPassport: string;
  firstName?: string;
  lastName?: string;
  title?: string;
  gender?: string;
  dob?: string;
  age?: number;
  personalEmail?: string;
  personalPhone?: string;
  residentNumber?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  stateOrProvince?: string;
  postalCode?: string;
  country?: string;
  nationality?: string;
  emergencyContacts?: EmergencyContact[];
};

export type CreateEmployeePayload = {
  firstName: string;
  lastName: string;
  epf?: string;
  secondaryJobTitle: string;
  employmentLocation: string;
  workLocation: string;
  workEmail: string;
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
  continuousServiceRecord?: string | null;
  personalInfo: CreatePersonalInfoPayload;
};

export interface ContinuousServiceRecordInfo {
  id: number;
  employeeId: string;
  firstName: string | null;
  lastName: string | null;
  employmentLocation: string;
  workLocation: string;
  startDate: string;
  managerEmail: string;
  additionalManagerEmails?: string | null;
  designation: string;
  secondaryJobTitle?: string;
  office: string;
  businessUnit: string;
  team: string;
  subTeam: string | null;
  unit?: string | null;
}

interface EmployeesState {
  state: State;
  employeeBasicInfoState: State;
  stateMessage: string | null;
  errorMessage: string | null;
  employee: Employee | null;
  employeesBasicInfo: EmployeeBasicInfo[];
  continuousServiceRecord: ContinuousServiceRecordInfo[];
}

const initialState: EmployeesState = {
  state: State.idle,
  employeeBasicInfoState: State.idle,
  stateMessage: null,
  errorMessage: null,
  employee: null,
  employeesBasicInfo: [],
  continuousServiceRecord: [],
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
        AppConfig.serviceUrls.employees,
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
          ? SnackMessage.error.addEmployee
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

export const fetchContinuousServiceRecord = createAsyncThunk(
  "employees/fetchContinuousServiceRecord",
  async (workEmail: string, { dispatch, rejectWithValue }) => {
    try {
      const response = await APIService.getInstance().get(
        `${AppConfig.serviceUrls.continuousServiceRecord
        }?workEmail=${encodeURIComponent(workEmail)}`
      );
      return response.data as ContinuousServiceRecordInfo[];
    } catch (error: any) {
      const status = error.response?.status;
      const errorMessage =
        status === HttpStatusCode.InternalServerError
          ? "Error fetching continuous service record"
          : error.response?.data?.message ||
          "An unknown error occurred while fetching continuous service record";

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
      state.continuousServiceRecord = [];
    },
    resetCreateEmployeeState(state) {
      state.state = State.idle;
      state.stateMessage = null;
      state.errorMessage = null;
    },
    resetContinuousService(state) {
      state.continuousServiceRecord = [];
      state.state = State.idle;
      state.stateMessage = null;
      state.errorMessage = null;
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
        state.employeeBasicInfoState = State.loading;
        state.stateMessage = "Fetching employees' basic information...";
        state.errorMessage = null;
      })
      .addCase(fetchEmployeesBasicInfo.fulfilled, (state, action) => {
        state.employeesBasicInfo = action.payload;
        state.employeeBasicInfoState = State.success;
        state.stateMessage =
          "Employees' basic information fetched successfully";
        state.errorMessage = null;
      })
      .addCase(fetchEmployeesBasicInfo.rejected, (state, action) => {
        state.employeeBasicInfoState = State.failed;
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
          state.errorMessage = null;
        }
      )
      .addCase(createEmployee.rejected, (state, action) => {
        state.state = State.failed;
        state.stateMessage = "Failed to create employee.";
        state.errorMessage = action.payload as string;
      })
      .addCase(fetchContinuousServiceRecord.pending, (state) => {
        state.state = State.loading;
        state.stateMessage = "Fetching continuous service record...";
        state.errorMessage = null;
      })
      .addCase(fetchContinuousServiceRecord.fulfilled, (state, action) => {
        state.state = State.success;
        state.stateMessage = "Successfully fetched continuous service record!";
        state.continuousServiceRecord = action.payload;
        state.errorMessage = null;
      })
      .addCase(fetchContinuousServiceRecord.rejected, (state, action) => {
        state.state = State.failed;
        state.stateMessage = "Failed to fetch continuous service record!";
        state.errorMessage = action.payload as string;
        state.continuousServiceRecord = [];
      });
  },
});

export const {
  resetSubmitState,
  resetEmployee,
  resetCreateEmployeeState,
  resetContinuousService,
} = EmployeeSlice.actions;
export default EmployeeSlice.reducer;
