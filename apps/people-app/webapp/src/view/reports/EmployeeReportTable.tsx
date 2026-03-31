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

import {
  Alert,
  alpha,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControlLabel,
  Skeleton,
  Switch,
  Tooltip,
  useTheme,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import { DataGrid, GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import {
  downloadEmployeeReportByStatus,
  Employee,
  EmployeeStatus,
  fetchFilteredEmployees,
} from "@slices/employeeSlice/employee";
import { useAppDispatch } from "@slices/store";
import { unwrapResult } from "@reduxjs/toolkit";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { getEmployeeStatusColor } from "@utils/utils";

const PREVIEW_LIMIT = 10;

interface EmployeeReportTableProps {
  employeeStatus: EmployeeStatus;
  previewAlertText: ReactNode;
  countChipLabel: string;
  downloadFilename: string;
  showExcludeFutureFilter?: boolean;
}

export default function EmployeeReportTable({
  employeeStatus,
  previewAlertText,
  countChipLabel,
  downloadFilename,
  showExcludeFutureFilter = true,
}: EmployeeReportTableProps) {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const [downloading, setDownloading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [rows, setRows] = useState<Employee[]>([]);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [excludeFutureStartDate, setExcludeFutureStartDate] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setRows([]);
    setTotalCount(null);
    dispatch(
      fetchFilteredEmployees({
        filters: { employeeStatus, excludeFutureStartDate: showExcludeFutureFilter ? excludeFutureStartDate : undefined },
        pagination: { limit: PREVIEW_LIMIT, offset: 0 },
        sort: { sortField: "employeeId", sortOrder: "ASC" },
        leadOnly: false,
      }),
    ).then((action) => {
      if (cancelled) return;
      if (fetchFilteredEmployees.fulfilled.match(action)) {
        setRows(action.payload.employees ?? []);
        setTotalCount(action.payload.totalCount ?? null);
      }
      setIsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [dispatch, employeeStatus, excludeFutureStartDate, showExcludeFutureFilter]);

  function getFullName(firstName: string, lastName: string) {
    return `${firstName || ""} ${lastName || ""}`.trim();
  }

  const columns: GridColDef<Employee>[] = useMemo(
    () => [
      {
        field: "employeeId",
        headerName: "Employee ID",
        flex: 0.5,
        width: 100,
        resizable: false,
      },
      {
        field: "fullName",
        headerName: "Employee",
        flex: 1,
        minWidth: 200,
        resizable: false,
        valueGetter: (_value, row) => getFullName(row.firstName, row.lastName),
        renderCell: (params: GridRenderCellParams<Employee>) => (
          <Tooltip title={params.value || ""} arrow>
            <Box
              sx={{
                fontWeight: 600,
                color: theme.palette.text.primary,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {params.value}
            </Box>
          </Tooltip>
        ),
      },
      {
        field: "workEmail",
        headerName: "Email",
        flex: 1,
        minWidth: 220,
        resizable: false,
        renderCell: (params: GridRenderCellParams<Employee>) => (
          <Tooltip title={params.value || ""} arrow>
            <Box
              sx={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                color: theme.palette.text.primary,
              }}
            >
              {params.value}
            </Box>
          </Tooltip>
        ),
      },
      {
        field: "company",
        headerName: "Company",
        flex: 0.7,
        minWidth: 120,
        resizable: false,
        renderCell: (params: GridRenderCellParams<Employee>) => (
          <Tooltip title={params.value || "N/A"} arrow>
            <Box
              sx={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                color: theme.palette.text.primary,
              }}
            >
              {params.value || "N/A"}
            </Box>
          </Tooltip>
        ),
      },
      {
        field: "designation",
        headerName: "Designation",
        flex: 0.8,
        minWidth: 140,
        resizable: false,
        renderCell: (params: GridRenderCellParams<Employee>) => (
          <Tooltip title={params.value || "N/A"} arrow>
            <Box
              sx={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                color: theme.palette.text.primary,
              }}
            >
              {params.value || "N/A"}
            </Box>
          </Tooltip>
        ),
      },
      {
        field: "employmentType",
        headerName: "Employment Type",
        flex: 0.8,
        minWidth: 130,
        resizable: false,
        renderCell: (params: GridRenderCellParams<Employee>) => (
          <Tooltip title={params.value || "N/A"} arrow>
            <Box
              sx={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                color: theme.palette.text.primary,
              }}
            >
              {params.value || "N/A"}
            </Box>
          </Tooltip>
        ),
      },
      {
        field: "employeeStatus",
        headerName: "Status",
        width: 110,
        resizable: false,
        align: "center",
        headerAlign: "center",
        renderCell: (params: GridRenderCellParams<Employee>) => (
          <Chip
            label={params.value || "Unknown"}
            variant="outlined"
            size="small"
            color={getEmployeeStatusColor(params.value)}
            sx={{
              fontWeight: 700,
              fontSize: "0.7rem",
              height: 24,
              borderRadius: 2,
              border: 1,
            }}
          />
        ),
      },
    ],
    [theme],
  );

  const SkeletonRowsOverlay = useMemo(() => {
    return function Overlay() {
      return (
        <Box sx={{ width: "100%", pb: 1 }}>
          {Array.from({ length: PREVIEW_LIMIT }).map((_, index) => (
            <Box
              key={index}
              sx={{
                display: "grid",
                gridTemplateColumns: columns
                  .map((col) =>
                    col.width
                      ? `${col.width}px`
                      : col.flex
                        ? `${col.flex}fr`
                        : "1fr",
                  )
                  .join(" "),
                alignItems: "center",
                height: 52,
                px: 2,
                gap: 2,
                borderBottom: `1px solid ${theme.palette.divider}`,
              }}
            >
              {columns.map((col, colIndex) => {
                if (col.field === "employeeStatus") {
                  return (
                    <Box
                      key={colIndex}
                      sx={{ display: "flex", justifyContent: "center" }}
                    >
                      <Skeleton
                        variant="rounded"
                        width={80}
                        height={22}
                        sx={{ borderRadius: 3 }}
                      />
                    </Box>
                  );
                }
                return (
                  <Box key={colIndex}>
                    <Skeleton
                      variant="rectangular"
                      width={col.field === "employeeId" ? "80%" : "75%"}
                      height={20}
                      sx={{ borderRadius: 3 }}
                    />
                  </Box>
                );
              })}
            </Box>
          ))}
        </Box>
      );
    };
  }, [columns, theme.palette.divider]);

  async function handleExport() {
    setDownloading(true);
    try {
      const csvText = unwrapResult(
        await dispatch(downloadEmployeeReportByStatus({ status: employeeStatus, excludeFutureStartDate: showExcludeFutureFilter ? excludeFutureStartDate : undefined })),
      );
      const blob = new Blob([csvText], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = downloadFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch {
      // Error message already dispatched by the thunk.
    } finally {
      setDownloading(false);
    }
  }

  return (
    <Box sx={{ height: "100%", width: "100%", overflow: "auto" }}>
      <Box
        sx={{
          px: 2,
          py: 1.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Alert
          severity="info"
          sx={{
            py: 0.5,
            flex: 1,
            fontSize: "0.875rem",
            "& .MuiAlert-icon": { alignItems: "center" },
          }}
        >
          {previewAlertText}
        </Alert>
        {showExcludeFutureFilter && (
          <FormControlLabel
            control={
              <Switch
                checked={excludeFutureStartDate}
                onChange={(e) => setExcludeFutureStartDate(e.target.checked)}
                size="small"
                sx={{
                  "& .MuiSwitch-switchBase.Mui-checked": { color: theme.palette.secondary.contrastText },
                  "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { backgroundColor: theme.palette.secondary.contrastText, opacity: 0.7 },
                }}
              />
            }
            label="Exclude future joiners"
            sx={{ flexShrink: 0, mr: 0, ml: 1 }}
          />
        )}
        <Chip
          size="small"
          label={
            <>
              <Box
                component="span"
                sx={{
                  lineHeight: 1,
                  display: "flex",
                  alignItems: "center",
                  fontSize: "11px",
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                  color: theme.palette.text.secondary,
                  textTransform: "capitalize",
                }}
              >
                {countChipLabel}
              </Box>
              <Box
                component="span"
                sx={{
                  fontSize: "14px",
                  fontWeight: 700,
                  lineHeight: 1,
                  color:
                    theme.palette.mode === "dark"
                      ? theme.palette.grey[100]
                      : theme.palette.grey[800],
                }}
              >
                {isLoading
                  ? "—"
                  : (totalCount ?? "—")}
              </Box>
            </>
          }
          sx={{
            flexShrink: 0,
            height: "auto",
            borderRadius: "100px",
            border: `1px solid ${theme.palette.text.disabled}`,
            backgroundColor:
              theme.palette.mode === "dark"
                ? theme.palette.background.paper
                : "#fff",
            "& .MuiChip-label": {
              padding: "6px 14px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            },
          }}
        />
        <Button
          variant="contained"
          color="secondary"
          sx={{ textTransform: "none", flexShrink: 0 }}
          startIcon={
            downloading ? (
              <CircularProgress size={14} color="inherit" />
            ) : (
              <DownloadIcon />
            )
          }
          onClick={handleExport}
          disabled={downloading}
        >
          Export CSV
        </Button>
      </Box>
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr", px: 2, pb: 2 }}>
        <DataGrid
          columns={columns}
          rows={isLoading ? [] : rows}
          getRowId={(row: Employee) => row.employeeId}
          hideFooter
          loading={isLoading}
          autoHeight={false}
          disableRowSelectionOnClick
          disableColumnMenu
          disableColumnFilter
          disableColumnSelector
          disableColumnSorting
          slots={{ loadingOverlay: SkeletonRowsOverlay }}
          sx={{
            width: "100%",
            "& .MuiDataGrid-columnHeaders": {
              backgroundColor:
                theme.palette.mode === "dark"
                  ? theme.palette.grey[800]
                  : theme.palette.grey[100],
              fontSize: "0.875rem",
              fontWeight: 700,
              color: theme.palette.text.primary,
              borderBottom: `0px solid ${theme.palette.divider}`,
              minHeight: "56px !important",
              maxHeight: "56px !important",
            },
            "& .MuiDataGrid-columnHeader": {
              borderBottom: 0,
              backgroundColor: theme.palette.background.paper,
              "&:focus, &:focus-within": { outline: "none" },
            },
            "& .MuiDataGrid-columnHeaderTitle": { fontWeight: 700 },
            "& .MuiDataGrid-virtualScroller": {
              ...(isLoading && {
                minHeight: `${PREVIEW_LIMIT * 52}px !important`,
              }),
            },
            "& .MuiDataGrid-cell": {
              display: "flex",
              alignItems: "center",
              fontSize: "0.875rem",
              py: 1.5,
              borderBottom: `1px solid ${theme.palette.divider}`,
              borderTop: 0,
              "&:focus, &:focus-within": { outline: "none" },
            },
            "& .MuiDataGrid-row": {
              backgroundColor: alpha(theme.palette.background.paper, 0.5),
              transition: "background-color 0.2s ease",
              "&:hover": { backgroundColor: theme.palette.action.hover },
              "&.Mui-selected": {
                backgroundColor: theme.palette.action.selected,
                "&:hover": { backgroundColor: theme.palette.action.focus },
              },
            },
            "& .MuiDataGrid-filler": { display: "none" },
          }}
        />
      </Box>
    </Box>
  );
}
