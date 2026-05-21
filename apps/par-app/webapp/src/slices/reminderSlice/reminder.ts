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
import { HttpStatusCode } from "axios";

import { AppConfig } from "@config/config";
import { SnackMessage, sliceErrorMessages } from "@config/constant";
import { enqueueSnackbarMessage } from "@slices/commonSlice/common";
import { RootState } from "@slices/store";
import { ApiService } from "@utils/apiService";
import { RequestState } from "@utils/types";
import { getErrorMessage } from "@utils/utils";

export interface reminderState {
  state: RequestState;
}

const initialState: reminderState = {
  state: RequestState.IDLE,
};

export const sendAllLeadReminder = createAsyncThunk(
  "reminder/sendAllLeadReminder",
  async (_, { dispatch }) => {
    try {
      const response = await ApiService.getInstance().patch(
        `${AppConfig.serviceUrls.reminders}/schedule-lead-reminders`,
      );

      if (response.status === HttpStatusCode.Accepted) {
        dispatch(
          enqueueSnackbarMessage({
            message: SnackMessage.success.sendReminder,
            type: "success",
          }),
        );
        return response.data;
      } else {
        throw new Error(response.data?.message || sliceErrorMessages.reminderSlice.postReminder);
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error, SnackMessage.error.sendReminder);

      dispatch(
        enqueueSnackbarMessage({
          message: errorMessage,
          type: "error",
        }),
      );
      throw error;
    }
  },
);

export const sendAllEmployeeReminder = createAsyncThunk(
  "reminder/sendAllEmployeeReminder",
  async (_, { dispatch }) => {
    try {
      const response = await ApiService.getInstance().patch(
        `${AppConfig.serviceUrls.reminders}/schedule-employee-reminders`,
      );

      if (response.status === HttpStatusCode.Accepted) {
        dispatch(
          enqueueSnackbarMessage({
            message: SnackMessage.success.sendReminder,
            type: "success",
          }),
        );
        return response.data;
      } else {
        throw new Error(response.data?.message || sliceErrorMessages.reminderSlice.postReminder);
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error, SnackMessage.error.sendReminder);

      dispatch(
        enqueueSnackbarMessage({
          message: errorMessage,
          type: "error",
        }),
      );
      throw error;
    }
  },
);

export const sendAllSpecialRatingReminder = createAsyncThunk(
  "reminder/sendAllSpecialRatingReminder",
  async (_, { dispatch }) => {
    try {
      const response = await ApiService.getInstance().patch(
        `${AppConfig.serviceUrls.reminders}/schedule-special-rating-reminders`,
      );

      if (response.status === HttpStatusCode.Accepted) {
        dispatch(
          enqueueSnackbarMessage({
            message: SnackMessage.success.sendReminder,
            type: "success",
          }),
        );
        return response.data;
      } else {
        throw new Error(response.data?.message || sliceErrorMessages.reminderSlice.postReminder);
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error, SnackMessage.error.sendReminder);

      dispatch(
        enqueueSnackbarMessage({
          message: errorMessage,
          type: "error",
        }),
      );
      throw error;
    }
  },
);

export const sendAllThreeSixtyReminder = createAsyncThunk(
  "reminder/sendAllThreeSixtyReminder",
  async (_, { dispatch }) => {
    try {
      const response = await ApiService.getInstance().patch(
        `${AppConfig.serviceUrls.reminders}/schedule-360-reminders`,
      );

      if (response.status === HttpStatusCode.Accepted) {
        dispatch(
          enqueueSnackbarMessage({
            message: SnackMessage.success.sendReminder,
            type: "success",
          }),
        );
        return response.data;
      } else {
        throw new Error(response.data?.message || sliceErrorMessages.reminderSlice.postReminder);
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error, SnackMessage.error.sendReminder);

      dispatch(
        enqueueSnackbarMessage({
          message: errorMessage,
          type: "error",
        }),
      );
      throw error;
    }
  },
);

const reminderSlice = createSlice({
  name: "reminder",
  initialState,
  reducers: {},

  extraReducers: (builder) => {
    builder
      .addCase(sendAllLeadReminder.pending, (state) => {
        state.state = RequestState.LOADING;
      })
      .addCase(sendAllLeadReminder.fulfilled, (state, action) => {
        state.state = RequestState.SUCCEEDED;
      })
      .addCase(sendAllLeadReminder.rejected, (state) => {
        state.state = RequestState.FAILED;
      })
      .addCase(sendAllEmployeeReminder.pending, (state) => {
        state.state = RequestState.LOADING;
      })
      .addCase(sendAllEmployeeReminder.fulfilled, (state, action) => {
        state.state = RequestState.SUCCEEDED;
      })
      .addCase(sendAllEmployeeReminder.rejected, (state) => {
        state.state = RequestState.FAILED;
      })
      .addCase(sendAllSpecialRatingReminder.pending, (state) => {
        state.state = RequestState.LOADING;
      })
      .addCase(sendAllSpecialRatingReminder.fulfilled, (state, action) => {
        state.state = RequestState.SUCCEEDED;
      })
      .addCase(sendAllSpecialRatingReminder.rejected, (state) => {
        state.state = RequestState.FAILED;
      })
      .addCase(sendAllThreeSixtyReminder.pending, (state) => {
        state.state = RequestState.LOADING;
      })
      .addCase(sendAllThreeSixtyReminder.fulfilled, (state, action) => {
        state.state = RequestState.SUCCEEDED;
      })
      .addCase(sendAllThreeSixtyReminder.rejected, (state) => {
        state.state = RequestState.FAILED;
      });
  },
});

export const selectReminderSendingState = (state: RootState) => state.reminder.state;

export default reminderSlice.reducer;
