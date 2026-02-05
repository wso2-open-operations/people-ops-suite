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

import { selectLeadReportState } from "@root/src/slices/leadReportSlice/leadReport";
import { useAppSelector } from "@root/src/slices/store";
import { State } from "@root/src/types/types";

interface ToolbarProps {
  startDate: Dayjs | null;
  endDate: Dayjs | null;
  onStartDateChange: (date: Dayjs | null) => void;
  onEndDateChange: (date: Dayjs | null) => void;
  onFetchReport: () => void;
}

export default function Toolbar({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onFetchReport,
}: ToolbarProps) {
  const { enqueueSnackbar } = useSnackbar();
  const leadReportState = useAppSelector(selectLeadReportState);
  const loading = leadReportState === State.loading;

  const handleFetchReport = () => {
    if (!startDate || !endDate) {
      enqueueSnackbar("Please select both start and end dates", { variant: "error" });
      return;
    }

    if (endDate.isBefore(startDate, "day")) {
      enqueueSnackbar("End date must be after start date", { variant: "error" });
      return;
    }

    onFetchReport();
  };

  return (
    <Stack gap="1.5rem" width="100%">
      <Stack direction="row" width="100%" alignItems="center">
        <Stack direction="row" ml="auto" gap="1.5rem" alignItems="center">
          <DatePicker
            label="From"
            value={startDate}
            onChange={onStartDateChange}
            sx={{ minWidth: 200 }}
          />
          <DatePicker
            label="To"
            value={endDate}
            onChange={onEndDateChange}
            sx={{ minWidth: 200 }}
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            startIcon={<SearchIcon />}
            onClick={handleFetchReport}
            disabled={loading}
            sx={{ width: "fit-content", height: "fit-content", px: "3rem", py: "0.5rem" }}
          >
            {loading ? "Loading..." : "Fetch Report"}
          </Button>
        </Stack>
      </Stack>
    </Stack>
  );
}
