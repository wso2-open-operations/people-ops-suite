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
import CloseIcon from "@mui/icons-material/Close";
import MailIcon from "@mui/icons-material/Mail";
import PlaylistRemoveIcon from "@mui/icons-material/PlaylistRemove";
import RateReviewIcon from "@mui/icons-material/RateReview";
import SendIcon from "@mui/icons-material/Send";
import VisibilityIcon from "@mui/icons-material/Visibility";
import {
  Alert,
  Avatar,
  Box,
  Chip,
  Fab,
  IconButton,
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
import dayjs from "dayjs";
import { useLocation, useNavigate } from "react-router-dom";

import React, { useEffect, useMemo, useState } from "react";

import { CustomModal } from "@component/common/CustomModal";
import ParStatusChip from "@component/common/ParStatusChip";
import { LoadingEffect } from "@component/ui/Loading";
import { tooltipVisibilityDelay, uiMessages } from "@config/constant";
import { selectUserEmail } from "@slices/authSlice/auth";
import { selectCurrentParCycleOfEmployee } from "@slices/employeeSlice/employee";
import { selectEmployeeMap } from "@slices/metaSlice/meta";
import { selectCurrentCycle } from "@slices/parCycleSlice/parCycle";
import { useAppDispatch, useAppSelector } from "@slices/store";
import {
  ParThreeSixtyReviewStatus,
  ThreeSixtyReviewRequest,
  fetchRequests,
  selectThreeSixtyReviewRequests,
  selectThreeSixtyReviewStatus,
} from "@slices/threeSixtyReviewSlice/threeSixtyReview";
import { RequestState } from "@utils/types";
import OfferFeedbackView from "@view/ongoingCycleView/components/OfferFeedbackView";
import { ReviewProvideModal } from "@view/ongoingCycleView/components/ReviewProvideModal";

import { tokens } from "../../theme";
import NoDataView from "./NoDataView";
import { ReviewViewModal } from "./ReviewViewModal";

export enum FeedbackTypes {
  OFFERED = "offered",
  REQUESTED = "requested",
}

export const ProvideFeedbackTab = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const employeeMap = useAppSelector(selectEmployeeMap);
  const userEmail = useAppSelector(selectUserEmail);
  const reviewRequests = useAppSelector(selectThreeSixtyReviewRequests);
  const reviewSliceState = useAppSelector(selectThreeSixtyReviewStatus);
  const currentCycle = useAppSelector(selectCurrentCycle);
  const employeeCurrentParCycle = useAppSelector(selectCurrentParCycleOfEmployee);
  const [isRejectSelected, setIsRejectSelected] = useState(false);
  const [reviewProvideModal, setReviewProvideModal] = useState(false);
  const [reviewViewModal, setReviewViewModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ThreeSixtyReviewRequest | null>(null);
  const [employeeToOfferFeedback, setEmployeeToOfferFeedback] = useState<string | null>(null);

  const handleRejectClick = (request: ThreeSixtyReviewRequest) => {
    setReviewProvideModal(true);
    setSelectedRequest(request);
    setIsRejectSelected(true);
  };

  useEffect(() => {
    if (currentCycle.parCycleId && userEmail) {
      dispatch(fetchRequests({ employeeId: userEmail, parCycleId: currentCycle.parCycleId }));
    }
  }, []);

  const isDeadlinePassed = React.useMemo(() => {
    if (!currentCycle?.parThreeSixtyRatingDeadline) {
      return false;
    }
    const deadlineLocal = dayjs(currentCycle.parThreeSixtyRatingDeadline).endOf("day");
    return dayjs().isAfter(deadlineLocal);
  }, [currentCycle]);

  const openReviewProvideModal = (request: ThreeSixtyReviewRequest) => {
    setSelectedRequest(request);
    setReviewProvideModal(true);
    const searchParams = new URLSearchParams(location.search);
    searchParams.set("tab", "provideThreeSixtyReviews");
    searchParams.set("employeeEmail", request.employeeEmail);
    navigate(`/?${searchParams.toString()}`, { replace: true });
  };

  const closeReviewProvideModal = () => {
    if (userEmail) {
      dispatch(
        fetchRequests({
          employeeId: userEmail,
          parCycleId: currentCycle.parCycleId!,
        }),
      );
      setIsRejectSelected(false);
    }
    setReviewProvideModal(false);
    const searchParams = new URLSearchParams(location.search);
    searchParams.set("tab", "provideThreeSixtyReviews");
    searchParams.delete("employeeEmail");
    navigate(`/?${searchParams.toString()}`, { replace: true });
    setSelectedRequest(null);
    setEmployeeToOfferFeedback(null);
  };

  const openReviewViewModal = (request: ThreeSixtyReviewRequest) => {
    setSelectedRequest(request);
    setReviewViewModal(true);
    const searchParams = new URLSearchParams(location.search);
    searchParams.set("tab", "provideThreeSixtyReviews");
    searchParams.set("employeeEmail", request.employeeEmail);
    navigate(`/?${searchParams.toString()}`, { replace: true });
  };

  const closeReviewViewModal = () => {
    setReviewViewModal(false);
    const searchParams = new URLSearchParams(location.search);
    searchParams.set("tab", "provideThreeSixtyReviews");
    searchParams.delete("employeeEmail");
    navigate(`/?${searchParams.toString()}`, { replace: true });
    setSelectedRequest(null);
  };

  useEffect(() => {
    if (
      reviewSliceState !== RequestState.LOADING &&
      reviewRequests.length === 0 &&
      userEmail &&
      currentCycle.parCycleId
    ) {
      dispatch(
        fetchRequests({
          employeeId: userEmail,
          parCycleId: currentCycle.parCycleId,
        }),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCycle.parCycleId, userEmail]);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const employeeEmail = searchParams.get("employeeEmail");
    if (employeeEmail) {
      const request = reviewRequests.find((r) => r.employeeEmail === employeeEmail);
      if (request) {
        if (
          request.reviewStatus === ParThreeSixtyReviewStatus.PENDING ||
          request.reviewStatus === ParThreeSixtyReviewStatus.DRAFT
        ) {
          openReviewProvideModal(request);
        } else if (
          request.reviewStatus === ParThreeSixtyReviewStatus.COMPLETED ||
          request.reviewStatus === ParThreeSixtyReviewStatus.REJECTED
        ) {
          openReviewViewModal(request);
        }
      }
    }
  }, [location.search, reviewRequests]);

  const [feedbackRequestModalOpen, setFeedbackRequestModalOpen] = useState(false);

  const handleOpenFeedbackRequestModal = () => setFeedbackRequestModalOpen(true);

  const handleCloseFeedbackRequestModal = (empEmailToReceiveFeedback?: string) => {
    setFeedbackRequestModalOpen(false);
    if (empEmailToReceiveFeedback) {
      setReviewProvideModal(true);
      setEmployeeToOfferFeedback(empEmailToReceiveFeedback);
      const searchParams = new URLSearchParams(location.search);
      searchParams.set("tab", "provideThreeSixtyReviews");
      searchParams.set("employeeEmail", empEmailToReceiveFeedback);
      navigate(`/?${searchParams.toString()}`, { replace: true });
    }
  };

  const [filterValue, setFilterValue] = useState(FeedbackTypes.REQUESTED);

  const filteredRequests = useMemo(() => {
    if (filterValue === FeedbackTypes.OFFERED) {
      return reviewRequests.filter(
        (request) => !request.isEmployeeRequested && !request.isLeadRequested,
      );
    }

    if (filterValue === FeedbackTypes.REQUESTED) {
      return reviewRequests.filter(
        (request) => request.isEmployeeRequested || request.isLeadRequested,
      );
    }

    return reviewRequests;
  }, [reviewRequests, filterValue]);

  const noDataMessage = `No ${
    filterValue === FeedbackTypes.OFFERED
      ? "voluntary"
      : filterValue === FeedbackTypes.REQUESTED
        ? "requested"
        : ""
  } feedback available`;

  return (
    <React.Fragment>
      <Box position="relative" height="100%" overflow={"auto"}>
        {isDeadlinePassed ? (
          <Alert severity="error" sx={{ mb: 1 }}>
            {`The 360° feedback submission deadline has now passed ${dayjs
              .utc(currentCycle.parThreeSixtyRatingDeadline)
              .format("D MMM 'YY")}`}
          </Alert>
        ) : (
          <Alert severity="info" sx={{ mb: 1 }}>
            {`Please share feedback before the deadline: ${dayjs
              .utc(currentCycle.parThreeSixtyRatingDeadline)
              .format("D MMM 'YY")}`}
          </Alert>
        )}
        <Box>
          <Tabs
            value={filterValue}
            onChange={(_, newValue) => setFilterValue(newValue)}
            sx={{
              borderBottom: 1,
              borderColor: "divider",
              "& .MuiTab-root": {
                textTransform: "none",
                minWidth: 120,
              },
            }}
          >
            <Tab
              label={
                <Tooltip
                  arrow
                  title="View and respond to 360 feedback requests sent to you"
                  enterDelay={tooltipVisibilityDelay}
                >
                  <Box display="flex" alignItems="center" gap={1}>
                    <MailIcon fontSize="small" />
                    <span>Requested Feedback</span>
                    <Chip
                      label={
                        reviewRequests.filter((r) => r.isEmployeeRequested || r.isLeadRequested)
                          .length
                      }
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  </Box>
                </Tooltip>
              }
              value={FeedbackTypes.REQUESTED}
            />
            <Tab
              label={
                <Tooltip
                  arrow
                  title="Share feedback proactively with anyone you have worked with, without needing a request"
                  enterDelay={tooltipVisibilityDelay}
                >
                  <Box display="flex" alignItems="center" gap={1}>
                    <SendIcon fontSize="small" />
                    <span>Voluntary Feedback</span>
                    <Chip
                      label={
                        reviewRequests.filter((r) => !r.isEmployeeRequested && !r.isLeadRequested)
                          .length
                      }
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  </Box>
                </Tooltip>
              }
              value={FeedbackTypes.OFFERED}
            />
          </Tabs>
        </Box>
        {reviewSliceState === RequestState.LOADING && (
          <LoadingEffect message={uiMessages.loading.pageLoading} />
        )}

        {reviewSliceState === RequestState.SUCCEEDED && filteredRequests.length === 0 && (
          <NoDataView text={noDataMessage} />
        )}
        {reviewSliceState === RequestState.SUCCEEDED && filteredRequests.length > 0 && (
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
                      width: "40%",
                      backgroundColor: (theme) => theme.palette.background.default,
                      fontWeight: 600,
                      color: (theme) => theme.palette.text.secondary,
                    }}
                  >
                    Name
                  </TableCell>
                  <TableCell
                    sx={{
                      width: "40%",
                      backgroundColor: (theme) => theme.palette.background.default,
                      fontWeight: 600,
                      color: (theme) => theme.palette.text.secondary,
                    }}
                  >
                    Status
                  </TableCell>
                  <TableCell
                    sx={{
                      width: "20%",
                      backgroundColor: (theme) => theme.palette.background.default,
                      fontWeight: 600,
                      color: (theme) => theme.palette.text.secondary,
                    }}
                  >
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRequests.map((request) => {
                  const employee = employeeMap[request.employeeEmail];
                  const isPendingOrDraft =
                    request.reviewStatus === ParThreeSixtyReviewStatus.PENDING ||
                    request.reviewStatus === ParThreeSixtyReviewStatus.DRAFT;
                  const isCompletedOrRejected =
                    request.reviewStatus === ParThreeSixtyReviewStatus.COMPLETED ||
                    request.reviewStatus === ParThreeSixtyReviewStatus.REJECTED;
                  const isEmployeeOrLeadRequested =
                    request.isEmployeeRequested || request.isLeadRequested;

                  return (
                    <TableRow
                      hover
                      key={request.employeeEmail}
                      onClick={() => {
                        if (!isDeadlinePassed) {
                          if (isPendingOrDraft) {
                            openReviewProvideModal(request);
                          } else if (isCompletedOrRejected) {
                            openReviewViewModal(request);
                          }
                        }
                      }}
                      sx={{
                        cursor:
                          !isDeadlinePassed && (isPendingOrDraft || isCompletedOrRejected)
                            ? "pointer"
                            : "default",
                        "&:hover": {
                          backgroundColor: (theme) => theme.palette.action.hover,
                        },
                      }}
                    >
                      <TableCell sx={{ py: 2 }}>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Avatar
                            src={employee?.employeeThumbnail}
                            alt={employee?.employeeName || request.employeeEmail}
                            sx={{ height: 48, width: 48 }}
                          />
                          <Box>
                            <Typography variant="subtitle1" fontWeight={500}>
                              {employee?.employeeName}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {request.employeeEmail}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ py: 2 }}>
                        {!isEmployeeOrLeadRequested &&
                        request.reviewStatus === ParThreeSixtyReviewStatus.PENDING &&
                        isDeadlinePassed ? (
                          <Chip
                            size="small"
                            label="Abandoned"
                            sx={{
                              width: "100px",
                              height: "1.23rem",
                              paddingTop: "0.15rem",
                              paddingX: "0.2rem",
                              backgroundColor:
                                theme.palette.mode === "light"
                                  ? theme.palette.surface.primary.active
                                  : theme.palette.surface.secondary.active,
                            }}
                          />
                        ) : (
                          <ParStatusChip
                            content={request?.reviewStatus || ""}
                            isDeadlinePassed={isDeadlinePassed}
                          />
                        )}
                      </TableCell>
                      <TableCell sx={{ py: 2 }}>
                        {!isDeadlinePassed && (
                          <Box display="flex" gap={1}>
                            {isPendingOrDraft && (
                              <>
                                <Tooltip
                                  arrow
                                  title="Provide Feedback"
                                  enterDelay={tooltipVisibilityDelay}
                                >
                                  <IconButton
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openReviewProvideModal(request);
                                    }}
                                    color="primary"
                                    size="medium"
                                    sx={{
                                      "&:hover": {
                                        backgroundColor: (theme) => theme.palette.primary.main,
                                        color: "white",
                                      },
                                    }}
                                  >
                                    <RateReviewIcon />
                                  </IconButton>
                                </Tooltip>
                                {isEmployeeOrLeadRequested && (
                                  <Tooltip
                                    arrow
                                    title="Decline Feedback"
                                    enterDelay={tooltipVisibilityDelay}
                                  >
                                    <IconButton
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRejectClick(request);
                                      }}
                                      color="error"
                                      size="medium"
                                      sx={{
                                        "&:hover": {
                                          backgroundColor: (theme) => theme.palette.error.main,
                                          color: "white",
                                        },
                                      }}
                                    >
                                      {isEmployeeOrLeadRequested ? (
                                        <CloseIcon />
                                      ) : (
                                        <PlaylistRemoveIcon />
                                      )}
                                    </IconButton>
                                  </Tooltip>
                                )}
                              </>
                            )}
                            {isCompletedOrRejected && (
                              <Tooltip
                                arrow
                                title="View Feedback"
                                enterDelay={tooltipVisibilityDelay}
                              >
                                <IconButton
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openReviewViewModal(request);
                                  }}
                                  color="primary"
                                  size="medium"
                                  sx={{
                                    "&:hover": {
                                      backgroundColor: (theme) => theme.palette.primary.main,
                                      color: "white",
                                    },
                                  }}
                                >
                                  <VisibilityIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        )}
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
          {filterValue === FeedbackTypes.OFFERED && (
            <Tooltip
              arrow
              title={isDeadlinePassed ? "Deadline passed" : "Provide Feedback"}
              enterDelay={tooltipVisibilityDelay}
            >
              <span>
                <Fab
                  disabled={isDeadlinePassed}
                  color="primary"
                  onClick={handleOpenFeedbackRequestModal}
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
          )}
        </Box>
      </Box>

      <CustomModal open={reviewProvideModal} onClose={closeReviewProvideModal} width="60vw">
        {employeeCurrentParCycle?.parCycleId &&
          employeeCurrentParCycle &&
          currentCycle?.parCycleConfigurations?.threeSixtyReviewQuestion &&
          currentCycle?.parCycleConfigurations?.threeSixtyReviewRatings &&
          userEmail &&
          selectedRequest && (
            <ReviewProvideModal
              onClose={closeReviewProvideModal}
              parCycle={employeeCurrentParCycle}
              employeeEmail={selectedRequest.employeeEmail}
              threeSixtyReviewQuestion={
                currentCycle.parCycleConfigurations.threeSixtyReviewQuestion
              }
              threeSixtyReviewRatings={currentCycle.parCycleConfigurations.threeSixtyReviewRatings}
              isRejectSelected={isRejectSelected}
              isOfferedFeedback={
                !selectedRequest.isEmployeeRequested && !selectedRequest.isLeadRequested
              }
            />
          )}
      </CustomModal>

      <CustomModal open={reviewViewModal} onClose={closeReviewViewModal} width="60vw">
        {employeeCurrentParCycle?.parCycleId && (
          <>
            {selectedRequest && (
              <ReviewViewModal
                onClose={closeReviewViewModal}
                parCycle={employeeCurrentParCycle}
                employeeEmail={selectedRequest.employeeEmail}
                isOfferedFeedback={
                  !selectedRequest.isEmployeeRequested && !selectedRequest.isLeadRequested
                }
              />
            )}
            {employeeToOfferFeedback && (
              <ReviewViewModal
                onClose={closeReviewViewModal}
                parCycle={employeeCurrentParCycle}
                employeeEmail={employeeToOfferFeedback}
                isOfferedFeedback
              />
            )}
          </>
        )}
      </CustomModal>

      <CustomModal open={feedbackRequestModalOpen} onClose={handleCloseFeedbackRequestModal}>
        {employeeCurrentParCycle.parCycleId && userEmail && (
          <OfferFeedbackView
            onClose={(employeeEmail) => {
              handleCloseFeedbackRequestModal(employeeEmail);
            }}
          />
        )}
      </CustomModal>
    </React.Fragment>
  );
};
