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
import { PromotionRequest } from "@root/src/utils/types";

interface Promotion {
  state: State;
  stateMessage: string | null;
  errorMessage: string | null;
  promotions: PromotionRequest[] | null;
}

const initialState: Promotion = {
  state: State.idle,
  stateMessage: null,
  errorMessage: null,
  promotions: null,
};

export const fetchPromotions = createAsyncThunk(
  "promotion/fetchPromotions",
  async (
    {
      employeeEmail,
      statusArray,
    }: {
      employeeEmail?: string;
      statusArray?: string[];
    },
    { dispatch, rejectWithValue }
  ) => {
    APIService.getCancelToken().cancel();
    const newCancelTokenSource = APIService.updateCancelToken();

    return new Promise<{ promotions: PromotionRequest[] }>((resolve, reject) => {
      APIService.getInstance()
        .get(AppConfig.serviceUrls.retrieveAllPromotionRequests, {
          params: {
            employeeEmail,
            statusArray: statusArray?.join(","),
          },
          cancelToken: newCancelTokenSource.token,
        })
        .then((response) => {
          resolve({
            promotions: response.data.promotionRequests,
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
                  ? "Failed to fetch promotions."
                  : "An unknown error occurred.",
              type: "error",
            })
          );
          reject(error.response?.data?.message);
        });
    });
  }
);


const PromotionSlice = createSlice({
  name: "promotion",
  initialState,
  reducers: {
    resetSubmitState(state) {
      state.state = State.idle;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPromotions.pending, (state) => {
        state.state = State.loading;
        state.stateMessage = "Fetching promotion data...";
      })
      .addCase(fetchPromotions.fulfilled, (state, action) => {
        state.state = State.success;
        state.stateMessage = "Successfully fetched!";
        state.promotions = action.payload.promotions;
      })
      .addCase(fetchPromotions.rejected, (state) => {
        state.state = State.failed;
        state.stateMessage = "Failed to fetch!";
      });
  },
});

export const { resetSubmitState } = PromotionSlice.actions;
export default PromotionSlice.reducer;
