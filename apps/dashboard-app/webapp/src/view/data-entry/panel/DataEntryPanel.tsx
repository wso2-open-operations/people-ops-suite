// Copyright (c) 2025 WSO2 LLC. (https://www.wso2.com).
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

import { AppConfig } from "@config/config";
import { DATE_RANGE_DAYS } from "@config/feature";
import { DataEntryMessage } from "@config/messages";
import {
  fetchLatestFoodWasteData,
  fetchMonthlyFoodWasteData,
  fetchWeeklyFoodWasteData,
  fetchYearlyFoodWasteData,
} from "@slices/foodWasteSlice/foodWaste";
import { useAppDispatch } from "@slices/store";
import { APIService } from "@utils/apiService";

import DailySummaryCard from "../component/card/DailySummaryCard";
import DateSelectionCard from "../component/card/DateSelectionCard";
import MealEntryCard, { type FoodWasteData } from "../component/card/MealEntryCard";

export default function DataEntryPanel() {
  const { enqueueSnackbar } = useSnackbar();
  const dispatch = useAppDispatch();

  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [loadError, setLoadError] = useState("");
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
    setLoadError("");

    let cancelled = false;

    const loadDailyRecords = async () => {
      try {
        const response = await APIService.getInstance().get(AppConfig.serviceUrls.foodWasteDaily, {
          params: { date: selectedDate },
        });

        if (cancelled) {
          return;
        }

        const daily = response.data as {
          breakfast?: { id?: number; totalWasteKg: number; plateCount: number } | null;
          lunch?: { id?: number; totalWasteKg: number; plateCount: number } | null;
        };

        if (daily.breakfast) {
          setBreakfastData({
            id: daily.breakfast.id ?? null,
            totalWasteKg: String(daily.breakfast.totalWasteKg),
            plateCount: String(daily.breakfast.plateCount),
          });
        }

        if (daily.lunch) {
          setLunchData({
            id: daily.lunch.id ?? null,
            totalWasteKg: String(daily.lunch.totalWasteKg),
            plateCount: String(daily.lunch.plateCount),
          });
        }
      } catch (err) {
        if (cancelled) {
          return;
        }
        console.error("Failed to load daily records", err);
        setLoadError(DataEntryMessage.snackbar.loadFailed);
      }
    };

    loadDailyRecords();

    return () => {
      cancelled = true;
    };
  }, [selectedDate]);

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

    const breakfastWaste = parseFloat(breakfastData.totalWasteKg);
    const breakfastPlates = parseInt(breakfastData.plateCount, 10);
    const lunchWaste = parseFloat(lunchData.totalWasteKg);
    const lunchPlates = parseInt(lunchData.plateCount, 10);

    const hasBreakfastData = Number.isFinite(breakfastWaste) && Number.isFinite(breakfastPlates);
    const hasLunchData = Number.isFinite(lunchWaste) && Number.isFinite(lunchPlates);

    if (!hasBreakfastData && !hasLunchData) {
      enqueueSnackbar(DataEntryMessage.snackbar.atLeastOneMeal, { variant: "warning" });
      return;
    }

    setIsSaving(true);

    const requests: {
      mealType: "BREAKFAST" | "LUNCH";
      promise: Promise<{ data?: { id?: number } }>;
    }[] = [];

    if (hasBreakfastData) {
      const payload = {
        totalWasteKg: breakfastWaste,
        plateCount: breakfastPlates,
      };

      if (breakfastData.id != null) {
        requests.push({
          mealType: "BREAKFAST",
          promise: APIService.getInstance().put(
            `${AppConfig.serviceUrls.foodWaste}/${breakfastData.id}`,
            payload,
          ) as Promise<{ data?: { id?: number } }>,
        });
      } else {
        requests.push({
          mealType: "BREAKFAST",
          promise: APIService.getInstance().post(AppConfig.serviceUrls.foodWaste, {
            recordDate: selectedDate,
            mealType: "BREAKFAST",
            ...payload,
          }) as Promise<{ data?: { id?: number } }>,
        });
      }
    }

    if (hasLunchData) {
      const payload = {
        totalWasteKg: lunchWaste,
        plateCount: lunchPlates,
      };

      if (lunchData.id != null) {
        requests.push({
          mealType: "LUNCH",
          promise: APIService.getInstance().put(
            `${AppConfig.serviceUrls.foodWaste}/${lunchData.id}`,
            payload,
          ) as Promise<{ data?: { id?: number } }>,
        });
      } else {
        requests.push({
          mealType: "LUNCH",
          promise: APIService.getInstance().post(AppConfig.serviceUrls.foodWaste, {
            recordDate: selectedDate,
            mealType: "LUNCH",
            ...payload,
          }) as Promise<{ data?: { id?: number } }>,
        });
      }
    }

    try {
      const results = await Promise.allSettled(requests.map((request) => request.promise));
      const successful = results.filter((result) => result.status === "fulfilled").length;
      const failedRequests = results
        .map((result, idx) => ({ result, idx }))
        .filter((item) => item.result.status === "rejected");

      results.forEach((result, idx) => {
        if (result.status === "fulfilled") {
          const returnedId = result.value?.data?.id as number | undefined;
          if (returnedId != null) {
            if (requests[idx].mealType === "BREAKFAST") {
              setBreakfastData((prev) => ({ ...prev, id: returnedId }));
            } else {
              setLunchData((prev) => ({ ...prev, id: returnedId }));
            }
          }
        }
      });

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
          const mealType = requests[failed.idx].mealType;
          const error = failed.result as PromiseRejectedResult;
          const errorMessage =
            error.reason?.response?.data?.message || error.reason?.message || "Unknown error";
          enqueueSnackbar(`${mealType}: ${errorMessage}`, { variant: "error" });
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
        loadError={loadError}
        onDateChange={setSelectedDate}
        getDisplayDate={getDisplayDate}
      />

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" }, gap: 3, mb: 3 }}>
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
