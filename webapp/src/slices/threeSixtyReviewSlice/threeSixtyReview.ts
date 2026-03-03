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

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { RequestState } from "@root/src/utils/types";
import { RootState } from "@slices/store";
import { AppConfig } from "@config/config";
import { ApiService } from "@utils/apiService";
import { enqueueSnackbarMessage } from "@slices/commonSlice/common";
import { base64Regex, sliceErrorMessages, SnackMessage } from "@config/constant";
import { HttpStatusCode } from "axios";
import { getErrorMessage } from "@utils/utils";

interface FetchReviewers {
  employeeId: string;
  parCycleId: number;
}

export enum ParThreeSixtyReviewStatus {
  PENDING = "PENDING",
  DRAFT = "DRAFT",
  COMPLETED = "SHARED",
  REJECTED = "REJECTED",
}

export interface ThreeSixtyReview {
  reviewerEmail: string;
  reviewRating: string;
  reviewComment?: string;
  reviewStatus?: ParThreeSixtyReviewStatus;
}

export interface ThreeSixtyReviewer {
  reviewerEmail: string;
  reviewStatus?: ParThreeSixtyReviewStatus;
  isLeadRequested?: boolean;
  isEmployeeRequested?: boolean;
}

export interface ThreeSixtyReviewRequest {
  employeeEmail: string;
  reviewStatus: ParThreeSixtyReviewStatus;
  isEmployeeRequested: boolean;
  isLeadRequested: boolean;
}

interface FetchRequests extends FetchReviewers {}
interface FetchReviews extends FetchReviewers {}

interface PostReviewers {
  employeeId: string;
  parCycleId: number;
  reviewerEmails: string[];
}

interface PostReviews {
  employeeId: string;
  parCycleId: number;
  values: {
    reviewRating?: string;
    reviewComment?: string;
    par360ReviewStatus: ParThreeSixtyReviewStatus;
    reviewerEmail?: string;
  };
}

export interface RejectedReview {
  employeeEmail: string;
  reviewerEmail: string;
  isOfferedFeedback: boolean;
}

interface ThreeSixtyReviewState {
  status: RequestState;
  reviewers: ThreeSixtyReviewer[];
  reviewRequests: ThreeSixtyReviewRequest[];
  reviews: ThreeSixtyReview[];
  selectedReview: ThreeSixtyReview;
  selectedReviewStatus: RequestState;
  rejectedReviews: RejectedReview[];
}

const initialState: ThreeSixtyReviewState = {
  status: RequestState.IDLE,
  reviewers: [],
  reviewRequests: [],
  reviews: [],
  selectedReview: {} as ThreeSixtyReview,
  selectedReviewStatus: RequestState.IDLE,
  rejectedReviews: [],
};

export const fetchRejectedReviews = createAsyncThunk(
  "threeSixtyReview/fetchRejectedReviews",
  async ({ parCycleId }: { parCycleId: number }, { dispatch }) => {
    try {
      const response = await ApiService.getInstance().get(
        `${AppConfig.serviceUrls.parCycles}/${parCycleId}/rejected-reviews`
      );

      if (response.status === HttpStatusCode.Ok) {
        return response.data;
      } else {
        throw new Error(response.data?.message || sliceErrorMessages.threeSixtyReviewSlice.fetchReviewers);
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error, SnackMessage.error.fetchReviewers);

      dispatch(
        enqueueSnackbarMessage({
          message: errorMessage,
          type: "error",
        })
      );
      throw error;
    }
  }
);

export const fetchReviewers = createAsyncThunk(
  "threeSixtyReview/fetchReviewers",
  async ({ employeeId, parCycleId }: FetchReviewers, { dispatch }) => {
    try {
      const response = await ApiService.getInstance().get(
        `${AppConfig.serviceUrls.parCycles}/${parCycleId}/employees/${employeeId}/reviewers`
      );

      if (response.status === HttpStatusCode.Ok) {
        return response.data;
      } else {
        throw new Error(response.data?.message || sliceErrorMessages.threeSixtyReviewSlice.fetchReviewers);
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error, SnackMessage.error.fetchReviewers);

      dispatch(
        enqueueSnackbarMessage({
          message: errorMessage,
          type: "error",
        })
      );
      throw error;
    }
  }
);

