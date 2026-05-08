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

import { useEffect, useState } from "react";

import dayjs from "dayjs";

import {
  Avatar,
  Box,
  Button,
  Card,
  Grid,
  IconButton,
  Link,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
  GridRowId,
  GridRowSelectionModel,
} from "@mui/x-data-grid";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DateRangeIcon from "@mui/icons-material/DateRange";
import RateReviewIcon from "@mui/icons-material/RateReview";
import VisibilityIcon from "@mui/icons-material/Visibility";

import { SnackMessage, tooltipVisibilityDelay, uiMessages } from "@config/constant";
import { RequestState } from "@utils/types";

import { ParLeadStatus } from "@root/src/slices/employeeHistorySlice/employeeHistory";
import { ParCycle } from "@root/src/slices/parCycleSlice/parCycle";
import { ShowSnackBarMessage } from "@slices/commonSlice/common";
import { bulkUpdateParRatingOfEmployee } from "@slices/employeeSlice/employee";
import { selectEmployeeMap } from "@slices/metaSlice/meta";
import { sendAllThreeSixtyReminder } from "@slices/reminderSlice/reminder";
import { useAppDispatch, useAppSelector } from "@slices/store";
import {
  ParRatingShort,
  TeamReport,
  fetchTeamReport,
  selectTeamReport,
  selectTeamReportStatus,
} from "@slices/teamSlice/team";

import { CompletionStatusSection } from "@component/common/CompletionStatusSection";
import { ConfirmationDialog } from "@component/common/ConfirmationDialog";
import { CustomModal } from "@component/common/CustomModal";
import { CycleDatesStepper } from "@component/common/CycleDatesStepper";
import ParStatusChip from "@component/common/ParStatusChip";
import { LoadingEffect } from "@component/ui/Loading";
import EmployeeSyncModal from "./EmployeeSyncModal";

interface DashboardProps {
  cycle: Partial<ParCycle>;
  teamId: number;
  openReviewEmployeeView: (employeeEmail: string) => void;
  isAdminAuditViewOn?: boolean;
  isAdminHistoryViewOn?: boolean;
  isLeadMultiTeamViewOn?: boolean;
  closeTeamSummary?: () => void;
}

