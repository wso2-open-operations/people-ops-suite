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
  postState: State;
  stateMessage: string | null;
  errorMessage: string | null;
  promotions: PromotionRequest[] | null;
}

interface InsertPromotionPaylod {
  PromotionCycleID: number,
  type: string,
  promotingJobBand: number,
  employeeEmail: string,
  statement: string,
}

const initialState: Promotion = {
  state: State.idle,
  postState: State.idle,
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
      type,
      recommendedBy,
    }: {
      employeeEmail?: string;
      statusArray?: string[];
      type?: string;
      recommendedBy?: string;
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
            type,
            recommendedBy,
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

export const insertPromotions = createAsyncThunk(
  "promotion/insertPromotions",
  async (payload: InsertPromotionPaylod,
    { dispatch, rejectWithValue }
  ) => {
    APIService.getCancelToken().cancel();
    const newCancelTokenSource = APIService.updateCancelToken(); 
    return new Promise<{ applicationID: number }>((resolve, reject) => {
      APIService.getInstance()
        .post(AppConfig.serviceUrls.retrieveAllPromotionRequests, payload,{
          cancelToken: newCancelTokenSource.token,
        })
        .then((response) => {
          resolve({
            applicationID: response.data
          })
          dispatch(
            enqueueSnackbarMessage({
              message: "Successfully Create a Promotion!",
              type: "success",
            })
          );
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
                  ? "Failed to Create a Promotion!"
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
      state.postState = State.idle;
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
      })
      .addCase(insertPromotions.pending, (state) => {
        state.postState = State.loading;
        state.stateMessage = "Inserting promotion data...";
      })
      .addCase(insertPromotions.fulfilled, (state, action) => {
        state.postState = State.success;
        state.stateMessage = "Successfully Created!";
      })
      .addCase(insertPromotions.rejected, (state) => {
        state.postState = State.failed;
        state.stateMessage = "Failed to Insert the promotion!";
      });
  },
});

export const { resetSubmitState } = PromotionSlice.actions;
export default PromotionSlice.reducer;
