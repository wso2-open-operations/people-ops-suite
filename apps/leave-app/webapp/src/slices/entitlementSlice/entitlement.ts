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

import { LeaveEntitlement, State } from "@/types/types";
import { getLeaveEntitlement } from "@root/src/services/leaveService";
import { enqueueSnackbarMessage } from "@slices/commonSlice/common";

interface EntitlementState {
  state: State;
  errorMessage: string | null;
  entitlements: LeaveEntitlement[];
}

const initialState: EntitlementState = {
  state: State.idle,
  errorMessage: null,
  entitlements: [],
};

// Async thunk for fetching leave entitlement
export const fetchLeaveEntitlement = createAsyncThunk<
  LeaveEntitlement[],
  string,
  { rejectValue: string }
>("entitlement/fetchLeaveEntitlement", async (email, { dispatch, rejectWithValue }) => {
  try {
    return await getLeaveEntitlement(email);
  } catch (err) {
    if (axios.isCancel(err)) {
      return rejectWithValue("Request canceled");
    }

    if (axios.isAxiosError(err)) {
      dispatch(
        enqueueSnackbarMessage({
          message:
            err.response?.status === HttpStatusCode.InternalServerError
              ? "Failed to fetch leave entitlement."
              : "An unknown error occurred while fetching leave entitlement.",
          type: "error",
        }),
      );
      return rejectWithValue(
        (err.response?.data as { message?: string })?.message ??
          "Failed to fetch leave entitlement.",
      );
    }

    dispatch(
      enqueueSnackbarMessage({
        message: "An unknown error occurred while fetching leave entitlement.",
        type: "error",
      }),
    );
    return rejectWithValue("Failed to fetch leave entitlement.");
  }
});

export const entitlementSlice = createSlice({
  name: "entitlement",
  initialState,
  reducers: {
    resetEntitlement: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLeaveEntitlement.pending, (state) => {
        state.state = State.loading;
        state.errorMessage = null;
      })
      .addCase(fetchLeaveEntitlement.fulfilled, (state, action) => {
        state.state = State.success;
        state.entitlements = action.payload;
      })
      .addCase(fetchLeaveEntitlement.rejected, (state, action) => {
        state.state = State.failed;
        state.errorMessage = action.payload ?? "Failed to fetch leave entitlement.";
      });
  },
});

export const { resetEntitlement } = entitlementSlice.actions;
export default entitlementSlice.reducer;
