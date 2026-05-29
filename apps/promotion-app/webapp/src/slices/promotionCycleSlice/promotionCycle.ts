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
    startDate: string,
    endDate: string,
    leadDeadline: string,
    functionalLeadDeadline: string,
    promotionBoardDeadline: string,
    status: string
}

interface InsertPromotionCyclePaylod {
    name: string,
    startDate: string,
    endDate: string,
    leadDeadline: string,
    functionalLeadDeadline: string,
    promotionBoardDeadline: string,
}

interface PromotionCycleState {
  state: State;
  createState: State;
  stateMessage: string | null;
  errorMessage: string | null;
  promotionCycles: PromotionCycle[] | null;
}

const initialState: PromotionCycleState = {
  state: State.idle,
  createState: State.idle,
  stateMessage: null,
  errorMessage: null,
  promotionCycles: null,
};

export const fetchPromotionCycles = createAsyncThunk(
  "promotionCycle/fetchPromotionCycles",
  async ({
      statusArray
    }: {
      statusArray?: string[];
    }, { dispatch, rejectWithValue }
  ) => {
    APIService.getCancelToken().cancel();
    const newCancelTokenSource = APIService.updateCancelToken();

    return new Promise<{ PromotionCycles: PromotionCycle[] | null }>((resolve, reject) => {
      APIService.getInstance()
        .get(AppConfig.serviceUrls.promotionCycle, {
          params: {
            statusArray: statusArray?.join(",")
          },
          cancelToken: newCancelTokenSource.token,
        })
        .then((response) => {
            if (response.data.promotionCycles[0]){
                resolve({
                    PromotionCycles: response.data.promotionCycles,
                });
            }else{
                resolve({
                    PromotionCycles: null
                });
            }
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

export const createPromotionCycle = createAsyncThunk(
  "promotionCycle/createPromotionCycle",
  async (payload: InsertPromotionCyclePaylod,
    { dispatch, rejectWithValue }
  ) => {
    APIService.getCancelToken().cancel();
    const newCancelTokenSource = APIService.updateCancelToken(); 
    return new Promise<{ cycleID: number }>((resolve, reject) => {
      APIService.getInstance()
        .post(AppConfig.serviceUrls.promotionCycle, payload,{
          cancelToken: newCancelTokenSource.token,
        })
        .then((response) => {
          resolve({
            cycleID: response.data
          })
          dispatch(
            enqueueSnackbarMessage({
              message: "Successfully Create a Promotion Cycle!",
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
                  ? "Failed to Create a Promotion Cycle!"
                  : "An unknown error occurred.",
              type: "error",
            })
          );
          reject(error.response?.data?.message);
        });
    });
  }
);

export const endPromotionCycle = createAsyncThunk(
  "promotionCycle/endPromotionCycle",
  async ({
      id,
    }: {
      id: number;
    }, { dispatch, rejectWithValue }
  ) => {
    APIService.getCancelToken().cancel();
    const newCancelTokenSource = APIService.updateCancelToken();

    return new Promise<{ status: string }>((resolve, reject) => {
      APIService.getInstance()
        .get(AppConfig.serviceUrls.promotionCycle + "/" + id + "/end", {
          cancelToken: newCancelTokenSource.token,
        })
        .then((response) => {
          resolve({
              status: response.data,
          });
          dispatch(
            enqueueSnackbarMessage({
              message: "Successfully Ended the Promotion Cycle!",
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
                  ? "Failed to End the  active Promotion Cycles."
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
      .addCase(fetchPromotionCycles.pending, (state) => {
        state.state = State.loading;
        state.stateMessage = "Fetching promotion cycle data...";
      })
      .addCase(fetchPromotionCycles.fulfilled, (state, action) => {
        state.state = State.success;
        state.stateMessage = "Successfully fetched!";
        state.promotionCycles = action.payload.PromotionCycles;
      })
      .addCase(fetchPromotionCycles.rejected, (state) => {
        state.state = State.failed;
        state.stateMessage = "Failed to fetch!";
      })
      .addCase(createPromotionCycle.pending, (state) => {
        state.createState = State.loading;
        state.stateMessage = "Craeting a Promotion Cycle...";
      })
      .addCase(createPromotionCycle.fulfilled, (state, action) => {
        state.createState = State.success;
        state.stateMessage = "Successfully Created a Promotion Cycle!";
      })
      .addCase(createPromotionCycle.rejected, (state) => {
        state.createState = State.failed;
        state.stateMessage = "Failed to create a promotion cycle";
      })
      .addCase(endPromotionCycle.pending, (state) => {
        state.createState = State.loading;
        state.stateMessage = "Ending the Promotion Cycle...";
      })
      .addCase(endPromotionCycle.fulfilled, (state, action) => {
        state.createState = State.success;
        state.stateMessage = "Successfully Ended the Promotion Cycle!";
      })
      .addCase(endPromotionCycle.rejected, (state) => {
        state.createState = State.failed;
        state.stateMessage = "Failed to Ended the promotion cycle";
      })
  },
});

export const { resetSubmitState } = PromotionCycleSlice.actions;
export default PromotionCycleSlice.reducer;