export const postReviewers = createAsyncThunk(
  "threeSixtyReview/postReviewers",
  async ({ employeeId, parCycleId, reviewerEmails }: PostReviewers, { dispatch }) => {
    try {
      const response = await ApiService.getInstance().post(
        `${AppConfig.serviceUrls.parCycles}/${parCycleId}/employees/${employeeId}/reviewers`,
        {
          reviewerEmails,
        }
      );

      if (response.status === HttpStatusCode.Created) {
        dispatch(
          enqueueSnackbarMessage({
            message: SnackMessage.success.postReviewers,
            type: "success",
          })
        );
        return response.data;
      } else {
        throw new Error(response.data?.message || sliceErrorMessages.threeSixtyReviewSlice.postReviewers);
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error, SnackMessage.error.postReviewers);

      dispatch(
        enqueueSnackbarMessage({
          message: errorMessage,
          type: "error",
        })
      );
      throw error;
    }
  }
);

export const fetchRequests = createAsyncThunk(
  "threeSixtyReview/fetchRequests",
  async ({ employeeId, parCycleId }: FetchRequests, { dispatch }) => {
    try {
      const response = await ApiService.getInstance().get(
        `${AppConfig.serviceUrls.parCycles}/${parCycleId}/employees/${employeeId}/review-requests`
      );

      if (response.status === HttpStatusCode.Ok) {
        return response.data;
      } else {
        throw new Error(response.data?.message || sliceErrorMessages.threeSixtyReviewSlice.fetchReviewerRequest);
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error, SnackMessage.error.fetchReviewRequests);

      dispatch(
        enqueueSnackbarMessage({
          message: errorMessage,
          type: "error",
        })
      );
      throw error;
    }
  }
);

export const postReviews = createAsyncThunk(
  "threeSixtyReview/postReviews",
  async ({ employeeId, parCycleId, values }: PostReviews, { dispatch }) => {
    try {
      const response = await ApiService.getInstance().patch(
        `${AppConfig.serviceUrls.parCycles}/${parCycleId}/employees/${employeeId}/review`,
        values
      );

      if (response.status === HttpStatusCode.Ok) {
        return response.data;
      } else {
        throw new Error(response.data?.message || sliceErrorMessages.threeSixtyReviewSlice.postReview);
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error, SnackMessage.error.postThreeSixtyReview);

      dispatch(
        enqueueSnackbarMessage({
          message: errorMessage,
          type: "error",
        })
      );
      throw error;
    }
  }
);

export const fetchReviews = createAsyncThunk(
  "threeSixtyReview/fetchReviews",
  async ({ employeeId, parCycleId }: FetchReviews, { dispatch }) => {
    try {
      const response = await ApiService.getInstance().get(
        `${AppConfig.serviceUrls.parCycles}/${parCycleId}/employees/${employeeId}/reviews`
      );

      if (response.status === HttpStatusCode.Ok) {
        return response.data;
      } else {
        throw new Error(response.data?.message || sliceErrorMessages.threeSixtyReviewSlice.fetchReview);
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error, SnackMessage.error.fetchThreeSixtyReview);

      dispatch(
        enqueueSnackbarMessage({
          message: errorMessage,
          type: "error",
        })
      );
      throw error;
    }
  }
);

export const fetchSelectedReview = createAsyncThunk(
  "threeSixtyReview/fetchSelectedReview",
  async ({ employeeId, parCycleId }: FetchReviews, { dispatch }) => {
    try {
      const response = await ApiService.getInstance().get(
        `${AppConfig.serviceUrls.parCycles}/${parCycleId}/employees/${employeeId}/review`
      );

      if (response.status === HttpStatusCode.Ok) {
        return response.data;
      } else {
        throw new Error(response.data?.message || sliceErrorMessages.threeSixtyReviewSlice.fetchReview);
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error, SnackMessage.error.fetchSelectedThreeSixtyReview);

      dispatch(
        enqueueSnackbarMessage({
          message: errorMessage,
          type: "error",
        })
      );
      throw error;
    }
  }
);

