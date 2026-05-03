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
import { AxiosError } from "axios";

import { AppConfig } from "@config/config";
import { getAPIService } from "@utils/apiService";

export interface FoodWasteRecord {
  id: number | null;
  totalWasteKg: number;
  plateCount: number;
}

interface DailyFoodWasteData {
  breakfast?: FoodWasteRecord;
  lunch?: FoodWasteRecord;
}

interface FoodWasteDailyState {
  state: "idle" | "loading" | "success" | "failed";
  data: DailyFoodWasteData | null;
  errorMessage: string | null;
}

const initialState: FoodWasteDailyState = {
  state: "idle",
  data: null,
  errorMessage: null,
};

export const fetchDailyFoodWaste = createAsyncThunk(
  "foodWasteDaily/fetchDailyFoodWaste",
  async (date: string, { rejectWithValue }) => {
    try {
      const response = await getAPIService().get(AppConfig.serviceUrls.foodWasteDaily, {
        params: { date },
      });

      const daily = response.data as {
        breakfast?: { id?: number; totalWasteKg: number; plateCount: number } | null;
        lunch?: { id?: number; totalWasteKg: number; plateCount: number } | null;
      };

      return {
        data: {
          breakfast: daily.breakfast
            ? {
                id: daily.breakfast.id ?? null,
                totalWasteKg: daily.breakfast.totalWasteKg,
                plateCount: daily.breakfast.plateCount,
              }
            : undefined,
          lunch: daily.lunch
            ? {
                id: daily.lunch.id ?? null,
                totalWasteKg: daily.lunch.totalWasteKg,
                plateCount: daily.lunch.plateCount,
              }
            : undefined,
        },
      };
    } catch (error) {
      const err = error as AxiosError;
      return rejectWithValue({
        code: err.code,
        message: err.message,
        status: err.response?.status,
      });
    }
  },
);

export interface SaveFoodWastePayload {
  id: number | null;
  recordDate: string;
  mealType: "BREAKFAST" | "LUNCH";
  totalWasteKg: number;
  plateCount: number;
}

export const saveFoodWasteRecord = createAsyncThunk(
  "foodWasteDaily/saveFoodWasteRecord",
  async (payload: SaveFoodWastePayload, { rejectWithValue }) => {
    try {
      if (payload.id != null) {
        const response = await getAPIService().put(
          `${AppConfig.serviceUrls.foodWaste}/${payload.id}`,
          {
            totalWasteKg: payload.totalWasteKg,
            plateCount: payload.plateCount,
          },
        );
        return { ...payload, returnedId: response.data?.id ?? payload.id };
      } else {
        const response = await getAPIService().post(AppConfig.serviceUrls.foodWaste, {
          recordDate: payload.recordDate,
          mealType: payload.mealType,
          totalWasteKg: payload.totalWasteKg,
          plateCount: payload.plateCount,
        });
        return { ...payload, returnedId: response.data?.id ?? null };
      }
    } catch (error) {
      const err = error as AxiosError;
      return rejectWithValue({
        code: err.code,
        message: err.message,
        status: err.response?.status,
        mealType: payload.mealType,
      });
    }
  },
);

const foodWasteDailySlice = createSlice({
  name: "foodWasteDaily",
  initialState,
  reducers: {
    clearDailyData: (state) => {
      state.data = null;
      state.errorMessage = null;
    },
    clearErrorMessage: (state) => {
      state.errorMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDailyFoodWaste.pending, (state) => {
        state.state = "loading";
        state.errorMessage = null;
      })
      .addCase(fetchDailyFoodWaste.fulfilled, (state, action) => {
        state.state = "success";
        state.data = action.payload.data;
        state.errorMessage = null;
      })
      .addCase(fetchDailyFoodWaste.rejected, (state) => {
        state.state = "failed";
        state.errorMessage = "Failed to load daily records";
      })
      .addCase(saveFoodWasteRecord.fulfilled, (state, action) => {
        const { mealType, returnedId } = action.payload;
        if (!state.data) {
          state.data = { breakfast: undefined, lunch: undefined };
        }
        if (mealType === "BREAKFAST") {
          if (!state.data.breakfast) {
            state.data.breakfast = {
              id: returnedId,
              totalWasteKg: action.payload.totalWasteKg,
              plateCount: action.payload.plateCount,
            };
          } else {
            state.data.breakfast.id = returnedId;
            state.data.breakfast.totalWasteKg = action.payload.totalWasteKg;
            state.data.breakfast.plateCount = action.payload.plateCount;
          }
        } else if (mealType === "LUNCH") {
          if (!state.data.lunch) {
            state.data.lunch = {
              id: returnedId,
              totalWasteKg: action.payload.totalWasteKg,
              plateCount: action.payload.plateCount,
            };
          } else {
            state.data.lunch.id = returnedId;
            state.data.lunch.totalWasteKg = action.payload.totalWasteKg;
            state.data.lunch.plateCount = action.payload.plateCount;
          }
        }
      });
  },
});

export const { clearDailyData, clearErrorMessage } = foodWasteDailySlice.actions;
export default foodWasteDailySlice.reducer;
