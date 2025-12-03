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

import Box from "@mui/material/Box";
import { DataGrid, GridColDef } from "@mui/x-data-grid";

import { EmployeeLeaveData } from "../MockData";

export default function ApprovalHistoryTable({ rows }: { rows: EmployeeLeaveData[] }) {
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
      field: "Status",
      headerName: "Status",
      type: "string",
      flex: 1,
      editable: false,
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
