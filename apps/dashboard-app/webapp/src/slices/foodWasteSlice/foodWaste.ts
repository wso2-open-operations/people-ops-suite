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

interface WeeklyTrendItem {
  date: string;
  breakfastWaste: number;
  lunchWaste: number;
}

interface MonthlyTrendItem {
  month: string;
  breakfastWaste: number;
  lunchWaste: number;
}

interface FoodWasteRecord {
  date: string;
  mealType: "BREAKFAST" | "LUNCH";
  totalWasteKg: number;
  plateCount: number;
  averageWastePerPlateGrams: number;
}

interface LatestFoodWasteResponse {
  date: string;
  breakfast?: FoodWasteRecord | null;
  lunch?: FoodWasteRecord | null;
  totalDailyWasteKg: number;
  totalDailyPlates: number;
  averageWastePerPlateGrams: number;
}

interface WeeklyDataPoint {
  date: string;
  breakfast: number;
  lunch: number;
}

interface MonthlyDataPoint {
  month: string;
  breakfast: number;
  lunch: number;
}

interface AnnualDataPoint {
  year: string;
  breakfast: number;
  lunch: number;
}

interface FoodWasteDashboardState {
  weeklyData: WeeklyDataPoint[];
  monthlyData: MonthlyDataPoint[];
  annualData: AnnualDataPoint[];
  latestData: LatestFoodWasteResponse | undefined;
  weeklyLoading: boolean;
  monthlyLoading: boolean;
  annualLoading: boolean;
  latestLoading: boolean;
  weeklyError: unknown;
  monthlyError: unknown;
  annualError: unknown;
  latestError: unknown;
}

const DEFAULT_WEEKLY_DATA: WeeklyDataPoint[] = [];
const DEFAULT_MONTHLY_DATA: MonthlyDataPoint[] = [];
const DEFAULT_ANNUAL_DATA: AnnualDataPoint[] = [];

const transformWeeklyData = (records: WeeklyTrendItem[]): WeeklyDataPoint[] =>
  records.map((item) => {
    // Parse as LOCAL date (not UTC) to avoid timezone shift.
    // new Date("YYYY-MM-DD") is UTC midnight which shifts the day backward in IST.
    const [year, month, day] = item.date.split("-").map(Number);
    const localDate = new Date(year, month - 1, day);
    return {
      date: localDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      breakfast: Number(item.breakfastWaste) || 0,
      lunch: Number(item.lunchWaste) || 0,
    };
  });

const transformMonthlyData = (records: MonthlyTrendItem[]): MonthlyDataPoint[] =>
  records.map((item) => {
    // Parse as local date (year, month) to avoid UTC timezone shift.
    const [year, month] = item.month.split("-").map(Number);
    const localDate = new Date(year, month - 1, 1);
    return {
      month: localDate.toLocaleDateString("en-US", {
        month: "short",
      }),
      breakfast: Number(item.breakfastWaste) || 0,
      lunch: Number(item.lunchWaste) || 0,
    };
  });

const transformYearlyData = (records: MonthlyTrendItem[]): AnnualDataPoint[] => {
  const yearly = records.reduce<Record<string, { breakfast: number; lunch: number }>>(
    (acc, item) => {
      const year = item.month.split("-")[0];
      if (!acc[year]) {
        acc[year] = { breakfast: 0, lunch: 0 };
      }
      acc[year].breakfast += Number(item.breakfastWaste) || 0;
      acc[year].lunch += Number(item.lunchWaste) || 0;
      return acc;
    },
    {},
  );

  return Object.entries(yearly).map(([year, totals]) => ({
    year,
    breakfast: totals.breakfast,
    lunch: totals.lunch,
  }));
};

const mapAxiosError = (error: unknown): unknown => {
  if (error instanceof AxiosError) {
    return error.response?.data ?? error.message;
  }
  return error;
};

export const fetchWeeklyFoodWasteData = createAsyncThunk<
  WeeklyDataPoint[],
  { startDate: string; endDate: string },
  { rejectValue: unknown }
>("foodWaste/fetchWeeklyData", async ({ startDate, endDate }, { rejectWithValue }) => {
  try {
    const response = await getAPIService().get(AppConfig.serviceUrls.foodWaste, {
      params: { duration: "weekly", startDate, endDate },
    });
    return transformWeeklyData(response.data as WeeklyTrendItem[]);
  } catch (error) {
    return rejectWithValue(mapAxiosError(error));
  }
});

