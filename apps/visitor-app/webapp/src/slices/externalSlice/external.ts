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
import { createAsyncThunk } from "@reduxjs/toolkit";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { State } from "../../types/types";
import axios from "axios";
import { ServiceBaseUrl } from "@config/config";

interface VisitData {
  visitors: Array<any>;
}

interface SubmitVisitState {
  state: State;
  submitState: State;
  stateMessage: string;
  error: string | null;
  data: any;
  visitInvitation: any | null;
}

const initialState: SubmitVisitState = {
  state: State.idle,
  submitState: State.idle,
  stateMessage: "",
  error: null,
  data: null,
  visitInvitation: null,
};

export const submitVisitAsync = createAsyncThunk(
  "visit/submitVisit",
  async (
    { visitData, invitationId }: { visitData: VisitData; invitationId: string },
    { rejectWithValue }
  ) => {
    console.log("Thunk VisitData", visitData);
    try {
      const response = await fetch(
        `${ServiceBaseUrl}/invitation/${invitationId}/fill`,
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
      console.error("Submit visit failed:", error);
      return rejectWithValue("Failed to submit visit");
    }
  }
);

export const getVisitInvitationAsync = createAsyncThunk(
  "visit/getVisitInvitation",
  async (invitationId: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${ServiceBaseUrl}/invitation/${invitationId}/authentication`
      );

      // assuming backend returns the invitation object directly
      return { success: true, data: response.data };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch visit invitation"
      );
    }
  }
);

const externalSlice = createSlice({
  name: "submitVisit",
  initialState,
  reducers: {
    resetSubmitState(state) {
      state.submitState = State.idle;
      state.error = null;
      state.stateMessage = "";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(submitVisitAsync.pending, (state) => {
        state.submitState = State.loading;
        state.stateMessage = "Submitting visit...";
        state.error = null;
      })
      .addCase(
        submitVisitAsync.fulfilled,
        (state, action: PayloadAction<any>) => {
          state.submitState = State.success;
          state.stateMessage = "Visit submitted successfully";
          state.data = action.payload.data;
          state.error = null;
        }
      )
      .addCase(submitVisitAsync.rejected, (state, action) => {
        state.submitState = State.failed;
        state.stateMessage = "Failed to submit visit";
        state.error = action.payload as string;
      })
      .addCase(getVisitInvitationAsync.pending, (state) => {
        state.state = State.loading;
        state.stateMessage = "Fetching invitation...";
        state.error = null;
      })
      .addCase(
        getVisitInvitationAsync.fulfilled,
        (state, action: PayloadAction<any>) => {
          state.state = State.success;
          state.stateMessage = "Invitation fetched successfully";
          state.visitInvitation = action.payload.data;
          state.error = null;
        }
      )
      .addCase(getVisitInvitationAsync.rejected, (state, action) => {
        state.state = State.failed;
        state.stateMessage = "Failed to fetch invitation";
        state.error = action.payload as string;
      });
  },
});

export const { resetSubmitState } = externalSlice.actions;
export default externalSlice.reducer;
