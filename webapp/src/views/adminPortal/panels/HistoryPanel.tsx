// Copyright (c) 2024, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useAppDispatch, useAppSelector } from "@slices/store";
import {
  fetchClosedParCycles,
  fetchParCycleById,
  selectAllCycles,
  selectParCycleState,
} from "@slices/parCycleSlice";
import { RequestState } from "@utils/types";
import { LoadingEffect } from "@components/ui/Loading";
import { shortDateFormat, uiMessages } from "@config/constant";
import dayjs from "dayjs";
import { OrgSummary } from "../components/OrgSummary";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";

const HistoryPanel = () => {
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
    <>
      <Box
        sx={{
          height: "calc(100vh - 17rem)",
          overflowY: "auto",
        }}
      >
        {!isOpen && (
          <TableContainer sx={{ height: "100%" }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: "50%", fontWeight: "bold" }}>
                    Cycle Name
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Start Date</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>End Date</TableCell>
                  <TableCell
                    sx={{ width: "10%", fontWeight: "bold" }}
                  ></TableCell>
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
                    {allCycles.length > 0 &&
                      allCycles.map((cycle) => (
                        <TableRow
                          sx={{ cursor: "pointer" }}
                          hover
                          key={cycle.parCycleId}
                          onClick={() => handleRowClick(cycle.parCycleId)}
                        >
                          <TableCell sx={{ py: 2 }}>
                            {cycle.parCycleName}
                          </TableCell>
                          <TableCell sx={{ py: 2 }}>
                            {dayjs(cycle.parCycleStartDate).format(
                              shortDateFormat
                            )}
                          </TableCell>
                          <TableCell sx={{ py: 2 }}>
                            {dayjs(cycle.parCycleEndDate).format(
                              shortDateFormat
                            )}
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
                              onClick={() => handleRowClick(cycle.parCycleId)}
                            ></Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    {allCycles.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={3}
                          align="center"
                          style={{ border: "none" }}
                        >
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
          <OrgSummary
            closeOrgSummaryView={closeOrgSummaryView}
            isAdminHistoryViewOn={true}
          />
        )}
      </Box>
    </>
  );
};

export default HistoryPanel;
