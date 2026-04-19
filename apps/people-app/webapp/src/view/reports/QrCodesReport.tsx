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

import CommonPage from "@layout/pages/CommonPage";
import QrCode2Icon from "@mui/icons-material/QrCode2";
import DownloadIcon from "@mui/icons-material/Download";
import CloseIcon from "@mui/icons-material/Close";
import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import {
  Alert,
  alpha,
  Autocomplete,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  Paper,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import { AppConfig } from "@config/config";
import { SEARCH_MAX_LENGTH, SEARCH_REGEX } from "@config/constant";
import { EmployeeStatus } from "@/types/types";
import {
  EmployeeQrInfo,
  fetchQrCodeEmployees,
} from "@slices/employeeSlice/employee";
import { useAppDispatch } from "@slices/store";
import { enqueueSnackbarMessage } from "@slices/commonSlice/common";
import { APIService } from "@utils/apiService";
import { useEffect, useRef, useState } from "react";

const QR_EXPORT_LIMIT = 50;
const SEARCH_LIMIT = 20;
const SEARCH_DEBOUNCE_MS = 300;

function getInitials(firstName: string, lastName: string) {
  return `${firstName?.charAt(0) ?? ""}${lastName?.charAt(0) ?? ""}`.toUpperCase();
}

function QrCodesReportContent() {
  const theme = useTheme();
  const dispatch = useAppDispatch();

  const [selected, setSelected] = useState<EmployeeQrInfo[]>([]);
  const [autocompleteKey, setAutocompleteKey] = useState(0);
  const [searchOptions, setSearchOptions] = useState<EmployeeQrInfo[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchSequenceRef = useRef(0);

  const selectedIds = new Set(selected.map((e) => e.employeeId));
  const atLimit = selected.length >= QR_EXPORT_LIMIT;
  const hasUnexportable = selected.some((e) => !e.house);

  async function performSearch(inputValue: string) {
    const seq = ++searchSequenceRef.current;
    setSearchLoading(true);
    const action = await dispatch(
      fetchQrCodeEmployees({
        ...(inputValue ? { searchString: inputValue } : {}),
        filters: { employeeStatus: EmployeeStatus.Active },
        pagination: { limit: SEARCH_LIMIT, offset: 0 },
        sort: { sortField: "startDate", sortOrder: "DESC" },
      }),
    );
    if (seq !== searchSequenceRef.current) return;
    if (fetchQrCodeEmployees.fulfilled.match(action)) {
      setSearchOptions(action.payload.employees);
    }
    setSearchLoading(false);
  }

  useEffect(() => {
    performSearch("");
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleInputChange(_: unknown, inputValue: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    // Strip characters outside the backend-allowed pattern (e.g. parentheses from option labels)
    const sanitized = inputValue
      .split("")
      .filter((ch) => SEARCH_REGEX.test(ch))
      .join("")
      .trim()
      .slice(0, SEARCH_MAX_LENGTH);
    debounceRef.current = setTimeout(() => performSearch(sanitized), SEARCH_DEBOUNCE_MS);
  }

  function handleSelect(_: unknown, value: EmployeeQrInfo | null) {
    if (!value || selectedIds.has(value.employeeId) || atLimit) return;
    setSelected((prev) => [...prev, value]);
    setAutocompleteKey((k) => k + 1);
  }

  function handleRemove(employeeId: string) {
    setSelected((prev) => prev.filter((e) => e.employeeId !== employeeId));
  }

  function handleClearAll() {
    setSelected([]);
  }

  async function handleDownload() {
    if (selected.length === 0 || isDownloading) return;
    setIsDownloading(true);
    const failed: string[] = [];
    for (const emp of selected) {
      try {
        const response = await APIService.getInstance().get(
          AppConfig.serviceUrls.employeeQrCode(emp.employeeId),
          { responseType: "blob" },
        );
        const url = URL.createObjectURL(response.data as Blob);
        const a = document.createElement("a");
        a.href = url;
        const safeName = `${emp.firstName}_${emp.lastName}`.replace(/[^\w\s-]/g, "").trim();
        a.download = `${emp.employeeId}-${safeName}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 100);
      } catch {
        failed.push(`${emp.firstName} ${emp.lastName} (${emp.employeeId})`);
      }
    }
    if (failed.length > 0) {
      dispatch(
        enqueueSnackbarMessage({
          message: `Failed to export QR code for: ${failed.join(", ")}`,
          type: "error",
        }),
      );
    }
    setIsDownloading(false);
  }

  return (
    <Box sx={{ height: "100%", width: "100%", overflow: "auto" }}>
      {/* Info alert */}
      <Box sx={{ px: 2, py: 1.5 }}>
        <Alert
          severity="info"
          sx={{
            py: 0.5,
            fontSize: "0.875rem",
            "& .MuiAlert-icon": { alignItems: "center" },
          }}
        >
          Search for employees and add them to the list. Click <strong>Export QR Codes</strong> to
          save each QR as an individual PNG file. <br />
          A maximum of <strong>{QR_EXPORT_LIMIT} employees</strong> can be exported at a time.
        </Alert>
      </Box>

      <Box sx={{ px: 2, pb: 2, display: "flex", flexDirection: "column", gap: 2 }}>
        {/* Search */}
        <Autocomplete
          key={autocompleteKey}
          options={searchOptions}
          getOptionLabel={(option) =>
            `${option.firstName} ${option.lastName} (${option.employeeId})`
          }
          filterOptions={(options) =>
            options.filter((o) => !selectedIds.has(o.employeeId))
          }
          onChange={handleSelect}
          onInputChange={handleInputChange}
          disabled={atLimit}
          loading={searchLoading}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Search employees"
              placeholder="Name, employee ID, or email"
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {searchLoading && <CircularProgress size={16} />}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
          renderOption={(props, option) => (
            <Box
              component="li"
              {...props}
              key={option.employeeId}
              sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 1 }}
            >
              <Avatar
                src={option.employeeThumbnail ?? undefined}
                sx={{
                  width: 32,
                  height: 32,
                  fontSize: "0.75rem",
                  bgcolor: theme.palette.secondary.main,
                }}
              >
                {getInitials(option.firstName, option.lastName)}
              </Avatar>
              <Box>
                <Typography variant="body2" fontWeight={600}>
                  {option.firstName} {option.lastName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {option.workEmail} · {option.employeeId}
                </Typography>
              </Box>
            </Box>
          )}
          noOptionsText="No employees found"
        />

        {/* Selected employees card */}
        {selected.length > 0 && (
          <Paper
            elevation={0}
            sx={{
              backgroundColor: "background.paper",
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            {/* Card header */}
            <Box
              sx={{
                px: 2,
                py: 1.25,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                bgcolor:
                  theme.palette.mode === "dark"
                    ? theme.palette.grey[900]
                    : theme.palette.grey[100],
              }}
            >
              <Typography variant="body2" fontWeight={700}>
                Selected employees
              </Typography>
              <Typography
                variant="caption"
                fontWeight={700}
                color={atLimit ? "error" : "text.secondary"}
              >
                {selected.length} / {QR_EXPORT_LIMIT}
              </Typography>
            </Box>
            <Divider />

            {/* Employee rows */}
            {selected.map((emp, index) => {
              const missingHouse = !emp.house;
              return (
                <Box key={emp.employeeId}>
                  <Box
                    sx={{
                      px: 2,
                      py: 1.25,
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      bgcolor: missingHouse
                        ? alpha(theme.palette.error.main, 0.06)
                        : "background.paper",
                      transition: "background-color 0.15s ease",
                      "&:hover": {
                        bgcolor: missingHouse
                          ? alpha(theme.palette.error.main, 0.1)
                          : theme.palette.action.hover,
                      },
                    }}
                  >
                    <Avatar
                      src={emp.employeeThumbnail ?? undefined}
                      sx={{
                        width: 36,
                        height: 36,
                        fontSize: "0.8rem",
                        bgcolor: missingHouse
                          ? theme.palette.error.main
                          : theme.palette.secondary.main,
                        flexShrink: 0,
                      }}
                    >
                      {missingHouse
                        ? <WarningAmberIcon sx={{ fontSize: 20 }} />
                        : getInitials(emp.firstName, emp.lastName)}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" fontWeight={600} noWrap>
                        {emp.firstName} {emp.lastName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {emp.workEmail} · {emp.employeeId}
                      </Typography>
                      {missingHouse && (
                        <Typography
                          variant="caption"
                          color="error"
                          sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.25 }}
                        >
                          <WarningAmberIcon sx={{ fontSize: 13 }} />
                          No house assigned — QR code cannot be generated
                        </Typography>
                      )}
                    </Box>
                    <Tooltip title="Remove">
                      <IconButton size="small" onClick={() => handleRemove(emp.employeeId)}>
                        <CloseIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  {index < selected.length - 1 && <Divider />}
                </Box>
              );
            })}
          </Paper>
        )}

        {/* Actions */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 1.5 }}>
          {selected.length > 0 && (
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<DeleteSweepIcon />}
              onClick={handleClearAll}
              disabled={isDownloading}
              sx={{ textTransform: "none", color: "text.secondary", borderColor: "divider" }}
            >
              Clear All
            </Button>
          )}
          <Tooltip
            title={hasUnexportable ? "Remove employees with no house assigned before exporting" : ""}
          >
            <span>
              <Button
                variant="contained"
                color="secondary"
                startIcon={
                  isDownloading ? <CircularProgress size={16} color="inherit" /> : <DownloadIcon />
                }
                onClick={handleDownload}
                disabled={selected.length === 0 || isDownloading || hasUnexportable}
                sx={{ textTransform: "none" }}
              >
                {isDownloading
                  ? "Exporting..."
                  : selected.length > 0
                    ? `Export QR Codes (${selected.length})`
                    : "Export QR Codes"}
              </Button>
            </span>
          </Tooltip>
        </Box>
      </Box>
    </Box>
  );
}

export default function QrCodesReport() {
  return (
    <CommonPage
      title="QR Codes"
      icon={<QrCode2Icon />}
      commonPageTabs={[]}
      page={<QrCodesReportContent />}
    />
  );
}
