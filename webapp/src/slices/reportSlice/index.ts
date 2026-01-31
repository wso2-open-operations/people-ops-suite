// Copyright (c) 2024, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { RootState } from "@slices/store";
import { appConfig } from "../../config/config";
import { ParReportEntry, RequestState } from "@utils/types";
import { ApiService } from "@utils/apiService";
import { enqueueSnackbarMessage } from "@slices/commonSlice/common";
import { sliceErrorMessages, snackMessages } from "@config/constant";
import { HttpStatusCode } from "axios";
import { getErrorMessage } from "@utils/utils";

interface reportState {
  ratings: ParReportEntry[];
  status: RequestState;
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
        `${appConfig.serviceUrls.parCycles}/${parCycleId}/par-ratings`
      );
      if (resp.status === HttpStatusCode.Ok) {
        return resp.data;
      } else {
        throw new Error(
          resp.data?.message || sliceErrorMessages.reportSlice.fetchReport
        );
      }
    } catch (error) {
      const errorMessage = getErrorMessage(
        error,
        snackMessages.error.fetchReportData
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

export const fetchDirectAndIndirectReports = createAsyncThunk(
  "report/fetchDirectAndIndirectReportData",
  async (
    { parCycleId, leadEmail }: { parCycleId: number; leadEmail: string },
    { dispatch }
  ) => {
    try {
      const resp = await ApiService.getInstance().get(
        `${appConfig.serviceUrls.parCycles}/${parCycleId}/reports?leadEmail=${leadEmail}`
      );
      if (resp.status === HttpStatusCode.Ok) {
        return resp.data;
      } else {
        throw new Error(
          resp.data?.message || sliceErrorMessages.reportSlice.fetchReport
        );
      }
    } catch (error) {
      const errorMessage = getErrorMessage(
        error,
        snackMessages.error.fetchReportData
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

export const fetchDirectEmployeePars = createAsyncThunk(
  "report/fetchDirectEmployeePars",
  async ({ parCycleId, leadEmail }: { parCycleId: number; leadEmail: string }, { dispatch }) => {
    try {
      const resp = await ApiService.getInstance().get(
        `${appConfig.serviceUrls.parCycles}/${parCycleId}/report-levels?leadEmail=${leadEmail}`
      );
      if (resp.status === HttpStatusCode.Ok) {
        return resp.data;
      } else {
        throw new Error(resp.data?.message || sliceErrorMessages.reportSlice.fetchReport);
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error, snackMessages.error.fetchReportData);

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
