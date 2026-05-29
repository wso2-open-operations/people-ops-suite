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
import { useLocation } from "react-router-dom";

import {
  Alert,
  Box,
  Button,
  Fade,
  Grid,
  Paper,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";

import AccountTreeIcon from "@mui/icons-material/AccountTree";
import HistoryIcon from "@mui/icons-material/History";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";

import { gradients, tooltipVisibilityDelay, uiMessages } from "@config/constant";
import { RequestState, Role } from "@utils/types";

import { selectRoles, selectUserEmail } from "@slices/authSlice/auth";
import {
  fetchParRatingOfEmployee,
  fetchPreviousParCyclesOfEmployee,
  selectEmployeeStatus,
  selectPreviousParCycleOfEmployee,
} from "@slices/employeeSlice/employee";
import { selectManagerEmailSet } from "@slices/metaSlice/meta";
import { ParCycle } from "@slices/parCycleSlice/parCycle";
import { useAppDispatch, useAppSelector } from "@slices/store";

import { EmployeePar } from "@component/common/EmployeePar";
import Title from "@component/common/Title";
import { LoadingEffect } from "@component/ui/Loading";
import ChainViewTab from "./ChainViewTab";

const ParHistory = () => {
  const location = useLocation();
  const dispatch = useAppDispatch();
  const userEmail = useAppSelector(selectUserEmail);
  const roles = useAppSelector(selectRoles);
  const previousCycles = useAppSelector(selectPreviousParCycleOfEmployee);
  const cycleLoadingState = useAppSelector(selectEmployeeStatus);
  const managerEmailSet = useAppSelector(selectManagerEmailSet);

  const theme = useTheme();

  const isLead = roles.includes(Role.LEAD);
  const hasSubordinates = !!userEmail && managerEmailSet.has(userEmail);
  const [activeTab, setActiveTab] = useState(0);

  const [isEmployeePreviousParOpen, setIsEmployeePreviousParOpen] = useState(false);
  const [selectedParCycle, setSelectedParCycle] = useState<Partial<ParCycle> | undefined>(
    undefined,
  );

  const closeParRatingView = () => setIsEmployeePreviousParOpen(false);

  const handleRowClick = async (cycle: Partial<ParCycle>) => {
    if (cycle.parCycleId && userEmail) {
      const resultAction = await dispatch(
        fetchParRatingOfEmployee({
          parCycleId: cycle.parCycleId,
          employeeId: userEmail,
        }),
      );
      if (fetchParRatingOfEmployee.fulfilled.match(resultAction)) {
        setIsEmployeePreviousParOpen(true);
        setSelectedParCycle(cycle);
      }
    }
  };

  useEffect(() => {
    setIsEmployeePreviousParOpen(false);
    setSelectedParCycle(undefined);
  }, [location]);

  useEffect(() => {
    if (userEmail) {
      dispatch(fetchPreviousParCyclesOfEmployee(userEmail));
    }
  }, [dispatch, userEmail]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    if (newValue === 0) {
      setIsEmployeePreviousParOpen(false);
      setSelectedParCycle(undefined);
    }
  };

  return (
    <Fade in={true}>
      <Grid sx={{ height: "100%" }}>
        <Paper
          sx={{
            width: "100%",
            height: "100%",
            borderRadius: "0.5rem",
            padding: "10px",
            background: theme.palette.mode === "dark" ? gradients.dark : gradients.light,
            boxShadow: "none",
            border: "none",
            overflowX: "hidden",
            boxSizing: "border-box",
          }}
        >
          <Title firstWord="PAR" secondWord="History" icon={<HistoryIcon fontSize="medium" />} />

          {isLead && hasSubordinates && (
            <Box sx={{ borderBottom: 1, borderColor: "divider", px: 2 }}>
              <Tabs value={activeTab} onChange={handleTabChange} aria-label="PAR History tabs">
                <Tab
                  icon={<HistoryIcon />}
                  iconPosition="start"
                  label="My History"
                  id="par-history-tab-0"
                  aria-controls="par-history-panel-0"
                />
                <Tab
                  icon={<AccountTreeIcon />}
                  iconPosition="start"
                  label="Report Chain"
                  id="par-history-tab-1"
                  aria-controls="par-history-panel-1"
                />
              </Tabs>
            </Box>
          )}

          {/* My History Tab (default, always shown; for leads only when tab 0 is active) */}
          <Box
            role="tabpanel"
            id="par-history-panel-0"
            hidden={isLead && hasSubordinates && activeTab !== 0}
          >
            <Alert severity="info" sx={{ mx: 4, mt: 2 }}>
              <Typography>{uiMessages.alert.historyDataNotSynced}</Typography>
            </Alert>

            {!isEmployeePreviousParOpen && (
              <Box sx={{ mx: 4, mt: 2 }}>
                <TableContainer
                  component="div"
                  sx={{ background: "transparent", height: "calc(100vh - 240px)" }}
                >
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell
                          sx={{
                            width: "50%",
                            background: "transparent",
                            borderBottom: "none",
                            fontWeight: 600,
                            fontSize: "0.8rem",
                            color: "text.primary",
                            pb: 2,
                          }}
                        >
                          Cycle Name
                        </TableCell>
                        <TableCell
                          sx={{
                            background: "transparent",
                            borderBottom: "none",
                            fontWeight: 600,
                            fontSize: "0.8rem",
                            color: "text.primary",
                          }}
                        >
                          Start Date
                        </TableCell>
                        <TableCell
                          sx={{
                            background: "transparent",
                            borderBottom: "none",
                            fontWeight: 600,
                            fontSize: "0.8rem",
                            color: "text.primary",
                          }}
                        >
                          End Date
                        </TableCell>
                        <TableCell
                          sx={{ width: "10%", background: "transparent", borderBottom: "none" }}
                        />
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {cycleLoadingState === RequestState.LOADING && (
                        <TableRow>
                          <TableCell
                            colSpan={4}
                            sx={{
                              border: "none",
                              height: "calc(100vh - 500px)",
                              textAlign: "center",
                              verticalAlign: "middle",
                            }}
                          >
                            <LoadingEffect message={uiMessages.loading.pageLoading} />
                          </TableCell>
                        </TableRow>
                      )}
                      {cycleLoadingState === RequestState.SUCCEEDED && (
                        <>
                          {previousCycles.length > 0 &&
                            previousCycles.map((cycle) => (
                              <TableRow
                                hover
                                key={cycle.parCycleId}
                                onClick={() => handleRowClick(cycle)}
                                sx={{
                                  cursor: "pointer",
                                  "& .MuiTableCell-root": { borderBottom: "none" },
                                }}
                              >
                                <TableCell sx={{ py: 1 }}>{cycle.parCycleName}</TableCell>
                                <TableCell sx={{ py: 1 }}>
                                  {dayjs(cycle.parCycleStartDate).format("D MMM 'YY")}
                                </TableCell>
                                <TableCell sx={{ py: 1 }}>
                                  {dayjs(cycle.parCycleEndDate).format("D MMM 'YY")}
                                </TableCell>
                                <TableCell sx={{ py: 1 }}>
                                  <Tooltip
                                    arrow
                                    title="View"
                                    enterDelay={tooltipVisibilityDelay}
                                    enterNextDelay={tooltipVisibilityDelay}
                                  >
                                    <Button
                                      variant="outlined"
                                      endIcon={
                                        <Box sx={{ m: 0, p: 0, ml: -1, pt: 1 }}>
                                          <KeyboardArrowRightIcon />
                                        </Box>
                                      }
                                      sx={{
                                        m: 0,
                                        p: 0,
                                        borderRadius: 5,
                                      }}
                                      onClick={() => handleRowClick(cycle)}
                                    ></Button>
                                  </Tooltip>
                                </TableCell>
                              </TableRow>
                            ))}
                          {previousCycles.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={4} align="center" sx={{ border: "none" }}>
                                <Typography color="text.secondary">No data available</Typography>
                              </TableCell>
                            </TableRow>
                          )}
                        </>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            {isEmployeePreviousParOpen && selectedParCycle && (
              <Box sx={{ minHeight: "calc(100vh - 430px)" }} mx={4} my={3}>
                <EmployeePar
                  closeParRatingView={closeParRatingView}
                  previousPageName="History"
                  selectedCycle={selectedParCycle}
                />
              </Box>
            )}
          </Box>

          {/* Chain View Tab — only for team leads */}
          {isLead && hasSubordinates && (
            <Box
              role="tabpanel"
              id="par-history-panel-1"
              hidden={activeTab !== 1}
              sx={{ p: 2, height: "calc(100vh - 300px)", overflow: "auto" }}
            >
              {activeTab === 1 && <ChainViewTab />}
            </Box>
          )}
        </Paper>
      </Grid>
    </Fade>
  );
};

export default ParHistory;
