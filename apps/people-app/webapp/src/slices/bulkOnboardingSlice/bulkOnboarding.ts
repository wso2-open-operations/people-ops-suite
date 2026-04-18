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
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { enqueueSnackbarMessage } from "@slices/commonSlice/common";
import { APIService } from "@utils/apiService";
import { HttpStatusCode, isCancel } from "axios";

export interface BulkEmployeeError {
  row: number;
  field: string;
  message: string;
}

export interface BulkUploadResponse {
  created: number;
  skipped: number;
  errors: BulkEmployeeError[];
}

interface BulkOnboardingState {
  state: State;
  stateMessage: string | null;
  errorMessage: string | null;
  errors: BulkEmployeeError[];
  created: number;
  skipped: number;
}

const initialState: BulkOnboardingState = {
  state: State.idle,
  stateMessage: null,
  errorMessage: null,
  errors: [],
  created: 0,
  skipped: 0,
};

export const uploadBulkEmployees = createAsyncThunk<
  BulkUploadResponse,
  File,
  { rejectValue: BulkEmployeeError[] | string }
>(
  "bulkOnboarding/uploadBulkEmployees",
  async (file, { dispatch, rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await APIService.getInstance().post(
        AppConfig.serviceUrls.bulkEmployees,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      dispatch(
        enqueueSnackbarMessage({
          message: "Bulk onboarding completed successfully",
          type: "success",
        }),
      );
      return response.data as BulkUploadResponse;
    } catch (error: any) {
      if (isCancel(error)) return rejectWithValue("cancelled");
      const status = error?.response?.status;
      if (
        status === HttpStatusCode.BadRequest &&
        Array.isArray(error?.response?.data)
      ) {
        dispatch(
          enqueueSnackbarMessage({
            message: "Bulk onboarding failed. Please fix the CSV errors.",
            type: "error",
          }),
        );
        return rejectWithValue(error.response.data as BulkEmployeeError[]);
      }
      const errorMessage =
        status === HttpStatusCode.InternalServerError
          ? "Failed to bulk create employees"
          : error?.response?.data?.message ||
            error?.message ||
            "An unknown error occurred while uploading the CSV.";
      dispatch(
        enqueueSnackbarMessage({
          message: errorMessage,
          type: "error",
        }),
      );
      return rejectWithValue(errorMessage);
    }
  },
);

const BulkOnboardingSlice = createSlice({
  name: "bulkOnboarding",
  initialState,
  reducers: {
    resetBulkUploadState(state) {
      state.state = State.idle;
      state.stateMessage = null;
      state.errorMessage = null;
      state.errors = [];
      state.created = 0;
      state.skipped = 0;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(uploadBulkEmployees.pending, (state) => {
        state.state = State.loading;
        state.stateMessage = "Uploading CSV...";
        state.errorMessage = null;
        state.errors = [];
        state.created = 0;
        state.skipped = 0;
      })
      .addCase(uploadBulkEmployees.fulfilled, (state, action) => {
        state.state = State.success;
        state.stateMessage = "Bulk upload completed";
        state.errorMessage = null;
        state.errors = action.payload.errors;
        state.created = action.payload.created;
        state.skipped = action.payload.skipped;
      })
      .addCase(uploadBulkEmployees.rejected, (state, action) => {
        state.state = State.failed;
        state.stateMessage = "Bulk upload failed";
        if (Array.isArray(action.payload)) {
          state.errors = action.payload as BulkEmployeeError[];
          state.errorMessage = null;
        } else {
          state.errors = [];
          state.errorMessage = action.payload as string;
        }
      });
  },
});

export const { resetBulkUploadState } = BulkOnboardingSlice.actions;
export default BulkOnboardingSlice.reducer;
