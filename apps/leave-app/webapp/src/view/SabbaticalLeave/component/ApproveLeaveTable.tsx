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

import { Box, Button, useTheme } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";

import { EmployeeApprovalData } from "../MockData";

export default function ApproveLeaveTable({ rows }: { rows: EmployeeApprovalData[] }) {
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
      field: "approval",
      headerName: "Approval",
      flex: 1,
      editable: false,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <Box
          display="flex"
          flexDirection="row"
          justifyContent="space-around"
          alignItems="center"
          width="100%"
          height="100%"
        >
          <Button
            sx={{
              backgroundColor: theme.palette.primary.main,
              color: "white",
              width: "40%",
              ":hover": { backgroundColor: theme.palette.primary.light },
            }}
          >
            Approve
          </Button>
          <Button
            sx={{
              backgroundColor: theme.palette.error.main,
              color: "white",
              width: "40%",
              ":hover": { backgroundColor: theme.palette.error.light },
            }}
          >
            Reject
          </Button>
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ width: "100%" }}>
      <DataGrid
        rows={rows}
        columns={columns}
        initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
        pageSizeOptions={[5]}
        disableRowSelectionOnClick
        showToolbar
      />
    </Box>
  );
}
