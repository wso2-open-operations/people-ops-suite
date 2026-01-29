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

import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { Alert, CircularProgress, Stack, Typography, useTheme } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs, { Dayjs } from "dayjs";

import { useEffect, useState } from "react";

import {
  formatDateForApi,
  getPeriodType,
  validateLeaveRequest,
} from "@root/src/services/leaveService";
import { DayPortion, PeriodType } from "@root/src/types/types";

interface LeaveDateSelectionProps {
  onDaysChange: (days: number) => void;
  onDatesChange: (startDate: Dayjs | null, endDate: Dayjs | null) => void;
  onWorkingDaysChange: (workingDays: number) => void;
  selectedDayPortion?: DayPortion | null;
  hasError?: boolean;
  onErrorClear?: () => void;
}

export default function LeaveDateSelection({
  onDaysChange,
  onDatesChange,
  onWorkingDaysChange,
  selectedDayPortion,
  hasError = false,
  onErrorClear,
}: LeaveDateSelectionProps) {
  const theme = useTheme();
  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);
  const [workingDaysSelected, setWorkingDaysSelected] = useState(0);
  const [isValidating, setIsValidating] = useState(false);

  const calculateTotalDays = (start: Dayjs | null, end: Dayjs | null): number => {
    if (!start || !end) return 0;
    if (end.isBefore(start, "day")) return 0;
    return end.diff(start, "day") + 1;
  };

  const [daysSelected, setDaysSelected] = useState(calculateTotalDays(startDate, endDate));

  useEffect(() => {
    onDaysChange(daysSelected);
  }, [daysSelected, onDaysChange]);

  // Trigger validation when selectedDayPortion changes
  useEffect(() => {
    if (startDate && endDate && selectedDayPortion) {
      validateDates(startDate, endDate);
    }
  }, [selectedDayPortion]);

  useEffect(() => {
    const today = dayjs().startOf("day");
    setStartDate(today);
    setEndDate(today);
    onDatesChange(today, today);
    validateDates(today, today);
  }, []);

  // Validate dates and fetch working days from API
  const validateDates = async (start: Dayjs | null, end: Dayjs | null) => {
    setDaysSelected(calculateTotalDays(start, end));
    if (!start || !end) {
      setWorkingDaysSelected(0);
      onWorkingDaysChange(0);
      return;
    }

    if (end.isBefore(start, "day")) {
      setWorkingDaysSelected(0);
      onWorkingDaysChange(0);
      return;
    }

    setIsValidating(true);
    try {
      const totalDays = calculateTotalDays(start, end);
      let periodType: PeriodType;
      let isMorningLeave: boolean | null = null;

      switch (selectedDayPortion) {
        case DayPortion.FULL:
          periodType = totalDays === 1 ? PeriodType.ONE : PeriodType.MULTIPLE;
          isMorningLeave = null;
          break;
        case DayPortion.FIRST:
          periodType = PeriodType.HALF;
          isMorningLeave = true;
          break;
        case DayPortion.SECOND:
          periodType = PeriodType.HALF;
          isMorningLeave = false;
          break;
        default:
          periodType = getPeriodType(totalDays);
          isMorningLeave = null;
          break;
      }
      const response = await validateLeaveRequest(
        {
          periodType,
          startDate: formatDateForApi(start),
          endDate: formatDateForApi(end),
          isMorningLeave,
        },
        true,
      );

      setWorkingDaysSelected(response.workingDays);
      onWorkingDaysChange(response.workingDays);
    } catch (error) {
      console.error("Error validating leave dates:", error);
      setWorkingDaysSelected(0);
      onWorkingDaysChange(0);
    } finally {
      setIsValidating(false);
    }
  };

  const handleStartDateChange = (newValue: Dayjs | null) => {
    setStartDate(newValue);
    onDatesChange(newValue, endDate);

    // If end date is before new start date, clear end date
    if (newValue && endDate && endDate.isBefore(newValue, "day")) {
      setEndDate(null);
      onDatesChange(newValue, null);
      setWorkingDaysSelected(0);
    } else if (newValue && endDate) {
      validateDates(newValue, endDate);
    }
  };

  const handleEndDateChange = (newValue: Dayjs | null) => {
    setEndDate(newValue);
    onDatesChange(startDate, newValue);

    if (startDate && newValue) {
      validateDates(startDate, newValue);
    }
  };

  // Determine status based on selection
  const getStatus = () => {
    if (isValidating) return "Validating...";
    if (!startDate || !endDate) return "Please select dates";
    if (endDate.isBefore(startDate, "day")) return "Invalid date range";
    if (daysSelected <= 0) return "Invalid selection";
    if (workingDaysSelected <= 0) return "No working days selected";
    return "Valid date selection";
  };

  const status = getStatus();
  const isValidSelection = status === "Valid date selection";

  const displayDaysSelected =
    selectedDayPortion === DayPortion.FIRST || selectedDayPortion === DayPortion.SECOND
      ? workingDaysSelected
      : daysSelected;

  return (
    <Stack
      direction="column"
      justifyContent="space-between"
      width={{ md: "40%" }}
      gap={{ xs: "1rem" }}
    >
      <Stack direction="row" justifyContent="space-between">
        <Typography variant="h6" sx={{ color: theme.palette.text.primary }}>
          Date Selection
        </Typography>
      </Stack>
      <Stack
        direction="row"
        spacing={1.5}
        justifyContent={{ xs: "space-evenly", md: "space-between" }}
      >
        <DatePicker
          label="Start Date"
          sx={{ minWidth: "10%" }}
          value={startDate}
          onChange={(newValue) => {
            handleStartDateChange(newValue);
            onErrorClear?.();
          }}
          format="YYYY-MM-DD"
          disablePast
          slotProps={{
            textField: {
              error: hasError,
            },
          }}
        />
        <DatePicker
          label="End Date"
          sx={{ minWidth: "10%" }}
          value={endDate}
          onChange={(newValue) => {
            handleEndDateChange(newValue);
            onErrorClear?.();
          }}
          minDate={startDate || undefined}
          format="YYYY-MM-DD"
          disablePast
          slotProps={{
            textField: {
              error: hasError,
            },
          }}
        />
      </Stack>
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} justifyContent="space-between">
        <Stack
          direction="row"
          justifyContent={{ xs: "space-evenly", md: "space-between" }}
          width="100%"
          marginTop="2rem"
        >
          <Typography variant="subtitle1" sx={{ color: theme.palette.text.secondary }}>
            Days selected: {displayDaysSelected}
          </Typography>
          <Typography variant="subtitle1" sx={{ color: theme.palette.text.secondary }}>
            Working days selected: {workingDaysSelected}
          </Typography>
        </Stack>
      </Stack>
      <Alert
        icon={isValidating ? <CircularProgress size={20} /> : <InfoOutlinedIcon fontSize="small" />}
        severity={isValidating ? "warning" : isValidSelection ? "success" : "warning"}
        variant="outlined"
        sx={{
          boxSizing: "border-box",
          display: "flex",
          width: "100%",
          justifyContent: "center",
          px: 2,
          py: 0.5,
          borderRadius: "0.4rem",
        }}
      >
        <Typography variant="body2">{status}</Typography>
      </Alert>
    </Stack>
  );
}
