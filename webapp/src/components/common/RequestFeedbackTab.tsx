// Copyright (c) 2024, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import React, { useEffect, useState } from "react";
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
import AddIcon from "@mui/icons-material/Add";
import { useAppDispatch, useAppSelector } from "@slices/store";
import { fetchReviewers, selectThreeSixtyReviewers, selectThreeSixtyReviewStatus } from "@slices/threeSixtyReviewSlice";
import { selectEmployeeMap } from "@slices/metaSlice";
import { LoadingEffect } from "@components/ui/Loading";
import { tooltipVisibilityDelay, uiMessages } from "@config/constant";
import { CustomModal } from "@components/common/CustomModal";
import { ReviewRequestModal } from "@components/common/ReviewRequestModal";
import { ParLeadStatus, RequestState } from "@utils/types";
import { selectCurrentCycle } from "@slices/parCycleSlice";
import { selectCurrentParCycleOfEmployee, selectEmployeeRatings } from "@slices/employeeSlice";
import { selectUserEmail } from "@slices/authSlice";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
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
        })
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
        {reviewSliceState === RequestState.LOADING && <LoadingEffect message={uiMessages.loading.pageLoading} />}
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
            bottom: 100,
            right: 100,
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
