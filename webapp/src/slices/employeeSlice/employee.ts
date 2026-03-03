// Copyright (c) 2024, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { RootState } from "@slices/store";
import { AppConfig } from "../../config/config";
import { ParCycleStatus, RequestState } from "@utils/types";
import { ParCycleSummary } from "@slices/parCycleSlice/parCycle";
import { ParEmployeeStatus , ParLeadStatus, ParRating, ParSpecialRating, ParF2fStatus } from "../employeeHistorySlice/employeeHistory";
import { ApiService } from "@utils/apiService";
import { enqueueSnackbarMessage } from "@slices/commonSlice/common";
import { sliceErrorMessages, SnackMessage } from "@config/constant";
import { HttpStatusCode } from "axios";
import { fetchParCycleById } from "@slices/parCycleSlice/parCycle";
import { base64Regex } from "../../config/constant";
import { getErrorMessage } from "@utils/utils";

interface EmployeeState {
  status: RequestState;
  previousCycles: ParCycleSummary[];
  currentCycleOfEmployee: Partial<ParCycleSummary>;
  selectedRating: ParRating;
  ratingStatus: RequestState;
  errorMessage: string;
}

const initialState: EmployeeState = {
  status: RequestState.IDLE,
  previousCycles: [],
  currentCycleOfEmployee: {},
  ratingStatus: RequestState.IDLE,
  selectedRating: {} as ParRating,
  errorMessage: "",
};

interface FetchEmployeeRatingsParams {
  employeeId: string;
  parCycleId: number | null;
}

interface UpdateEmployeeRatingsParams {
  employeeId: string | null;
  parCycleId: number | null | undefined;
  parRatingId: number | null;
  values: {
    parEmployeeComment?: string;
    parEmployeeStatus?: ParEmployeeStatus;
    parLeadStatus?: ParLeadStatus;
    parLeadComment?: string;
    parAdminComment?: string;
    parRating?: string;
    parSpecialRating?: ParSpecialRating;
    parF2fStatus?: ParF2fStatus;
    parF2fDate?: string;
  };
}
interface UpdateParTeamIdParam {
  employeeId: string;
  parCycleId: number;
}