export const TeamSummary = ({
  cycle,
  teamId,
  openReviewEmployeeView,
  isAdminAuditViewOn = false,
  isAdminHistoryViewOn = false,
  isLeadMultiTeamViewOn = false,
  closeTeamSummary,
}: DashboardProps) => {
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const teamReportState = useAppSelector(selectTeamReportStatus);
  const teamReport = useAppSelector<TeamReport | null>(selectTeamReport);
  const employeeMap = useAppSelector(selectEmployeeMap);
  // Stores state of active step of the Cycle Dates MUI stepper
  const [activeStep, setActiveStep] = useState(0);
  // Stores the search term for the teams list
  const [searchTerm, setSearchTerm] = useState("");
  // Stores the selected rows in the data grid
  const [selectionModel, setSelectionModel] = useState<GridRowSelectionModel>({
    type: "include",
    ids: new Set(),
  });
  // Stores state of 360 reminder confirmation open/ close
  const [is360ReminderDialogOpen, setIs360ReminderDialogOpen] = useState(false);
  // Stores the state of the dialog to confirm the bulk share
  const [isParShareDialogOpen, setIsParShareDialogOpen] = useState(false);
  const [isParCycleDatesOpen, setIsParCycleDatesOpen] = useState(false);
  const [feedbackRequestModalOpen, setFeedbackRequestModalOpen] = useState(false);

  const handleOpenFeedbackRequestModal = () => setFeedbackRequestModalOpen(true);
  const handleCloseFeedbackRequestModal = () => setFeedbackRequestModalOpen(false);

  const openCycleDeadlines = () => setIsParCycleDatesOpen(true);
  const closeCycleDeadlines = () => setIsParCycleDatesOpen(false);

  const openParShareDialog = () => {
    const ratingMap = getSelectedRatings(Array.from(selectionModel.ids), teamReport?.details ?? []);

    if (!validateRatings(ratingMap)) {
      dispatch(ShowSnackBarMessage(SnackMessage.error.invalidBulkShare, "error"));
      return;
    }
    setIsParShareDialogOpen(true);
  };
  const closeParShareDialog = () => setIsParShareDialogOpen(false);
  const open360ReminderDialog = () => setIs360ReminderDialogOpen(true);
  const close360ReminderDialog = () => setIs360ReminderDialogOpen(false);

  const send360reminder = async () => {
    const resultAction = await dispatch(sendAllThreeSixtyReminder());

    if (sendAllThreeSixtyReminder.fulfilled.match(resultAction)) {
      close360ReminderDialog();
    }
  };

  const handleMembersTableClick = (parRating: ParRatingShort) => {
    openReviewEmployeeView(parRating.parEmployeeEmail);
  };

  const filteredMembers =
    teamReport !== null
      ? teamReport.details
        ?.map((member: ParRatingShort) => ({
          ...member,
          id: member.parRatingId,
        }))
        .filter((member: ParRatingShort) =>
          `${member.parEmployeeName.toLowerCase()}${member.parEmployeeEmail.toLowerCase()}`.includes(
            searchTerm.toLowerCase(),
          ),
        )
      : [];

  const columns: GridColDef<ParRatingShort>[] = [
    {
      field: "parEmployeeName",
      headerName: "Team Member",
      flex: 0.2,
      headerAlign: "center",
      renderCell: (params: GridRenderCellParams<ParRatingShort>) => (
        <Box display="flex" alignItems="center" height="100%" width="100%" gap={0.75}>
          <Avatar
            src={employeeMap[params.row?.parEmployeeEmail]?.employeeThumbnail}
            alt={
              employeeMap[params.row?.parEmployeeEmail]?.employeeName ||
              params.row?.parEmployeeEmail
            }
            sx={{ flexShrink: 0, height: "1.6rem", width: "1.6rem", fontSize: "0.65rem" }}
          >
            {(
              employeeMap[params.row?.parEmployeeEmail]?.employeeName ||
              params.row?.parEmployeeEmail
            )?.charAt(0)}
          </Avatar>
          <Tooltip
            arrow
            title={params.row?.parEmployeeEmail}
            enterDelay={tooltipVisibilityDelay}
            enterNextDelay={tooltipVisibilityDelay}
          >
            <Typography variant="body2" fontWeight={500} noWrap>
              {params.row?.parEmployeeName}
            </Typography>
          </Tooltip>
          <Tooltip
            title="Copy Email"
            enterDelay={tooltipVisibilityDelay}
            enterNextDelay={tooltipVisibilityDelay}
          >
            <IconButton
              size="small"
              aria-label="Copy Email"
              onClick={() => {
                navigator.clipboard.writeText(params.row?.parEmployeeEmail);
                dispatch(ShowSnackBarMessage("Email copied", "success"));
              }}
              sx={{
                flexShrink: 0,
                color:
                  theme.palette.mode === "dark"
                    ? theme.palette.info.main
                    : theme.palette.text.secondary,
              }}
            >
              <ContentCopyIcon sx={{ fontSize: "0.85rem" }} />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
    {
      field: "parEmployeeStatus",
      headerName: "Employee PAR",
      flex: 0.1,
      headerAlign: "center",
      renderCell: (params: GridRenderCellParams<ParRatingShort>) => (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
          }}
        >
          <ParStatusChip content={params.row?.parEmployeeStatus || ""} />
        </Box>
      ),
    },
    {
      field: "par360ReviewStatus",
      headerName: "360° Feedback",
      flex: 0.12,
      headerAlign: "center",
      renderCell: (params: GridRenderCellParams<ParRatingShort>) => (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
          }}
        >
          <ParStatusChip
            content={params.row?.par360ReviewStatus || ""}
            countDetails={{
              completed: params.row?.par360ReviewCounts?.sharedReviewCount || 0,
              total: params.row?.par360ReviewCounts?.requestedReviewCount || 0,
            }}
          />
        </Box>
      ),
    },
    {
      field: "parLeadStatus",
      headerName: "Lead's PAR",
      flex: 0.1,
      headerAlign: "center",
      renderCell: (params: GridRenderCellParams<ParRatingShort>) => (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
          }}
        >
          <ParStatusChip content={params.row?.parLeadStatus || ""} />
        </Box>
      ),
    },
    {
      field: "parRating",
      headerName: "Rating",
      flex: 0.15,
      headerAlign: "center",
      renderCell: (params: GridRenderCellParams<ParRatingShort>) => (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
          }}
        >
          <ParStatusChip content={params.row?.parRating || ""} />
        </Box>
      ),
    },
    {
      field: "parSpecialRating",
      headerName: "Top 5%/20% Rating",
      flex: 0.15,
      headerAlign: "center",
      renderCell: (params: GridRenderCellParams<ParRatingShort>) => (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
          }}
        >
          <ParStatusChip content={params.row?.parSpecialRating || ""} />
        </Box>
      ),
    },
    {
      field: "parF2fStatus",
      headerName: "F2F",
      flex: 0.08,
      headerAlign: "center",
      renderCell: (params: GridRenderCellParams<ParRatingShort>) => (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
          }}
        >
          <ParStatusChip content={params.row?.parF2fStatus || ""} />
        </Box>
      ),
    },
    {
      field: "actions",
      headerName: "",
      sortable: false,
      flex: 0.08,
      headerAlign: "center",
      renderCell: (params: GridRenderCellParams<ParRatingShort>) => (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
          }}
        >
          <Tooltip
            arrow
            title={
              params.row.parLeadStatus === ParLeadStatus.SHARED || isAdminHistoryViewOn
                ? "View"
                : "Review"
            }
            enterDelay={tooltipVisibilityDelay}
            enterNextDelay={tooltipVisibilityDelay}
          >
            <IconButton
              size="small"
              onClick={() => handleMembersTableClick(params.row)}
              sx={{
                color: "primary.main",
                "&:hover": { bgcolor: "primary.main", color: "white" },
              }}
            >
              {params.row.parLeadStatus === ParLeadStatus.SHARED || isAdminHistoryViewOn ? (
                <VisibilityIcon fontSize="small" />
              ) : (
                <RateReviewIcon fontSize="small" />
              )}
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  const handleSelectionModelChange = (newSelectionModel: GridRowSelectionModel) => {
    setSelectionModel(newSelectionModel);
  };

  const getSelectedRatings = (selectedIdsArray: GridRowId[], details: ParRatingShort[]) => {
    return selectedIdsArray.reduce((acc: ParRatingShort[], rowId) => {
      const employeeParRating = details?.find((member) => member.parRatingId === rowId);
      if (employeeParRating) {
        acc.push(employeeParRating);
      }
      return acc;
    }, []);
  };

  const validateRatings = (ratingMap: ParRatingShort[]) => {
    return ratingMap.every((rating) => rating?.parLeadStatus === ParLeadStatus.DRAFT);
  };

  const updateSelectedRatings = async () => {
    try {
      const ratingMap = getSelectedRatings(
        Array.from(selectionModel.ids),
        teamReport?.details ?? [],
      );

      if (!validateRatings(ratingMap)) {
        dispatch(ShowSnackBarMessage(SnackMessage.error.invalidBulkShare, "error"));
        return;
      }

      const formattedObjects: {
        employeeId: string;
        parCycleId: number | undefined;
        parRatingId: number;
        values: {
          parLeadStatus: ParLeadStatus;
        };
      }[] = [];

      ratingMap.forEach((employeeParRating) => {
        if (employeeParRating) {
          formattedObjects.push({
            employeeId: employeeParRating.parEmployeeEmail,
            parCycleId: cycle.parCycleId,
            parRatingId: employeeParRating.parRatingId,
            values: {
              parLeadStatus: ParLeadStatus.SHARED,
            },
          });
        }
      });

      if (formattedObjects.length > 0) {
        const resultAction = await dispatch(bulkUpdateParRatingOfEmployee(formattedObjects));

        const { passedCount, failedCount, reasonMessage } = resultAction.payload as {
          passedCount: number;
          failedCount: number;
          reasonMessage: string;
        };
        if (passedCount !== 0 && cycle?.parCycleId) {
          dispatch(fetchTeamReport({ parCycleId: cycle.parCycleId, teamId }));
        }

        if (passedCount === 0) {
          dispatch(
            ShowSnackBarMessage(
              `Failed to share ${failedCount} ratings. ${reasonMessage}`,
              "error",
            ),
          );
        } else if (failedCount !== 0) {
          dispatch(
            ShowSnackBarMessage(
              `Failed to update ${failedCount} ratings. ${reasonMessage}`,
              "warning",
            ),
          );
        } else {
          dispatch(ShowSnackBarMessage(`Successfully updated ${passedCount} ratings`, "success"));
        }
      }
    } catch (error) {
      dispatch(ShowSnackBarMessage("Failed to update ratings", "error"));
    }
  };

  const handleConfirmationProceed = async () => {
    await updateSelectedRatings();
    closeParShareDialog();
  };

  const copySelectedEmailsToClipboard = () => {
    const allDetails = teamReport?.details ?? [];
    const emails =
      selectionModel.type === "exclude"
        ? allDetails
          .filter((m) => !selectionModel.ids.has(m.parRatingId))
          .map((m) => m.parEmployeeEmail)
        : Array.from(selectionModel.ids)
          .map((rowId) => allDetails.find((m) => m.parRatingId === rowId)?.parEmployeeEmail)
          .filter(Boolean);

    navigator.clipboard.writeText(emails.join(", "));
    dispatch(ShowSnackBarMessage("Emails copied to clipboard", "success"));
  };

  const handleEmployeeSyncSuccess = () => {
    if (cycle.parCycleId) dispatch(fetchTeamReport({ parCycleId: cycle.parCycleId, teamId }));
  };

  useEffect(() => {
    if (cycle?.parCycleId) {
      dispatch(fetchTeamReport({ parCycleId: cycle.parCycleId, teamId }));
    }
  }, [dispatch, cycle.parCycleId, teamId]);

  useEffect(() => {
    if (dayjs().diff(cycle.parEmployeeDeadline, "day", true) >= 0) {
      setActiveStep(1);
    }
    if (dayjs().diff(cycle.parLeadDeadline, "day", true) - 1 >= 0) {
      setActiveStep(2);
    }
    if (dayjs().diff(cycle.parSpecialRatingDeadline, "day", true) >= 0) {
      setActiveStep(3);
    }
    if (dayjs().diff(cycle.parEvaluationEndDate, "day", true) >= 0) {
      setActiveStep(4);
    }
  }, [dispatch, cycle]);

  return (
    <Box sx={{ height: "auto" }}>
      {teamReportState === RequestState.LOADING && (
        <Box height={"70vh"}>
          <LoadingEffect message={uiMessages.loading.pageLoading} />
        </Box>
      )}
      {teamReportState === RequestState.SUCCEEDED && teamReport !== null && (
        <Box sx={{ height: "100%" }} display={"flex"} flexDirection={"column"}>
          <Box
            sx={{
              display: "flex",
              width: "100%",
              justifyContent: "space-between",
              alignItems: "center",
              pb: 1,
            }}
          >
            <Box>
              {(isAdminAuditViewOn || isAdminHistoryViewOn || isLeadMultiTeamViewOn) && (
                <Box sx={{ display: "inline" }}>
                  <IconButton
                    aria-label="back"
                    color="primary"
                    onClick={closeTeamSummary}
                    sx={{ mb: "10px", mr: 1 }}
                  >
                    <ArrowBackIcon />
                  </IconButton>
                  {isAdminHistoryViewOn && (
                    <Typography display={"inline"} variant="h5">
                      {` History / ${cycle.parCycleName} / `}
                    </Typography>
                  )}
                  <Link
                    underline="hover"
                    color="textPrimary"
                    variant="h5"
                    onClick={closeTeamSummary}
                  >
                    {"All Teams"}
                  </Link>
                  <Typography display={"inline"} variant="h5">
                    {" / "}
                  </Typography>
                </Box>
              )}

              <Typography display={"inline"} variant="h5">
                {teamReport.parBusinessUnit}
                {" / "}
                {teamReport.parDepartment}
                {" / "}
                {teamReport.parTeam}
                {teamReport.parSubTeam && ` / ${teamReport.parSubTeam}`}
              </Typography>
            </Box>

            {!isAdminHistoryViewOn && !isAdminAuditViewOn && (
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
                <Button onClick={open360ReminderDialog} variant="contained">
                  Send 360° Reminder
                </Button>

                {/* Temporary dialog for this cycle */}
                <Button sx={{ ml: 1 }} onClick={handleOpenFeedbackRequestModal} variant="contained">
                  Sync an Employee
                </Button>
              </Box>
            )}
          </Box>
          <Stack>
            <CompletionStatusSection
              employeeParComplete={teamReport.summary.employeeParCompletedCount}
              leadReviewComplete={teamReport.summary.leadsReviewCompletedCount}
              f2fComplete={teamReport.summary.f2fCompletedCount}
              total={teamReport.numberOfTeamMembers}
              sx={{ flex: 1 }}
            />
            {/* Commented out temporarily for testing new features; to be removed later. */}
            {/* <Card variant="outlined" sx={{ padding: 2, flex: 1 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  position: "relative",
                }}
              >
                <Typography variant="h5">Top 5%/20% Ratings</Typography>
                <Tooltip
                  arrow
                  title={uiMessages.tooltip.top5Percent20PercentInfo}
                  enterDelay={tooltipVisibilityDelay}
                  enterNextDelay={tooltipVisibilityDelay}
                >
                  <IconButton
                    aria-label="info"
                    sx={{
                      position: "absolute",
                      left: "9rem",
                      top: "-0.5rem",
                      "&:hover": {
                        backgroundColor: "transparent",
                      },
                    }}
                  >
                    <InfoIcon
                      sx={{ fontSize: "1.3rem", color: "primary.main" }}
                    />
                  </IconButton>
                </Tooltip>
              </Box>
              <Stack direction={"row"} spacing={4}>
                <Box sx={{ width: "50%" }}>
                  <CompletionStatusCard
                    name={`Top 5% : ${
                      teamReport.numberOf5pSlots - teamReport.available5pSlots
                    }/${teamReport.numberOf5pSlots}`}
                    completed={
                      teamReport.numberOf5pSlots - teamReport.available5pSlots
                    }
                    total={teamReport.numberOf5pSlots}
                    hideLeftCount={true}
                  />
                </Box>
                <Box sx={{ width: "50%" }}>
                  <CompletionStatusCard
                    name={`Top 20% : ${
                      teamReport.numberOf20pSlots - teamReport.available20pSlots
                    }/${teamReport.numberOf20pSlots}`}
                    completed={
                      teamReport.numberOf20pSlots - teamReport.available20pSlots
                    }
                    total={teamReport.numberOf20pSlots}
                    hideLeftCount={true}
                  />
                </Box>
              </Stack>
            </Card> */}
          </Stack>
          <Card
            variant="outlined"
            sx={{
              p: 2,
              mt: "10px",
              ml: 0.2,
              mr: 0.2,
              height: "100%",
              display: "flex",
              flexDirection: "column",
              background: "transparent",
              backdropFilter: "none",
            }}
          >
            <Grid container justifyContent="space-between" mb={2}>
              <Typography variant="h5">Members</Typography>
              <Box>
                <Button
                  variant="contained"
                  onClick={copySelectedEmailsToClipboard}
                  disabled={selectionModel.type === "include" && selectionModel.ids.size === 0}
                  sx={{ mr: 2 }}
                >
                  Copy Emails
                </Button>
                {!isAdminAuditViewOn && !isAdminHistoryViewOn && (
                  <Button
                    variant="contained"
                    onClick={openParShareDialog}
                    disabled={selectionModel.type === "include" && selectionModel.ids.size === 0}
                    sx={{ mr: 2 }}
                  >
                    Share
                  </Button>
                )}
                <TextField
                  label="Search Members"
                  variant="outlined"
                  size="small"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </Box>
            </Grid>

            <Box
              sx={{
                flex: 1,
                overflowY: "auto",
                overflowX: "hidden",
                width: "100%",
                minHeight: 400,
              }}
            >
              <DataGrid
                rows={filteredMembers.sort((a, b) =>
                  a.parEmployeeName.localeCompare(b.parEmployeeName),
                )}
                columns={columns}
                rowHeight={36}
                checkboxSelection
                pageSizeOptions={[10, 20, 25]}
                initialState={{
                  pagination: {
                    paginationModel: {
                      pageSize: 10,
                      page: 0,
                    },
                  },
                }}
                disableRowSelectionOnClick
                rowSelectionModel={selectionModel}
                onRowSelectionModelChange={handleSelectionModelChange}
              />
            </Box>
          </Card>
          <ConfirmationDialog
            open={isParShareDialogOpen}
            onClose={closeParShareDialog}
            title={uiMessages.dialog.leadParBulkShare.title}
            message={uiMessages.dialog.leadParBulkShare.message}
            okText={uiMessages.dialog.leadParBulkShare.okText}
            onConfirm={handleConfirmationProceed}
            ariaLabelledby="alert-lead-par-bulk-share-title"
            ariaDescribedby="alert-lead-par-bulk-share-description"
          />
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
            cycle={cycle}
            activeStep={activeStep}
            open={isParCycleDatesOpen}
            onClose={closeCycleDeadlines}
          />
          <CustomModal open={feedbackRequestModalOpen} onClose={handleCloseFeedbackRequestModal}>
            <EmployeeSyncModal leadonly onSyncSuccess={handleEmployeeSyncSuccess} />
          </CustomModal>
        </Box>
      )}
    </Box>
  );
};
