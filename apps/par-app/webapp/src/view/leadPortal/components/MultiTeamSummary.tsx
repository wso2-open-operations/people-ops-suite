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

import DateRangeIcon from "@mui/icons-material/DateRange";
import { Box, Button, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import { DataGrid, GridColDef, GridRowParams, useGridApiRef } from "@mui/x-data-grid";
import dayjs from "dayjs";

import { Dispatch, SetStateAction, useState } from "react";

import { shortDateFormat, tooltipVisibilityDelay, uiMessages } from "@config/constant";
import { RequestState } from "@utils/types";
import { calculateAllTeamsSummary } from "@utils/utils";

import { selectCurrentCycle } from "@slices/parCycleSlice/parCycle";
import { sendAllThreeSixtyReminder } from "@slices/reminderSlice/reminder";
import { useAppDispatch, useAppSelector } from "@slices/store";
import { AllTeamsSummary, Team, selectTeamStatus } from "@slices/teamSlice/team";

import { CompletionStatusSection } from "@component/common/CompletionStatusSection";
import { ConfirmationDialog } from "@component/common/ConfirmationDialog";
import { CycleDatesStepper } from "@component/common/CycleDatesStepper";
import { DataGridToolbar } from "@component/common/DataGridToolbar";
import { LoadingEffect } from "@component/ui/Loading";

interface MultiTeamSummaryProps {
  filteredSummary: AllTeamsSummary;
  formattedTeams: Team[];
  columns: GridColDef[];
  handleTeamChange: (params: GridRowParams) => void;
  setFilteredSummary: Dispatch<SetStateAction<AllTeamsSummary>>;
}

export const MultiTeamSummary = ({
  filteredSummary,
  formattedTeams,
  columns,
  handleTeamChange,
  setFilteredSummary,
}: MultiTeamSummaryProps) => {
  const currentCycle = useAppSelector(selectCurrentCycle);
  const dispatch = useAppDispatch();
  const teamState = useAppSelector(selectTeamStatus);
  const apiRef = useGridApiRef();

  // Stores state of 360 reminder confirmation open/ close
  const [is360ReminderDialogOpen, setIs360ReminderDialogOpen] = useState(false);
  const [isParCycleDatesOpen, setIsParCycleDatesOpen] = useState(false);

  const open360ReminderDialog = () => setIs360ReminderDialogOpen(true);
  const close360ReminderDialog = () => setIs360ReminderDialogOpen(false);

  const send360reminder = async () => {
    const resultAction = await dispatch(sendAllThreeSixtyReminder());

    if (sendAllThreeSixtyReminder.fulfilled.match(resultAction)) {
      close360ReminderDialog();
    }
  };

  const openCycleDeadlines = () => {
    setIsParCycleDatesOpen(true);
  };
  const closeCycleDeadlines = () => {
    setIsParCycleDatesOpen(false);
  };

  return (
    <Box sx={{ height: "fit-content", minHeight: "70vh" }}>
      <Stack mb={1} display={"flex"} flexDirection={"row"} justifyContent={"space-between"}>
        <Box display={"flex"} alignItems={"end"} mb={1}>
          <Typography display={"inline"} variant="h4">
            {currentCycle.parCycleName}{" "}
          </Typography>
          <Typography display={"inline"} color="text.secondary">
            ({dayjs(currentCycle.parCycleStartDate).format(shortDateFormat)} -{" "}
            {dayjs(currentCycle.parCycleEndDate).format(shortDateFormat)})
          </Typography>
        </Box>
        <Box sx={{ justifyContent: "flex-end" }}>
          <Tooltip
            arrow
            title="Open Cycle Dates"
            enterDelay={tooltipVisibilityDelay}
            enterNextDelay={tooltipVisibilityDelay}
          >
            <IconButton
              sx={{
                color: "primary.main",
                "&:hover": {
                  bgcolor: "primary.main",
                  color: "white",
                },
                mr: 1,
              }}
              aria-label="cycle dates"
              onClick={openCycleDeadlines}
            >
              <DateRangeIcon />
            </IconButton>
          </Tooltip>
          <Button onClick={open360ReminderDialog} variant="contained" sx={{ mr: 1 }}>
            Send 360° Reminder
          </Button>
        </Box>
      </Stack>
      <CompletionStatusSection
        employeeParComplete={filteredSummary.totalEmployeeParComplete}
        leadReviewComplete={filteredSummary.totalLeadReviewComplete}
        f2fComplete={filteredSummary.totalF2fComplete}
        total={filteredSummary.totalEmployees}
      />
      <Box sx={{ my: 2, mx: 0.5 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="h6" fontWeight={600}>
            Teams
          </Typography>
          <DataGridToolbar apiRef={apiRef} />
        </Box>
        {teamState === RequestState.LOADING && (
          <Box sx={{ height: "40vh", display: "flex", alignItems: "center" }}>
            <LoadingEffect message={uiMessages.loading.pageLoading} />
          </Box>
        )}
        {teamState === RequestState.SUCCEEDED && (
          <DataGrid
            apiRef={apiRef}
            sx={{
              border: "none",
              "& .MuiDataGrid-row:hover": { cursor: "pointer" },
              "& .MuiDataGrid-columnHeaders": { borderBottom: "none" },
              "& .MuiDataGrid-cell": { borderBottom: "none" },
            }}
            rows={formattedTeams}
            columns={columns}
            rowHeight={44}
            getRowId={(row) => row.parTeamId}
            disableRowSelectionOnClick
            autoHeight
            pageSizeOptions={[10, 20, 25]}
            initialState={{
              pagination: { paginationModel: { pageSize: 10, page: 0 } },
            }}
            onRowClick={handleTeamChange}
            onFilterModelChange={(model) => {
              const filteredRows = formattedTeams.filter((row) =>
                Object.values(row).some((value) =>
                  String(value)
                    .toLowerCase()
                    .includes(model.quickFilterValues?.[0]?.toLowerCase() || ""),
                ),
              );
              setFilteredSummary(calculateAllTeamsSummary(filteredRows));
            }}
          />
        )}
      </Box>
      <ConfirmationDialog
        open={is360ReminderDialogOpen}
        onClose={close360ReminderDialog}
        title={uiMessages.dialog.threeSixtyReminder.title}
        message={uiMessages.dialog.threeSixtyReminder.message}
        okText={uiMessages.dialog.threeSixtyReminder.okText}
        onConfirm={send360reminder}
        ariaLabelledby="alert-360-reminder-title"
        ariaDescribedby="alert-360-reminder-description"
      />
      <CycleDatesStepper
        cycle={currentCycle}
        open={isParCycleDatesOpen}
        onClose={closeCycleDeadlines}
      />
    </Box>
  );
};