export const fetchMonthlyFoodWasteData = createAsyncThunk<
  MonthlyDataPoint[],
  void,
  { rejectValue: unknown }
>("foodWaste/fetchMonthlyData", async (_, { rejectWithValue }) => {
  try {
    const response = await getAPIService().get(AppConfig.serviceUrls.foodWaste, {
      params: { duration: "monthly" },
    });
    return transformMonthlyData(response.data as MonthlyTrendItem[]);
  } catch (error) {
    return rejectWithValue(mapAxiosError(error));
  }
});

export const fetchYearlyFoodWasteData = createAsyncThunk<
  AnnualDataPoint[],
  void,
  { rejectValue: unknown }
>("foodWaste/fetchYearlyData", async (_, { rejectWithValue }) => {
  try {
    const response = await getAPIService().get(AppConfig.serviceUrls.foodWaste, {
      params: { duration: "yearly" },
    });
    return transformYearlyData(response.data as MonthlyTrendItem[]);
  } catch (error) {
    return rejectWithValue(mapAxiosError(error));
  }
});

export const fetchLatestFoodWasteData = createAsyncThunk<
  LatestFoodWasteResponse,
  void,
  { rejectValue: unknown }
>("foodWaste/fetchLatestData", async (_, { rejectWithValue }) => {
  try {
    const response = await getAPIService().get(AppConfig.serviceUrls.foodWaste, {
      params: { latest: true },
    });
    return response.data as LatestFoodWasteResponse;
  } catch (error) {
    return rejectWithValue(mapAxiosError(error));
  }
});

const initialState: FoodWasteDashboardState = {
  weeklyData: DEFAULT_WEEKLY_DATA,
  monthlyData: DEFAULT_MONTHLY_DATA,
  annualData: DEFAULT_ANNUAL_DATA,
  latestData: undefined,
  weeklyLoading: false,
  monthlyLoading: false,
  annualLoading: false,
  latestLoading: false,
  weeklyError: null,
  monthlyError: null,
  annualError: null,
  latestError: null,
};

const FoodWasteSlice = createSlice({
  name: "foodWaste",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchWeeklyFoodWasteData.pending, (state) => {
        state.weeklyLoading = true;
        state.weeklyError = null;
      })
      .addCase(fetchWeeklyFoodWasteData.fulfilled, (state, action) => {
        state.weeklyLoading = false;
        state.weeklyData = action.payload;
      })
      .addCase(fetchWeeklyFoodWasteData.rejected, (state, action) => {
        state.weeklyLoading = false;
        state.weeklyError = action.payload ?? action.error;
      })
      .addCase(fetchMonthlyFoodWasteData.pending, (state) => {
        state.monthlyLoading = true;
        state.monthlyError = null;
      })
      .addCase(fetchMonthlyFoodWasteData.fulfilled, (state, action) => {
        state.monthlyLoading = false;
        state.monthlyData = action.payload;
      })
      .addCase(fetchMonthlyFoodWasteData.rejected, (state, action) => {
        state.monthlyLoading = false;
        state.monthlyError = action.payload ?? action.error;
      })
      .addCase(fetchYearlyFoodWasteData.pending, (state) => {
        state.annualLoading = true;
        state.annualError = null;
      })
      .addCase(fetchYearlyFoodWasteData.fulfilled, (state, action) => {
        state.annualLoading = false;
        state.annualData = action.payload;
      })
      .addCase(fetchYearlyFoodWasteData.rejected, (state, action) => {
        state.annualLoading = false;
        state.annualError = action.payload ?? action.error;
      })
      .addCase(fetchLatestFoodWasteData.pending, (state) => {
        state.latestLoading = true;
        state.latestError = null;
      })
      .addCase(fetchLatestFoodWasteData.fulfilled, (state, action) => {
        state.latestLoading = false;
        state.latestData = action.payload;
      })
      .addCase(fetchLatestFoodWasteData.rejected, (state, action) => {
        state.latestLoading = false;
        state.latestError = action.payload ?? action.error;
      });
  },
});

export default FoodWasteSlice.reducer;
