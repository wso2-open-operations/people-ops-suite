// Copyright (c) 2024, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import {
  ParCycleStatus,
  ParCycleSummary,
} from "@slices/parCycleSlice/parCycle";
import { ParThreeSixtyReviewStatus} from "@slices/threeSixtyReviewSlice/threeSixtyReview";
import { RequestState } from "@root/src/utils/types";
import { HttpStatusCode } from "axios";
import { RootState } from "@slices/store";
import { getErrorMessage } from "@utils/utils";
import { ApiService } from "@utils/apiService";
import { base64Regex } from "../../config/constant";
import { AppConfig, ServiceBaseUrl } from "../../config/config";
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { enqueueSnackbarMessage } from "@slices/commonSlice/common";
import { sliceErrorMessages, SnackMessage } from "@config/constant";

interface EmployeeState {
  ratingStatus: RequestState;
  reviewStatus: RequestState;
  empPreviousCyclesStatus: RequestState;
  parRating: ParRating;
  reviews: ThreeSixtyReview[];
  empPreviousCycles: ParCycleSummary[];
  parHistorySummary: ParRatingSummary[];
}

export interface ParRating {
  parRatingId: number;
  parEmployeeEmail: string;
  parEmployeeName: string;
  parEmployeeComment: string;
  parEmployeeStatus: ParEmployeeStatus;
  parF2fStatus: ParF2fStatus;
  parF2fDate: string;
  parRating?: string;
  parSpecialRating?: ParSpecialRating;
  parLeadEmail?: string;
  parLeadComment?: string;
  parLeadStatus?: ParLeadStatus;
  parAdminComment?: string;
  parTeam?: string;
  parDepartment?: string;
  parBusinessUnit?: string;
  parSubTeam?: string;
  parRatingSharedBy?: string;
  parPerformanceNoticeAck?: string;
}

export enum ParF2fStatus {
  PENDING = "PENDING",
  SCHEDULED = "SCHEDULED",
  COMPLETED = "COMPLETED",
}

export enum ParSpecialRating {
  TOP_FIVE_PERCENT = "TOP5P",
  TOP_TWENTY_PERCENT = "TOP20P",
  NONE = "NOT_ASSIGNED",
}

export interface ParRatingSummary {
  parSharedBy: string;
  parCycleId: number;
  parCycleName: string;
  parCycleStartDate: string;
  parCycleEndDate: string;
  parUpdatedOn: string;
  parEmployeeStatus: ParEmployeeStatus;
  parLeadStatus: ParLeadStatus;
  parLeadEmail: string;
  parCycleStatus: ParCycleStatus;
}

export enum ParLeadStatus {
  PENDING = "PENDING",
  DRAFT = "DRAFT",
  SHARED = "SHARED",
}

export enum ParEmployeeStatus {
  PENDING = "PENDING",
  DRAFT = "DRAFT",
  SHARED = "SHARED",
  SHARED_BLOCKED = "SHARED_BLOCKED",
}

export const parRatingNotAssigned = "NOT_ASSIGNED";

export interface ThreeSixtyReview {
  reviewerEmail: string;
  reviewRating: string;
  reviewComment?: string;
  reviewStatus?: ParThreeSixtyReviewStatus;
}

const initialState: EmployeeState = {
  ratingStatus: RequestState.IDLE,
  reviewStatus: RequestState.IDLE,
  empPreviousCyclesStatus: RequestState.IDLE,
  parRating: {} as ParRating,
  reviews: [],
  empPreviousCycles: [],
  parHistorySummary: [],
};

interface FetchEmployeeRatingsParams {
  employeeId: string;
  parCycleId: number | null;
}

interface FetchReviews {
  employeeId: string;
  parCycleId: number;
}

export const fetchHistoryParRatingOfEmployee = createAsyncThunk(
  "employee/fetchHistoryParRatingOfEmployee",
  async ({ employeeId, parCycleId }: FetchEmployeeRatingsParams, { dispatch }) => {
    try {
      const response = await ApiService.getInstance().get(
        `${AppConfig.serviceUrls.parCycles}/${parCycleId}/employees/${employeeId}/par-ratings`
      );

      if (response.status === HttpStatusCode.Ok) {
        const parRating = response.data;
        ["parEmployeeComment", "parLeadComment", "parAdminComment"].forEach((commentKey) => {
          if (base64Regex.test(parRating[commentKey])) {
            parRating[commentKey] = decodeURIComponent(atob(parRating[commentKey]));
          } else {
            parRating[commentKey] = "";
          }
        });

        return parRating;
      } else {
        throw new Error(response.data?.message || sliceErrorMessages.employeeSlice.getEmployeeRating);
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error, SnackMessage.error.fetchEmployeeParRatings);
      dispatch(enqueueSnackbarMessage({ message: errorMessage, type: "error" }));
      throw error;
    }
  }
);

