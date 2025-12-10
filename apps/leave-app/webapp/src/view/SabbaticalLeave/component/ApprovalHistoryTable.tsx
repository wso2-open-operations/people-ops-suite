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

import { Box, Chip, useTheme } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";

import { EmployeeLeaveData } from "../MockData";

export default function ApprovalHistoryTable({ rows }: { rows: EmployeeLeaveData[] }) {
  const theme = useTheme();

  const columns: GridColDef[] = [
    {
      field: "email",
      headerName: "Employee",
      type: "string",
      flex: 1,
      editable: false,
    },
    {
      field: "startDate",
      headerName: "Start Date",
      type: "date",
      flex: 1,
      editable: false,
    },
    {
      field: "endDate",
      headerName: "End Date",
      type: "date",
      flex: 1,
      editable: false,
    },
    {
      field: "status",
      headerName: "Status",
      type: "string",
      flex: 1,
      editable: false,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => {
        const status = params.value?.toLowerCase() || "";
        const displayValue = params.value || "Unknown";

        let chipProps;
        switch (status) {
          case "approved":
            chipProps = {
              color: theme.palette.success.main,
              backgroundColor: theme.palette.success.light,
            };
            break;
          case "rejected":
            chipProps = {
              color: theme.palette.error.main,
              backgroundColor: theme.palette.error.light,
            };
            break;
          case "pending":
            chipProps = {
              color: theme.palette.primary.main,
              backgroundColor: theme.palette.primary.light,
            };
            break;
          default:
            chipProps = {
              color: theme.palette.grey[600],
              backgroundColor: theme.palette.grey[200],
            };
        }

        return (
          <Chip
            label={displayValue}
            sx={{
              color: theme.palette.common.white,
              backgroundColor: chipProps.backgroundColor,
              borderRadius: "0.5rem",
              fontSize: theme.typography.caption.fontSize,
              fontWeight: 600,
              width: "10rem",
              textTransform: "capitalize",
              border: `1px solid ${chipProps.color}`,
            }}
          />
        );
      },
    },
  ];

  return (
    <Box sx={{ width: "100%" }}>
      <DataGrid
        rows={rows}
        columns={columns}
        initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
        pageSizeOptions={[10]}
        disableRowSelectionOnClick
        showToolbar
      />
    </Box>
  );
}