export const fetchCurrentParCycleOfEmployee = createAsyncThunk(
  "employee/fetchCurrentParCycleOfEmployee",
  async (employeeId: string, { dispatch }) => {
    try {
      const response = await ApiService.getInstance().get(
        `${AppConfig.serviceUrls.parCycles}?email=${employeeId}&status=${ParCycleStatus.OPEN}`
      );

      if (response.status === HttpStatusCode.Ok) {
        if (response.data.length > 0) {
          const currentCycle = response.data.find(
            (parCycle: ParCycleSummary) =>
              parCycle.parCycleStatus === ParCycleStatus.OPEN
          );
          const currentParCycleId = currentCycle?.parCycleId;

          dispatch(
            fetchParRatingOfEmployee({
              employeeId,
              parCycleId: currentParCycleId,
            })
          );

          dispatch(fetchParCycleById(currentParCycleId));
          return { currentCycle };
        }

        return { currentCycle: {} };
      } else {
        throw new Error(
          response.data?.message || sliceErrorMessages.employeeSlice.getEmployee
        );
      }
    } catch (error) {
      const errorMessage = getErrorMessage(
        error,
        SnackMessage.error.fetchEmployeeParCycles
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

export const fetchPreviousParCyclesOfEmployee = createAsyncThunk(
  "employee/fetchPreviousParCycleOfEmployee",
  async (employeeId: string, { dispatch }) => {
    try {
      const response = await ApiService.getInstance().get(
        `${AppConfig.serviceUrls.parCycles}?email=${employeeId}&status=${ParCycleStatus.CLOSED}`
      );

      if (response.status === HttpStatusCode.Ok) {
        return response.data;
      } else {
        throw new Error(
          response.data?.message || sliceErrorMessages.employeeSlice.getEmployee
        );
      }
    } catch (error) {
      const errorMessage = getErrorMessage(
        error,
        SnackMessage.error.fetchEmployeeParCycles
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

export const fetchParRatingOfEmployee = createAsyncThunk(
  "employee/fetchParRatingOfEmployee",
  async (
    { employeeId, parCycleId }: FetchEmployeeRatingsParams,
    { rejectWithValue }
  ) => {
    try {
      const response = await ApiService.getInstance().get(
        `${AppConfig.serviceUrls.parCycles}/${parCycleId}/employees/${employeeId}/par-ratings`
      );

      if (response.status === HttpStatusCode.Ok) {
        const parRating = response.data;

        try {
          if (base64Regex.test(parRating?.parEmployeeComment)) {
            try {
              parRating.parEmployeeComment = decodeURIComponent(
                atob(parRating?.parEmployeeComment)
              );
            } catch (decodeError) {
              parRating.parEmployeeComment = "";
            }
          } else {
            parRating.parEmployeeComment = "";
          }

          if (base64Regex.test(parRating?.parLeadComment)) {
            try {
              parRating.parLeadComment = decodeURIComponent(
                atob(parRating?.parLeadComment)
              );
            } catch (decodeError) {
              parRating.parLeadComment = "";
            }
          } else {
            parRating.parLeadComment = "";
          }

          if (base64Regex.test(parRating?.parAdminComment)) {
            try {
              parRating.parAdminComment = decodeURIComponent(
                atob(parRating?.parAdminComment)
              );
            } catch (decodeError) {
              parRating.parAdminComment = "";
            }
          } else {
            parRating.parAdminComment = "";
          }
        } catch (commentProcessingError) {
          throw commentProcessingError;
        }
        return parRating;
      } else {
        throw new Error(
          response.data?.message ||
            sliceErrorMessages.employeeSlice.getEmployeeRating
        );
      }
    } catch (error) {
      return rejectWithValue(
        (error instanceof Error ? error.message : String(error)) ||
          sliceErrorMessages.employeeSlice.getEmployeeRating
      );
    }
  }
);

export const updateParRatingOfEmployee = createAsyncThunk(
  "employee/updateParRatingOfEmployee",
  async (
    {
      employeeId,
      parCycleId,
      parRatingId,
      values,
    }: UpdateEmployeeRatingsParams,
    { dispatch }
  ) => {
    try {
      const response = await ApiService.getInstance().patch(
        `${AppConfig.serviceUrls.parCycles}/${parCycleId}/employees/${employeeId}/par-ratings/${parRatingId}`,
        values
      );

      if (response.status === HttpStatusCode.Ok) {
        return response.data;
      } else {
        throw new Error(
          response.data?.message ||
            sliceErrorMessages.employeeSlice.postEmployeeRating
        );
      }
    } catch (error) {
      const errorMessage = getErrorMessage(
        error,
        values?.parF2fStatus
          ? SnackMessage.error.updateF2fStatus
          : SnackMessage.error.updateEmployeeParRatings
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

export const bulkUpdateParRatingOfEmployee = createAsyncThunk(
  "employee/bulkUpdateParRatingOfEmployee",
  async (
    objects: UpdateEmployeeRatingsParams[],
    { dispatch }
  ): Promise<{
    passedCount: number;
    failedCount: number;
    reasonMessage: string;
  }> => {
    let passedCount = 0;
    let failedCount = 0;
    let reason: string[] = [];

    for (const object of objects) {
      try {
        const response = await ApiService.getInstance().patch(
          `${AppConfig.serviceUrls.parCycles}/${object.parCycleId}/employees/${object.employeeId}/par-ratings/${object.parRatingId}`,
          object.values
        );
        if (response.status === HttpStatusCode.Ok) {
          passedCount++;
        } else {
          reason.push(response.data?.message);
          failedCount++;
        }
      } catch (error) {
        const errorMessage = getErrorMessage(
          error,
          SnackMessage.error.updateEmployeeParRatings
        );
        reason.push(errorMessage);
        failedCount++;
      }
    }

    const reasonMessage = reason.join(", ");
    return { passedCount, failedCount, reasonMessage };
  }
);

export const updateParTeamIdOfEmployee = createAsyncThunk(
  "employee/updateParTeamIdOfEmployee",
  async ({ employeeId, parCycleId }: UpdateParTeamIdParam, { dispatch }) => {
    try {
      const response = await ApiService.getInstance().post(
        `${AppConfig.serviceUrls.parCycles}/${parCycleId}/employees/${employeeId}/sync`
      );

      if (response.status === HttpStatusCode.Ok) {
        return response.data;
      } else {
        throw new Error(
          response.data?.message ||
            sliceErrorMessages.employeeSlice.postEmployeeRating
        );
      }
    } catch (error) {
      const errorMessage = getErrorMessage(
        error,
        SnackMessage.error.employeeSyncError
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

const employeeSlice = createSlice({
  name: "employee",
  initialState,
  reducers: {
    resetSelectedEmployeeParState: (state) => {
      state.status = RequestState.IDLE;
      state.currentCycleOfEmployee = {};
      state.errorMessage = "";
      state.previousCycles = [];
      state.ratingStatus = RequestState.IDLE;
      state.selectedRating = {} as ParRating;
    },
    updateSelectedParEmployeeComment(state, action) {
      state.selectedRating.parEmployeeComment = action.payload;
      state.selectedRating.parEmployeeStatus = ParEmployeeStatus.DRAFT;
    },
    updateSelectedParLeadComment(state, action) {
      state.selectedRating.parLeadComment = action.payload.parLeadComment;
      state.selectedRating.parRating = action.payload.parRating;
      state.selectedRating.parSpecialRating = action.payload.parSpecialRating;
      state.selectedRating.parLeadStatus = ParLeadStatus.DRAFT;
    },
    updateSelectedParF2fFields(state, action) {
      state.selectedRating.parF2fStatus = action.payload.parF2fStatus;
      state.selectedRating.parF2fDate = action.payload.parF2fDate;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCurrentParCycleOfEmployee.pending, (state) => {
        state.status = RequestState.LOADING;
      })
      .addCase(fetchCurrentParCycleOfEmployee.fulfilled, (state, action) => {
        state.currentCycleOfEmployee = action.payload.currentCycle;
        state.status = RequestState.SUCCEEDED;
      })
      .addCase(fetchCurrentParCycleOfEmployee.rejected, (state) => {
        state.currentCycleOfEmployee = {};
        state.selectedRating = {} as ParRating;
        state.status = RequestState.FAILED;
      })
      .addCase(fetchPreviousParCyclesOfEmployee.pending, (state) => {
        state.status = RequestState.LOADING;
      })
      .addCase(fetchPreviousParCyclesOfEmployee.fulfilled, (state, action) => {
        state.previousCycles = action.payload;
        state.status = RequestState.SUCCEEDED;
      })
      .addCase(fetchPreviousParCyclesOfEmployee.rejected, (state) => {
        state.previousCycles = [];
        state.status = RequestState.FAILED;
      })
      .addCase(fetchParRatingOfEmployee.pending, (state) => {
        state.ratingStatus = RequestState.LOADING;
      })
      .addCase(fetchParRatingOfEmployee.fulfilled, (state, action) => {
        state.selectedRating = action.payload as ParRating;
        state.ratingStatus = RequestState.SUCCEEDED;
      })
      .addCase(fetchParRatingOfEmployee.rejected, (state, action) => {
        state.ratingStatus = RequestState.FAILED;
        state.selectedRating = {} as ParRating;
        state.errorMessage =
          typeof action.payload === "string"
            ? action.payload
            : SnackMessage.error.fetchEmployeeParRatings;
      })
      .addCase(updateParTeamIdOfEmployee.rejected, (state) => {
        state.ratingStatus = RequestState.FAILED;
      })
      .addCase(updateParTeamIdOfEmployee.pending, (state) => {
        state.ratingStatus = RequestState.LOADING;
      })
      .addCase(updateParTeamIdOfEmployee.fulfilled, (state) => {
        state.ratingStatus = RequestState.SUCCEEDED;
      });
  },
});

export const {
  updateSelectedParEmployeeComment,
  updateSelectedParLeadComment,
  updateSelectedParF2fFields,
  resetSelectedEmployeeParState,
} = employeeSlice.actions;

export const selectCurrentParCycleOfEmployee = (state: RootState) =>
  state.employee.currentCycleOfEmployee;
export const selectPreviousParCycleOfEmployee = (state: RootState) =>
  state.employee.previousCycles;
export const selectEmployeeRatings = (state: RootState) =>
  state.employee.selectedRating;
export const selectEmployeeStatus = (state: RootState) => state.employee.status;
export const selectEmployeeRatingStatus = (state: RootState) =>
  state.employee.ratingStatus;
export const selectEmployeeRatingError = (state: RootState) =>
  state.employee.errorMessage;

export default employeeSlice.reducer;
