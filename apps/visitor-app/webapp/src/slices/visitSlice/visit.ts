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
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { enqueueSnackbarMessage } from "@slices/commonSlice/common";

const initialState: VisitState = {
  state: State.idle,
  submitState: State.idle,
  stateMessage: "",
  errorMessage: "",
  backgroundProcess: false,
  backgroundProcessMessage: null,
};

interface VisitState {
  state: State;
  submitState: State;
  stateMessage: string | null;
  errorMessage: string | null;
  backgroundProcess: boolean;
  backgroundProcessMessage: string | null;
}

export interface Visit extends AddVisitPayload {
  createdBy: string;
  createdOn: string;
  updatedBy: string;
  updatedOn: string;
}

export interface AddVisitPayload {
  nicHash: string;
  companyName: string | null;
  passNumber: string;
  whomTheyMeet: string;
  purposeOfVisit: string;
  accessibleLocations: FloorRoom[];
  timeOfEntry: string;
  timeOfDeparture: string;
}

export interface FloorRoom {
  floor: string;
  rooms: string[];
}

export const addVisit = createAsyncThunk(
  "visit/addVisit",
  async (payload: AddVisitPayload, { dispatch }) => {
    APIService.getCancelToken().cancel();
    const newCancelTokenSource = APIService.updateCancelToken();
    return new Promise<AddVisitPayload>((resolve, reject) => {
      APIService.getInstance()
        .post(AppConfig.serviceUrls.visits, payload, {
          cancelToken: newCancelTokenSource.token,
        })
        .then((response) => {
          dispatch(
            enqueueSnackbarMessage({
              message:
                response.data.message ||
                "Your visit has been added successfully!",
              type: "success",
            })
          );
          resolve(response.data);
        })
        .catch((error) => {
          const errorMessage =
            error.response?.data?.message ||
            (error.response?.status === HttpStatusCode.InternalServerError
              ? error.response?.data?.message
              : "An error occurred during visit creation!");
          dispatch(
            enqueueSnackbarMessage({
              message: errorMessage,
              type: "error",
            })
          );
          reject(error);
        });
    });
  }
);

const VisitSlice = createSlice({
  name: "visits",
  initialState,
  reducers: {
    resetSubmitState(state) {
      state.submitState = State.idle;
    },
    resetState(state) {
      state.state = State.idle;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(addVisit.pending, (state) => {
        state.submitState = State.loading;
        state.stateMessage = "Hang tight! We’re adding your visit...";
      })
      .addCase(addVisit.fulfilled, (state, action) => {
        state.submitState = State.success;
        state.stateMessage = "Your visit has been added successfully!";
      })
      .addCase(addVisit.rejected, (state, action) => {
        state.submitState = State.failed;
        state.stateMessage = "An error occurred during visit creation!";
      });
  },
});

export const { resetSubmitState, resetState } = VisitSlice.actions;
export default VisitSlice.reducer;
