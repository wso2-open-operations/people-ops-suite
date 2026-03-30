// Copyright (c) 2024, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.
import DateRangeIcon from "@mui/icons-material/DateRange";
import {
  Box,
  Button,
  Card,
  Divider,
  Grid,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  DataGrid,
  GridColDef,
  GridRowParams,
  GridToolbarColumnsButton,
  GridToolbarContainer,
  GridToolbarDensitySelector,
  GridToolbarFilterButton,
  GridToolbarQuickFilter,
} from "@mui/x-data-grid";
import dayjs from "dayjs";

import React, { useState } from "react";

import { CompletionStatusSection } from "@component/common/CompletionStatusSection";
import { ConfirmationDialog } from "@component/common/ConfirmationDialog";
import { CustomModal } from "@component/common/CustomModal";
import { CycleDatesStepper } from "@component/common/CycleDatesStepper";
import { LoadingEffect } from "@component/ui/Loading";
import { shortDateFormat, tooltipVisibilityDelay, uiMessages } from "@config/constant";
import { selectCurrentCycle } from "@slices/parCycleSlice/parCycle";
import { sendAllThreeSixtyReminder } from "@slices/reminderSlice/reminder";
import { useAppDispatch, useAppSelector } from "@slices/store";
import { AllTeamsSummary, Team } from "@slices/teamSlice/team";
import { selectTeamStatus } from "@slices/teamSlice/team";
import { RequestState } from "@utils/types";
import { calculateAllTeamsSummary } from "@utils/utils";

interface MultiTeamSummaryProps {
  filteredSummary: AllTeamsSummary;
  formattedTeams: Team[];
  columns: GridColDef[];
  handleTeamChange: (params: GridRowParams) => void;
  setFilteredSummary: React.Dispatch<React.SetStateAction<AllTeamsSummary>>;
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

  // Stores state of active step of the Cycle Dates MUI stepper
  const [activeStep, setActiveStep] = useState(0);

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
          <Typography display={"inline"} color={"GrayText"}>
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
      <Card
        variant="outlined"
        sx={{
          p: 2,
          width: "100%",
          mt: 2,
          flex: 1,
          pb: 0,
          mb: 3,
        }}
      >
        <Grid container justifyContent="space-between" mb={2}>
          <Typography variant="h5">Teams</Typography>
        </Grid>
        {teamState === RequestState.LOADING && (
          <Box sx={{ height: "70vh" }}>
            <LoadingEffect message={uiMessages.loading.pageLoading} />
          </Box>
        )}
        {teamState === RequestState.SUCCEEDED && (
          <DataGrid
            sx={{
              border: "none",
              "& .MuiDataGrid-row:hover": {
                cursor: "pointer",
              },
            }}
            rows={formattedTeams}
            columns={columns}
            rowHeight={60}
            getRowId={(row) => row.parTeamId}
            disableRowSelectionOnClick
            autoHeight
            pageSizeOptions={[10, 20, 25]}
            initialState={{
              pagination: {
                paginationModel: {
                  pageSize: 10,
                  page: 0,
                },
              },
            }}
            onRowClick={handleTeamChange}
            // components={{
            //   Toolbar: CustomToolbar,
            // }}
            onFilterModelChange={(model) => {
              const filteredRows = formattedTeams.filter((row) =>
                Object.values(row).some((value) =>
                  String(value)
                    .toLowerCase()
                    .includes(model.quickFilterValues?.[0]?.toLowerCase() || ""),
                ),
              );
              const newFilteredSummary = calculateAllTeamsSummary(filteredRows);
              setFilteredSummary(newFilteredSummary);
            }}
          />
        )}
      </Card>
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
      <CustomModal open={isParCycleDatesOpen} onClose={closeCycleDeadlines} width="80vw">
        <Typography id="dashboard-modal-title" variant="h4" pb={2}>
          Cycle Dates
        </Typography>
        <Divider sx={{ bgcolor: "primary.main" }} />
        <Box pt={9} pb={5}>
          <CycleDatesStepper cycle={currentCycle} activeStep={activeStep} />
        </Box>
      </CustomModal>
    </Box>
  );
};

const CustomToolbar = () => {
  return (
    <GridToolbarContainer sx={{ justifyContent: "space-between" }}>
      <Box>
        <GridToolbarColumnsButton />
        <GridToolbarFilterButton />
        <GridToolbarDensitySelector />
      </Box>
      <GridToolbarQuickFilter />
    </GridToolbarContainer>
  );
};
