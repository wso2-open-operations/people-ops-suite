// Copyright (c) 2024, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Grid,
  IconButton,
  Fade,
  Paper,
  Alert,
  Tooltip,
  Button,
  TableContainer,
} from "@mui/material";

import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@slices/store";
import { LoadingEffect } from "@components/ui/Loading";
import { tooltipVisibilityDelay, uiMessages } from "@config/constant";
import { ParCycle, RequestState } from "@utils/types";

import HistoryIcon from "@mui/icons-material/History";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";

import { selectUserEmail } from "@slices/authSlice";
import {
  fetchParRatingOfEmployee,
  fetchPreviousParCyclesOfEmployee,
  selectEmployeeStatus,
  selectPreviousParCycleOfEmployee,
} from "@slices/employeeSlice";
import { EmployeePar } from "@components/common/EmployeePar";
import dayjs from "dayjs";
import { useLocation } from "react-router-dom";

const ParHistory = () => {
  const location = useLocation();
  const dispatch = useAppDispatch();
  const userEmail = useAppSelector(selectUserEmail);
  const previousCycles = useAppSelector(selectPreviousParCycleOfEmployee);
  const cycleLoadingState = useAppSelector(selectEmployeeStatus);

  const [isEmployeePreviousParOpen, setIsEmployeePreviousParOpen] =
    useState(false);
  const [selectedParCycle, setSelectedParCycle] = useState<
    Partial<ParCycle> | undefined
  >(undefined);

  const closeParRatingView = () => setIsEmployeePreviousParOpen(false);

  const handleRowClick = async (cycle: Partial<ParCycle>) => {
    if (cycle.parCycleId && userEmail) {
      const resultAction = await dispatch(
        fetchParRatingOfEmployee({
          parCycleId: cycle.parCycleId,
          employeeId: userEmail,
        })
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

  return (
    <Fade in={true}>
      <Grid item>
        <Paper
          className="paper"
          variant="outlined"
          sx={{
            height: "calc(100vh - 150px)",
            borderRadius: "5px",
            minWidth: "1200px",
          }}
        >
          <Grid
            item
            xs={12}
            sx={{
              display: "flex",
              justifyContent: "space-between",
              margin: "10px",
            }}
          >
            <Grid
              item
              xs={12}
              style={{
                display: "flex",
                justifyContent: "left",
              }}
            >
              <IconButton color="primary" component="label" onClick={() => {}}>
                <HistoryIcon fontSize="large" />
              </IconButton>
              <Typography
                variant="h4"
                sx={{ marginTop: "12px", marginLeft: "10px" }}
              >
                PAR History
              </Typography>
            </Grid>
          </Grid>
          <Alert severity="info" sx={{ margin: 2 }}>
            <Typography>{uiMessages.alert.historyDataNotSynced}</Typography>
          </Alert>

          {!isEmployeePreviousParOpen && (
            <Box sx={{ margin: 4 }}>
              <TableContainer sx={{ height: "calc(100vh - 350px)" }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell
                        sx={{ width: "50%", fontWeight: "bold", color: "grey" }}
                      >
                        Cycle Name
                      </TableCell>
                      <TableCell sx={{ fontWeight: "bold", color: "grey" }}>
                        Start Date
                      </TableCell>
                      <TableCell sx={{ fontWeight: "bold", color: "grey" }}>
                        End Date
                      </TableCell>
                      <TableCell sx={{ width: "10%" }}></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {cycleLoadingState === RequestState.LOADING && (
                      <TableRow>
                        <TableCell colSpan={3} style={{ border: "none" }}>
                          <LoadingEffect
                            message={uiMessages.loading.pageLoading}
                          />
                        </TableCell>
                      </TableRow>
                    )}
                    {cycleLoadingState === RequestState.SUCCEEDED && (
                      <>
                        {previousCycles.length > 0 &&
                          previousCycles.map((cycle) => (
                            <TableRow
                              sx={{ cursor: "pointer" }}
                              hover
                              key={cycle.parCycleId}
                              onClick={() => handleRowClick(cycle)}
                            >
                              <TableCell>{cycle.parCycleName}</TableCell>
                              <TableCell>
                                {dayjs(cycle.parCycleStartDate).format(
                                  "D MMM 'YY"
                                )}
                              </TableCell>
                              <TableCell>
                                {dayjs(cycle.parCycleEndDate).format(
                                  "D MMM 'YY"
                                )}
                              </TableCell>
                              <TableCell>
                                <Tooltip
                                  arrow
                                  title="View"
                                  enterDelay={tooltipVisibilityDelay}
                                  enterNextDelay={tooltipVisibilityDelay}
                                >
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
                                    onClick={() => handleRowClick(cycle)}
                                  ></Button>
                                </Tooltip>
                              </TableCell>
                            </TableRow>
                          ))}
                        {previousCycles.length === 0 && (
                          <TableRow>
                            <TableCell
                              colSpan={3}
                              align="center"
                              style={{ border: "none" }}
                            >
                              <Typography color={"GrayText"}>
                                No data available
                              </Typography>
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
            <Box sx={{ minHeight: "calc(100vh - 350px)" }} mx={4} my={3}>
              <EmployeePar
                closeParRatingView={closeParRatingView}
                previousPageName="History"
                selectedCycle={selectedParCycle}
              />
            </Box>
          )}
        </Paper>
      </Grid>
    </Fade>
  );
};

export default ParHistory;
