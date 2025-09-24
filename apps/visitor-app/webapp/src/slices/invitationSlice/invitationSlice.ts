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

import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { AppConfig } from "@config/config";
import { APIService } from "@root/src/utils/apiService";
import axios, { AxiosError, HttpStatusCode } from "axios";
import { enqueueSnackbarMessage } from "../commonSlice/common";
import { State } from "../../types/types";

export interface AccessibleLocation {
  floor: string;
  rooms: string[];
}

export interface VisitDetails {
  nameOfCompany: string;
  whomTheyMeet: string;
  purposeOfVisit: string;
  accessibleLocations: AccessibleLocation[];
  sheduledDate: string;
  timeOfEntry: string;
  timeOfDeparture: string;
}

export interface Invitation {
  createdOn: string;
  updatedBy: string;
  updatedOn: string;
  isActive: number;
  noOfInvitations: number;
  visitDetails: VisitDetails;
  inviteeEmail: string;
}

interface VisitData {
  visitors: Array<any>;
}

export interface InvitationState {
  loading: boolean;
  success: boolean;
  error: string | null;
  invitation: Invitation | null;

  // visit submission
  submitState: State;
  submitMessage: string;
  submitError: string | null;
  submittedData: any;

  // fetched invitation
  fetchState: State;
  fetchMessage: string;
  visitInvitation: any | null;
}

const initialState: InvitationState = {
  loading: false,
  success: false,
  error: null,
  invitation: null,

  submitState: State.idle,
  submitMessage: "",
  submitError: null,
  submittedData: null,

  fetchState: State.idle,
  fetchMessage: "",
  visitInvitation: null,
};

export const sendInvitation = createAsyncThunk<
  Invitation,
  Invitation,
  { rejectValue: string }
>(
  "invitation/sendInvitation",
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      APIService.getCancelToken().cancel();
      const newCancelTokenSource = APIService.updateCancelToken();

      const response = await APIService.getInstance().post(
        AppConfig.serviceUrls.invitations,
        payload,
        {
          cancelToken: newCancelTokenSource.token,
        }
      );

      return response.data as Invitation;
    } catch (err) {
      const error = err as AxiosError<any>;
      const errorMessage =
        error.response?.data?.message ||
        (error.response?.status === HttpStatusCode.InternalServerError
          ? error.response?.data?.message
          : "An error occurred while sending invitation!");

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

export const submitVisitAsync = createAsyncThunk<
  any,
  { visitData: VisitData; invitationId: string },
  { rejectValue: string }
>(
  "invitation/submitVisit",
  async ({ visitData, invitationId }, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${AppConfig.serviceUrls.invitations}/${invitationId}/fill`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(visitData.visitors[0]),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue("Failed to submit visit");
    }
  }
);

export const getVisitInvitationAsync = createAsyncThunk<
  any,
  string,
  { rejectValue: string }
>(
  "invitation/getVisitInvitation",
  async (invitationId, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${AppConfig.serviceUrls.invitations}/${invitationId}/authentication`
      );
      return { success: true, data: response.data };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch visit invitation"
      );
    }
  }
);

const invitationSlice = createSlice({
  name: "invitation",
  initialState,
  reducers: {
    resetInvitationState: (state) => {
      state.loading = false;
      state.success = false;
      state.error = null;
      state.invitation = null;
    },
    resetSubmitState: (state) => {
      state.submitState = State.idle;
      state.submitError = null;
      state.submitMessage = "";
      state.submittedData = null;
    },
    resetFetchState: (state) => {
      state.fetchState = State.idle;
      state.fetchMessage = "";
      state.visitInvitation = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendInvitation.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = null;
      })
      .addCase(
        sendInvitation.fulfilled,
        (state, action: PayloadAction<Invitation>) => {
          state.loading = false;
          state.success = true;
          state.invitation = action.payload;
        }
      )
      .addCase(sendInvitation.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error =
          action.payload || action.error.message || "Something went wrong";
      })
      .addCase(submitVisitAsync.pending, (state) => {
        state.submitState = State.loading;
        state.submitMessage = "Submitting visit...";
        state.submitError = null;
      })
      .addCase(
        submitVisitAsync.fulfilled,
        (state, action: PayloadAction<any>) => {
          state.submitState = State.success;
          state.submitMessage = "Visit submitted successfully";
          state.submittedData = action.payload.data;
          state.submitError = null;
        }
      )
      .addCase(submitVisitAsync.rejected, (state, action) => {
        state.submitState = State.failed;
        state.submitMessage = "Failed to submit visit";
        state.submitError = action.payload as string;
      })
      .addCase(getVisitInvitationAsync.pending, (state) => {
        state.fetchState = State.loading;
        state.fetchMessage = "Fetching invitation...";
        state.error = null;
      })
      .addCase(
        getVisitInvitationAsync.fulfilled,
        (state, action: PayloadAction<any>) => {
          state.fetchState = State.success;
          state.fetchMessage = "Invitation fetched successfully";
          state.visitInvitation = action.payload.data;
          state.error = null;
        }
      )
      .addCase(getVisitInvitationAsync.rejected, (state, action) => {
        state.fetchState = State.failed;
        state.fetchMessage = "Failed to fetch invitation";
        state.error = action.payload as string;
      });
  },
});

export const { resetInvitationState, resetSubmitState, resetFetchState } =
  invitationSlice.actions;

export default invitationSlice.reducer;
