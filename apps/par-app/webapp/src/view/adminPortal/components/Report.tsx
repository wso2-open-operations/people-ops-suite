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

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Box, IconButton, Link, Typography } from "@mui/material";
import { DataGrid, GridColDef, GridRenderCellParams, useGridApiRef } from "@mui/x-data-grid";

import { useEffect } from "react";

import { DataGridToolbar } from "@component/common/DataGridToolbar";
import ParStatusChip from "@component/common/ParStatusChip";
import { LoadingEffect } from "@component/ui/Loading";
import { uiMessages } from "@config/constant";
import { ParCycle } from "@root/src/slices/parCycleSlice/parCycle";
import {
  ParReportEntry,
  fetchReportData,
  selectReportData,
  selectReportStatus,
} from "@slices/reportSlice/report";
import { useAppDispatch, useAppSelector } from "@slices/store";
import { RequestState } from "@utils/types";
import { getSpecialRatingLabel } from "@utils/utils";

const statusChipColumn = (
  field: keyof ParReportEntry,
  headerName: string,
  overrides?: Partial<GridColDef<ParReportEntry>>,
): GridColDef<ParReportEntry> => ({
  field,
  headerName,
  flex: 0.7,
  minWidth: 110,
  align: "center",
  renderCell: (params: GridRenderCellParams<ParReportEntry>) => (
    <ParStatusChip content={(params.row[field] as string) ?? ""} />
  ),
  ...overrides,
});

interface ReportProps {
  parCycle: Partial<ParCycle>;
  closeReportView: () => void;
  isAdminHistoryViewOn?: boolean;
}

export const Report = ({ parCycle, closeReportView, isAdminHistoryViewOn }: ReportProps) => {
  const dispatch = useAppDispatch();
  const reportDataStatus = useAppSelector(selectReportStatus);
  const reportData = useAppSelector(selectReportData);
  const apiRef = useGridApiRef();
  const usableReportData = reportData.map((data: ParReportEntry) => ({
    ...data,
    id: data.parRatingId,
  }));

  const columns: GridColDef<ParReportEntry>[] = [
    { field: "parEmployeeEmail", headerName: "Employee Email", flex: 1.5, minWidth: 200 },
    { field: "parCompany", headerName: "Company", flex: 0.8, minWidth: 110 },
    { field: "parLocation", headerName: "Location", flex: 0.8, minWidth: 110 },
    { field: "parBusinessUnit", headerName: "Business Unit", flex: 1, minWidth: 140 },
    { field: "parDepartment", headerName: "Department", flex: 1, minWidth: 140 },
    { field: "parTeam", headerName: "Team", flex: 1, minWidth: 120 },
    { field: "parSubTeam", headerName: "Sub Team", flex: 1, minWidth: 120 },
    { field: "parLeadEmail", headerName: "Lead Email", flex: 1.5, minWidth: 200 },
    statusChipColumn("parRating", "Rating"),
    statusChipColumn("parSpecialRating", "Top 5%/20%", {
      valueGetter: (_value, row) => getSpecialRatingLabel(row.parSpecialRating),
    }),
    statusChipColumn("parEmployeeStatus", "Employee PAR", { flex: 0.8, minWidth: 130 }),
    statusChipColumn("parLeadStatus", "Lead's PAR"),
    statusChipColumn("parF2fStatus", "F2F", { flex: 0.5, minWidth: 90 }),
  ];

  useEffect(() => {
    if (parCycle.parCycleId) {
      dispatch(fetchReportData(parCycle.parCycleId));
    }
  }, [dispatch, parCycle.parCycleId]);

  return (
    <Box>
      <Box>
        <IconButton
          aria-label="back"
          color="primary"
          onClick={closeReportView}
          sx={{ mb: 1, mr: 1 }}
        >
          <ArrowBackIcon />
        </IconButton>
        {isAdminHistoryViewOn && (
          <Typography display={"inline"} variant="h5">
            {` History / `}
          </Typography>
        )}
        <Link underline="hover" color="textPrimary" variant="h5" onClick={closeReportView}>
          {parCycle.parCycleName}
        </Link>
        <Typography display={"inline"} variant="h5">
          {" / Report"}
        </Typography>
      </Box>

      {reportDataStatus === RequestState.LOADING && (
        <LoadingEffect message={uiMessages.loading.pageLoading} />
      )}

      {reportDataStatus === RequestState.SUCCEEDED && (
        <Box
          sx={{
            height: "calc(100vh - 12rem)",
            minHeight: 400,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Box display="flex" justifyContent="flex-end" sx={{ mb: 0.5, flexShrink: 0 }}>
            <DataGridToolbar apiRef={apiRef} />
          </Box>
          <DataGrid
            apiRef={apiRef}
            rows={usableReportData}
            columns={columns}
            rowHeight={36}
            disableRowSelectionOnClick
            pageSizeOptions={[25, 50, 100]}
            sx={{ flex: 1, minHeight: 0 }}
            initialState={{
              columns: {
                columnVisibilityModel: {
                  parCompany: false,
                  parLocation: false,
                  parLeadEmail: false,
                },
              },
              pagination: {
                paginationModel: { pageSize: 100, page: 0 },
              },
            }}
          />
        </Box>
      )}
    </Box>
  );
};
