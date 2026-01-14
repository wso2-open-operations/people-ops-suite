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

import { useMemo } from "react";

import { LeadReportResponse } from "@root/src/types/types";

interface LeadReportTableProps {
  reportData: LeadReportResponse | null;
  loading: boolean;
}

export default function LeadReportTable({ reportData, loading }: LeadReportTableProps) {
  const rows = useMemo(() => {
    if (!reportData) return [];

    return Object.entries(reportData).map(([email, data]) => ({
      id: email,
      employee: email,
      annual: data.casual || 0, // since annual and casual are combined
      paternity: data.paternity || 0,
      maternity: data.maternity || 0,
      lieu: data.lieu || 0,
      sabbatical: data.sabbatical || 0,
      totalExclLieu: data.totalExLieu || 0,
      total: data.total || 0,
    }));
  }, [reportData]);

  const columns: GridColDef[] = [
    {
      field: "employee",
      headerName: "Employee Name",
      flex: 1,
    },
    {
      field: "annual",
      headerName: "Annual/Casual",
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
      field: "sabbatical",
      headerName: "Sabbatical",
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
        loading={loading}
        initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
        pageSizeOptions={[5, 10, 25]}
        disableRowSelectionOnClick
      />
    </Box>
  );
}
