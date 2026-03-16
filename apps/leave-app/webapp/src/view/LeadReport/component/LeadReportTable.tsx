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

import { Chip, Stack, useTheme } from "@mui/material";
import Box from "@mui/material/Box";
import { DataGrid, GridColDef } from "@mui/x-data-grid";

import { SingleLeaveHistory } from "@root/src/types/types";

interface LeadReportTableProps {
  rows: SingleLeaveHistory[];
  loading: boolean;
}

export default function LeadReportTable({ rows, loading }: LeadReportTableProps) {
  const theme = useTheme();
  const totalDays = rows.reduce((sum, r) => sum + (r.numberOfDays ?? 0), 0);

  const perEmployeeDays = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.email] = (acc[r.email] ?? 0) + (r.numberOfDays ?? 0);
    return acc;
  }, {});
  const uniqueEmployees = Object.keys(perEmployeeDays);
  const isMultipleEmployees = uniqueEmployees.length > 1;

  const columns: GridColDef[] = [
    {
      field: "email",
      headerName: "Employee",
      flex: 1.5,
    },
    {
      field: "leaveType",
      headerName: "Leave Type",
      flex: 1,
      renderCell: (params) => (
        <span>
          {String(params.value)
            .replace(/_/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase())}
        </span>
      ),
    },
    {
      field: "startDate",
      headerName: "Start Date",
      flex: 1,
      renderCell: (params) => <span>{String(params.value ?? "").substring(0, 10)}</span>,
    },
    {
      field: "endDate",
      headerName: "End Date",
      flex: 1,
      renderCell: (params) => <span>{String(params.value ?? "").substring(0, 10)}</span>,
    },
    {
      field: "numberOfDays",
      headerName: "Days",
      type: "number",
      flex: 0.6,
    },
    {
      field: "periodType",
      headerName: "Period",
      flex: 0.8,
    },
  ];

  return (
    <Box sx={{ width: "100%" }}>
      <Stack direction="row" justifyContent="flex-end" flexWrap="wrap" gap={1} mb={1}>
        {isMultipleEmployees
          ? uniqueEmployees.map((email) => (
              <Chip
                key={email}
                label={`${email}: ${perEmployeeDays[email]} day${perEmployeeDays[email] !== 1 ? "s" : ""}`}
                size="small"
              />
            ))
          : null}
        <Chip
          label={`Total: ${totalDays} day${totalDays !== 1 ? "s" : ""}`}
          size="small"
          color="primary"
        />
      </Stack>
      <DataGrid
        rows={rows}
        columns={columns}
        loading={loading}
        initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
        pageSizeOptions={[5, 10, 25]}
        disableRowSelectionOnClick
        showToolbar
        slotProps={{
          columnsPanel: {
            sx: {
              "& .MuiTypography-root": {
                color: theme.palette.text.primary,
              },
            },
          },
        }}
      />
    </Box>
  );
}
