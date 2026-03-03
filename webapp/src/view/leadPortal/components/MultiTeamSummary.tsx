// Copyright (c) 2024, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import React, { useState } from "react";
import { Box, Button, Card, Divider, Grid, IconButton, Stack, Tooltip, Typography } from "@mui/material";
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
import DateRangeIcon from "@mui/icons-material/DateRange";

import { CompletionStatusCard } from "@components/common/CompletionStatusCard";
import { ConfirmationDialog } from "@components/common/ConfirmationDialog";
import { CustomModal } from "@components/common/CustomModal";
import { CycleDatesStepper } from "@components/common/CycleDatesStepper";
import { AllTeamsSummary, RequestState, Team } from "@utils/types";

import { calculateAllTeamsSummary } from "@utils/utils";
import { shortDateFormat, tooltipVisibilityDelay, uiMessages } from "@config/constant";

import { useAppDispatch, useAppSelector } from "@slices/store";
import { selectCurrentCycle } from "@slices/parCycleSlice";
import { sendAllThreeSixtyReminder } from "@slices/reminderSlice";

import dayjs from "dayjs";
import { LoadingEffect } from "@components/ui/Loading";
import { selectTeamStatus } from "@slices/teamSlice";

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
      <Card variant="outlined" sx={{ padding: 2 }}>
        <Grid container>
          <Grid item xs={12} sm={12} display={"flex"} alignItems={"center"} justifyContent={"space-between"}>
            <Typography variant="h5">Completion Status</Typography>
          </Grid>
        </Grid>
        <Grid container spacing={10}>
          <Grid item xs={12} sm={4}>
            <CompletionStatusCard
              name="Employee PAR"
              completed={filteredSummary.totalEmployeeParComplete}
              total={filteredSummary.totalEmployees}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <CompletionStatusCard
              name="Lead's PAR"
              completed={filteredSummary.totalLeadReviewComplete}
              total={filteredSummary.totalEmployees}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <CompletionStatusCard
              name="F2F"
              completed={filteredSummary.totalF2fComplete}
              total={filteredSummary.totalEmployees}
            />
          </Grid>
        </Grid>
      </Card>
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
            disableSelectionOnClick
            autoHeight
            rowsPerPageOptions={[10, 20, 25]}
            initialState={{
              pagination: {
                pageSize: 10,
                page: 0,
              },
            }}
            onRowClick={handleTeamChange}
            components={{
              Toolbar: CustomToolbar,
            }}
            onFilterModelChange={(model) => {
              const filteredRows = formattedTeams.filter((row) =>
                Object.values(row).some((value) =>
                  String(value)
                    .toLowerCase()
                    .includes(model.quickFilterValues?.[0]?.toLowerCase() || "")
                )
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
        <GridToolbarColumnsButton
          placeholder={undefined}
          onPointerEnterCapture={undefined}
          onPointerLeaveCapture={undefined}
        />
        <GridToolbarFilterButton
          placeholder={undefined}
          onPointerEnterCapture={undefined}
          onPointerLeaveCapture={undefined}
        />
        <GridToolbarDensitySelector
          placeholder={undefined}
          onPointerEnterCapture={undefined}
          onPointerLeaveCapture={undefined}
        />
      </Box>
      <GridToolbarQuickFilter placeholder="Search Teams" />
    </GridToolbarContainer>
  );
};
