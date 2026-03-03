// Copyright (c) 2024, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import {
  IconButton,
  Box,
  Stack,
  Tooltip,
  Chip,
  useTheme,
} from "@mui/material";
import { selectUserEmail } from "@slices/authSlice/auth";
import {
  fetchCurrentParCycleOfEmployee,
  selectEmployeeStatus,
} from "@slices/employeeSlice/employee";
import { useAppSelector, useAppDispatch } from "@slices/store";
import { useEffect, useRef, useState } from "react";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import { TeamSummary } from "../components/TeamSummary";
import { MultiTeamSummary } from "../components/MultiTeamSummary";
import {
  fetchTeams,
  selectAllTeams,
  selectAllTeamsSummary,
  selectTeamStatus,
  Team,
} from "@slices/teamSlice/team";
import { RequestState } from "@utils/types";
import { LoadingEffect } from "@component/ui/Loading";
import { tooltipVisibilityDelay, uiMessages } from "@config/constant";
import { Review } from "../components/Review";
import { useNavigate, useLocation } from "react-router-dom";
import { GridRenderCellParams, GridRowParams } from "@mui/x-data-grid";
import { tokens } from "../../../theme";
import NoDataView from "@component/common/NoDataView";
import { ParCycle } from "@root/src/slices/parCycleSlice/parCycle";

