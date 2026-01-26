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

import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios, { HttpStatusCode } from "axios";

import { SnackMessage } from "@config/constant";
import { cancelLeaveRequest, getLeaveHistory } from "@root/src/services/leaveService";
import { enqueueSnackbarMessage } from "@slices/commonSlice/common";
import { RootState } from "@slices/store";
import { LeaveHistoryQueryParam, LeaveHistoryResponse, SingleLeaveHistory, State } from "@/types/types";

interface LeaveState {
  state: State;
  stateMessage: string | null;
  errorMessage: string | null;
  leaves: SingleLeaveHistory[];
  cancellingLeaveId: number | null;
}

const initialState: LeaveState = {
  state: State.idle,
  stateMessage: null,
  errorMessage: null,
  leaves: [],
  cancellingLeaveId: null,
};

// Async thunk for fetching leave history
export const fetchLeaveHistory = createAsyncThunk<
  LeaveHistoryResponse,
  LeaveHistoryQueryParam,
  { rejectValue: string }
>("leave/fetchLeaveHistory", async (params, { dispatch, rejectWithValue }) => {
  try {
    return await getLeaveHistory(params);
  } catch (err) {
    if (axios.isCancel(err)) {
      return rejectWithValue("Request canceled");
    }

    if (axios.isAxiosError(err)) {
      dispatch(
        enqueueSnackbarMessage({
          message:
            err.response?.status === HttpStatusCode.InternalServerError
              ? SnackMessage.error.fetchLeaveHistoryMessage
              : "An unknown error occurred while fetching leave history.",
          type: "error",
        }),
      );
      return rejectWithValue(
        (err.response?.data as { message?: string })?.message ?? "Failed to fetch leave history.",
      );
    }

    dispatch(
      enqueueSnackbarMessage({
        message: "An unknown error occurred while fetching leave history.",
        type: "error",
      }),
    );
    return rejectWithValue("Failed to fetch leave history.");
  }
});

// Async thunk for cancelling a leave
export const cancelLeave = createAsyncThunk<number, number, { rejectValue: string }>(
  "leave/cancelLeave",
  async (leaveId, { dispatch, rejectWithValue }) => {
    try {
      await cancelLeaveRequest(leaveId);
      dispatch(
        enqueueSnackbarMessage({
          message: SnackMessage.success.cancelLeaveMessage,
          type: "success",
        }),
      );
      return leaveId;
    } catch (err) {
      if (axios.isCancel(err)) {
        return rejectWithValue("Request canceled");
      }

      if (axios.isAxiosError(err)) {
        dispatch(
          enqueueSnackbarMessage({
            message:
              err.response?.status === HttpStatusCode.InternalServerError
                ? SnackMessage.error.cancelLeaveMessage
                : "An unknown error occurred while cancelling leave.",
            type: "error",
          }),
        );
        return rejectWithValue(
          (err.response?.data as { message?: string })?.message ?? "Failed to cancel leave.",
        );
      }

      dispatch(
        enqueueSnackbarMessage({
          message: "An unknown error occurred while cancelling leave.",
          type: "error",
        }),
      );
      return rejectWithValue("Failed to cancel leave.");
    }
  },
);

const LeaveSlice = createSlice({
  name: "leave",
  initialState,
  reducers: {
    resetLeaveState(state) {
      state.state = State.idle;
      state.stateMessage = null;
      state.errorMessage = null;
    },
    removeLeaveFromList(state, action: PayloadAction<number>) {
      state.leaves = state.leaves.filter((leave) => leave.id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    // Fetch Leave History
    builder
      .addCase(fetchLeaveHistory.pending, (state) => {
        state.state = State.loading;
        state.stateMessage = "Fetching leave history...";
      })
      .addCase(fetchLeaveHistory.fulfilled, (state, action) => {
        state.state = State.success;
        state.stateMessage = "Successfully fetched leave history!";
        state.leaves = action.payload.leaves;
      })
      .addCase(fetchLeaveHistory.rejected, (state, action) => {
        state.state = State.failed;
        state.stateMessage = "Failed to fetch leave history.";
        state.errorMessage = (action.payload as string | undefined) ?? action.error.message ?? null;
      });

    // Cancel Leave
    builder
      .addCase(cancelLeave.pending, (state, action) => {
        state.cancellingLeaveId = action.meta.arg;
      })
      .addCase(cancelLeave.fulfilled, (state, action) => {
        state.cancellingLeaveId = null;
        state.leaves = state.leaves.filter((leave) => leave.id !== action.payload);
      })
      .addCase(cancelLeave.rejected, (state) => {
        state.cancellingLeaveId = null;
      });
  },
});

export const { resetLeaveState, removeLeaveFromList } = LeaveSlice.actions;

export const selectLeaveState = (state: RootState) => state.leave.state;
export const selectLeaves = (state: RootState) => state.leave.leaves;
export const selectLeaveError = (state: RootState) => state.leave.errorMessage;
export const selectCancellingLeaveId = (state: RootState) => state.leave.cancellingLeaveId;

export default LeaveSlice.reducer;
