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
import { enqueueSnackbarMessage } from "@slices/commonSlice/common";
import { APIService } from "@utils/apiService";

import { State } from "../../types/types";

interface Date {
  year: number;
  month: number;
  day: number;
}

type NullableDate = Date | null;

export type EmployeeInfo = {
  id: string;
  lastName: string;
  firstName: string;
  epf: string | null;
  employeeLocation: string | null;
  workLocation: string | null;
  wso2Email: string;
  workPhoneNumber: string | null;
  startDate: Date;
  managerEmail: string | null;
  reportToEmail: string | null;
  additionalManagerEmail: string | null;
  additionalReportToEmail: string | null;
  employeeStatus: string | null;
  lengthOfService: number | null;
  employeeThumbnail: string | null;
  subordinateCount: number | null;
  probationEndDate: NullableDate;
  agreementEndDate: NullableDate;
  jobRole: string | null;
  employmentTypeId: number;
  designationId: number;
  officeId: number;
  companyId: number;
  teamId: number;
  subTeamId: number;
  businessUnitId: number;
  unitId: number;
  personalInfoId: number;
};

export interface PersonalInfo {
  id: number;
  nic: string;
  fullName: string;
  nameWithInitials?: string;
  firstName?: string;
  lastName?: string;
  title: string;
  dob: string;
  age?: number;
  personalEmail: string;
  personalPhone: string;
  homePhone: string;
  address: string;
  postalCode?: string;
  country: string;
  nationality?: string;
  languageSpoken?: string;
  nokInfo?: any;
  onboardingDocuments?: any;
  educationInfo?: any;
  createdBy: string;
  createdOn: string;
  updatedBy: string;
  updatedOn: string;
}

export type UpdateEmployeeInfo = {
  id?: string;
  lastName?: string;
  firstName?: string;
  epf?: string | null;
  employeeLocation?: string | null;
  workLocation?: string | null;
  wso2Email?: string;
  workPhoneNumber?: string | null;
  startDate?: Date;
  managerEmail?: string | null;
  reportToEmail?: string | null;
  additionalManagerEmail?: string | null;
  additionalReportToEmail?: string | null;
  employeeStatus?: string | null;
  lengthOfService?: number | null;
  employeeThumbnail?: string | null;
  subordinateCount?: number | null;
  probationEndDate?: NullableDate;
  agreementEndDate?: NullableDate;
  jobRole?: string | null;
  employmentTypeId?: number;
  designationId?: number;
  officeId?: number;
  companyId?: number;
  teamId?: number;
  subTeamId?: number;
  businessUnitId?: number;
  unitId?: number;
  personalInfoId?: number;
};

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
  employeeInfo: EmployeeInfo | null;
  personalInfo: PersonalInfo | null;
}

const initialState: EmployeeInfoState = {
  state: State.idle,
  stateMessage: null,
  errorMessage: null,
  employeeInfo: null,
  personalInfo: null,
};

export const fetchEmployeeInfo = createAsyncThunk(
  "employee/fetchEmployeeInfo",
  async (email: string, { dispatch, rejectWithValue }) => {
    APIService.getCancelToken().cancel();
    const newCancelTokenSource = APIService.updateCancelToken();

    return new Promise<EmployeeInfo>((resolve, reject) => {
      APIService.getInstance()
        .get(`${AppConfig.serviceUrls.employee_info}/${email}`, {
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

export const fetchEmployeePersonalInfo = createAsyncThunk(
  "employee/fetchEmployeePersonalInfo",
  async (email: string, { dispatch, rejectWithValue }) => {
    APIService.getCancelToken().cancel();
    const newCancelTokenSource = APIService.updateCancelToken();

    return new Promise<PersonalInfo>((resolve, reject) => {
      APIService.getInstance()
        .get(`${AppConfig.serviceUrls.employee_personal_info}`, {
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
    payload: UpdateEmployeeInfo,

    { rejectWithValue, dispatch },
  ) => {
    return new Promise<UpdateEmployeeInfo>((resolve, reject) => {
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
        state.employeeInfo = action.payload;
      })
      .addCase(fetchEmployeeInfo.rejected, (state) => {
        state.state = State.failed;
        state.stateMessage = "Failed to fetch!";
      })
      .addCase(fetchEmployeePersonalInfo.pending, (state) => {
        state.state = State.loading;
        state.stateMessage = "Fetching employee data...";
      })
      .addCase(fetchEmployeePersonalInfo.fulfilled, (state, action) => {
        state.state = State.success;
        state.stateMessage = "Successfully fetched!";
        state.personalInfo = action.payload;
      })
      .addCase(fetchEmployeePersonalInfo.rejected, (state) => {
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
