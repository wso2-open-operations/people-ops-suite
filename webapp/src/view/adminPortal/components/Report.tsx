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

import { RequestState } from "@utils/types";
import { Box, IconButton, Link, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { ChangeEvent, useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@slices/store";
import {
  fetchReportData,
  ParReportEntry,
  selectReportData,
  selectReportStatus,
} from "@slices/reportSlice/report";
import { LoadingEffect } from "@component/ui/Loading";
import { uiMessages } from "@config/constant";
import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
  GridToolbar,
  GridToolbarExportContainer,
} from "@mui/x-data-grid";
import ParStatusChip from "@component/common/ParStatusChip";
import { getSpecialRatingEnum, getSpecialRatingLabel } from "@utils/utils";
import { ParCycle } from "@root/src/slices/parCycleSlice/parCycle";

interface ReportProps {
  parCycle: Partial<ParCycle>;
  closeReportView: () => void;
  isAdminHistoryViewOn?: boolean;
}

export const Report = ({
  parCycle,
  closeReportView,
  isAdminHistoryViewOn,
}: ReportProps) => {
  const dispatch = useAppDispatch();
  const reportDataStatus = useAppSelector(selectReportStatus);
  const reportData = useAppSelector(selectReportData);
  const [searchText, setSearchText] = useState("");

  const usableReportData = reportData.map((data: ParReportEntry) => {
    return {
      ...data,
      id: data.parRatingId,
      parSpecialRating: getSpecialRatingLabel(data.parSpecialRating),
    };
  });

  const columns: GridColDef[] = [
    { field: "parEmployeeEmail", headerName: "Employee Email", flex: 1 },
    { field: "parCompany", headerName: "Company", flex: 0.5 },
    { field: "parLocation", headerName: "Location", flex: 0.5 },
    { field: "parBusinessUnit", headerName: "Business Unit", flex: 1 },
    { field: "parDepartment", headerName: "Department", flex: 1 },
    { field: "parTeam", headerName: "Team", flex: 1 },
    { field: "parSubTeam", headerName: "Sub Team", flex: 1 },
    { field: "parLeadEmail", headerName: "Lead Email", flex: 1, },
    {
      field: "parRating",
      headerName: "Rating",
      flex: 0.5,
      renderCell: (params: GridRenderCellParams<ParReportEntry>) => (
        <ParStatusChip content={params.row?.parRating || ""} />
      ),
    },
    {
      field: "parSpecialRating",
      headerName: "Top 5%/20% Rating",
      flex: 0.5,
      renderCell: (params: GridRenderCellParams<ParReportEntry>) => (
        <ParStatusChip
          content={getSpecialRatingEnum(params.row?.parSpecialRating) ?? ""}
        />
      ),
    },
    {
      field: "parEmployeeStatus",
      headerName: "Employee Status",
      flex: 0.5,
      renderCell: (params: GridRenderCellParams<ParReportEntry>) => (
        <ParStatusChip content={params.row?.parEmployeeStatus || ""} />
      ),
    },
    {
      field: "parLeadStatus",
      headerName: "Lead Status",
      flex: 0.5,
      renderCell: (params: GridRenderCellParams<ParReportEntry>) => (
        <ParStatusChip content={params.row?.parLeadStatus || ""} />
      ),
    },
    {
      field: "parF2fStatus",
      headerName: "F2F Status",
      flex: 0.5,
      renderCell: (params: GridRenderCellParams<ParReportEntry>) => (
        <ParStatusChip content={params.row?.parF2fStatus || ""} />
      ),
    },
  ];

  useEffect(() => {
    if (parCycle.parCycleId) {
      dispatch(fetchReportData(parCycle.parCycleId));
    }
  }, [dispatch, parCycle.parCycleId]);

  return (
    <Box>
      <Box mb={2}>
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
        <Link
          underline="hover"
          color="inherit"
          variant="h5"
          onClick={closeReportView}
        >
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
        <Box height={"calc(100vh - 23rem)"}>
          <DataGrid
            sx={{ p: 1, gap: 2 }}
            rows={usableReportData}
            columns={columns}
            disableRowSelectionOnClick
            pageSizeOptions={[100]}
            slots={{
              toolbar: GridToolbar,
            }}
            slotProps={{
              toolbar: {
                showQuickFilter: true,
                quickFilterProps: { debounceMs: 500 },
              },
            }}
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
              filter: {
                filterModel: {
                  items: [
                    {
                      id: "searchText",
                      value: searchText,
                      field: "searchText",
                      operator: "contains",
                    },
                  ],
                },
              },
            }}
          />
        </Box>
      )}
    </Box>
  );
};
