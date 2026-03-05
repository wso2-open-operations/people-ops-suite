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
import { ParCycle } from "@slices/parCycleSlice/parCycle";

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
    };
  }) as unknown as Team[];

  const columns = [
    { field: "parBusinessUnit", headerName: "BU", flex: 0.15 },
    { field: "parDepartment", headerName: "Department", flex: 0.15 },
    { field: "parTeam", headerName: "Team", flex: 0.15 },
    { field: "parSubTeam", headerName: "Sub Team", flex: 0.15 },
    {
      field: "employeePARCompletion",
      headerName: "Employee PAR",
      flex: 0.1,
      renderCell: (params: GridRenderCellParams<Team>) => {
        const completed = params.row.summary.employeeParCompletedCount;
        const total = params.row.numberOfTeamMembers;
        return (
          <Chip
            size="small"
            label={`${completed}/${total}`}
            sx={{
              backgroundColor: completed === total ? "success.main" : "warning.dark",
            }}
          />
        );
      },
    },
    {
      field: "leadReviewCompletion",
      headerName: "Lead's Feedback",
      flex: 0.1,
      renderCell: (params: GridRenderCellParams<Team>) => {
        const completed = params.row.summary.leadsReviewCompletedCount;
        const total = params.row.numberOfTeamMembers;
        return (
          <Chip
            size="small"
            label={`${completed}/${total}`}
            sx={{
              backgroundColor: completed === total ? "success.main" : "warning.dark",
            }}
          />
        );
      },
    },
    {
      field: "f2fCompletion",
      headerName: "F2F",
      flex: 0.1,
      renderCell: (params: GridRenderCellParams<Team>) => {
        const completed = params.row.summary.f2fCompletedCount;
        const total = params.row.numberOfTeamMembers;
        return (
          <Chip
            size="small"
            label={`${completed}/${total}`}
            sx={{
              backgroundColor: completed === total ? "success.main" : "warning.dark",
            }}
          />
        );
      },
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
