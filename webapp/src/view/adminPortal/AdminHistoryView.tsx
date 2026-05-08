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

import HistoryIcon from "@mui/icons-material/History";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import {
  Box,
  Button,
  Fade,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import dayjs from "dayjs";

import { useEffect, useState } from "react";

import { FormContainer } from "@component/common/FormContainer";
import Title from "@component/common/Title";
import { LoadingEffect } from "@component/ui/Loading";
import { shortDateFormat, uiMessages } from "@config/constant";
import {
  fetchClosedParCycles,
  fetchParCycleById,
  selectAllCycles,
  selectParCycleState,
} from "@slices/parCycleSlice/parCycle";
import { useAppDispatch, useAppSelector } from "@slices/store";
import { RequestState } from "@utils/types";

import { OrgSummary } from "./components/OrgSummary";

export default function AdminHistoryView() {
  const dispatch = useAppDispatch();
  const allCycles = useAppSelector(selectAllCycles);
  const cycleLoadingState = useAppSelector(selectParCycleState);

  const [isOpen, setIsOpen] = useState(false);

  const openOrgSummaryView = () => setIsOpen(true);
  const closeOrgSummaryView = () => setIsOpen(false);

  const handleRowClick = (cycleId: number) => {
    dispatch(fetchParCycleById(cycleId));
    openOrgSummaryView();
  };

  useEffect(() => {
    dispatch(fetchClosedParCycles());
  }, [dispatch]);

  return (
    <Fade in={true}>
      <Stack sx={{ height: "100%" }}>
        <FormContainer>
          <Title
            firstWord="Admin"
            secondWord="Portal - History"
            icon={<HistoryIcon fontSize="medium" />}
          />

          <Box sx={{ flexGrow: 1, overflowY: "auto", p: { xs: 2, md: 3 } }}>
            <Box sx={{ height: "100%" }}>
              {!isOpen && (
                <TableContainer sx={{ height: "100%" }}>
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ width: "50%", fontWeight: "bold" }}>Cycle Name</TableCell>
                        <TableCell sx={{ fontWeight: "bold" }}>Start Date</TableCell>
                        <TableCell sx={{ fontWeight: "bold" }}>End Date</TableCell>
                        <TableCell sx={{ width: "10%", fontWeight: "bold" }}></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody sx={{ overflow: "auto", maxHeight: "100%" }}>
                      {cycleLoadingState === RequestState.LOADING && (
                        <TableRow>
                          <TableCell colSpan={4} style={{ border: "none" }}>
                            <LoadingEffect message={uiMessages.loading.pageLoading} />
                          </TableCell>
                        </TableRow>
                      )}

                      {cycleLoadingState === RequestState.SUCCEEDED && (
                        <>
                          {allCycles.length > 0 ? (
                            allCycles.map((cycle) => (
                              <TableRow
                                sx={{ cursor: "pointer" }}
                                hover
                                key={cycle.parCycleId}
                                onClick={() => handleRowClick(cycle.parCycleId)}
                              >
                                <TableCell sx={{ py: 2 }}>{cycle.parCycleName}</TableCell>
                                <TableCell sx={{ py: 2 }}>
                                  {dayjs(cycle.parCycleStartDate).format(shortDateFormat)}
                                </TableCell>
                                <TableCell sx={{ py: 2 }}>
                                  {dayjs(cycle.parCycleEndDate).format(shortDateFormat)}
                                </TableCell>
                                <TableCell sx={{ py: 2 }}>
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
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRowClick(cycle.parCycleId);
                                    }}
                                  />
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={4} align="center" style={{ border: "none" }}>
                                <Typography>No data available</Typography>
                              </TableCell>
                            </TableRow>
                          )}
                        </>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {isOpen && cycleLoadingState === RequestState.LOADING && (
                <LoadingEffect message={uiMessages.loading.pageLoading} />
              )}

              {isOpen && cycleLoadingState === RequestState.SUCCEEDED && (
                <OrgSummary closeOrgSummaryView={closeOrgSummaryView} isAdminHistoryViewOn={true} />
              )}
            </Box>
          </Box>
        </FormContainer>
      </Stack>
    </Fade>
  );
}
