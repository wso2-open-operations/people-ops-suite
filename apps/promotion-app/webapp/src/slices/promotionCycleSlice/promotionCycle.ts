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
import axios, { HttpStatusCode } from "axios";
import { APIService } from "@utils/apiService";
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { enqueueSnackbarMessage } from "@slices/commonSlice/common";

interface PromotionCycle {
    id: number,
    name: string,
    startDate: Date,
    endDate: Date,
    leadDeadline: Date,
    functionalLeadDeadline: Date,
    promotionBoardDeadline: Date,
    status: string
}

interface PromotionCycleState {
  state: State;
  stateMessage: string | null;
  errorMessage: string | null;
  activePromotionCycle: PromotionCycle | null;
}

const initialState: PromotionCycleState = {
  state: State.idle,
  stateMessage: null,
  errorMessage: null,
  activePromotionCycle: null,
};

export const fetchActivePromotionCycle = createAsyncThunk(
  "promotionCycle/fetchActivePromotionCycle",
  async (_, { dispatch, rejectWithValue }
  ) => {
    APIService.getCancelToken().cancel();
    const newCancelTokenSource = APIService.updateCancelToken();

    return new Promise<{ activePromotionCycles: PromotionCycle }>((resolve, reject) => {
      APIService.getInstance()
        .get(AppConfig.serviceUrls.getActivePromotionCycle, {
          cancelToken: newCancelTokenSource.token,
        })
        .then((response) => {
          resolve({
            activePromotionCycles: response.data.promotionCycles[0],
          });
        })
        .catch((error) => {
          if (axios.isCancel(error)) {
            reject(rejectWithValue("Request canceled"));
            return;
          }
          dispatch(
            enqueueSnackbarMessage({
              message:
                error.response?.status === HttpStatusCode.InternalServerError
                  ? "Failed to fetch active Promotion Cycles."
                  : "An unknown error occurred.",
              type: "error",
            })
          );
          reject(error.response?.data?.message);
        });
    });
  }
);

const PromotionCycleSlice = createSlice({
  name: "promotionCycle",
  initialState,
  reducers: {
    resetSubmitState(state) {
      state.state = State.idle;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchActivePromotionCycle.pending, (state) => {
        state.state = State.loading;
        state.stateMessage = "Fetching promotion cycle data...";
      })
      .addCase(fetchActivePromotionCycle.fulfilled, (state, action) => {
        state.state = State.success;
        state.stateMessage = "Successfully fetched!";
        state.activePromotionCycle = action.payload.activePromotionCycles;
      })
      .addCase(fetchActivePromotionCycle.rejected, (state) => {
        state.state = State.failed;
        state.stateMessage = "Failed to fetch!";
      })
  },
});

export const { resetSubmitState } = PromotionCycleSlice.actions;
export default PromotionCycleSlice.reducer;
