// Copyright (c) 2024, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import { useEffect, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Card,
  Divider,
  Grid,
  IconButton,
  Link,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  DataGrid,
  GridRenderCellParams,
  GridRowId,
  GridSelectionModel,
} from "@mui/x-data-grid";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DateRangeIcon from "@mui/icons-material/DateRange";
import InfoIcon from "@mui/icons-material/Info";
import RateReviewIcon from "@mui/icons-material/RateReview";
import VisibilityIcon from "@mui/icons-material/Visibility";

import ParStatusChip from "@components/common/ParStatusChip";
import {
  fetchTeamReport,
  selectTeamReport,
  selectTeamReportStatus,
} from "@slices/teamSlice";
import { useAppDispatch, useAppSelector } from "@slices/store";
import dayjs from "dayjs";
import {
  ParCycle,
  ParLeadStatus,
  ParRatingShort,
  RequestState,
  TeamReport,
} from "@utils/types";
import { CompletionStatusCard } from "@components/common/CompletionStatusCard";
import { selectEmployeeMap } from "@slices/metaSlice";
import { LoadingEffect } from "@components/ui/Loading";
import {
  snackMessages,
  tooltipVisibilityDelay,
  uiMessages,
} from "@config/constant";
import { CycleDatesStepper } from "@components/common/CycleDatesStepper";
import { bulkUpdateParRatingOfEmployee } from "@slices/employeeSlice";
import { showSnackBarMessage } from "@slices/commonSlice/common";
import { ConfirmationDialog } from "@components/common/ConfirmationDialog";
import { sendAllThreeSixtyReminder } from "@slices/reminderSlice";
import { CustomModal } from "@components/common/CustomModal";
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
  const teamReportState = useAppSelector(selectTeamReportStatus);
  const teamReport = useAppSelector<TeamReport | null>(selectTeamReport);
  const employeeMap = useAppSelector(selectEmployeeMap);
  // Stores state of active step of the Cycle Dates MUI stepper
  const [activeStep, setActiveStep] = useState(0);
  // Stores the search term for the teams list
  const [searchTerm, setSearchTerm] = useState("");
  // Stores the selected rows in the data grid
  const [selectionModel, setSelectionModel] = useState<GridRowId[]>([]);
  // Stores state of 360 reminder confirmation open/ close
  const [is360ReminderDialogOpen, setIs360ReminderDialogOpen] = useState(false);
  // Stores the state of the dialog to confirm the bulk share
  const [isParShareDialogOpen, setIsParShareDialogOpen] = useState(false);
  const [isParCycleDatesOpen, setIsParCycleDatesOpen] = useState(false);
  const [feedbackRequestModalOpen, setFeedbackRequestModalOpen] =
    useState(false);
  const handleOpenFeedbackRequestModal = () =>
    setFeedbackRequestModalOpen(true);
  const handleCloseFeedbackRequestModal = () =>
    setFeedbackRequestModalOpen(false);

  const openCycleDeadlines = () => {
    setIsParCycleDatesOpen(true);
  };
  const closeCycleDeadlines = () => {
    setIsParCycleDatesOpen(false);
  };

  const openParShareDialog = () => {
    const ratingMap = getSelectedRatings(
      selectionModel,
      teamReport?.details ?? []
    );

    if (!validateRatings(ratingMap)) {
      dispatch(
        showSnackBarMessage(snackMessages.error.invalidBulkShare, "error")
      );
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
              searchTerm.toLowerCase()
            )
          )
      : [];

  const columns = [
    {
      field: "parEmployeeName",
      headerName: "Team Member",
      flex: 0.2,
      renderCell: (params: GridRenderCellParams<ParRatingShort>) => (
        <Box display="flex" alignItems="center" position="relative">
          <Avatar
            src={employeeMap[params.row?.parEmployeeEmail]?.employeeThumbnail}
            alt={
              employeeMap[params.row?.parEmployeeEmail]?.employeeName ||
              params.row?.parEmployeeEmail
            }
            sx={{ marginRight: 2, height: "2.2rem", width: "2.2rem" }}
          />
          <Box
            sx={{
              position: "relative",
              transition: "transform 0.3s ease",
              "&:hover": {
                transform: "translateY(-10px)",
              },
              "&:hover > div": {
                opacity: 1,
              },
            }}
          >
            <Typography variant="h5">{params.row?.parEmployeeName}</Typography>
            <Box
              sx={{
                position: "absolute",
                top: "100%",
                left: 0,
                display: "flex",
                alignItems: "center",
                padding: "1px 0",
                borderRadius: "4px",
                opacity: 0,
                transition: "opacity 0.3s",
              }}
            >
              <Typography color={"GrayText"} variant="h6" mr={1}>
                {params.row?.parEmployeeEmail}
              </Typography>
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
                    dispatch(showSnackBarMessage("Email copied", "success"));
                  }}
                >
                  <ContentCopyIcon sx={{ fontSize: "15px" }} />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Box>
      ),
    },
    {
      field: "parEmployeeStatus",
      headerName: "Employee PAR",
      flex: 0.1,
      renderCell: (params: GridRenderCellParams<ParRatingShort>) => (
        <ParStatusChip content={params.row?.parEmployeeStatus || ""} />
      ),
    },
    {
      field: "par360ReviewStatus",
      headerName: "360° Feedback",
      flex: 0.1,
      renderCell: (params: GridRenderCellParams<ParRatingShort>) => (
        <ParStatusChip
          content={params.row?.par360ReviewStatus || ""}
          countDetails={{
            completed: params.row?.par360ReviewCounts?.sharedReviewCount || 0,
            total: params.row?.par360ReviewCounts?.requestedReviewCount || 0,
          }}
        />
      ),
    },
    {
      field: "parLeadStatus",
      headerName: "Lead's PAR",
      flex: 0.1,
      renderCell: (params: GridRenderCellParams<ParRatingShort>) => (
        <ParStatusChip content={params.row?.parLeadStatus || ""} />
      ),
    },
    {
      field: "parRating",
      headerName: "Rating",
      flex: 0.15,
      renderCell: (params: GridRenderCellParams<ParRatingShort>) => (
        <ParStatusChip content={params.row?.parRating || ""} />
      ),
    },
    {
      field: "parSpecialRating",
      headerName: "Top 5%/20% Rating",
      flex: 0.15,
      renderCell: (params: GridRenderCellParams<ParRatingShort>) => (
        <ParStatusChip content={params.row?.parSpecialRating || ""} />
      ),
    },
    {
      field: "parF2fStatus",
      headerName: "F2F",
      flex: 0.1,
      renderCell: (params: GridRenderCellParams<ParRatingShort>) => (
        <ParStatusChip content={params.row?.parF2fStatus || ""} />
      ),
    },

    {
      field: "actions",
      headerName: "",
      sortable: false,
      flex: 0.1,
      renderCell: (params: GridRenderCellParams<ParRatingShort>) => (
        <IconButton
          sx={{
            color: "primary.main",
            "&:hover": {
              bgcolor: "primary.main",
              color: "white",
            },
          }}
          onClick={() => handleMembersTableClick(params.row)}
        >
          {params.row.parLeadStatus === ParLeadStatus.SHARED ||
          isAdminHistoryViewOn ? (
            <Tooltip
              arrow
              title="View"
              enterDelay={tooltipVisibilityDelay}
              enterNextDelay={tooltipVisibilityDelay}
            >
              <VisibilityIcon />
            </Tooltip>
          ) : (
            <Tooltip
              arrow
              title="Review"
              enterDelay={tooltipVisibilityDelay}
              enterNextDelay={tooltipVisibilityDelay}
            >
              <RateReviewIcon />
            </Tooltip>
          )}
        </IconButton>
      ),
    },
  ];

  const handleSelectionModelChange = (
    newSelectionModel: GridSelectionModel
  ) => {
    setSelectionModel(newSelectionModel);
  };

  const getSelectedRatings = (
    selectionModel: GridRowId[],
    details: ParRatingShort[]
  ) => {
    return selectionModel.reduce((acc: ParRatingShort[], rowId) => {
      const employeeParRating = details?.find(
        (member) => member.parRatingId === rowId
      );
      if (employeeParRating) {
        acc.push(employeeParRating);
      }
      return acc;
    }, []);
  };

  const validateRatings = (ratingMap: ParRatingShort[]) => {
    return ratingMap.every(
      (rating) => rating?.parLeadStatus === ParLeadStatus.DRAFT
    );
  };

  const updateSelectedRatings = async () => {
    try {
      const ratingMap = getSelectedRatings(
        selectionModel,
        teamReport?.details ?? []
      );

      if (!validateRatings(ratingMap)) {
        dispatch(
          showSnackBarMessage(snackMessages.error.invalidBulkShare, "error")
        );
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
        const resultAction = await dispatch(
          bulkUpdateParRatingOfEmployee(formattedObjects)
        );

        const { passedCount, failedCount, reasonMessage } =
          resultAction.payload as {
            passedCount: number;
            failedCount: number;
            reasonMessage: string;
          };
        if (passedCount !== 0 && cycle?.parCycleId) {
          dispatch(fetchTeamReport({ parCycleId: cycle.parCycleId, teamId }));
        }

        if (passedCount === 0) {
          dispatch(
            showSnackBarMessage(
              `Failed to share ${failedCount} ratings. ${reasonMessage}`,
              "error"
            )
          );
        } else if (failedCount !== 0) {
          dispatch(
            showSnackBarMessage(
              `Failed to update ${failedCount} ratings. ${reasonMessage}`,
              "warning"
            )
          );
        } else {
          dispatch(
            showSnackBarMessage(
              `Successfully updated ${passedCount} ratings`,
              "success"
            )
          );
        }
      }
    } catch (error) {
      dispatch(showSnackBarMessage("Failed to update ratings", "error"));
    }
  };

  const handleConfirmationProceed = async () => {
    await updateSelectedRatings();
    closeParShareDialog();
  };

  const copySelectedEmailsToClipboard = () => {
    const emails = selectionModel.map((rowId) => {
      const employeeParRating = teamReport?.details.find(
        (member) => member.parRatingId === rowId
      );
      if (employeeParRating?.parEmployeeEmail) {
        return employeeParRating?.parEmployeeEmail;
      }
    });

    navigator.clipboard.writeText(emails.join(", "));
    dispatch(showSnackBarMessage("Emails copied to clipboard", "success"));
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
            mb={1}
            sx={{
              display: "flex",
              width: "100%",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Box>
              {(isAdminAuditViewOn ||
                isAdminHistoryViewOn ||
                isLeadMultiTeamViewOn) && (
                <Box sx={{ display: "inline" }}>
                  <IconButton
                    aria-label="back"
                    color="primary"
                    onClick={closeTeamSummary}
                    sx={{ mb: 1, mr: 1 }}
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
                    color="inherit"
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
          <Stack direction="row" spacing={2}>
            <Card variant="outlined" sx={{ padding: 2, flex: 2 }}>
              <Box>
                <Typography variant="h5">Completion Status</Typography>
              </Box>
              <Stack direction={"row"} spacing={4}>
                <Box sx={{ width: "33%" }}>
                  <CompletionStatusCard
                    name="Employee PAR"
                    completed={teamReport.summary.employeeParCompletedCount}
                    total={teamReport.numberOfTeamMembers}
                  />
                </Box>
                <Box sx={{ width: "33%" }}>
                  <CompletionStatusCard
                    name="Lead's PAR"
                    completed={teamReport.summary.leadsReviewCompletedCount}
                    total={teamReport.numberOfTeamMembers}
                  />
                </Box>
                <Box sx={{ width: "33%" }}>
                  <CompletionStatusCard
                    name="F2F"
                    completed={teamReport.summary.f2fCompletedCount}
                    total={teamReport.numberOfTeamMembers}
                  />
                </Box>
              </Stack>
            </Card>
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
              mt: 2,
              mb: 1,
              height: "100%",
              width: "100%",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Grid container justifyContent="space-between" mb={2}>
              <Typography variant="h5">Members</Typography>
              <Box>
                <Button
                  variant="contained"
                  onClick={copySelectedEmailsToClipboard}
                  disabled={selectionModel.length === 0}
                  sx={{ mr: 2 }}
                >
                  Copy Emails
                </Button>
                {!isAdminAuditViewOn && !isAdminHistoryViewOn && (
                  <Button
                    variant="contained"
                    onClick={openParShareDialog}
                    disabled={selectionModel.length === 0}
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

            <Box sx={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
              <DataGrid
                sx={{
                  border: "none",
                  "& .MuiDataGrid-row:hover": {
                    backgroundColor: "inherit",
                  },
                }}
                rows={filteredMembers.sort((a, b) =>
                  a.parEmployeeName.localeCompare(b.parEmployeeName)
                )}
                columns={columns}
                rowHeight={50}
                checkboxSelection
                autoHeight
                rowsPerPageOptions={[10, 20, 25]}
                initialState={{
                  pagination: {
                    pageSize: 10,
                    page: 0,
                  },
                }}
                disableSelectionOnClick
                selectionModel={selectionModel}
                onSelectionModelChange={handleSelectionModelChange}
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
          <CustomModal
            open={isParCycleDatesOpen}
            onClose={closeCycleDeadlines}
            width="80vw"
          >
            <Typography id="dashboard-modal-title" variant="h5" pb={2}>
              Cycle Dates
            </Typography>
            <Divider sx={{ bgcolor: "primary.main" }} />
            <Box pt={9} pb={5}>
              <CycleDatesStepper cycle={cycle} activeStep={activeStep} />
            </Box>
          </CustomModal>
          <CustomModal
            open={feedbackRequestModalOpen}
            onClose={handleCloseFeedbackRequestModal}
          >
            <EmployeeSyncModal leadonly onSyncSuccess={handleEmployeeSyncSuccess} />
          </CustomModal>
        </Box>
      )}
    </Box>
  );
};
