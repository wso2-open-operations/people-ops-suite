// Copyright (c) 2024, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import { PayloadAction, createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { RootState } from "@slices/store";
import {
  RequestState,
} from "@utils/types";
import { AppConfig } from "@config/config";
import { enqueueSnackbarMessage } from "@slices/commonSlice/common";
import { ApiService } from "@utils/apiService";
import { SnackMessage, uiMessages } from "@config/constant";
import { HttpStatusCode } from "axios";
import { getErrorMessage } from "@utils/utils";
import { sliceErrorMessages } from "@config/constant";

interface UpdateOpenParCycleRequest {
  parCycleId: number;
  values: {
    parCycleStartDate: string;
    parCycleEndDate: string;
    parEvaluationEndDate: string;
    parEmployeeDeadline: string;
    parThreeSixtyRatingDeadline: string;
    parLeadDeadline: string;
    parSpecialRatingDeadline: string;
    parCycleConfigurations: {
      employeeParQuestion: string;
      threeSixtyReviewQuestion: string;
    };
  };
}

export interface ParCycle {
  parCycleId: number;
  parCycleName: string;
  parCycleStartDate: string;
  parCycleEndDate: string;
  parEvaluationStartDate: string;
  parEvaluationEndDate: string;
  parEmployeeDeadline: string;
  parThreeSixtyRatingDeadline: string;
  parLeadDeadline: string;
  parSpecialRatingDeadline: string;
  parF2FDeadline: string;
  parCycleStatus: string;
  parCycleConfigurations: ParConfigurations;
}

export enum ParCycleStatus {
  PENDING = "PENDING",
  OPEN = "OPEN",
  CLOSED = "CLOSED",
  PENDING_QUOTA = "PENDING_QUOTA",
}

export interface ParConfigurations {
  employeeParQuestion: string;
  threeSixtyReviewQuestion: string;
  parRatings: string[];
  threeSixtyReviewRatings: string[];
}

export type ParCycleSummary = Omit<
  ParCycle,
  | "parEmployeeDeadline"
  | "parThreeSixtyRatingDeadline"
  | "parLeadDeadline"
  | "parSpecialRatingDeadline"
  | "parCycleConfigurations"
>;

export interface ParCycleState {
  state: RequestState;
  stateMessage: string;
  isParCycleOngoing: boolean;
  currentCycle: Partial<ParCycle>;
  allCycles: ParCycleSummary[];
  isQuotaPending: string;
}

const initialState: ParCycleState = {
  state: RequestState.IDLE, // State of async operations
  stateMessage: "", // State message for async operations
  isParCycleOngoing: false, // Current cycle state
  currentCycle: {}, // Object with current cycle details
  allCycles: [], // List of past PAR cycles
  isQuotaPending: "", // Get the quota pending status
};