const threeSixtyReviewSlice = createSlice({
  name: "threeSixtyReview",
  initialState,
  reducers: {
    updateSelectedReview(state, action) {
      state.selectedReview.reviewComment = action.payload.reviewComment;
      state.selectedReview.reviewRating = action.payload.reviewRating;
      state.selectedReview.reviewStatus = ParThreeSixtyReviewStatus.DRAFT;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchReviewers.pending, (state) => {
        state.status = RequestState.LOADING;
      })
      .addCase(fetchReviewers.fulfilled, (state, action) => {
        state.reviewers = action.payload as ThreeSixtyReviewer[];
        state.status = RequestState.SUCCEEDED;
      })
      .addCase(fetchReviewers.rejected, (state) => {
        state.reviewers = [];
        state.status = RequestState.FAILED;
      })
      .addCase(postReviewers.pending, (state) => {
        state.status = RequestState.LOADING;
      })
      .addCase(postReviewers.fulfilled, (state) => {
        state.status = RequestState.SUCCEEDED;
      })
      .addCase(postReviewers.rejected, (state) => {
        state.status = RequestState.FAILED;
      })
      .addCase(fetchRequests.pending, (state) => {
        state.status = RequestState.LOADING;
      })
      .addCase(fetchRequests.fulfilled, (state, action) => {
        state.reviewRequests = action.payload as ThreeSixtyReviewRequest[];
        state.status = RequestState.SUCCEEDED;
      })
      .addCase(fetchRequests.rejected, (state) => {
        state.reviewRequests = [];
        state.status = RequestState.FAILED;
      })
      .addCase(postReviews.pending, (state) => {
        state.status = RequestState.LOADING;
      })
      .addCase(postReviews.fulfilled, (state) => {
        state.status = RequestState.SUCCEEDED;
      })
      .addCase(postReviews.rejected, (state) => {
        state.status = RequestState.FAILED;
      })
      .addCase(fetchReviews.pending, (state) => {
        state.status = RequestState.LOADING;
      })
      .addCase(fetchReviews.fulfilled, (state, action) => {
        state.reviews = action.payload as ThreeSixtyReview[];
        state.status = RequestState.SUCCEEDED;
      })
      .addCase(fetchReviews.rejected, (state) => {
        state.status = RequestState.FAILED;
      })
      .addCase(fetchSelectedReview.pending, (state) => {
        state.selectedReviewStatus = RequestState.LOADING;
      })
      .addCase(fetchSelectedReview.fulfilled, (state, action) => {
        state.selectedReview.reviewRating = action.payload.reviewRating;
        state.selectedReview.reviewerEmail = action.payload.reviewerEmail;

        const reviewComment = action.payload?.reviewComment;
        if (reviewComment) {
          state.selectedReview.reviewComment = base64Regex.test(reviewComment ?? "")
            ? decodeURIComponent(atob(reviewComment ?? ""))
            : "";
        } else {
          state.selectedReview.reviewComment = "";
        }
        state.selectedReview.reviewStatus = action.payload?.reviewStatus;

        state.selectedReviewStatus = RequestState.SUCCEEDED;
      })
      .addCase(fetchSelectedReview.rejected, (state) => {
        state.selectedReview = {} as ThreeSixtyReview;
        state.selectedReviewStatus = RequestState.FAILED;
      })
      .addCase(fetchRejectedReviews.pending, (state) => {
        state.status = RequestState.LOADING;
      })
      .addCase(fetchRejectedReviews.fulfilled, (state, action) => {
        state.rejectedReviews = action.payload;
        state.status = RequestState.SUCCEEDED;
      })
      .addCase(fetchRejectedReviews.rejected, (state) => {
        state.status = RequestState.FAILED;
      });
  },
});

export const { updateSelectedReview } = threeSixtyReviewSlice.actions;

export const selectThreeSixtyReviewStatus = (state: RootState) => state.threeSixtyReview.status;
export const selectThreeSixtyReviewers = (state: RootState) => state.threeSixtyReview.reviewers;
export const selectThreeSixtyReviewRequests = (state: RootState) => state.threeSixtyReview.reviewRequests;
export const selectThreeSixtyReviews = (state: RootState) => state.threeSixtyReview.reviews;
export const selectSelectedThreeSixtyReview = (state: RootState) => state.threeSixtyReview.selectedReview;
export const selectSelectedThreeSixtyReviewStatus = (state: RootState) => state.threeSixtyReview.selectedReviewStatus;
export const selectRejectedReviews = (state: RootState) => state.threeSixtyReview.rejectedReviews;

export default threeSixtyReviewSlice.reducer;
