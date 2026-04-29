// Copyright (c) 2024, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.
import { PayloadAction, createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios, { HttpStatusCode } from "axios";

import { SnackMessage } from "@config/constant";
import { sliceErrorMessages } from "@config/constant";
import { enqueueSnackbarMessage } from "@slices/commonSlice/common";
import { RootState } from "@slices/store";
import { ApiService } from "@utils/apiService";
import { RequestState } from "@utils/types";
import { getErrorMessage } from "@utils/utils";

import { AppConfig } from "../../config/config";

interface QuotaState {
  status: RequestState;
  quotaGroups: SpecialQuotaTeam[];
  savedQuotaGroups: ParSpecialRatingQuotaGroups[];
  stateMessage: string;
  specialRatingAllocation: SpecialRatingAllocation[];
}

export interface ParSpecialRatingQuotaGroups {
  parCycleId: number;
  parSpecialRatingGroups: PostSpecialQuotaTeam[];
  specialRatingQuotas: SpecialRatingQuota[];
}

export interface SpecialRatingQuota {
  specialRatingQuotaId: number;
  specialRatingQuotaName: string;
  top5pQuota: number;
  top20pQuota: number;
  allocatedLeads: string[];
}

export interface PostSpecialQuotaTeam {
  parCycleId: number;
  specialRatingGroupId: number;
  businessUnit: string;
  department: string;
  team: string;
  specialRatingQuotaId: number;
}

export interface SpecialQuotaTeam {
  parCycleId: number;
  specialRatingGroupId: number;
  businessUnit: string;
  department: string;
  team: string;
  headCount: number | null;
  groupNumber: number | null;
  specialRatingQuotaId: number | null;
}

export interface SpecialRatingAllocation {
  parQuotaId: number;
  parTop5Quota: number;
  parTop20Quota: number;
  parSpecialQuotaName: string;
  parDepartment: string;
  parBusinessUnit: string;
  parTeam: string;
  highlight?: boolean;
}

const initialState: QuotaState = {
  status: RequestState.IDLE,
  quotaGroups: [],
  savedQuotaGroups: [],
  stateMessage: "",
  specialRatingAllocation: [],
};

interface GetGroupRequest {
  parCycleId: number;
  signal: AbortSignal;
}

export const postQuotaGroups = createAsyncThunk(
  "specialQuota/postQuotaGroups",
  async (
    { parCycleId, parSpecialRatingGroups, specialRatingQuotas }: ParSpecialRatingQuotaGroups,
    { dispatch },
  ) => {
    try {
      const response = await ApiService.getInstance().post(
        `${AppConfig.serviceUrls.parCycles}/${parCycleId}/special-rating-groups-quota`,
        {
          parSpecialRatingGroups,
          specialRatingQuotas,
        },
      );
      if (response.status === HttpStatusCode.Ok || response.status === HttpStatusCode.Created) {
        dispatch(
          enqueueSnackbarMessage({
            message: SnackMessage.success.quotaSaved,
            type: "success",
          }),
        );
        return response.data;
      } else {
        throw new Error(response.data?.message || sliceErrorMessages.specialQuotaSlice.postGroups);
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error, SnackMessage.error.common);
      dispatch(
        enqueueSnackbarMessage({
          message: errorMessage,
          type: "error",
        }),
      );
      throw error;
    }
  },
);

export const fetchQuotaGroups = createAsyncThunk(
  "specialQuota/fetchQuotaGroups",
  async ({ parCycleId, signal }: GetGroupRequest, { dispatch }) => {
    try {
      const url = `${AppConfig.serviceUrls.parCycles}/${parCycleId}/special-rating-groups`;
      const resp = await ApiService.getInstance().get(url, { signal });
      if (resp.status === HttpStatusCode.Ok) {
        return resp.data;
      } else {
        throw new Error(resp.data?.message || sliceErrorMessages.specialQuotaSlice.fetchGroups);
      }
    } catch (error) {
      if (axios.isCancel(error)) {
        return "Request canceled";
      }
      const errorMessage = getErrorMessage(error, SnackMessage.error.fetchQuotaData);

      dispatch(
        enqueueSnackbarMessage({
          message: errorMessage,
          type: "error",
        }),
      );
      throw error;
    }
  },
);

export const fetchQuotaGroupRatings = createAsyncThunk(
  "specialQuota/fetchQuotaGroupRatings",
  async ({ parCycleId, leadEmail }: { parCycleId: number; leadEmail?: string }, { dispatch }) => {
    try {
      let url = `${AppConfig.serviceUrls.parCycles}/${parCycleId}/special-rating-groups-quota`;

      if (leadEmail) {
        const encodedEmail = encodeURIComponent(leadEmail);
        url += `?leadEmail=${encodedEmail}`;
      }
      const resp = await ApiService.getInstance().get(url);
      if (resp.status === HttpStatusCode.Ok) {
        return resp.data;
      } else {
        throw new Error(resp.data?.message || sliceErrorMessages.specialQuotaSlice.fetchGroups);
      }
    } catch (error) {
      if (axios.isCancel(error)) {
        return "Request canceled";
      }
      const errorMessage = getErrorMessage(error, SnackMessage.error.fetchQuotaData);

      dispatch(
        enqueueSnackbarMessage({
          message: errorMessage,
          type: "error",
        }),
      );
      throw error;
    }
  },
);

const specialQuotaSlice = createSlice({
  name: "specialQuota",
  initialState,
  reducers: {
    updateStateMessage: (state, action: PayloadAction<string>) => {
      state.stateMessage = action.payload;
    },
    resetQuotaSate(state) {
      state.status = RequestState.IDLE;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchQuotaGroups.pending, (state) => {
        state.status = RequestState.LOADING;
        state.stateMessage = "Fetching quota groups...";
      })
      .addCase(fetchQuotaGroups.fulfilled, (state, action) => {
        state.status = RequestState.SUCCEEDED;
        state.quotaGroups = action.payload;
        state.stateMessage = "Successfully fetched quota groups";
      })
      .addCase(fetchQuotaGroups.rejected, (state) => {
        state.status = RequestState.FAILED;
        state.stateMessage = "Failed to fetch Quota groups!";
      })
      .addCase(postQuotaGroups.pending, (state) => {
        state.status = RequestState.LOADING;
        state.stateMessage = "Creating special rating groups...";
      })
      .addCase(postQuotaGroups.fulfilled, (state, action) => {
        state.savedQuotaGroups = action.payload;
        state.status = RequestState.SUCCEEDED;
        state.stateMessage = "Special rating groups created successfully !";
      })
      .addCase(postQuotaGroups.rejected, (state) => {
        state.status = RequestState.FAILED;
        state.stateMessage = "Failed to create special rating groups!";
      })
      .addCase(fetchQuotaGroupRatings.pending, (state) => {
        state.status = RequestState.LOADING;
        state.stateMessage = "Fetching quota allocations...";
      })
      .addCase(fetchQuotaGroupRatings.fulfilled, (state, action) => {
        state.status = RequestState.SUCCEEDED;
        state.specialRatingAllocation = action.payload;
        state.stateMessage = "Successfully fetched quota allocations";
      })
      .addCase(fetchQuotaGroupRatings.rejected, (state) => {
        state.status = RequestState.FAILED;
        state.stateMessage = "Failed to fetch Quota allocations!";
      });
  },
});

export const selectQuotaGroups = (state: RootState) => state.specialQuota.quotaGroups;
export const selectQuotaGroupsStatus = (state: RootState) => state.specialQuota.status;
export const selectSavedQuotaGroups = (state: RootState) => state.specialQuota.savedQuotaGroups;
export const selectSpecialRatingAllocation = (state: RootState) =>
  state.specialQuota.specialRatingAllocation;

export default specialQuotaSlice.reducer;
export const { updateStateMessage, resetQuotaSate } = specialQuotaSlice.actions;
