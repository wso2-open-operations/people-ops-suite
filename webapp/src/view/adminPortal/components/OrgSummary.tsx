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
import DateRangeIcon from "@mui/icons-material/DateRange";
import HistoryEduIcon from "@mui/icons-material/HistoryEdu";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import RateReviewIcon from "@mui/icons-material/RateReview";
import SettingsIcon from "@mui/icons-material/Settings";
import UpdateIcon from "@mui/icons-material/Update";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import FilterListIcon from "@mui/icons-material/FilterList";
import SearchIcon from "@mui/icons-material/Search";
import ViewColumnIcon from "@mui/icons-material/ViewColumn";
import VisibilityIcon from "@mui/icons-material/Visibility";
import {
  Avatar,
  Box,
  Button,
  Card,
  Chip,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  Link,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { DataGrid, GridPreferencePanelsValue, GridRenderCellParams, useGridApiRef } from "@mui/x-data-grid";
import dayjs from "dayjs";
import { useLocation } from "react-router-dom";
import { useDebounce } from "use-debounce";

import { useEffect, useRef, useState } from "react";

import { CompletionStatusCard } from "@component/common/CompletionStatusCard";
import { ConfirmationDialog } from "@component/common/ConfirmationDialog";
import { CustomModal } from "@component/common/CustomModal";
import { CycleDatesStepper } from "@component/common/CycleDatesStepper";
import NoDataView from "@component/common/NoDataView";
import SpecialRatingAllocationView from "@component/common/SpecialRatingAllocationView";
import { LoadingEffect } from "@component/ui/Loading";
import { shortDateFormat, tooltipVisibilityDelay, uiMessages } from "@config/constant";
import { selectUserEmail } from "@slices/authSlice/auth";
import { fetchParRatingSummary } from "@slices/employeeHistorySlice/employeeHistory";
import { ParLeadStatus } from "@slices/employeeHistorySlice/employeeHistory";
import {
  Employee,
  fetchConfigurations,
  fetchEmployees,
  fetchParticipants,
  selectEmployeeMap,
  selectEmployeeMapStatus,
  selectParticipants,
  selectParticipantsStatus,
} from "@slices/metaSlice/meta";
import {
  closeParCycle,
  fetchOpenParCycle,
  selectCurrentCycle,
} from "@slices/parCycleSlice/parCycle";
import { useAppDispatch, useAppSelector } from "@slices/store";
import {
  Team,
  fetchTeams,
  selectAllTeams,
  selectAllTeamsSummary,
  selectTeamStatus,
} from "@slices/teamSlice/team";
import {
  RejectedReview,
  fetchRejectedReviews,
  postReviews,
  selectRejectedReviews,
  selectThreeSixtyReviewStatus,
} from "@slices/threeSixtyReviewSlice/threeSixtyReview";
import { ParThreeSixtyReviewStatus } from "@slices/threeSixtyReviewSlice/threeSixtyReview";
import { RequestState } from "@utils/types";
import { calculateAllTeamsSummary } from "@utils/utils";
import { BulkReminderModal } from "@view/adminPortal/components/BulkReminderModal";
import { Completion } from "@view/adminPortal/components/Completion";
import { Report } from "@view/adminPortal/components/Report";
import EmployeeSyncModal from "@view/leadPortal/components/EmployeeSyncModal";
import { Review } from "@view/leadPortal/components/Review";
import { TeamSummary } from "@view/leadPortal/components/TeamSummary";

import { ParCycleSettingsForm } from "./ParCycleSettingsForm";
import SummarizedParHistoryView from "./SummarizedParHistoryView";

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

export const OrgSummary = ({
  closeOrgSummaryView,
  isAdminAuditViewOn,
  isAdminHistoryViewOn,
}: DashboardProps) => {
  const theme = useTheme();
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
  const employeeMapStatus = useAppSelector(selectEmployeeMapStatus);
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
  // Stores the unified search text for the active tab
  const [tableSearchText, setTableSearchText] = useState("");
  // Stores the filtered summary
  const [filteredSummary, setFilteredSummary] = useState(summary);
  // Debounces the search text for filteredSummary recalculation
  const [debouncedTableSearch] = useDebounce(tableSearchText, 500);
  // ApiRefs for each DataGrid tab
  const teamApiRef = useGridApiRef();
  const employeeApiRef = useGridApiRef();
  const reviewApiRef = useGridApiRef();
  // NOTE: Array order must match Tab order — [0]=Team View, [1]=Employee View, [2]=Rejected Reviews
  const tabApiRefs = [teamApiRef, employeeApiRef, reviewApiRef];
  // Stores the selected employee email
  const [selectedEmployeeEmail, setSelectedEmployeeEmail] = useState<string>("");
  // Stores the state of review employee view
  const [reviewEmployeeView, setReviewEmployeeView] = useState(false);
  // Stores the state of reports view
  const [reportView, setReportView] = useState(false);
  const [isParCycleDatesOpen, setIsParCycleDatesOpen] = useState(false);
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

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
    setTableSearchText("");
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
    if (selectedTab === 0) {
      const filteredTeams = formattedTeams.filter((team) =>
        Object.values(team).some((value) =>
          String(value).toLowerCase().includes(debouncedTableSearch.toLowerCase()),
        ),
      );
      const newFilteredSummary = calculateAllTeamsSummary(filteredTeams);
      setFilteredSummary(newFilteredSummary);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedTableSearch, selectedTab]);

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
          }),
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
    if ((selectedTab === 1 || selectedTab === 2) && employeeMapStatus === RequestState.IDLE) {
      dispatch(fetchEmployees());
    }
  }, [selectedTab]);

  useEffect(() => {
    const ref = tabApiRefs[selectedTab];
    if (ref?.current) {
      ref.current.setQuickFilterValues(tableSearchText ? [tableSearchText] : []);
    }
  }, [tableSearchText]);

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
        }),
      );

      if (postReviews.fulfilled.match(resultAction)) {
        fetchReviews();
      }
    }
  };

  const captionFontSize = theme.typography.caption.fontSize ?? "0.75rem";

  const dataGridSx = {
    border: "none",
    fontSize: captionFontSize,
    "& .MuiDataGrid-columnHeaderTitle": {
      fontSize: captionFontSize,
      fontWeight: 600,
    },
    "& .MuiDataGrid-columnHeader": {
      px: 1,
      py: 0,
    },
    "& .MuiDataGrid-cell": {
      px: 1,
      py: "3px",
    },
    "& .MuiDataGrid-row:hover": {
      cursor: "pointer",
    },
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
      renderCell: (params: GridRenderCellParams<FormattedTeam>) => (
        <Chip size="small" label={params.row.leadReviewCompletion} />
      ),
    },
    {
      field: "f2fCompletion",
      headerName: "F2F",
      flex: 0.08,
      renderCell: (params: GridRenderCellParams<FormattedTeam>) => (
        <Chip size="small" label={params.row.f2fCompletion} />
      ),
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
        <Box display="flex" alignItems="center" height="100%">
          <Tooltip
            arrow
            title="Open Team"
            enterDelay={tooltipVisibilityDelay}
            enterNextDelay={tooltipVisibilityDelay}
          >
            <IconButton
              size="small"
              onClick={() => handleTeamsTableClick(params.row.id)}
              sx={{
                borderRadius: "4px",
                padding: "4px",
                color: theme.palette.primary.main,
                "&:hover": {
                  borderRadius: "4px",
                  bgcolor: theme.palette.primary.main,
                  color: theme.palette.common.white,
                },
              }}
            >
              <KeyboardArrowRightIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
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
            src={params.row?.employeeThumbnail || ""}
            alt={params.row?.employeeName}
            sx={{ marginRight: 1, height: "1.6rem", width: "1.6rem", fontSize: "0.65rem" }}
          >
            {params.row?.employeeName?.charAt(0)}
          </Avatar>
          <Typography variant="body2" fontWeight={500}>
            {params.row?.employeeName}
          </Typography>
        </Box>
      ),
    },
    {
      field: "workEmail",
      headerName: "Employee Email",
      flex: 2,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="caption" color={theme.palette.text.secondary}>
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
        <Box display="flex" alignItems="center" height="100%" gap={0.5}>
          <Tooltip
            arrow
            title={params.row.parLeadStatus === ParLeadStatus.SHARED || isAdminHistoryViewOn ? "View" : "Review"}
            enterDelay={tooltipVisibilityDelay}
            enterNextDelay={tooltipVisibilityDelay}
          >
            <IconButton
              size="small"
              onClick={() => handleEmployeeSelect(params.row, false)}
              sx={{
                borderRadius: "4px",
                padding: "4px",
                color: theme.palette.primary.main,
                "&:hover": {
                  borderRadius: "4px",
                  bgcolor: theme.palette.primary.main,
                  color: theme.palette.common.white,
                },
              }}
            >
              {params.row.parLeadStatus === ParLeadStatus.SHARED || isAdminHistoryViewOn ? (
                <VisibilityIcon fontSize="small" />
              ) : (
                <RateReviewIcon fontSize="small" />
              )}
            </IconButton>
          </Tooltip>
          <Tooltip
            arrow
            title="View summary of PAR history"
            enterDelay={tooltipVisibilityDelay}
            enterNextDelay={tooltipVisibilityDelay}
          >
            <IconButton
              size="small"
              onClick={() => handleEmployeeSelect(params.row, true)}
              sx={{
                borderRadius: "4px",
                padding: "4px",
                color: theme.palette.primary.main,
                "&:hover": {
                  borderRadius: "4px",
                  bgcolor: theme.palette.primary.main,
                  color: theme.palette.common.white,
                },
              }}
            >
              <HistoryEduIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
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
            src={employeeMap[params.row?.employeeEmail]?.employeeThumbnail || ""}
            alt={employeeMap[params.row?.employeeEmail]?.employeeName ?? params.row?.employeeEmail}
            sx={{ marginRight: 1, height: "1.6rem", width: "1.6rem", fontSize: "0.65rem" }}
          >
            {(employeeMap[params.row?.employeeEmail]?.employeeName ?? params.row?.employeeEmail)?.charAt(0)}
          </Avatar>
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
            <Typography variant="body2" fontWeight={500}>
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
              <Typography variant="caption" color={theme.palette.text.secondary}>
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
            label={
              params.row.isOfferedFeedback === "TRUE"
                ? "Was offered a review by"
                : " Requested a review from"
            }
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
            src={employeeMap[params.row?.reviewerEmail]?.employeeThumbnail || ""}
            alt={employeeMap[params.row?.reviewerEmail]?.employeeName ?? params.row?.reviewerEmail}
            sx={{ marginRight: 1, height: "1.6rem", width: "1.6rem", fontSize: "0.65rem" }}
          >
            {(employeeMap[params.row?.reviewerEmail]?.employeeName ?? params.row?.reviewerEmail)?.charAt(0)}
          </Avatar>
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
            <Typography variant="body2" fontWeight={500}>
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
              <Typography variant="caption" color={theme.palette.text.secondary}>
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
            color: theme.palette.primary.main,
            "&:hover": {
              bgcolor: theme.palette.primary.main,
              color: theme.palette.common.white,
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
        <Box >
          {selectedTeamId === null &&
            !reviewEmployeeView &&
            !reportView &&
            !isParCompletionViewOpen && (
              <Box flexDirection={"column"} height={"100%"}>
                <Grid container mb={"5px"} mt={"5px"} spacing={2}>
                  {/* Title Section */}
                  <Grid size={{ xs: 12, md: 4 }} alignContent={"center"}>
                    {isAdminHistoryViewOn && (
                      <Box sx={{ display: "inline" }}>
                        <IconButton
                          aria-label="back"
                          color="primary"
                          onClick={closeOrgSummaryView}
                          sx={{ mb: 1, mr: 1 }}
                        >
                          <ArrowBackIcon />
                        </IconButton>
                        <Link
                          underline="hover"
                          color="inherit"
                          variant="h5"
                          onClick={closeOrgSummaryView}
                        >
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

                  {/* Actions Section (Buttons & Icons) */}
                  <Grid
                    size={{ xs: 12, md: 8 }}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: { xs: "flex-start", md: "flex-end" },
                      flexWrap: "wrap",
                      gap: 1,
                    }}
                  >
                    <Button
                      variant="contained"
                      sx={{ whiteSpace: "nowrap" }}
                      onClick={openReportView}
                    >
                      View Reports
                    </Button>
                    {!isAdminHistoryViewOn && (
                      <>
                        <Button
                          sx={{ whiteSpace: "nowrap" }}
                          onClick={handleEmployeeSyncModal}
                          variant="contained"
                        >
                          Sync an Employee
                        </Button>
                        <Button
                          sx={{ whiteSpace: "nowrap" }}
                          onClick={openBulkReminderModal}
                          variant="contained"
                        >
                          Bulk Reminders
                        </Button>
                        <Button
                          sx={{ whiteSpace: "nowrap" }}
                          color="error"
                          variant="contained"
                          onClick={handleParClosingDialogOpen}
                        >
                          Close Cycle
                        </Button>

                        {/* Group the icons in a flex box so they wrap to a new row together */}
                        <Box sx={{ display: "flex", gap: 1 }}>
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
                                ml: 1,
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
                                mr: 1,
                              }}
                            >
                              <SettingsIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </>
                    )}
                  </Grid>
                </Grid>
                <>
                  <Card variant="outlined" sx={{ padding: 1, ml: 0.2, mr: 0.2 }}>
                    <Grid container>
                      <Grid
                        size={{ xs: 12, sm: 12 }}
                        display={"flex"}
                        alignItems={"center"}
                        justifyContent={"space-between"}
                      >
                        <Typography sx={{ color: theme.palette.brandColors.lightOrange }}>
                          Completion Status
                        </Typography>
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
                                p: 0,
                                mr: "8px",
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
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <CompletionStatusCard
                          name="Employee PAR"
                          completed={filteredSummary.totalEmployeeParComplete}
                          total={filteredSummary.totalEmployees}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 4 }}>
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
                      padding: 1,
                      flex: 1,
                      mt: "10px",
                      ml: 0.2,
                      mr: 0.2,
                    }}
                  >
                    <Box
                      display="flex"
                      alignItems="center"
                      sx={{ borderBottom: 1, borderColor: "divider" }}
                    >
                      <Tabs
                        value={selectedTab}
                        onChange={handleTabChange}
                        aria-label="admin tabs"
                        variant="scrollable"
                        scrollButtons="auto"
                        allowScrollButtonsMobile
                        sx={{ flex: 1, minWidth: 0, px: 1 }}
                      >
                        <Tab label="Team View" />
                        <Tab label="Employee View" />
                        <Tab label="Rejected Reviews" />
                        <Tab label="Quota Allocations" />
                      </Tabs>
                      {selectedTab < 3 && (
                        <Box
                          display="flex"
                          alignItems="center"
                          gap={0.5}
                          sx={{ pr: 1, flexShrink: 0 }}
                        >
                          <Tooltip title="Columns" enterDelay={500}>
                            <IconButton
                              size="small"
                              onClick={() =>
                                tabApiRefs[selectedTab]?.current?.showPreferences(
                                  GridPreferencePanelsValue.columns,
                                )
                              }
                            >
                              <ViewColumnIcon sx={{ fontSize: "1.1rem" }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Filters" enterDelay={500}>
                            <IconButton
                              size="small"
                              onClick={() => tabApiRefs[selectedTab]?.current?.showFilterPanel()}
                            >
                              <FilterListIcon sx={{ fontSize: "1.1rem" }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Export CSV" enterDelay={500}>
                            <IconButton
                              size="small"
                              onClick={() => tabApiRefs[selectedTab]?.current?.exportDataAsCsv()}
                            >
                              <FileDownloadIcon sx={{ fontSize: "1.1rem" }} />
                            </IconButton>
                          </Tooltip>
                          <TextField
                            size="small"
                            placeholder="Search…"
                            value={tableSearchText}
                            onChange={(e) => setTableSearchText(e.target.value)}
                            slotProps={{
                              input: {
                                startAdornment: (
                                  <InputAdornment position="start">
                                    <SearchIcon sx={{ fontSize: "1rem" }} />
                                  </InputAdornment>
                                ),
                              },
                            }}
                            sx={{ width: 180, "& .MuiInputBase-root": { height: 32 } }}
                          />
                        </Box>
                      )}
                    </Box>

                    {selectedTab === 0 && (
                      <>
                        {teamState === RequestState.LOADING && (
                          <Card
                            variant="outlined"
                            sx={{
                              textAlign: "center",
                              height: "calc(100vh - 24rem)",
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
                                apiRef={teamApiRef}
                                sx={dataGridSx}
                                rows={formattedTeams}
                                columns={columns}
                                autoHeight
                                disableRowSelectionOnClick
                                pageSizeOptions={[10, 20, 25]}
                                rowHeight={38}
                                onRowClick={(params) => handleTeamsTableClick(params.row.id)}
                                initialState={{
                                  pagination: {
                                    paginationModel: { pageSize: 10, page: 0 },
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
                                  apiRef={employeeApiRef}
                                  sx={dataGridSx}
                                  rows={employeeArray}
                                  getRowId={(row) => row.workEmail}
                                  columns={employeeColumns}
                                  rowHeight={36}
                                  autoHeight
                                  pageSizeOptions={[10, 20, 25]}
                                  initialState={{
                                    pagination: {
                                      paginationModel: { pageSize: 10, page: 0 },
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
                                        empThumbnail={
                                          employeeMap[selectedEmployee.workEmail]
                                            ?.employeeThumbnail ?? ""
                                        }
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
                                  apiRef={reviewApiRef}
                                  sx={dataGridSx}
                                  rows={rejectedReviews}
                                  getRowId={(row) => {
                                    return row.employeeEmail + row.reviewerEmail;
                                  }}
                                  columns={reviewColumns}
                                  rowHeight={36}
                                  autoHeight
                                  pageSizeOptions={[10, 20, 25]}
                                  initialState={{
                                    pagination: {
                                      paginationModel: { pageSize: 10, page: 0 },
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
      {isParCycleSettingsOpen && (
        <ParCycleSettingsForm closeParCycleSettings={closeParCycleSettings} />
      )}
    </Stack>
  );
};
