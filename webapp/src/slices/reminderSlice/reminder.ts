// Copyright (c) 2024, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

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
