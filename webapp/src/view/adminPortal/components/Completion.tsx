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
import { Box, Chip, IconButton, Link, Typography } from "@mui/material";
import { DataGrid, GridColDef, GridRenderCellParams, useGridApiRef } from "@mui/x-data-grid";

import { DataGridToolbar } from "@component/common/DataGridToolbar";
import { LoadingEffect } from "@component/ui/Loading";
import { uiMessages } from "@config/constant";
import { ParCycle } from "@root/src/slices/parCycleSlice/parCycle";
import { useAppSelector } from "@slices/store";
import { selectAllTeams, selectTeamStatus } from "@slices/teamSlice/team";
import { RequestState } from "@utils/types";
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
  const apiRef = useGridApiRef();

  const formattedTeams = getCombinedTeams(teams).map((team) => ({
    ...team,
    id: team.parTeamId,
    employeePARCompletion: Number(
      ((team.summary.employeeParCompletedCount / team.numberOfTeamMembers) * 100).toFixed(1),
    ),
    leadReviewCompletion: Number(
      ((team.summary.leadsReviewCompletedCount / team.numberOfTeamMembers) * 100).toFixed(1),
    ),
    f2fCompletion: Number(
      ((team.summary.f2fCompletedCount / team.numberOfTeamMembers) * 100).toFixed(1),
    ),
  }));

  const columns: GridColDef[] = [
    { field: "parBusinessUnit", headerName: "BU", flex: 0.15 },
    { field: "parDepartment", headerName: "Department", flex: 0.15 },
    { field: "parTeam", headerName: "Team", flex: 0.15 },
    {
      field: "employeePARCompletion",
      headerName: "Employee PAR (%)",
      flex: 0.15,
      renderCell: (params: GridRenderCellParams) => (
        <Chip size="small" label={params.row.employeePARCompletion} />
      ),
    },
    {
      field: "leadReviewCompletion",
      headerName: "Lead's Feedback (%)",
      flex: 0.15,
      renderCell: (params: GridRenderCellParams) => (
        <Chip size="small" label={params.row.leadReviewCompletion} />
      ),
    },
    {
      field: "f2fCompletion",
      headerName: "F2F",
      flex: 0.1,
      renderCell: (params: GridRenderCellParams) => (
        <Chip size="small" label={params.row.f2fCompletion} />
      ),
    },
  ];

  return (
    <Box>
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        mt={1}
        mb={1}
      >
        <Box>
          <IconButton
            aria-label="back"
            color="primary"
            onClick={closeCompletionView}
            sx={{ mr: 1, ml: -1 }}
          >
            <ArrowBackIcon />
          </IconButton>
          {isAdminHistoryViewOn && (
            <Typography display="inline" variant="h5">
              {` History / `}
            </Typography>
          )}
          <Link underline="hover" color="text.primary" variant="h5" onClick={closeCompletionView}>
            {parCycle.parCycleName}
          </Link>
          <Typography display="inline" variant="h5">
            {" / Completion Overview"}
          </Typography>
        </Box>

        {teamState === RequestState.SUCCEEDED && (
          <DataGridToolbar apiRef={apiRef} />
        )}
      </Box>

      {teamState === RequestState.LOADING && (
        <Box sx={{ height: "calc(100vh - 28rem)" }}>
          <LoadingEffect message={uiMessages.loading.pageLoading} />
        </Box>
      )}

      {teamState === RequestState.SUCCEEDED && (
        <DataGrid
          apiRef={apiRef}
          sx={{ border: "none", height: "auto", ml: 3 }}
          rows={formattedTeams}
          columns={columns}
          rowHeight={50}
          disableRowSelectionOnClick
          pageSizeOptions={[10, 20, 25]}
          initialState={{
            columns: {
              columnVisibilityModel: { f2fCompletion: false },
            },
            pagination: {
              paginationModel: { pageSize: 10, page: 0 },
            },
          }}
        />
      )}
    </Box>
  );
};
