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
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { Save, X } from "lucide-react";
import { useSnackbar } from "notistack";

import { useCallback, useEffect, useMemo, useState } from "react";

import { DATE_RANGE_DAYS } from "@config/feature";
import { DataEntryMessage } from "@config/messages";
import {
  clearDailyData,
  fetchDailyFoodWaste,
  saveFoodWasteRecord,
} from "@slices/foodWasteDailySlice/foodWasteDaily";
import {
  fetchLatestFoodWasteData,
  fetchMonthlyFoodWasteData,
  fetchWeeklyFoodWasteData,
  fetchYearlyFoodWasteData,
} from "@slices/foodWasteSlice/foodWaste";
import { useAppDispatch, useAppSelector } from "@slices/store";

import DailySummaryCard from "../component/card/DailySummaryCard";
import DateSelectionCard from "../component/card/DateSelectionCard";
import { FoodWasteData } from "../component/card/MealEntryCard";
import MealEntryCard from "../component/card/MealEntryCard";

export default function DataEntryPanel() {
  const { enqueueSnackbar } = useSnackbar();
  const dispatch = useAppDispatch();

  const { data: dailyData, errorMessage: dailyError } = useAppSelector(
    (state: { foodWasteDaily: { data: unknown; state: string; errorMessage: string | null } }) =>
      state.foodWasteDaily,
  );

  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [isSaving, setIsSaving] = useState(false);

  const [breakfastData, setBreakfastData] = useState<FoodWasteData>({
    id: null,
    totalWasteKg: "",
    plateCount: "",
  });

  const [lunchData, setLunchData] = useState<FoodWasteData>({
    id: null,
    totalWasteKg: "",
    plateCount: "",
  });

  const handleBreakfastChange = useCallback((field: keyof FoodWasteData, value: string) => {
    setBreakfastData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleLunchChange = useCallback((field: keyof FoodWasteData, value: string) => {
    setLunchData((prev) => ({ ...prev, [field]: value }));
  }, []);

  useEffect(() => {
    setBreakfastData({ id: null, totalWasteKg: "", plateCount: "" });
    setLunchData({ id: null, totalWasteKg: "", plateCount: "" });

    dispatch(clearDailyData());
    dispatch(fetchDailyFoodWaste(selectedDate));
  }, [selectedDate, dispatch]);

  useEffect(() => {
    if (dailyData && typeof dailyData === "object") {
      const data = dailyData as {
        breakfast?: { id?: number; totalWasteKg: number; plateCount: number };
        lunch?: { id?: number; totalWasteKg: number; plateCount: number };
      };
      if (data.breakfast) {
        setBreakfastData({
          id: data.breakfast.id ?? null,
          totalWasteKg: String(data.breakfast.totalWasteKg),
          plateCount: String(data.breakfast.plateCount),
        });
      }

      if (data.lunch) {
        setLunchData({
          id: data.lunch.id ?? null,
          totalWasteKg: String(data.lunch.totalWasteKg),
          plateCount: String(data.lunch.plateCount),
        });
      }
    }
  }, [dailyData]);

  const { startDate: weeklyStart, endDate: weeklyEnd } = useMemo(() => {
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - DATE_RANGE_DAYS);

    const toLocalDateStr = (date: Date) =>
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

    return {
      startDate: toLocalDateStr(sevenDaysAgo),
      endDate: toLocalDateStr(today),
    };
  }, []);

  const refreshDashboardData = useCallback(() => {
    dispatch(fetchLatestFoodWasteData());
    dispatch(fetchWeeklyFoodWasteData({ startDate: weeklyStart, endDate: weeklyEnd }));
    dispatch(fetchMonthlyFoodWasteData());
    dispatch(fetchYearlyFoodWasteData());
  }, [dispatch, weeklyStart, weeklyEnd]);

  const handleSaveDailyRecord = async () => {
    if (isSaving) {
      return;
    }

    const parseDecimalStrict = (value: string): number | null => {
      const normalizedValue = value.trim();
      if (!/^\d+(\.\d+)?$/.test(normalizedValue)) {
        return null;
      }

      const parsedValue = Number(normalizedValue);
      return Number.isFinite(parsedValue) ? parsedValue : null;
    };

    const parseIntegerStrict = (value: string): number | null => {
      const normalizedValue = value.trim();
      if (!/^\d+$/.test(normalizedValue)) {
        return null;
      }

      const parsedValue = Number(normalizedValue);
      return Number.isInteger(parsedValue) ? parsedValue : null;
    };

    const breakfastWaste = parseDecimalStrict(breakfastData.totalWasteKg);
    const breakfastPlates = parseIntegerStrict(breakfastData.plateCount);
    const lunchWaste = parseDecimalStrict(lunchData.totalWasteKg);
    const lunchPlates = parseIntegerStrict(lunchData.plateCount);

    const hasBreakfastData = breakfastWaste !== null && breakfastPlates !== null;
    const hasLunchData = lunchWaste !== null && lunchPlates !== null;

    if (!hasBreakfastData && !hasLunchData) {
      enqueueSnackbar(DataEntryMessage.snackbar.atLeastOneMeal, { variant: "warning" });
      return;
    }

    setIsSaving(true);

    type MealRequest = { promise: Promise<unknown>; mealType: string };
    const requests: MealRequest[] = [];

    if (breakfastWaste !== null && breakfastPlates !== null) {
      requests.push({
        promise: dispatch(
          saveFoodWasteRecord({
            id: breakfastData.id ?? null,
            recordDate: selectedDate,
            mealType: "BREAKFAST",
            totalWasteKg: breakfastWaste,
            plateCount: breakfastPlates,
          }),
        ).unwrap(),
        mealType: "BREAKFAST",
      });
    }

    if (lunchWaste !== null && lunchPlates !== null) {
      requests.push({
        promise: dispatch(
          saveFoodWasteRecord({
            id: lunchData.id ?? null,
            recordDate: selectedDate,
            mealType: "LUNCH",
            totalWasteKg: lunchWaste,
            plateCount: lunchPlates,
          }),
        ).unwrap(),
        mealType: "LUNCH",
      });
    }

    try {
      const results = await Promise.allSettled(requests.map((r) => r.promise));
      const successful = results.filter((result) => result.status === "fulfilled").length;
      const failedRequests = results
        .map((result, idx) => ({ result, mealType: requests[idx].mealType }))
        .filter((item) => item.result.status === "rejected");

      if (failedRequests.length === 0) {
        const localDate = (() => {
          const [year, month, day] = selectedDate.split("-").map(Number);
          return new Date(year, month - 1, day);
        })();

        enqueueSnackbar(
          `${DataEntryMessage.snackbar.savedForDatePrefix} ${localDate.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}`,
          { variant: "success" },
        );
        refreshDashboardData();
      } else {
        failedRequests.forEach((failed) => {
          const error = failed.result as PromiseRejectedResult;
          const errorMessage = (error.reason as { message?: string })?.message || "Unknown error";
          enqueueSnackbar(`${failed.mealType}: ${errorMessage}`, { variant: "error" });
        });

        if (successful > 0) {
          enqueueSnackbar(
            `${DataEntryMessage.snackbar.savedPartialPrefix} ${successful} ${DataEntryMessage.snackbar.savedPartialSuffix}`,
            {
              variant: "info",
            },
          );
          refreshDashboardData();
        }
      }
    } catch (err) {
      console.error("Critical failure during save operation:", err);
      enqueueSnackbar(DataEntryMessage.snackbar.saveUnexpectedFailure, { variant: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelDailyRecord = useCallback(() => {
    setBreakfastData((prev) => ({ ...prev, totalWasteKg: "", plateCount: "" }));
    setLunchData((prev) => ({ ...prev, totalWasteKg: "", plateCount: "" }));
  }, []);

  const getLocalDateFromSelectedDate = (dateStr: string): Date => {
    const [year, month, day] = dateStr.split("-").map(Number);
    return new Date(year, month - 1, day);
  };

  const getDisplayDate = (dateStr: string): string =>
    getLocalDateFromSelectedDate(dateStr).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });

  return (
    <Box sx={{ maxWidth: 1400, mx: "auto", px: 3, py: 4 }}>
      <Box sx={{ mb: 4, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Box>
          <Typography variant="h3" gutterBottom color="text.primary">
            {DataEntryMessage.title}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {DataEntryMessage.subtitle}
          </Typography>
        </Box>
      </Box>

      <DateSelectionCard
        selectedDate={selectedDate}
        isSaving={isSaving}
        loadError={dailyError}
        onDateChange={setSelectedDate}
        getDisplayDate={getDisplayDate}
      />

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
          gap: 3,
          mb: 3,
        }}
      >
        <MealEntryCard
          title={DataEntryMessage.mealLabels.breakfast}
          data={breakfastData}
          onChange={handleBreakfastChange}
          disabled={isSaving}
        />
        <MealEntryCard
          title={DataEntryMessage.mealLabels.lunch}
          data={lunchData}
          onChange={handleLunchChange}
          disabled={isSaving}
        />
      </Box>

      <DailySummaryCard breakfastData={breakfastData} lunchData={lunchData} />

      <Box sx={{ display: "flex", gap: 2, justifyContent: "center", maxWidth: 400, mx: "auto" }}>
        <Button
          variant="contained"
          size="small"
          startIcon={<Save />}
          onClick={handleSaveDailyRecord}
          disabled={isSaving}
          sx={{ flex: 1 }}
        >
          {isSaving ? DataEntryMessage.actions.saving : DataEntryMessage.actions.save}
        </Button>
        <Button
          variant="outlined"
          size="small"
          startIcon={<X />}
          onClick={handleCancelDailyRecord}
          disabled={isSaving}
          sx={{ flex: 1 }}
        >
          {DataEntryMessage.actions.cancel}
        </Button>
      </Box>
    </Box>
  );
}
