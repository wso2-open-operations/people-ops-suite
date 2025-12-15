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

import SearchIcon from "@mui/icons-material/Search";
import { Button, Stack } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { Dayjs } from "dayjs";
import { useSnackbar } from "notistack";

import { useEffect } from "react";

import Title from "@root/src/component/common/Title";
import { formatDateForAPI, getLeadReport } from "@root/src/services/leaveService";
import { LeadReportResponse } from "@root/src/types/types";

interface ToolbarProps {
  startDate: Dayjs | null;
  endDate: Dayjs | null;
  onStartDateChange: (date: Dayjs | null) => void;
  onEndDateChange: (date: Dayjs | null) => void;
  onFetchReport: (data: LeadReportResponse) => void;
  setLoading: (loading: boolean) => void;
}

export default function Toolbar({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onFetchReport,
  setLoading,
}: ToolbarProps) {
  const { enqueueSnackbar } = useSnackbar();

  const handleFetchReport = async () => {
    if (!startDate || !endDate) {
      enqueueSnackbar("Please select both start and end dates", { variant: "error" });
      return;
    }

    if (endDate.isBefore(startDate, "day")) {
      enqueueSnackbar("End date must be after start date", { variant: "error" });
      return;
    }

    try {
      setLoading(true);
      const response = await getLeadReport({
        startDate: formatDateForAPI(startDate),
        endDate: formatDateForAPI(endDate),
      });
      onFetchReport(response);
      enqueueSnackbar("Report fetched successfully", { variant: "success" });
    } catch (error: any) {
      console.error("Error fetching lead report:", error);
      const errorMessage = error?.response?.data?.message || "Failed to fetch report";
      enqueueSnackbar(errorMessage, { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch report on initial load with default dates
    handleFetchReport();
  }, []);

  return (
    <Stack direction="row" width="100%" alignItems="center">
      <Title firstWord="Lead" secondWord="Report" />
      <Stack direction="row" ml="auto" gap="1.5rem" alignItems="center">
        {/* TODO: Implement fetch for indirect reports */}
        {/* <FormControlLabel
          control={<Switch />}
          label="Include indirect reports"
          sx={{ color: theme.palette.text.secondary }}
        /> */}
        <DatePicker label="From" value={startDate} onChange={onStartDateChange} />
        <DatePicker label="To" value={endDate} onChange={onEndDateChange} />
        <Button
          type="submit"
          variant="contained"
          color="primary"
          startIcon={<SearchIcon />}
          onClick={handleFetchReport}
          sx={{ width: "fit-content", height: "fit-content", px: "3rem", py: "0.5rem" }}
        >
          Fetch Report
        </Button>
      </Stack>
    </Stack>
  );
}
