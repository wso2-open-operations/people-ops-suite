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

import { Box, Stack, Typography, useTheme } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs, { Dayjs } from "dayjs";
import { Info } from "lucide-react";

import { useEffect, useState } from "react";

import {
  formatDateForAPI,
  getPeriodType,
  validateLeaveRequest,
} from "@root/src/services/leaveService";

interface LeaveDateSelectionProps {
  onDaysChange: (days: number) => void;
  onDatesChange: (startDate: Dayjs | null, endDate: Dayjs | null) => void;
}

export default function LeaveDateSelection({
  onDaysChange,
  onDatesChange,
}: LeaveDateSelectionProps) {
  const theme = useTheme();
  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);
  const [workingDaysSelected, setWorkingDaysSelected] = useState(0);
  const [isValidating, setIsValidating] = useState(false); // eslint-disable-line @typescript-eslint/no-unused-vars

  const calculateTotalDays = (start: Dayjs | null, end: Dayjs | null): number => {
    if (!start || !end) return 0;
    if (end.isBefore(start)) return 0;
    return end.diff(start, "day") + 1;
  };

  const daysSelected = calculateTotalDays(startDate, endDate);

  useEffect(() => {
    onDaysChange(daysSelected);
  }, [daysSelected, onDaysChange]);

  // Notify parent of initial dates on mount
  useEffect(() => {
    onDatesChange(startDate, endDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Initial validation on mount
  useEffect(() => {
    if (startDate && endDate) {
      validateDates(startDate, endDate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Validate dates and fetch working days from API
  const validateDates = async (start: Dayjs | null, end: Dayjs | null) => {
    if (!start || !end) {
      setWorkingDaysSelected(0);
      return;
    }

    if (end.isBefore(start)) {
      setWorkingDaysSelected(0);
      return;
    }

    setIsValidating(true);
    try {
      const totalDays = calculateTotalDays(start, end);
      const response = await validateLeaveRequest({
        periodType: getPeriodType(totalDays),
        startDate: formatDateForAPI(start),
        endDate: formatDateForAPI(end),
        isMorningLeave: null,
      });

      setWorkingDaysSelected(response.workingDays);
    } catch (error) {
      console.error("Error validating leave dates:", error);
      setWorkingDaysSelected(0);
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
    if (!startDate || !endDate) return "Please select dates";
    if (endDate.isBefore(startDate)) return "Invalid date range";
    if (daysSelected === 0) return "Invalid selection";
    return "Valid Leave Request";
  };

  const status = getStatus();
  const isValidSelection = status === "Valid Leave Request";

  return (
    <Stack
      direction="column"
      justifyContent="space-between"
      width={{ md: "40%" }}
      gap={{ xs: "1rem" }}
    >
      <Typography variant="h6" sx={{ color: theme.palette.text.primary }}>
        Select Date(s)
      </Typography>
      <Stack
        direction="row"
        spacing={1.5}
        justifyContent={{ xs: "space-evenly", md: "space-between" }}
      >
        <DatePicker
          label="From"
          sx={{ minWidth: "10%" }}
          value={startDate}
          onChange={handleStartDateChange}
          disablePast
        />
        <DatePicker
          label="To"
          sx={{ minWidth: "10%" }}
          value={endDate}
          onChange={handleEndDateChange}
          minDate={startDate || undefined}
          disablePast
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
            Days selected: {daysSelected}
          </Typography>
          <Typography variant="subtitle1" sx={{ color: theme.palette.text.secondary }}>
            Working days selected: {workingDaysSelected}
          </Typography>
        </Stack>
      </Stack>
      <Box
        width="70%"
        marginX="auto"
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "0.5rem",
          backgroundColor: isValidSelection
            ? theme.palette.primary.main
            : theme.palette.warning.main,
          color: isValidSelection
            ? theme.palette.primary.contrastText
            : theme.palette.warning.contrastText,
          borderRadius: "0.4rem",
          py: "0.5rem",
          px: "2rem",
        }}
      >
        <Info />
        <Typography variant="body2">Status: {status}</Typography>
      </Box>
    </Stack>
  );
}
