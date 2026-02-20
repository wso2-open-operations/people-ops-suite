// Copyright (c) 2024, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import { ParCycle, RequestState, Team } from "@utils/types";
import { Box, Chip, IconButton, Link, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useState } from "react";
import { useAppSelector } from "@slices/store";
import { LoadingEffect } from "@components/ui/Loading";
import { uiMessages } from "@config/constant";
import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
  GridToolbar,
  GridToolbarExportContainer,
} from "@mui/x-data-grid";
import { selectAllTeams, selectTeamStatus } from "@slices/teamSlice";
import { getCombinedTeams } from "@utils/utils";

interface CompletionProps {
  parCycle: Partial<ParCycle>;
  closeCompletionView: () => void;
  isAdminHistoryViewOn?: boolean;
}

export const Completion = ({
  parCycle,
  closeCompletionView,
  isAdminHistoryViewOn,
}: CompletionProps) => {
  const teams = useAppSelector(selectAllTeams);
  const teamState = useAppSelector(selectTeamStatus);
  const [searchText, setSearchText] = useState("");

  const formattedTeams = getCombinedTeams(teams).map((team) => {
    return {
      ...team,
      id: team.parTeamId,
      employeePARCompletion: Number(
        (
          (team.summary.employeeParCompletedCount / team.numberOfTeamMembers) *
          100
        ).toFixed(1)
      ),
      leadReviewCompletion: Number(
        (
          (team.summary.leadsReviewCompletedCount / team.numberOfTeamMembers) *
          100
        ).toFixed(1)
      ),
      f2fCompletion: Number(
        (
          (team.summary.f2fCompletedCount / team.numberOfTeamMembers) *
          100
        ).toFixed(1)
      ),
    };
  });

  const columns: GridColDef[] = [
    { field: "parBusinessUnit", headerName: "BU", flex: 0.15 },
    { field: "parDepartment", headerName: "Department", flex: 0.15 },
    { field: "parTeam", headerName: "Team", flex: 0.15 },
    {
      field: "employeePARCompletion",
      headerName: "Employee PAR (%)",
      flex: 0.15,
      renderCell: (params: GridRenderCellParams<Team>) => (
        <Chip size="small" label={params.row.employeePARCompletion} />
      ),
    },
    {
      field: "leadReviewCompletion",
      headerName: "Lead's Feedback (%)",
      flex: 0.15,
      renderCell: (params: GridRenderCellParams<Team>) => (
        <Chip size="small" label={params.row.leadReviewCompletion} />
      ),
    },
    {
      field: "f2fCompletion",
      headerName: "F2F",
      flex: 0.1,
      renderCell: (params: GridRenderCellParams<Team>) => (
        <Chip size="small" label={params.row.f2fCompletion} />
      ),
      hide: true,
    },
  ];

  return (
    <Box>
      <Box mb={2}>
        <IconButton
          aria-label="back"
          color="primary"
          onClick={closeCompletionView}
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
          variant="h4"
          onClick={closeCompletionView}
        >
          {parCycle.parCycleName}
        </Link>
        <Typography display={"inline"} variant="h5">
          {" / Completion Overview"}
        </Typography>
      </Box>

      {teamState === RequestState.LOADING && (
        <LoadingEffect message={uiMessages.loading.pageLoading} />
      )}

      {teamState === RequestState.SUCCEEDED && (
        <Box height={"calc(100vh - 23rem)"}>
          <DataGrid
            sx={{
              border: "none",
            }}
            rows={formattedTeams}
            columns={columns}
            pageSize={10}
            rowsPerPageOptions={[10]}
            rowHeight={60}
            disableSelectionOnClick
            components={{
              Toolbar: GridToolbar,
            }}
            componentsProps={{
              toolbar: {
                showQuickFilter: true,
                quickFilterProps: { debounceMs: 500 },
                value: searchText,
                onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
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
