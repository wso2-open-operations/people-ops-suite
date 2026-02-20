// Copyright (c) 2024, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import { ParCycle, ParReportEntry, RequestState } from "@utils/types";
import { Box, IconButton, Link, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { ChangeEvent, useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@slices/store";
import {
  fetchReportData,
  selectReportData,
  selectReportStatus,
} from "@slices/reportSlice";
import { LoadingEffect } from "@components/ui/Loading";
import { uiMessages } from "@config/constant";
import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
  GridToolbar,
  GridToolbarExportContainer,
} from "@mui/x-data-grid";
import ParStatusChip from "@components/common/ParStatusChip";
import { getSpecialRatingEnum, getSpecialRatingLabel } from "@utils/utils";

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
    { field: "parCompany", headerName: "Company", flex: 0.5, hide: true },
    { field: "parLocation", headerName: "Location", flex: 0.5, hide: true },
    { field: "parBusinessUnit", headerName: "Business Unit", flex: 1 },
    { field: "parDepartment", headerName: "Department", flex: 1 },
    { field: "parTeam", headerName: "Team", flex: 1 },
    { field: "parSubTeam", headerName: "Sub Team", flex: 1 },
    { field: "parLeadEmail", headerName: "Lead Email", flex: 1, hide: true },
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
            pageSize={100}
            rowsPerPageOptions={[100]}
            components={{
              Toolbar: GridToolbar,
            }}
            disableSelectionOnClick
            componentsProps={{
              toolbar: {
                showQuickFilter: true,
                quickFilterProps: { debounceMs: 500 },
                value: searchText,
                onChange: (event: ChangeEvent<HTMLInputElement>) =>
                  setSearchText(event.target.value),
                components: [GridToolbarExportContainer],
              },
            }}
            initialState={{
              filter: {
                filterModel: {
                  items: [
                    {
                      id: "searchText",
                      value: searchText,
                      columnField: "searchText",
                      operatorValue: "contains",
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
