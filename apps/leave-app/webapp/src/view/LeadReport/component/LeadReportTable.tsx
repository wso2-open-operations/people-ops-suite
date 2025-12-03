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

import { rows } from "../MockData";

export default function LeadReportTable() {
  const columns: GridColDef[] = [
    {
      field: "employee",
      headerName: "Employee Name",
      flex: 1,
    },
    {
      field: "other",
      headerName: "Other",
      type: "number",
      flex: 1,
    },
    {
      field: "annual",
      headerName: "Annual",
      type: "number",
      flex: 1,
    },
    {
      field: "paternity",
      headerName: "Paternity",
      flex: 1,
      type: "number",
    },
    {
      field: "maternity",
      headerName: "Maternity",
      flex: 1,
      type: "number",
    },
    {
      field: "lieu",
      headerName: "Lieu",
      flex: 1,
      type: "number",
    },
    {
      field: "totalExclLieu",
      headerName: "Total (Excl. Lieu)",
      flex: 1,
      type: "number",
    },
    {
      field: "total",
      headerName: "Total",
      flex: 1,
      type: "number",
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
