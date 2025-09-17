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
import { AppConfig } from "@root/src/config/config";
import { APIService } from "@root/src/utils/apiService";
import { AxiosError, HttpStatusCode } from "axios";
import { enqueueSnackbarMessage } from "../commonSlice/common";

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

interface InvitationsState {
  loading: boolean;
  success: boolean;
  error: string | null;
  invitation: Invitation | null;
}

const initialState: InvitationsState = {
  loading: false,
  success: false,
  error: null,
  invitation: null,
};

export const sendInvitation = createAsyncThunk<
  Invitation, // Return type
  Invitation, // Arg type
  { rejectValue: string } // Rejection type
>(
  "invitations/sendInvitation",
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

const invitationsSlice = createSlice({
  name: "invitations",
  initialState,
  reducers: {
    resetInvitationState: (state) => {
      state.loading = false;
      state.success = false;
      state.error = null;
      state.invitation = null;
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
      });
  },
});

export const { resetInvitationState } = invitationsSlice.actions;
export default invitationsSlice.reducer;
