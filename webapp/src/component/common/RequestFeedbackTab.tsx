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
import AddIcon from "@mui/icons-material/Add";
import {
  Alert,
  Avatar,
  Box,
  Fab,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

import React, { useEffect, useState } from "react";

import { CustomModal } from "@component/common/CustomModal";
import { ReviewRequestModal } from "@component/common/ReviewRequestModal";
import { LoadingEffect } from "@component/ui/Loading";
import { tooltipVisibilityDelay, uiMessages } from "@config/constant";
import { ParLeadStatus } from "@root/src/slices/employeeHistorySlice/employeeHistory";
import { selectUserEmail } from "@slices/authSlice/auth";
import {
  selectCurrentParCycleOfEmployee,
  selectEmployeeRatings,
} from "@slices/employeeSlice/employee";
import { selectEmployeeMap } from "@slices/metaSlice/meta";
import { selectCurrentCycle } from "@slices/parCycleSlice/parCycle";
import { useAppDispatch, useAppSelector } from "@slices/store";
import {
  fetchReviewers,
  selectThreeSixtyReviewStatus,
  selectThreeSixtyReviewers,
} from "@slices/threeSixtyReviewSlice/threeSixtyReview";
import { RequestState } from "@utils/types";

import NoDataView from "./NoDataView";

dayjs.extend(utc);

export const RequestFeedbackTab = () => {
  const reviewSliceState = useAppSelector(selectThreeSixtyReviewStatus);
  const reviewers = useAppSelector(selectThreeSixtyReviewers);
  const userEmail = useAppSelector(selectUserEmail);
  const employeeMap = useAppSelector(selectEmployeeMap);
  const employeeCurrentParCycle = useAppSelector(selectCurrentParCycleOfEmployee);
  const ratings = useAppSelector(selectEmployeeRatings);
  const currentCycle = useAppSelector(selectCurrentCycle);

  const dispatch = useAppDispatch();

  const [isDeadlinePassed, setIsDeadlinePassed] = useState(false);

  const [reviewRequestModal, setReviewRequestModal] = useState(false);
  const openReviewRequestModal = () => setReviewRequestModal(true);
  const closeReviewRequestModal = () => setReviewRequestModal(false);

  useEffect(() => {
    const deadlineLocal = dayjs(currentCycle.parThreeSixtyRatingDeadline).endOf("day");
    setIsDeadlinePassed(dayjs().isAfter(deadlineLocal));
  }, [currentCycle.parThreeSixtyRatingDeadline]);

  useEffect(() => {
    if (userEmail && currentCycle.parCycleId) {
      dispatch(
        fetchReviewers({
          employeeId: userEmail,
          parCycleId: currentCycle.parCycleId,
        }),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCycle.parCycleId, userEmail]);

  const alertMessage =
    ratings.parLeadStatus === ParLeadStatus.SHARED
      ? "Lead has shared the PAR"
      : isDeadlinePassed
        ? `The deadline for requesting 360° feedback has passed on ${dayjs
            .utc(currentCycle.parThreeSixtyRatingDeadline)
            .format("D MMM 'YY")}`
        : `Please request feedback before the deadline: ${dayjs
            .utc(currentCycle.parThreeSixtyRatingDeadline)
            .format("D MMM 'YY")}`;

  return (
    <React.Fragment>
      <Box position="relative" height="100%" overflow={"auto"}>
        {alertMessage && (
          <Alert severity="info" sx={{ mb: 1 }}>
            {alertMessage}
          </Alert>
        )}
        {reviewSliceState === RequestState.LOADING && (
          <LoadingEffect message={uiMessages.loading.pageLoading} />
        )}
        {reviewSliceState === RequestState.SUCCEEDED && reviewers.length === 0 && (
          <NoDataView text=" No reviewers available" />
        )}
        {reviewSliceState === RequestState.SUCCEEDED && reviewers.length > 0 && (
          <TableContainer
            component={Paper}
            elevation={0}
            sx={{
              height: "100%",
              borderRadius: 2,
              border: (theme) => `1px solid ${theme.palette.divider}`,
              "&::-webkit-scrollbar": {
                width: 8,
                height: 8,
              },
              "&::-webkit-scrollbar-track": {
                backgroundColor: (theme) => theme.palette.grey[100],
              },
              "&::-webkit-scrollbar-thumb": {
                backgroundColor: (theme) => theme.palette.grey[400],
                borderRadius: 1,
                "&:hover": {
                  backgroundColor: (theme) => theme.palette.grey[500],
                },
              },
            }}
          >
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell
                    sx={{
                      py: 2,
                      backgroundColor: (theme) => theme.palette.background.default,
                      fontWeight: 600,
                      color: (theme) => theme.palette.text.secondary,
                      width: "100%",
                    }}
                  >
                    Name
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reviewers.map((reviewer) => {
                  const employee = employeeMap[reviewer.reviewerEmail];
                  return (
                    <TableRow
                      key={reviewer.reviewerEmail}
                      hover
                      sx={{
                        "&:hover": {
                          backgroundColor: (theme) => theme.palette.action.hover,
                        },
                      }}
                    >
                      <TableCell sx={{ py: 2 }}>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Avatar
                            src={employee?.employeeThumbnail}
                            alt={employee?.employeeName || reviewer.reviewerEmail}
                            sx={{ height: 48, width: 48 }}
                          />
                          <Box>
                            <Typography variant="subtitle1" fontWeight={500}>
                              {employee?.employeeName}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {reviewer.reviewerEmail}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        <Box
          sx={{
            position: "fixed",
            bottom: 50,
            right: 50,
            zIndex: 1000,
          }}
        >
          <Tooltip
            arrow
            title={
              isDeadlinePassed || ratings.parLeadStatus === ParLeadStatus.SHARED
                ? "Action not available"
                : "Request Feedback"
            }
            enterDelay={tooltipVisibilityDelay}
            enterNextDelay={tooltipVisibilityDelay}
          >
            <span>
              <Fab
                disabled={isDeadlinePassed || ratings.parLeadStatus === ParLeadStatus.SHARED}
                color="primary"
                onClick={openReviewRequestModal}
                sx={{
                  boxShadow: (theme) => theme.shadows[4],
                  "&:hover": {
                    boxShadow: (theme) => theme.shadows[8],
                  },
                }}
              >
                <AddIcon />
              </Fab>
            </span>
          </Tooltip>
        </Box>
        <CustomModal open={reviewRequestModal} onClose={closeReviewRequestModal}>
          {employeeCurrentParCycle.parCycleId && userEmail && (
            <ReviewRequestModal
              onClose={closeReviewRequestModal}
              parCycleId={employeeCurrentParCycle.parCycleId}
              selectedEmployeeEmail={userEmail}
            />
          )}
        </CustomModal>
      </Box>
    </React.Fragment>
  );
};