const LeadOngoingPanel = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const userEmail = useAppSelector(selectUserEmail);
  const parCycleLoadingStatus = useAppSelector(selectEmployeeStatus);
  const teamsLoadingStatus = useAppSelector(selectTeamStatus);
  const teams = useAppSelector(selectAllTeams);
  const summary = useAppSelector(selectAllTeamsSummary);
  const apiController = useRef(new AbortController());
  const dispatch = useAppDispatch();
  const [filteredSummary, setFilteredSummary] = useState(summary);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [currentCycle, setCurrentCycle] = useState<ParCycle | null>(null);
  const [reviewEmployeeView, setReviewEmployeeView] = useState(false);
  const [showTeamsTable, setShowTeamsTable] = useState(false);
  const [isLeadMultiTeamViewOn, setIsLeadMultiTeamViewOn] = useState(false);
  const [isMainView, setIsMainView] = useState(true);
  const initialRenderRef = useRef(true);

  const openReviewEmployeeView = (employeeEmail: string) => {
    setSelectedEmployeeEmail(employeeEmail);
    setReviewEmployeeView(true);
    navigate(
      `/lead-portal?teamId=${selectedTeamId}&employeeEmail=${employeeEmail}`
    );
  };

  const closeReviewEmployeeView = () => {
    setReviewEmployeeView(false);
    setSelectedEmployeeEmail("");
    navigate(`/lead-portal?teamId=${selectedTeamId}`);
  };

  // Stores the selected employee email for the team member
  const [selectedEmployeeEmail, setSelectedEmployeeEmail] =
    useState<string>("");

  const isLoading =
    parCycleLoadingStatus === RequestState.LOADING ||
    teamsLoadingStatus === RequestState.LOADING;

  const isDataFetched =
    parCycleLoadingStatus === RequestState.SUCCEEDED &&
    teamsLoadingStatus === RequestState.SUCCEEDED;

  const handleTeamChange = (params: GridRowParams) => {
    const value = params.row.parTeamId;
    setSelectedTeamId(value);
    setShowTeamsTable(false);
    navigate(`/lead-portal?teamId=${value}`);
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

  const columns = [
    { field: "parBusinessUnit", headerName: "BU", flex: 0.15 },
    { field: "parDepartment", headerName: "Department", flex: 0.15 },
    { field: "parTeam", headerName: "Team", flex: 0.15 },
    { field: "parSubTeam", headerName: "Sub Team", flex: 0.15 },
    {
      field: "employeePARCompletion",
      headerName: "Employee PAR",
      flex: 0.1,
      renderCell: (params: GridRenderCellParams<Team>) => (
        <Chip
          size="small"
          label={params.row.employeePARCompletion}
          sx={{
            backgroundColor:
              params.row.employeePARCompletion ===
              params.row.numberOfTeamMembers
                ? colors.greenAccent[600]
                : colors.yellowAccent[900],
          }}
        />
      ),
    },
    {
      field: "leadReviewCompletion",
      headerName: "Lead's Feedback",
      flex: 0.1,
      renderCell: (params: GridRenderCellParams<Team>) => (
        <Chip
          size="small"
          label={params.row.leadReviewCompletion}
          sx={{
            backgroundColor:
              params.row.leadReviewCompletion === params.row.numberOfTeamMembers
                ? colors.greenAccent[600]
                : colors.yellowAccent[900],
          }}
        />
      ),
    },
    {
      field: "f2fCompletion",
      headerName: "F2F",
      flex: 0.1,
      renderCell: (params: GridRenderCellParams<Team>) => (
        <Chip
          size="small"
          label={params.row.f2fCompletion}
          sx={{
            backgroundColor:
              params.row.f2fCompletion === params.row.numberOfTeamMembers
                ? colors.greenAccent[600]
                : colors.yellowAccent[900],
          }}
        />
      ),
    },
    {
      field: "actions",
      headerName: "",
      sortable: false,
      flex: 0.1,
      disableExport: true,
      renderCell: (params: GridRenderCellParams<Team>) => (
        <IconButton
          sx={{
            color: "primary.main",
            "&:hover": {
              bgcolor: "primary.main",
              color: "white",
            },
          }}
          onClick={() => handleTeamChange}
        >
          <Tooltip
            arrow
            title="Open Team"
            enterDelay={tooltipVisibilityDelay}
            enterNextDelay={tooltipVisibilityDelay}
          >
            <KeyboardArrowRightIcon />
          </Tooltip>
        </IconButton>
      ),
    },
  ];

  const fetchData = async () => {
    if (userEmail) {
      const fetchParCycleResult = await dispatch(
        fetchCurrentParCycleOfEmployee(userEmail)
      );

      if (fetchCurrentParCycleOfEmployee.fulfilled.match(fetchParCycleResult)) {
        const currentCycle = fetchParCycleResult.payload.currentCycle;
        setCurrentCycle(currentCycle);

        if (userEmail && currentCycle.parCycleId) {
          apiController.current = new AbortController();
          dispatch(
            fetchTeams({
              parCycleId: currentCycle.parCycleId,
              email: userEmail,
              signal: apiController.current.signal,
            })
          );
        }
      }
    }
  };

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const employeeEmail = searchParams.get("employeeEmail");
    const teamIdFromUrl = searchParams.get("teamId");
    const teamId = teamIdFromUrl ? parseInt(teamIdFromUrl, 10) : null;
    const newIsMainView = !teamId && !employeeEmail;
    setIsMainView(newIsMainView);

    if (initialRenderRef.current) {
      initialRenderRef.current = false;
      fetchData();
    } else if (newIsMainView && !isMainView) {
      // Only fetch data when returning to main view
      fetchData();
    }

    const resetView = () => {
      setSelectedEmployeeEmail("");
      setReviewEmployeeView(false);
      setShowTeamsTable(true);
      if (location.pathname + location.search !== "/lead-portal") {
        navigate("/lead-portal", { replace: true });
      }
    };

    const setTeamView = (id: number) => {
      setSelectedTeamId(id);
      setShowTeamsTable(false);
    };

    const setEmployeeReviewView = (email: string, id: number) => {
      setSelectedEmployeeEmail(email);
      setSelectedTeamId(id);
      setReviewEmployeeView(true);
    };

    if (teams.length > 1) {
      setIsLeadMultiTeamViewOn(true);

      if (teamId && teams.some((team: Team) => team.parTeamId === teamId)) {
        employeeEmail
          ? setEmployeeReviewView(employeeEmail, teamId)
          : setTeamView(teamId);
      } else {
        resetView();
      }
    } else if (teams.length === 1) {
      const singleTeamId = teams[0].parTeamId;
      setShowTeamsTable(false);
      setSelectedTeamId(singleTeamId);

      if (teamId === singleTeamId) {
        employeeEmail
          ? setEmployeeReviewView(employeeEmail, teamId)
          : setTeamView(teamId);
      } else if (teamId) {
        // navigate("/lead-portal", { replace: true });
        if (location.pathname + location.search !== "/lead-portal") {
          navigate("/lead-portal", { replace: true });
        }
      }
    } else {
      setShowTeamsTable(false);
      setSelectedTeamId(null);
    }
  }, [teams, userEmail]);

  useEffect(() => {
    setFilteredSummary(summary);
  }, [summary]);

  useEffect(() => {
    return () => {
      apiController.current.abort();
    };
  }, []);

  return (
    <Box display={"flex"} flexDirection={"column"}>
      <Stack sx={{ height: "100vh", minWidth: "100%", flex: 1 }}>
        {isLoading && (
          <Box sx={{ height: "70vh" }}>
            <LoadingEffect message={uiMessages.loading.pageLoading} />
          </Box>
        )}

        {isDataFetched && currentCycle && (
          <>
            {showTeamsTable && (
              <MultiTeamSummary
                filteredSummary={filteredSummary}
                formattedTeams={formattedTeams}
                columns={columns}
                handleTeamChange={handleTeamChange}
                setFilteredSummary={setFilteredSummary}
              />
            )}

            {!showTeamsTable &&
              !reviewEmployeeView &&
              selectedTeamId !== null && (
                <TeamSummary
                  cycle={currentCycle}
                  teamId={selectedTeamId}
                  closeTeamSummary={() => {
                    setShowTeamsTable(true);
                    setSelectedTeamId(null);
                    navigate("/lead-portal");
                  }}
                  openReviewEmployeeView={openReviewEmployeeView}
                  isLeadMultiTeamViewOn={isLeadMultiTeamViewOn}
                />
              )}

            {!showTeamsTable &&
              reviewEmployeeView &&
              currentCycle?.parCycleId && (
                <Review
                  selectedEmployeeEmail={selectedEmployeeEmail}
                  closeReviewEmployeeView={closeReviewEmployeeView}
                />
              )}
          </>
        )}

        {isDataFetched &&
          currentCycle?.parCycleId &&
          !showTeamsTable &&
          selectedTeamId === null && (
            <Box sx={{ height: "70vh" }}>
              <NoDataView text={uiMessages.error.noTeamsUnderLead} />
            </Box>
          )}

        {parCycleLoadingStatus === RequestState.SUCCEEDED &&
          teamsLoadingStatus !== RequestState.LOADING &&
          !currentCycle?.parCycleId && (
            <Box sx={{ height: "70vh" }}>
              <NoDataView text={uiMessages.error.noParCycleFound} />
            </Box>
          )}
      </Stack>
    </Box>
  );
};

export default LeadOngoingPanel;