export const fetchQuotaPendingParCycle = createAsyncThunk(
  "parCycle/fetchQuotaPendingParCycle",
  async (_, { dispatch }) => {
    try {
      const response = await ApiService.getInstance().get(
        `${AppConfig.serviceUrls.parCycles}?status=${ParCycleStatus.PENDING_QUOTA}`
      );

      if (response.status === HttpStatusCode.Ok) {
        if (response.data.length === 0) {
          return {
            currentCycle: {},
          };
        } else {
          const parCycleId = response.data[0].parCycleId;
          const currentCycle = await dispatch(fetchParCycleById(parCycleId));
          return {
            currentCycle: currentCycle.payload,
          };
        }
      } else {
        throw new Error(
          response.data?.message ||
            sliceErrorMessages.parCycleSlice.fetchQuotaCycle
        );
      }
    } catch (error) {
      const errorMessage = getErrorMessage(
        error,
        SnackMessage.error.fetchRequestedCycleDetails
      );

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

export const fetchOpenParCycle = createAsyncThunk(
  "parCycle/fetchOpenParCycle",
  async (_, { dispatch }) => {
    try {
      const response = await ApiService.getInstance().get(
        `${AppConfig.serviceUrls.parCycles}?status=${ParCycleStatus.OPEN}`
      );

      if (response.status === HttpStatusCode.Ok) {
        if (response.data.length === 0) {
          return {
            isParCycleOngoing: false,
            currentCycle: {},
          };
        } else {
          const parCycleId = response.data[0].parCycleId;
          const currentCycle = await dispatch(fetchParCycleById(parCycleId));
          return {
            isParCycleOngoing: true,
            currentCycle: currentCycle.payload,
          };
        }
      } else {
        throw new Error(
          response.data?.message ||
            sliceErrorMessages.parCycleSlice.fetchOpenCycle
        );
      }
    } catch (error) {
      const errorMessage = getErrorMessage(
        error,
        SnackMessage.error.fetchRequestedCycleDetails
      );

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

export const fetchPendingParCycle = createAsyncThunk(
  "parCycle/fetchPendingParCycle",
  async (_, { dispatch }) => {
    try {
      const response = await ApiService.getInstance().get(
        `${AppConfig.serviceUrls.parCycles}?status=${ParCycleStatus.PENDING}`
      );

      if (response.status === HttpStatusCode.Ok) {
        return response.data;
      } else {
        throw new Error(
          response.data?.message ||
            sliceErrorMessages.parCycleSlice.fetchPendingCycle
        );
      }
    } catch (error) {
      const errorMessage = getErrorMessage(
        error,
        SnackMessage.error.fetchRequestedCycleDetails
      );

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

export const fetchClosedParCycles = createAsyncThunk(
  "parCycle/fetchClosedParCycles",
  async (_, { dispatch }) => {
    try {
      const response = await ApiService.getInstance().get(
        `${AppConfig.serviceUrls.parCycles}?status=${ParCycleStatus.CLOSED}`
      );

      if (response.status === HttpStatusCode.Ok) {
        return response.data;
      } else {
        throw new Error(
          response.data?.message ||
            sliceErrorMessages.parCycleSlice.fetchPendingCycle
        );
      }
    } catch (error) {
      const errorMessage = getErrorMessage(
        error,
        SnackMessage.error.fetchRequestedCycleDetails
      );

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

export const fetchParCycleById = createAsyncThunk(
  "parCycle/fetchParCycleById",
  async (parCycleId: number, { dispatch }) => {
    try {
      dispatch(updateStateMessage(uiMessages.loading.fetchCurrentCycleDetails));
      const response = await ApiService.getInstance().get(
        `${AppConfig.serviceUrls.parCycles}/${parCycleId}`
      );

      if (response.status === HttpStatusCode.Ok) {
        return response.data;
      } else {
        throw new Error(
          response.data?.message || sliceErrorMessages.parCycleSlice.fetchCycle
        );
      }
    } catch (error) {
      const errorMessage = getErrorMessage(
        error,
        SnackMessage.error.fetchRequestedCycleDetails
      );

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

export const createParCycle = createAsyncThunk(
  "parCycle/createParCycle",
  async (
    values: Omit<ParCycle, "parCycleId" | "parCycleStatus">,
    { dispatch }
  ) => {
    try {
      dispatch(updateStateMessage(uiMessages.loading.parCycleCreation));
      const response = await ApiService.getInstance().post(
        AppConfig.serviceUrls.parCycles,
        values
      );

      if (response.status === HttpStatusCode.Created) {
        dispatch(
          enqueueSnackbarMessage({
            message: SnackMessage.success.parCycleCreation,
            type: "success",
          })
        );
        return response.data;
      } else {
        throw new Error(
          response.data?.message || sliceErrorMessages.parCycleSlice.fetchCycle
        );
      }
    } catch (error) {
      const errorMessage = getErrorMessage(
        error,
        SnackMessage.error.parCycleCreation
      );

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

export const updateParCycle = createAsyncThunk(
  "parCycle/updateParCycle",
  async ({ parCycleId, values }: UpdateOpenParCycleRequest, { dispatch }) => {
    try {
      dispatch(updateStateMessage(uiMessages.loading.parCycleCreation));
      const response = await ApiService.getInstance().patch(
        `${AppConfig.serviceUrls.parCycles}/${parCycleId}`,
        values
      );

      if (response.status === HttpStatusCode.Ok) {
        dispatch(
          enqueueSnackbarMessage({
            message: SnackMessage.success.parCycleUpdate,
            type: "success",
          })
        );
        return response.data;
      } else {
        throw new Error(
          response.data?.message || sliceErrorMessages.parCycleSlice.postCycle
        );
      }
    } catch (error) {
      const errorMessage = getErrorMessage(
        error,
        SnackMessage.error.parCycleUpdate
      );

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

export const openParCycle = createAsyncThunk(
  "parCycle/openParCycle",
  async (parCycleId: number, { dispatch }) => {
    try {
      const response = await ApiService.getInstance().patch(
        `${AppConfig.serviceUrls.parCycles}/${parCycleId}`,
        {
          parCycleStatus: ParCycleStatus.OPEN,
        }
      );

      if (response.status === HttpStatusCode.Ok) {
        dispatch(
          enqueueSnackbarMessage({
            message: SnackMessage.success.parCycleUpdate,
            type: "success",
          })
        );
        return response.data;
      } else {
        throw new Error(
          response.data?.message || sliceErrorMessages.parCycleSlice.postCycle
        );
      }
    } catch (error) {
      const errorMessage = getErrorMessage(
        error,
        SnackMessage.error.parCycleClosing
      );

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

export const closeParCycle = createAsyncThunk(
  "parCycle/closeParCycle",
  async (parCycleId: number, { dispatch }) => {
    try {
      const response = await ApiService.getInstance().patch(
        `${AppConfig.serviceUrls.parCycles}/${parCycleId}`,
        {
          parCycleStatus: ParCycleStatus.CLOSED,
        }
      );

      if (response.status === HttpStatusCode.Ok) {
        dispatch(
          enqueueSnackbarMessage({
            message: SnackMessage.success.parCycleClosing,
            type: "success",
          })
        );
        return response.data;
      } else {
        throw new Error(
          response.data?.message || sliceErrorMessages.parCycleSlice.postCycle
        );
      }
    } catch (error) {
      const errorMessage = getErrorMessage(
        error,
        SnackMessage.error.parCycleClosing
      );

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

const parCycleSlice = createSlice({
  name: "parCycle",
  initialState,
  reducers: {
    updateStateMessage: (state, action: PayloadAction<string>) => {
      state.stateMessage = action.payload;
    },
    resetOngoingParCycleState: (state) => {
      state.isParCycleOngoing = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOpenParCycle.pending, (state) => {
        state.state = RequestState.LOADING;
      })
      .addCase(fetchOpenParCycle.fulfilled, (state, action) => {
        state.state = RequestState.SUCCEEDED;
        state.isParCycleOngoing = action.payload.isParCycleOngoing;
        state.currentCycle = action.payload.currentCycle;
      })
      .addCase(fetchOpenParCycle.rejected, (state) => {
        state.state = RequestState.FAILED;
      })
      .addCase(fetchParCycleById.pending, (state) => {
        state.state = RequestState.LOADING;
      })
      .addCase(fetchParCycleById.fulfilled, (state, action) => {
        state.state = RequestState.SUCCEEDED;
        state.currentCycle = action.payload;
      })
      .addCase(fetchParCycleById.rejected, (state) => {
        state.state = RequestState.FAILED;
      })
      .addCase(fetchClosedParCycles.pending, (state) => {
        state.state = RequestState.LOADING;
      })
      .addCase(fetchClosedParCycles.fulfilled, (state, action) => {
        state.state = RequestState.SUCCEEDED;
        state.allCycles = action.payload.reverse();
      })
      .addCase(fetchClosedParCycles.rejected, (state) => {
        state.state = RequestState.FAILED;
      })
      .addCase(fetchQuotaPendingParCycle.pending, (state) => {
        state.state = RequestState.LOADING;
      })
      .addCase(fetchQuotaPendingParCycle.fulfilled, (state, action) => {
        state.state = RequestState.SUCCEEDED;
        state.currentCycle = action.payload.currentCycle;
        state.isQuotaPending = action.payload.currentCycle.parCycleStatus;
      })
      .addCase(fetchQuotaPendingParCycle.rejected, (state) => {
        state.state = RequestState.FAILED;
      });
  },
});

export const selectIsParCycleOngoing = (state: RootState) =>
  state.parCycle.isParCycleOngoing;
export const selectCurrentCycle = (state: RootState) =>
  state.parCycle.currentCycle;
export const selectAllCycles = (state: RootState) => state.parCycle.allCycles;
export const selectParCycleState = (state: RootState) => state.parCycle.state;
export const selectIsQuotaPending = (state: RootState) =>
  state.parCycle.isQuotaPending;

export const { updateStateMessage, resetOngoingParCycleState } =
  parCycleSlice.actions;

export default parCycleSlice.reducer;