export const fetchHistoryReviews = createAsyncThunk(
  "threeSixtyReview/fetchHistoryReviews",
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
      dispatch(enqueueSnackbarMessage({ message: errorMessage, type: "error" }));
      throw error;
    }
  }
);

export const fetchParticipatedParCyclesOfEmployee = createAsyncThunk(
  "employee/fetchParticipatedParCycleOfEmployee",
  async (args: { email?: string; status?: ParCycleStatus } | void, { dispatch }) => {
    try {
      const response = await ApiService.getInstance().get(
        `${AppConfig.serviceUrls.parCycles}?status=${args?.status ?? ParCycleStatus.CLOSED}${
          args?.email ? `&email=${encodeURIComponent(args.email)}` : ""
        }`
      );

      if (response.status === HttpStatusCode.Ok) {
        return response.data;
      } else {
        throw new Error(response.data?.message || sliceErrorMessages.employeeSlice.getEmployee);
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error, SnackMessage.error.fetchEmployeeParCycles);

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

export const fetchParRatingSummary = createAsyncThunk(
  "employee/fetchParRatingSummary",
  async (employeeEmail: string, { dispatch }) => {
    try {
      const response = await ApiService.getInstance().get(`${ServiceBaseUrl}/par-ratings/summary/${employeeEmail}`);

      if (response.status === HttpStatusCode.Ok) {
        return response.data;
      } else {
        throw new Error(response.data?.message || sliceErrorMessages.employeeSlice.postEmployeeRating);
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error, SnackMessage.error.fetchReportData);
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

const employeeHistorySlice = createSlice({
  name: "employeeHistory",
  initialState,
  reducers: {
    resetEmpReviewHistorySate(state) {
      state.reviewStatus = RequestState.IDLE;
    },
    resetEmpRatingHistorySate(state) {
      state.ratingStatus = RequestState.IDLE;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchHistoryParRatingOfEmployee.pending, (state) => {
        state.ratingStatus = RequestState.LOADING;
      })
      .addCase(fetchHistoryParRatingOfEmployee.fulfilled, (state, action) => {
        state.parRating = action.payload as ParRating;
        state.ratingStatus = RequestState.SUCCEEDED;
      })
      .addCase(fetchHistoryParRatingOfEmployee.rejected, (state) => {
        state.ratingStatus = RequestState.FAILED;
        state.parRating = {} as ParRating;
      })
      .addCase(fetchHistoryReviews.pending, (state) => {
        state.reviewStatus = RequestState.LOADING;
      })
      .addCase(fetchHistoryReviews.fulfilled, (state, action) => {
        state.reviews = action.payload as ThreeSixtyReview[];
        state.reviewStatus = RequestState.SUCCEEDED;
      })
      .addCase(fetchHistoryReviews.rejected, (state) => {
        state.reviewStatus = RequestState.FAILED;
      })
      .addCase(fetchParticipatedParCyclesOfEmployee.pending, (state) => {
        state.empPreviousCyclesStatus = RequestState.LOADING;
      })
      .addCase(fetchParticipatedParCyclesOfEmployee.fulfilled, (state, action) => {
        state.empPreviousCycles = action.payload;
        state.empPreviousCyclesStatus = RequestState.SUCCEEDED;
      })
      .addCase(fetchParticipatedParCyclesOfEmployee.rejected, (state) => {
        state.empPreviousCycles = [];
        state.empPreviousCyclesStatus = RequestState.FAILED;
      })
      .addCase(fetchParRatingSummary.rejected, (state) => {
        state.ratingStatus = RequestState.FAILED;
      })
      .addCase(fetchParRatingSummary.pending, (state) => {
        state.ratingStatus = RequestState.LOADING;
      })
      .addCase(fetchParRatingSummary.fulfilled, (state, action) => {
        state.ratingStatus = RequestState.SUCCEEDED;
        state.parHistorySummary = action.payload;
      });
  },
});

export const selectEmployeeHistoryRatingStatus = (state: RootState) => state.employeeHistorySlice.ratingStatus;
export const selectEmployeeHistoryRating = (state: RootState) => state.employeeHistorySlice.parRating;
export const selectEmployeeHistoryReviewStatus = (state: RootState) => state.employeeHistorySlice.reviewStatus;
export const selectEmployeeHistoryReviews = (state: RootState) => state.employeeHistorySlice.reviews;
export const selectParticipatedParCyclesOfEmployee = (state: RootState) => state.employeeHistorySlice.empPreviousCycles;
export const selectParticipatedParCyclesOfEmployeeState = (state: RootState) =>
  state.employeeHistorySlice.empPreviousCyclesStatus;
export const selectSummarizedParHistory = (state: RootState) => state.employeeHistorySlice.parHistorySummary;

export default employeeHistorySlice.reducer;
export const { resetEmpReviewHistorySate, resetEmpRatingHistorySate } = employeeHistorySlice.actions;
