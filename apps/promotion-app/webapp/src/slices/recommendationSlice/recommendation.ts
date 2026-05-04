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
import { RecommendationInterface } from "@root/src/utils/types";

interface Recommendation {
  state: State;
  updateState: State;
  stateMessage: string | null;
  errorMessage: string | null;
  recommendations: RecommendationInterface[] | null;
}

interface UpdateRecommendationPaylod {
  id: number;
  statement?: string;
  comment?: string|null;
}

const initialState: Recommendation = {
  state: State.idle,
  updateState: State.idle,
  stateMessage: null,
  errorMessage: null,
  recommendations: null,
};

export const fetchRecommendation = createAsyncThunk(
  "recommendation/fetchRecommendation",
  async ({
    leadEmail,
    statusArray,
    promotionCycleId,
  }:{
    leadEmail: string,
    statusArray: string[],
    promotionCycleId?: number,
  },{ dispatch, rejectWithValue }
  ) => {
    APIService.getCancelToken().cancel();
    const newCancelTokenSource = APIService.updateCancelToken();

    return new Promise<{ recommendations: RecommendationInterface[] }>((resolve, reject) => {
      APIService.getInstance()
        .get(AppConfig.serviceUrls.getPromotionRecommendations, {
            params: {
                leadEmail: leadEmail,
                statusArray: statusArray?.join(","),
                promotionCycleId: promotionCycleId
            },
          cancelToken: newCancelTokenSource.token,
        })
        .then((response) => {
          console.log(response.data.promotionRequests);
          resolve({
            recommendations: response.data,
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
                  ? "Failed to fetch recommendations."
                  : "An unknown error occurred.",
              type: "error",
            })
          );
          reject(error.response?.data?.message);
        });
    });
  }
);

export const patchRecommendation = createAsyncThunk(
  "recommendation/patchRecommendation",
  async (payload: UpdateRecommendationPaylod,
    { dispatch, rejectWithValue }
  ) => {
    APIService.getCancelToken().cancel();
    const newCancelTokenSource = APIService.updateCancelToken(); 
    return new Promise<{ status: string }>((resolve, reject) => {
      APIService.getInstance()
        .patch(AppConfig.serviceUrls.getPromotionRecommendations, payload,{
          cancelToken: newCancelTokenSource.token,
        })
        .then((response) => {
          resolve({
            status: response.data
          })
          dispatch(
            enqueueSnackbarMessage({
              message: "Successfully Save Draft!",
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
                  ? "Failed to Save Draft!"
                  : "An unknown error occurred.",
              type: "error",
            })
          );
          reject(error.response?.data?.message);
        });
    });
  }
);

export const approveRecommendation = createAsyncThunk(
  "recommendation/approveRecommendation",
  async ({
    id
  }:{
    id: number
  },
    { dispatch, rejectWithValue }
  ) => {
    APIService.getCancelToken().cancel();
    const newCancelTokenSource = APIService.updateCancelToken(); 
    return new Promise<{ status: string }>((resolve, reject) => {
      APIService.getInstance()
        .get(`${AppConfig.serviceUrls.getPromotionRecommendations}/${id}/submit`,{
          cancelToken: newCancelTokenSource.token,
        })
        .then((response) => {
          resolve({
            status: response.data
          })
          dispatch(
            enqueueSnackbarMessage({
              message: "Successfully submit the Promotion!",
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
                  ? "Failed to submit the promotion!"
                  : "An unknown error occurred.",
              type: "error",
            })
          );
          reject(error.response?.data?.message);
        });
    });
  }
);

export const declineRecommendation = createAsyncThunk(
  "recommendation/declineRecommendation",
  async ({
    id,
    comment
  }:{
    id: number,
    comment: string,
  },
    { dispatch, rejectWithValue }
  ) => {
    APIService.getCancelToken().cancel();
    const newCancelTokenSource = APIService.updateCancelToken(); 
    return new Promise<{ status: string }>((resolve, reject) => {
      APIService.getInstance()
        .get(`${AppConfig.serviceUrls.getPromotionRecommendations}/${id}/decline`,{
          params: {
            comment: comment
          },
          cancelToken: newCancelTokenSource.token,
        })
        .then((response) => {
          resolve({
            status: response.data
          })
          dispatch(
            enqueueSnackbarMessage({
              message: "Successfully decline the Promotion!",
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
                  ? "Failed to decline the promotion!"
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
      .addCase(fetchRecommendation.pending, (state) => {
        state.state = State.loading;
        state.stateMessage = "Fetching recommendation data...";
      })
      .addCase(fetchRecommendation.fulfilled, (state, action) => {
        state.state = State.success;
        state.stateMessage = "Successfully fetched!";
        state.recommendations = action.payload.recommendations;
      })
      .addCase(fetchRecommendation.rejected, (state) => {
        state.state = State.failed;
        state.stateMessage = "Failed to fetch!";
      })
      .addCase(patchRecommendation.pending, (state) => {
        state.updateState = State.loading;
        state.stateMessage = "Updateding recommendation comment...";
      })
      .addCase(patchRecommendation.fulfilled, (state, action) => {
        state.updateState = State.success;
        state.stateMessage = action.payload.status;
      })
      .addCase(patchRecommendation.rejected, (state) => {
        state.updateState = State.failed;
        state.stateMessage = "Failed to Updated!";
      })
      .addCase(approveRecommendation.pending, (state) => {
        state.updateState = State.loading;
        state.stateMessage = "Submiting promotion...";
      })
      .addCase(approveRecommendation.fulfilled, (state, action) => {
        state.updateState = State.success;
        state.stateMessage = action.payload.status;
      })
      .addCase(approveRecommendation.rejected, (state) => {
        state.updateState = State.failed;
        state.stateMessage = "Failed to submit the promotion!";
      })
      .addCase(declineRecommendation.pending, (state) => {
        state.updateState = State.loading;
        state.stateMessage = "declining promotion...";
      })
      .addCase(declineRecommendation.fulfilled, (state, action) => {
        state.updateState = State.success;
        state.stateMessage = action.payload.status;
      })
      .addCase(declineRecommendation.rejected, (state) => {
        state.updateState = State.failed;
        state.stateMessage = "Failed to decline the promotion!";
      });
  },
});

export const { resetSubmitState } = PromotionSlice.actions;
export default PromotionSlice.reducer;
