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

import { useEffect, useRef, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Card,
  Chip,
  Divider,
  Grid,
  IconButton,
  Link,
  Stack,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from "@mui/material";
import { DataGrid, GridRenderCellParams, GridToolbar } from "@mui/x-data-grid";
import { useLocation } from "react-router-dom";
import { alpha } from "@mui/material/styles";
import { useDebounce } from "use-debounce";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DateRangeIcon from "@mui/icons-material/DateRange";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import SettingsIcon from "@mui/icons-material/Settings";
import RateReviewIcon from "@mui/icons-material/RateReview";
import VisibilityIcon from "@mui/icons-material/Visibility";
import UpdateIcon from "@mui/icons-material/Update";
import HistoryEduIcon from "@mui/icons-material/HistoryEdu";
import dayjs from "dayjs";

import { fetchTeams, selectAllTeams, selectAllTeamsSummary, selectTeamStatus, Team } from "@slices/teamSlice/team";
import { useAppDispatch, useAppSelector } from "@slices/store";
import { closeParCycle, fetchOpenParCycle, selectCurrentCycle } from "@slices/parCycleSlice/parCycle";
import {
  Employee,
  fetchConfigurations,
  fetchParticipants,
  selectEmployeeMap,
  selectParticipants,
  selectParticipantsStatus,
} from "@slices/metaSlice/meta";
import { fetchParRatingSummary } from "@slices/employeeHistorySlice/employeeHistory";
import {
  fetchRejectedReviews,
  postReviews,
  RejectedReview,
  selectRejectedReviews,
  selectThreeSixtyReviewStatus,
} from "@slices/threeSixtyReviewSlice/threeSixtyReview";
import { selectUserEmail } from "@slices/authSlice/auth";

import { BulkReminderModal } from "@view/adminPortal/components/BulkReminderModal";
import { ParCycleSettingsForm } from "./ParCycleSettingsForm";
import { CompletionStatusCard } from "@component/common/CompletionStatusCard";
import { CustomModal } from "@component/common/CustomModal";
import { CycleDatesStepper } from "@component/common/CycleDatesStepper";
import { LoadingEffect } from "@component/ui/Loading";
import { ConfirmationDialog } from "@component/common/ConfirmationDialog";
import { TeamSummary } from "@view/leadPortal/components/TeamSummary";
import { Review } from "@view/leadPortal/components/Review";
import { Report } from "@view/adminPortal/components/Report";
import { Completion } from "@view/adminPortal/components/Completion";
import NoDataView from "@component/common/NoDataView";
import SummarizedParHistoryView from "./SummarizedParHistoryView";
import SpecialRatingAllocationView from "@component/common/SpecialRatingAllocationView";
import EmployeeSyncModal from "@view/leadPortal/components/EmployeeSyncModal";

import { calculateAllTeamsSummary } from "@utils/utils";
import { RequestState } from "@utils/types";
import { ParLeadStatus } from "@slices/employeeHistorySlice/employeeHistory";
import { ParThreeSixtyReviewStatus } from "@slices/threeSixtyReviewSlice/threeSixtyReview";
import { tooltipVisibilityDelay, uiMessages, shortDateFormat } from "@config/constant";

interface DashboardProps {
  closeOrgSummaryView?: () => void;
  isAdminAuditViewOn?: boolean;
  isAdminHistoryViewOn?: boolean;
}

interface FormattedTeam extends Team {
  id: number;
  employeePARCompletion: string;
  leadReviewCompletion: string;
  f2fCompletion: string;
}

export const OrgSummary = ({ closeOrgSummaryView, isAdminAuditViewOn, isAdminHistoryViewOn }: DashboardProps) => {
  const location = useLocation();
  const dispatch = useAppDispatch();
  const openReportView = () => setReportView(true);
  const closeReportView = () => setReportView(false);
  const currentCycle = useAppSelector(selectCurrentCycle);
  const teams = useAppSelector(selectAllTeams);
  const summary = useAppSelector(selectAllTeamsSummary);
  const teamState = useAppSelector(selectTeamStatus);
  const userEmail = useAppSelector(selectUserEmail);
  const employeeArray = useAppSelector(selectParticipants);
  const employeeArrayStatus = useAppSelector(selectParticipantsStatus);
  const employeeMap = useAppSelector(selectEmployeeMap);
  const reviewStatus = useAppSelector(selectThreeSixtyReviewStatus);
  const rejectedReviews = useAppSelector(selectRejectedReviews);
  const apiController = useRef(new AbortController());
  // Stores state of bulk reminder modal open/ close
  const [bulkReminderModal, setBulkReminderModal] = useState(false);
  // Stores state of PAR closing dialog open/ close
  const [parClosingDialog, setParCloseDialog] = useState(false);
  // Stores state of PAR cycle settings view open
  const [isParCycleSettingsOpen, setIsParCycleSettingsOpen] = useState(false);
  // Stores state of PAR cycle settings view open
  const [isParCompletionViewOpen, setIsParCompletionViewOpen] = useState(false);
  // Stores state of active step of the Cycle Dates MUI stepper
  const [activeStep, setActiveStep] = useState(0);
  // Stores the selected team id
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  // Stores the search text for the teams list
  const [searchText, setSearchText] = useState("");
  // Stores the filtered summary
  const [filteredSummary, setFilteredSummary] = useState(summary);
  // Debounces the search text
  const [debouncedSearchText] = useDebounce(searchText, 500);
  // Stores the selected employee email
  const [selectedEmployeeEmail, setSelectedEmployeeEmail] = useState<string>("");
  // Stores the state of review employee view
  const [reviewEmployeeView, setReviewEmployeeView] = useState(false);
  // Stores the state of reports view
  const [reportView, setReportView] = useState(false);
  const [isParCycleDatesOpen, setIsParCycleDatesOpen] = useState(false);
  const [employeeSearchText, setEmployeeSearchText] = useState("");
  const [reviewSearchText, setReviewSearchText] = useState("");
  const closeReviewEmployeeView = () => setReviewEmployeeView(false);
  const openBulkReminderModal = () => setBulkReminderModal(true);
  const closeBulkReminderModal = () => setBulkReminderModal(false);
  const handleParClosingDialogOpen = () => setParCloseDialog(true);
  const handleParClosingDialogClose = () => setParCloseDialog(false);
  const openParCycleSettings = () => setIsParCycleSettingsOpen(true);
  const closeParCycleSettings = () => setIsParCycleSettingsOpen(false);
  const openParCompletionView = () => setIsParCompletionViewOpen(true);
  const closeParCompletionView = () => setIsParCompletionViewOpen(false);
  const [selectedTab, setSelectedTab] = useState(0);
  const [openConfirmationDialog, setOpenConfirmationDialog] = useState(false);
  const [selectedReview, setSelectedReview] = useState<RejectedReview | null>(null);
  const [isEmpHistoryModalOpen, setIsEmpHistoryModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [employeeSyncModal, setEmployeeSyncModalOpen] = useState(false);
  const handleEmployeeSyncModal = () => setEmployeeSyncModalOpen(!employeeSyncModal);

  const openCycleDeadlines = () => setIsParCycleDatesOpen(true);
  const closeCycleDeadlines = () => setIsParCycleDatesOpen(false);

  const openReviewEmployeeView = (employeeEmail: string) => {
    setSelectedEmployeeEmail(employeeEmail);
    setReviewEmployeeView(true);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  const handleTeamsTableClick = (parTeamId: number) => {
    setSelectedTeamId(parTeamId);
  };

  const handleParClosingProceed = async () => {
    if (currentCycle.parCycleId) {
      const resultAction = await dispatch(closeParCycle(currentCycle.parCycleId));
      if (closeParCycle.fulfilled.match(resultAction)) {
        handleParClosingDialogClose();
        dispatch(fetchOpenParCycle());
      }
    }
  };

  const handleConfirmationDialogClose = () => {
    setSelectedReview(null);
    setOpenConfirmationDialog(false);
  };

  const handleClickRestoreReview = (review: RejectedReview) => {
    setSelectedReview(review);
    setOpenConfirmationDialog(true);
  };

  const handleEmployeeSelect = (employee: Employee | null, isHistory: boolean) => {
    if (employee) {
      setSelectedEmployeeEmail(employee.workEmail);
      setSelectedEmployee(employee);
      if (isHistory) {
        setIsEmpHistoryModalOpen(true);
      } else {
        setReviewEmployeeView(true);
      }
    }
  };

  const fetchReviews = async () => {
    if (currentCycle.parCycleId) {
      dispatch(fetchRejectedReviews({ parCycleId: currentCycle.parCycleId }));
    }
    setOpenConfirmationDialog(false);
  };

  const formattedTeams = teams.map((team) => {
    return {
      ...team,
      id: team.parTeamId,
      employeePARCompletion: `${team.summary.employeeParCompletedCount}/${team.numberOfTeamMembers}`,
      leadReviewCompletion: `${team.summary.leadsReviewCompletedCount}/${team.numberOfTeamMembers}`,
      f2fCompletion: `${team.summary.f2fCompletedCount}/${team.numberOfTeamMembers}`,
    };
  });

  useEffect(() => {
    return () => {
      apiController.current.abort();
    };
  }, []);

  useEffect(() => {
    closeReviewEmployeeView();
    setSelectedEmployeeEmail("");
    closeReportView();
    setSelectedTeamId(null);
    setSelectedEmployee(null);
  }, [location.search]);

  useEffect(() => {
    const filteredTeams = formattedTeams.filter((team) =>
      Object.values(team).some((value) => String(value).toLowerCase().includes(debouncedSearchText.toLowerCase()))
    );
    const newFilteredSummary = calculateAllTeamsSummary(filteredTeams);
    setFilteredSummary(newFilteredSummary);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchText]);

  useEffect(() => {
    setFilteredSummary(summary);
  }, [summary]);

  useEffect(() => {
    if (currentCycle.parCycleId) {
      apiController.current = new AbortController();
      if (userEmail) {
        dispatch(
          fetchTeams({
            parCycleId: currentCycle.parCycleId,
            signal: apiController.current.signal,
          })
        );
      }
    }
    if (dayjs().diff(currentCycle.parEmployeeDeadline, "day", true) >= 0) {
      setActiveStep(1);
    }
    if (dayjs().diff(currentCycle.parLeadDeadline, "day", true) - 1 >= 0) {
      setActiveStep(2);
    }
    if (dayjs().diff(currentCycle.parSpecialRatingDeadline, "day", true) >= 0) {
      setActiveStep(3);
    }
    if (dayjs().diff(currentCycle.parEvaluationEndDate, "day", true) >= 0) {
      setActiveStep(4);
    }

    dispatch(fetchConfigurations());
  }, [currentCycle.parCycleId]);

  useEffect(() => {
    if (selectedTab === 1 && currentCycle.parCycleId) {
      dispatch(fetchParticipants({ parCycleId: currentCycle.parCycleId, leadEmail: null }));
    }
    if (selectedTab === 2) {
      fetchReviews();
    }
  }, [selectedTab]);

  useEffect(() => {
    if (selectedTab === 1 && currentCycle.parCycleId && selectedEmployee) {
      dispatch(fetchParRatingSummary(selectedEmployee.workEmail));
    }
  }, [selectedEmployee]);

  const handleConfirmReviewRestore = async () => {
    if (currentCycle.parCycleId && selectedReview) {
      const values: {
        par360ReviewStatus: ParThreeSixtyReviewStatus;
        reviewerEmail?: string;
      } = {
        par360ReviewStatus: ParThreeSixtyReviewStatus.PENDING,
        reviewerEmail: selectedReview.reviewerEmail,
      };
      const resultAction = await dispatch(
        postReviews({
          employeeId: selectedReview.employeeEmail,
          parCycleId: currentCycle.parCycleId,
          values: values,
        })
      );

      if (postReviews.fulfilled.match(resultAction)) {
        fetchReviews();
      }
    }
  };

  const columns = [
    { field: "parBusinessUnit", headerName: "BU", flex: 0.15 },
    { field: "parDepartment", headerName: "Department", flex: 0.15 },
    { field: "parTeam", headerName: "Team", flex: 0.15 },
    { field: "parSubTeam", headerName: "Sub Team", flex: 0.15 },
    { field: "parLeadEmail", headerName: "Lead", flex: 0.15 },
    {
      field: "employeePARCompletion",
      headerName: "Employee PAR",
      flex: 0.09,
      renderCell: (params: GridRenderCellParams<FormattedTeam>) => (
        <Chip size="small" label={params.row.employeePARCompletion} />
      ),
    },
    {
      field: "leadReviewCompletion",
      headerName: "Lead's Feedback",
      flex: 0.08,
      renderCell: (params: GridRenderCellParams<FormattedTeam>) => <Chip size="small" label={params.row.leadReviewCompletion} />,
    },
    {
      field: "f2fCompletion",
      headerName: "F2F",
      flex: 0.08,
      renderCell: (params: GridRenderCellParams<FormattedTeam>) => <Chip size="small" label={params.row.f2fCompletion} />,
    },
    { field: "numberOf5pSlots", headerName: "5% Slots", flex: 0.09 },
    { field: "numberOf20pSlots", headerName: "20% Slots", flex: 0.09 },
    {
      field: "actions",
      headerName: "",
      sortable: false,
      flex: 0.1,
      disableExport: true,
      renderCell: (params: GridRenderCellParams<FormattedTeam>) => (
        <Tooltip arrow title="Open Team" enterDelay={tooltipVisibilityDelay} enterNextDelay={tooltipVisibilityDelay}>
          <Button
            variant="outlined"
            endIcon={
              <Box sx={{ m: 0, p: 0, ml: -1 }}>
                <KeyboardArrowRightIcon />
              </Box>
            }
            sx={{
              m: 0,
              p: 0,
              borderRadius: 5,
            }}
            onClick={() => handleTeamsTableClick(params.row.id)}
          ></Button>
        </Tooltip>
      ),
    },
  ];

  const employeeColumns = [
    {
      field: "employeeName",
      headerName: "Employee Name",
      flex: 2,
      renderCell: (params: GridRenderCellParams) => (
        <Box display="flex" alignItems="center" position="relative">
          <Avatar
            src={employeeMap[params.row?.workEmail]?.employeeThumbnail}
            alt={"Employee Thumbnail"}
            sx={{ marginRight: 2, height: "2.2rem", width: "2.2rem" }}
          />
          <Typography variant="h5">{params.row?.employeeName}</Typography>
        </Box>
      ),
    },
    {
      field: "workEmail",
      headerName: "Employee Email",
      flex: 2,
      renderCell: (params: GridRenderCellParams) => (
        <Typography color={"GrayText"} variant="h6">
          {params.row?.workEmail}
        </Typography>
      ),
    },
    {
      field: "actions",
      headerName: "",
      sortable: false,
      flex: 0.3,
      renderCell: (params: GridRenderCellParams) => (
        <>
          <IconButton
            sx={{
              color: "primary.main",
              "&:hover": {
                bgcolor: "primary.main",
                color: "white",
              },
              mr: 2,
            }}
            onClick={() => handleEmployeeSelect(params.row, false)}
          >
            {params.row.parLeadStatus === ParLeadStatus.SHARED || isAdminHistoryViewOn ? (
              <Tooltip arrow title="View" enterDelay={tooltipVisibilityDelay} enterNextDelay={tooltipVisibilityDelay}>
                <VisibilityIcon />
              </Tooltip>
            ) : (
              <Tooltip arrow title="Review" enterDelay={tooltipVisibilityDelay} enterNextDelay={tooltipVisibilityDelay}>
                <RateReviewIcon />
              </Tooltip>
            )}
          </IconButton>
          <IconButton
            sx={{
              color: "primary.main",
              "&:hover": {
                bgcolor: "primary.main",
                color: "white",
              },
            }}
            onClick={() => {
              handleEmployeeSelect(params.row, true);
            }}
          >
            <Tooltip
              arrow
              title="View summary of PAR history"
              enterDelay={tooltipVisibilityDelay}
              enterNextDelay={tooltipVisibilityDelay}
            >
              <HistoryEduIcon />
            </Tooltip>
          </IconButton>
        </>
      ),
    },
  ];

  const reviewColumns = [
    {
      field: "employeeEmail",
      headerName: "Reviewee Details",
      flex: 2,
      renderCell: (params: GridRenderCellParams) => (
        <Box display="flex" alignItems="center" position="relative">
          <Avatar
            src={employeeMap[params.row?.employeeEmail]?.employeeThumbnail}
            alt={"Employee Thumbnail"}
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
            <Typography variant="h5">
              {employeeMap[params.row?.employeeEmail]?.employeeName ?? params.row?.employeeEmail}
            </Typography>
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
              <Typography variant="body2" color="text.secondary">
                {params.row?.employeeEmail}
              </Typography>
            </Box>
          </Box>
        </Box>
      ),
    },
    {
      field: "isOfferedFeedback",
      headerName: "Review Type",
      flex: 2,
      renderCell: (params: GridRenderCellParams) => (
        <Box display="flex" alignItems="center" position="relative">
          <Chip
            size="small"
            label={params.row.isOfferedFeedback === "TRUE" ? "Was offered a review by" : " Requested a review from"}
            sx={{
              height: 24,
              width: "180px",
              borderRadius: 12,
              fontWeight: 500,
              fontSize: "0.75rem",
              backgroundColor:
                params.row.isOfferedFeedback === "TRUE"
                  ? (theme) =>
                    theme.palette.mode === "light"
                      ? alpha(theme.palette.info.main, 0.1)
                      : alpha(theme.palette.info.main, 0.8)
                  : (theme) =>
                    theme.palette.mode === "light"
                      ? alpha(theme.palette.warning.main, 0.1)
                      : alpha(theme.palette.warning.main, 0.8),

              "& .MuiChip-label": {
                px: 1.5,
                py: 0.5,
              },
            }}
          />
        </Box>
      ),
    },
    {
      field: "reviewerEmail",
      headerName: "Reviewer Details",
      flex: 2,
      renderCell: (params: GridRenderCellParams) => (
        <Box display="flex" alignItems="center" position="relative">
          <Avatar
            src={employeeMap[params.row?.reviewerEmail]?.employeeThumbnail}
            alt={"Reviewer Thumbnail"}
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
            <Typography variant="h5">
              {employeeMap[params.row?.reviewerEmail]?.employeeName ?? params.row?.reviewerEmail}
            </Typography>
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
              <Typography variant="body2" color="text.secondary">
                {params.row?.reviewerEmail}
              </Typography>
            </Box>
          </Box>
        </Box>
      ),
    },
    {
      field: "actions",
      headerName: "",
      sortable: false,
      flex: 1,
      renderCell: (params: GridRenderCellParams) => (
        <IconButton
          sx={{
            color: "primary.main",
            "&:hover": {
              bgcolor: "primary.main",
              color: "white",
            },
          }}
          onClick={() => handleClickRestoreReview(params.row)}
        >
          <Tooltip
            arrow
            title="Restore the declined review"
            enterDelay={tooltipVisibilityDelay}
            enterNextDelay={tooltipVisibilityDelay}
          >
            <UpdateIcon />
          </Tooltip>
        </IconButton>
      ),
    },
  ];

  return (
    <Stack sx={{ height: "100%" }}>
      {!isParCycleSettingsOpen && (
        <Box height={"100%"}>
          {selectedTeamId === null && !reviewEmployeeView && !reportView && !isParCompletionViewOpen && (
            <Box flexDirection={"column"} height={"100%"}>
              <Grid container mb={1}>
                <Grid size={{ xs: 12, sm: 6 }} alignContent={"center"}>
                  {isAdminHistoryViewOn && (
                    <Box sx={{ display: "inline" }}>
                      <IconButton aria-label="back" color="primary" onClick={closeOrgSummaryView} sx={{ mb: 1, mr: 1 }}>
                        <ArrowBackIcon />
                      </IconButton>

                      <Link underline="hover" color="inherit" variant="h5" onClick={closeOrgSummaryView}>
                        {"History"}
                      </Link>
                      <Typography display={"inline"} variant="h5">
                        {" / "}
                      </Typography>
                    </Box>
                  )}
                  <Typography display={"inline"} variant="h5">
                    {currentCycle.parCycleName}{" "}
                  </Typography>
                  <Typography display={"inline"}>
                    ({dayjs(currentCycle.parCycleStartDate).format(shortDateFormat)} -{" "}
                    {dayjs(currentCycle.parCycleEndDate).format(shortDateFormat)})
                  </Typography>
                </Grid>
                <Grid
                  size={{ xs: 12, sm: 6 }}
                  pr={2}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    gap: 1,
                  }}
                >
                  <Button variant="contained" onClick={openReportView}>
                    View Reports
                  </Button>

                  {!isAdminHistoryViewOn && (
                    <>
                      <Button sx={{ ml: 1 }} onClick={handleEmployeeSyncModal} variant="contained">
                        Sync an Employee
                      </Button>

                      <Button onClick={openBulkReminderModal} variant="contained">
                        Bulk Reminders
                      </Button>

                      <Button color="error" variant="contained" onClick={handleParClosingDialogOpen}>
                        Close Cycle
                      </Button>
                      <Tooltip
                        arrow
                        title="Open Cycle Dates"
                        enterDelay={tooltipVisibilityDelay}
                        enterNextDelay={tooltipVisibilityDelay}
                      >
                        <IconButton
                          aria-label="cycle dates"
                          onClick={openCycleDeadlines}
                          sx={{
                            color: "primary.main",
                            "&:hover": {
                              bgcolor: "primary.main",
                              color: "white",
                            },
                            mr: 1,
                          }}
                        >
                          <DateRangeIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip
                        arrow
                        title="PAR Cycle Settings"
                        enterDelay={tooltipVisibilityDelay}
                        enterNextDelay={tooltipVisibilityDelay}
                      >
                        <IconButton
                          aria-label="cycle settings"
                          onClick={openParCycleSettings}
                          sx={{
                            color: "primary.main",
                            "&:hover": {
                              bgcolor: "primary.main",
                              color: "white",
                            },
                          }}
                        >
                          <SettingsIcon />
                        </IconButton>
                      </Tooltip>
                    </>
                  )}
                </Grid>
              </Grid>
              <>
                <Card variant="outlined" sx={{ padding: 2 }}>
                  <Grid container>
                    <Grid size={{ xs: 12, sm: 12 }} display={"flex"} alignItems={"center"} justifyContent={"space-between"}>
                      <Typography variant="h5">Completion Status</Typography>
                      <Box>
                        <Tooltip
                          arrow
                          title="PAR Completion Overview"
                          enterDelay={tooltipVisibilityDelay}
                          enterNextDelay={tooltipVisibilityDelay}
                        >
                          <IconButton
                            aria-label="PAR completion overview"
                            onClick={openParCompletionView}
                            sx={{
                              color: "primary.main",
                              "&:hover": {
                                bgcolor: "primary.main",
                                color: "white",
                              },
                            }}
                          >
                            <OpenInNewIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Grid>
                  </Grid>
                  <Grid container spacing={10}>
                    <Grid size={{ xs: 12, sm: 4 }} >
                      <CompletionStatusCard
                        name="Employee PAR"
                        completed={filteredSummary.totalEmployeeParComplete}
                        total={filteredSummary.totalEmployees}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }} >
                      <CompletionStatusCard
                        name="Lead's PAR"
                        completed={filteredSummary.totalLeadReviewComplete}
                        total={filteredSummary.totalEmployees}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
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
                    height: "auto",
                    p: 1,
                    width: "100%",
                    flex: 1,
                    mt: 1,
                  }}
                >
                  <Tabs
                    value={selectedTab}
                    onChange={handleTabChange}
                    aria-label="admin tabs"
                    sx={{ borderColor: "divider" }}
                  >
                    <Tab label="Team View" />
                    <Tab label="Employee View" />
                    <Tab label="Rejected Reviews" />
                    <Tab label="Quota Allocations" />
                  </Tabs>

                  {selectedTab === 0 && (
                    <>
                      {teamState === RequestState.LOADING && (
                        <Card
                          variant="outlined"
                          sx={{
                            textAlign: "center",
                            height: "30vh",
                            overflow: "auto",
                            mt: 2,
                          }}
                        >
                          <LoadingEffect message={uiMessages.loading.pageLoading} />
                        </Card>
                      )}

                      {teamState === RequestState.FAILED && (
                        <Card
                          variant="outlined"
                          sx={{
                            textAlign: "center",
                            height: "calc(100vh - 23rem)",
                            overflow: "auto",
                            mt: 2,
                          }}
                        >
                          <NoDataView text={"Error occurred while fetching teams"} />
                        </Card>
                      )}

                      {teamState === RequestState.SUCCEEDED && (
                        <>
                          {teams.length > 0 ? (
                            <DataGrid
                              sx={{
                                border: "none",
                                "& .MuiDataGrid-row:hover": {
                                  cursor: "pointer",
                                },
                              }}
                              rows={formattedTeams}
                              columns={columns}
                              autoHeight
                              disableRowSelectionOnClick
                              pageSizeOptions={[10, 20, 25]}
                              rowHeight={60}
                              onRowClick={(params) => handleTeamsTableClick(params.row.id)}
                              slots={{
                                toolbar: GridToolbar,
                              }}
                              slotProps={{
                                toolbar: {
                                  showQuickFilter: true,
                                  quickFilterProps: { debounceMs: 500 },
                                },
                                baseTextField: {
                                  placeholder: "Search Team",
                                },
                              }}
                              onFilterModelChange={(model) => {
                                setSearchText(model.quickFilterValues?.[0]?.toString() || "");
                              }}
                              initialState={{
                                pagination: {
                                  paginationModel: { pageSize: 10, page: 0 },
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
                          ) : (
                            <Card
                              variant="outlined"
                              sx={{
                                textAlign: "center",
                                height: "calc(100vh - 23rem)",
                                overflow: "auto",
                                mt: 2,
                              }}
                            >
                              <NoDataView text={uiMessages.error.noTeamsFound} />
                            </Card>
                          )}
                        </>
                      )}
                    </>
                  )}

                  {selectedTab === 1 && (
                    <>
                      {employeeArrayStatus === RequestState.LOADING && (
                        <Card
                          variant="outlined"
                          sx={{
                            textAlign: "center",
                            height: "30vh",
                            overflow: "auto",
                            mt: 2,
                          }}
                        >
                          <LoadingEffect message={uiMessages.loading.pageLoading} />
                        </Card>
                      )}

                      {employeeArrayStatus === RequestState.FAILED && (
                        <Card
                          variant="outlined"
                          sx={{
                            textAlign: "center",
                            height: "calc(100vh - 23rem)",
                            overflow: "auto",
                            mt: 2,
                          }}
                        >
                          <NoDataView text={"Error occurred while fetching employees"} />
                        </Card>
                      )}

                      {employeeArrayStatus === RequestState.SUCCEEDED && (
                        <>
                          {employeeArray.length > 0 ? (
                            <>
                              <DataGrid
                                sx={{
                                  border: "none",
                                  "& .MuiDataGrid-row:hover": {
                                    backgroundColor: "inherit",
                                  },
                                }}
                                rows={employeeArray}
                                getRowId={(row) => row.workEmail}
                                columns={employeeColumns}
                                rowHeight={50}
                                autoHeight
                                pageSizeOptions={[10, 20, 25]}
                                slots={{
                                  toolbar: GridToolbar,
                                }}
                                slotProps={{
                                  toolbar: {
                                    showQuickFilter: true,
                                    quickFilterProps: { debounceMs: 500 },
                                  },
                                  baseTextField: {
                                    placeholder: "Search Employee",
                                  },
                                }}
                                onFilterModelChange={(model) => {
                                  setEmployeeSearchText(model.quickFilterValues?.[0]?.toString() || "");
                                }}
                                initialState={{
                                  pagination: {
                                    paginationModel: { pageSize: 10, page: 0 },
                                  },
                                  filter: {
                                    filterModel: {
                                      items: [
                                        {
                                          id: "employeeSearchText",
                                          value: employeeSearchText,
                                          field: "employeeSearchText",
                                          operator: "contains",
                                        },
                                      ],
                                    },
                                  },
                                }}
                              />
                              {selectedEmployee && (
                                <CustomModal
                                  open={isEmpHistoryModalOpen}
                                  onClose={() => setIsEmpHistoryModalOpen(false)}
                                >
                                  {
                                    <SummarizedParHistoryView
                                      empName={selectedEmployee.employeeName}
                                      empEmail={selectedEmployee.workEmail}
                                      empThumbnail={employeeMap[selectedEmployee.workEmail].employeeThumbnail ?? ""}
                                      handleClose={() => setIsEmpHistoryModalOpen(false)}
                                    />
                                  }
                                </CustomModal>
                              )}
                            </>
                          ) : (
                            <Card
                              variant="outlined"
                              sx={{
                                textAlign: "center",
                                height: "calc(100vh - 23rem)",
                                overflow: "auto",
                                mt: 2,
                              }}
                            >
                              <NoDataView text={"No employees found"} />
                            </Card>
                          )}
                        </>
                      )}
                    </>
                  )}

                  {selectedTab === 2 && (
                    <>
                      {reviewStatus === RequestState.LOADING && (
                        <Card
                          variant="outlined"
                          sx={{
                            textAlign: "center",
                            height: "30vh",
                            overflow: "auto",
                            mt: 2,
                          }}
                        >
                          <LoadingEffect message={uiMessages.loading.pageLoading} />
                        </Card>
                      )}

                      {reviewStatus === RequestState.FAILED && (
                        <Card
                          variant="outlined"
                          sx={{
                            textAlign: "center",
                            height: "calc(100vh - 23rem)",
                            overflow: "auto",
                            mt: 2,
                          }}
                        >
                          <NoDataView text={"Error occurred while fetching reviews"} />
                        </Card>
                      )}

                      {reviewStatus === RequestState.SUCCEEDED && (
                        <>
                          {rejectedReviews.length > 0 ? (
                            <>
                              <DataGrid
                                sx={{
                                  border: "none",
                                  "& .MuiDataGrid-row:hover": {
                                    backgroundColor: "inherit",
                                  },
                                }}
                                rows={rejectedReviews}
                                getRowId={(row) => {
                                  return row.employeeEmail + row.reviewerEmail;
                                }}
                                columns={reviewColumns}
                                rowHeight={50}
                                autoHeight
                                pageSizeOptions={[10, 20, 25]}
                                slots={{
                                  toolbar: GridToolbar,
                                }}
                                slotProps={{
                                  toolbar: {
                                    showQuickFilter: true,
                                    quickFilterProps: { debounceMs: 500 },
                                  },
                                  baseTextField: {
                                    placeholder: "Search Reviews",
                                  },
                                }}
                                onFilterModelChange={(model) => {
                                  setReviewSearchText(model.quickFilterValues?.[0]?.toString() || "");
                                }}
                                initialState={{
                                  pagination: {
                                    paginationModel: { pageSize: 10, page: 0 },
                                  },
                                  filter: {
                                    filterModel: {
                                      items: [
                                        {
                                          id: "reviewSearchText",
                                          value: reviewSearchText,
                                          field: "searchText",
                                          operator: "contains",
                                        },
                                      ],
                                    },
                                  },
                                }}
                              />
                              <ConfirmationDialog
                                open={openConfirmationDialog}
                                onClose={handleConfirmationDialogClose}
                                title="Restore Review"
                                message={`Are you sure you need to restore the declined review request?`}
                                okText="Yes"
                                onConfirm={handleConfirmReviewRestore}
                                ariaLabelledby="alert-par-closing-dialog-title"
                                ariaDescribedby="alert-par-closing-dialog-description"
                                isWarning={true}
                              />
                            </>
                          ) : (
                            <Card
                              variant="outlined"
                              sx={{
                                textAlign: "center",
                                height: "calc(100vh - 23rem)",
                                overflow: "auto",
                                mt: 2,
                              }}
                            >
                              <NoDataView text={"No reviews found"} />
                            </Card>
                          )}
                        </>
                      )}
                    </>
                  )}
                  {selectedTab === 3 && <SpecialRatingAllocationView isAdminView={true} />}
                </Card>
              </>

              <CustomModal open={bulkReminderModal} onClose={closeBulkReminderModal}>
                {<BulkReminderModal onClose={closeBulkReminderModal} isAdmin={true} />}
              </CustomModal>
              <CustomModal open={isParCycleDatesOpen} onClose={closeCycleDeadlines} width="80vw">
                <Typography id="dashboard-modal-title" variant="h5" pb={2}>
                  Cycle Dates
                </Typography>
                <Divider sx={{ bgcolor: "primary.main" }} />
                <Box pt={9} pb={5}>
                  <CycleDatesStepper cycle={currentCycle} activeStep={activeStep} />
                </Box>
              </CustomModal>
              <CustomModal open={employeeSyncModal} onClose={handleEmployeeSyncModal}>
                <EmployeeSyncModal />
              </CustomModal>
              <ConfirmationDialog
                open={parClosingDialog}
                onClose={handleParClosingDialogClose}
                title={uiMessages.dialog.closeParCycle.title}
                message={uiMessages.dialog.closeParCycle.message}
                okText={uiMessages.dialog.closeParCycle.okText}
                onConfirm={handleParClosingProceed}
                ariaLabelledby="alert-par-closing-dialog-title"
                ariaDescribedby="alert-par-closing-dialog-description"
                isWarning={true}
              />
            </Box>
          )}

          {selectedTeamId !== null && !reviewEmployeeView && (
            <TeamSummary
              cycle={currentCycle}
              teamId={selectedTeamId}
              openReviewEmployeeView={openReviewEmployeeView}
              isAdminAuditViewOn={isAdminAuditViewOn}
              isAdminHistoryViewOn={isAdminHistoryViewOn}
              closeTeamSummary={() => setSelectedTeamId(null)}
            />
          )}

          {(selectedTeamId !== null || selectedEmployeeEmail !== null) &&
            reviewEmployeeView &&
            currentCycle?.parCycleId &&
            currentCycle.parCycleConfigurations && (
              <Review
                selectedEmployeeEmail={selectedEmployeeEmail}
                closeReviewEmployeeView={closeReviewEmployeeView}
                isAdminAuditViewOn={isAdminAuditViewOn}
                isAdminHistoryViewOn={isAdminHistoryViewOn}
              />
            )}

          {reportView && currentCycle?.parCycleId && (
            <Report
              parCycle={currentCycle}
              closeReportView={closeReportView}
              isAdminHistoryViewOn={isAdminHistoryViewOn}
            />
          )}

          {isParCompletionViewOpen && currentCycle?.parCycleId && (
            <Completion parCycle={currentCycle} closeCompletionView={closeParCompletionView} />
          )}
        </Box>
      )}
      {isParCycleSettingsOpen && <ParCycleSettingsForm closeParCycleSettings={closeParCycleSettings} />}
    </Stack>
  );
};
