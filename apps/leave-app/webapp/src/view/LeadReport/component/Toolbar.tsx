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
import { Box, Button, Stack, Switch, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { Dayjs } from "dayjs";
import { useSnackbar } from "notistack";

interface ToolbarProps {
  startDate: Dayjs | null;
  endDate: Dayjs | null;
  onStartDateChange: (date: Dayjs | null) => void;
  onEndDateChange: (date: Dayjs | null) => void;
  onFetchReport: () => void;
  loading: boolean;
  showToggle?: boolean;
  toggleChecked?: boolean;
  onToggleChange?: (checked: boolean) => void;
}

export default function Toolbar({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onFetchReport,
  loading,
  showToggle = false,
  toggleChecked = true,
  onToggleChange,
}: ToolbarProps) {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();

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
      <Stack direction="row" width="100%" alignItems="center" justifyContent="space-between">
        <Stack direction="row" gap="1.5rem" alignItems="center" flex={1}>
          {showToggle && onToggleChange && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                px: 2,
                py: 1,
                borderRadius: 2,
                backgroundColor:
                  theme.palette.mode === "dark"
                    ? "rgba(255, 255, 255, 0.05)"
                    : "rgba(0, 0, 0, 0.03)",
                border: `1px solid ${
                  theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.08)"
                }`,
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 500,
                  color: theme.palette.text.secondary,
                }}
              >
                View:
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: toggleChecked ? 600 : 400,
                    color: toggleChecked
                      ? theme.palette.text.primary
                      : theme.palette.text.secondary,
                    transition: "all 0.2s ease",
                  }}
                >
                  All Employees
                </Typography>
                <Switch
                  checked={!toggleChecked}
                  onChange={(e) => onToggleChange(!e.target.checked)}
                  size="small"
                  sx={{
                    "& .MuiSwitch-switchBase.Mui-checked": {
                      color: theme.palette.primary.main,
                    },
                    "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                      backgroundColor: theme.palette.primary.main,
                    },
                  }}
                />
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: !toggleChecked ? 600 : 400,
                    color: !toggleChecked
                      ? theme.palette.text.primary
                      : theme.palette.text.secondary,
                    transition: "all 0.2s ease",
                  }}
                >
                  My Subordinates
                </Typography>
              </Box>
            </Box>
          )}
        </Stack>
        <Stack direction="row" gap="1.5rem" alignItems="center">
          <DatePicker
            label="From"
            value={startDate}
            onChange={onStartDateChange}
            format="YYYY-MM-DD"
            sx={{ minWidth: 200 }}
          />
          <DatePicker
            label="To"
            value={endDate}
            onChange={onEndDateChange}
            format="YYYY-MM-DD"
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
