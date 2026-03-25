// Copyright (c) 2024, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { HttpStatusCode } from "axios";

import { SnackMessage, sliceErrorMessages } from "@config/constant";
import { enqueueSnackbarMessage } from "@slices/commonSlice/common";
import {
  ParEmployeeStatus,
  ParF2fStatus,
  ParLeadStatus,
  ParSpecialRating,
} from "@slices/employeeHistorySlice/employeeHistory";
import { RootState } from "@slices/store";
import { ApiService } from "@utils/apiService";
import { RequestState } from "@utils/types";
import { getErrorMessage } from "@utils/utils";

import { AppConfig } from "../../config/config";

interface reportState {
  ratings: ParReportEntry[];
  status: RequestState;
}

export interface ParReportEntry {
  parRatingId: number;
  parCycleId: number;
  parEmployeeEmail: string;
  parEmployeeName: string;
  parCompany: string;
  parLocation: string;
  parBusinessUnit: string;
  parDepartment: string;
  parTeam: string;
  parSubTeam: string;
  parLeadEmail: string;
  parRating: string;
  parSpecialRating: ParSpecialRating;
  parEmployeeStatus: ParEmployeeStatus;
  parLeadStatus: ParLeadStatus;
  parF2fStatus: ParF2fStatus;
  parEmployeeAcceptanceStatus: string;
  parDirectLead?: string;
  reportingType?: string;
  isEmployeeALead?: string;
}

const initialState: reportState = {
  ratings: [],
  status: RequestState.IDLE,
};

export const fetchReportData = createAsyncThunk(
  "report/fetchReportData",
  async (parCycleId: number, { dispatch }) => {
    try {
      const resp = await ApiService.getInstance().get(
        `${AppConfig.serviceUrls.parCycles}/${parCycleId}/par-ratings`,
      );
      if (resp.status === HttpStatusCode.Ok) {
        return resp.data;
      } else {
        throw new Error(resp.data?.message || sliceErrorMessages.reportSlice.fetchReport);
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error, SnackMessage.error.fetchReportData);

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

export const fetchDirectAndIndirectReports = createAsyncThunk(
  "report/fetchDirectAndIndirectReportData",
  async ({ parCycleId, leadEmail }: { parCycleId: number; leadEmail: string }, { dispatch }) => {
    try {
      const resp = await ApiService.getInstance().get(
        `${AppConfig.serviceUrls.parCycles}/${parCycleId}/reports?leadEmail=${leadEmail}`,
      );
      if (resp.status === HttpStatusCode.Ok) {
        return resp.data;
      } else {
        throw new Error(resp.data?.message || sliceErrorMessages.reportSlice.fetchReport);
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error, SnackMessage.error.fetchReportData);

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

export const fetchDirectEmployeePars = createAsyncThunk(
  "report/fetchDirectEmployeePars",
  async ({ parCycleId, leadEmail }: { parCycleId: number; leadEmail: string }, { dispatch }) => {
    try {
      const resp = await ApiService.getInstance().get(
        `${AppConfig.serviceUrls.parCycles}/${parCycleId}/report-levels?leadEmail=${leadEmail}`,
      );
      if (resp.status === HttpStatusCode.Ok) {
        return resp.data;
      } else {
        throw new Error(resp.data?.message || sliceErrorMessages.reportSlice.fetchReport);
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error, SnackMessage.error.fetchReportData);

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

const reportSlice = createSlice({
  name: "report",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchReportData.pending, (state) => {
        state.status = RequestState.LOADING;
      })
      .addCase(fetchReportData.fulfilled, (state, action) => {
        state.ratings = action.payload;
        state.status = RequestState.SUCCEEDED;
      })
      .addCase(fetchReportData.rejected, (state) => {
        state.status = RequestState.FAILED;
      })
      .addCase(fetchDirectAndIndirectReports.pending, (state) => {
        state.status = RequestState.LOADING;
      })
      .addCase(fetchDirectAndIndirectReports.fulfilled, (state, action) => {
        state.ratings = action.payload;
        state.status = RequestState.SUCCEEDED;
      })
      .addCase(fetchDirectAndIndirectReports.rejected, (state) => {
        state.status = RequestState.FAILED;
      })
      .addCase(fetchDirectEmployeePars.pending, (state) => {
        state.status = RequestState.LOADING;
      })
      .addCase(fetchDirectEmployeePars.fulfilled, (state, action) => {
        state.ratings = action.payload;
        state.status = RequestState.SUCCEEDED;
      })
      .addCase(fetchDirectEmployeePars.rejected, (state) => {
        state.status = RequestState.FAILED;
      });
  },
});

export const selectReportData = (state: RootState) => state.report.ratings;
export const selectReportStatus = (state: RootState) => state.report.status;
export const selectDirectEmployeePars = (state: RootState) => state.report.ratings;

export default reportSlice.reducer;
