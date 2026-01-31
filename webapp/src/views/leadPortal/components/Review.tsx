// Copyright (c) 2024, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import { SyntheticEvent, useEffect, useState } from "react";
import {
  Avatar,
  Box,
  Breadcrumbs,
  Button,
  Chip,
  Divider,
  Fab,
  IconButton,
  Link,
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
import GroupWorkIcon from "@mui/icons-material/GroupWork";
import GradingIcon from "@mui/icons-material/Grading";
import ParStatusChip from "@components/common/ParStatusChip";
import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import GroupIcon from "@mui/icons-material/Group";
import VisibilityIcon from "@mui/icons-material/Visibility";

import { CustomModal } from "@components/common/CustomModal";
import { ReviewRequestModal } from "@components/common/ReviewRequestModal";
import { LeadReviewPanel } from "../panels/LeadReviewPanel";
import { F2fPanel } from "@components/common/F2fPanel";
import { UpdateStatusPanel } from "@components/common/UpdateStatusPanel";
import EmployeeHistoryCard from "@components/common/EmployeeHistoryCard";
import { LoadingEffect } from "@components/ui/Loading";
import {
  base64Regex,
  defaultTabWidth,
  tooltipVisibilityDelay,
  uiMessages,
} from "@config/constant";
import {
  fetchReviewers,
  selectThreeSixtyReviewers,
  selectThreeSixtyReviews,
  selectThreeSixtyReviewStatus,
} from "@slices/threeSixtyReviewSlice";
import {
  ParLeadStatus,
  ParThreeSixtyReviewStatus,
  RequestState,
} from "@utils/types";
import { useAppDispatch, useAppSelector } from "@slices/store";
import { tokens } from "../../../theme";
import { selectUserEmail, selectUserInfo } from "@slices/authSlice";
import { selectCurrentCycle } from "@slices/parCycleSlice";
import { selectEmployeeMap } from "@slices/metaSlice";
import { ReviewViewModal } from "@components/common/ReviewViewModal";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import {
  selectEmployeeRatings,
  selectEmployeeRatingStatus,
} from "@slices/employeeSlice";
import React from "react";
dayjs.extend(utc);

interface ReviewProps {
  selectedEmployeeEmail: string;
  closeReviewEmployeeView: () => void;
  isAdminAuditViewOn?: boolean;
  isAdminHistoryViewOn?: boolean;
}

export const Review = ({
  selectedEmployeeEmail,
  closeReviewEmployeeView,
  isAdminAuditViewOn = false,
  isAdminHistoryViewOn = false,
}: ReviewProps) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const dispatch = useAppDispatch();

  const reviewSliceState = useAppSelector(selectThreeSixtyReviewStatus);
  const reviewers = useAppSelector(selectThreeSixtyReviewers);
  const reviews = useAppSelector(selectThreeSixtyReviews);
  const userInfo = useAppSelector(selectUserInfo);
  const cycle = useAppSelector(selectCurrentCycle);
  const employeeMap = useAppSelector(selectEmployeeMap);
  const employeeRating = useAppSelector(selectEmployeeRatings);
  const employeeParRatingStatus = useAppSelector(selectEmployeeRatingStatus);
  const [isThreeSixtyDeadlinePassed, setIsThreeSixtyDeadlinePassed] =
    useState(false);
  const [reviewRequestModal, setReviewRequestModal] = useState(false);
  const [reviewViewModal, setReviewViewModal] = useState(false);
  const [reviewObject, setReviewObject] = useState({
    reviewComment: "",
    reviewRating: "",
    reviewerEmail: "",
  });
  const [isEmpHistoryModalOpen, setIsEmpHistoryModalOpen] = useState(false);
  const userEmail = useAppSelector(selectUserEmail);

  // Handles tabs
  const [value, setValue] = useState<number>(0);
  const handleTabChange = (event: SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const openReviewRequestModal = () => setReviewRequestModal(true);
  const closeReviewRequestModal = () => setReviewRequestModal(false);

  const closeReviewViewModal = () => setReviewViewModal(false);

  const openReviewViewModal = (providerEmail: string) => {
    // get the review comment and rating for the provider email, from the reviews
    const { reviewComment, reviewRating } = reviews.filter(
      (review) => review.reviewerEmail === providerEmail
    )[0];
    if (reviewComment && reviewRating) {
      setReviewObject({
        reviewComment: base64Regex.test(reviewComment ?? "")
          ? decodeURIComponent(atob(reviewComment ?? ""))
          : "",
        reviewRating,
        reviewerEmail: providerEmail,
      });
    }
    setReviewViewModal(true);
  };

  useEffect(() => {
    const deadlineLocal = dayjs
      (cycle.parThreeSixtyRatingDeadline).endOf("day");
    setIsThreeSixtyDeadlinePassed(dayjs().isAfter(deadlineLocal));
  }, [cycle.parThreeSixtyRatingDeadline]);

  useEffect(() => {
    // To get the reviewers
    if (cycle.parCycleId && selectedEmployeeEmail) {
      if (!(userEmail === selectedEmployeeEmail)) {
        dispatch(
          fetchReviewers({
            employeeId: selectedEmployeeEmail,
            parCycleId: cycle.parCycleId,
          })
        );
      }
    }
  }, [dispatch, cycle.parCycleId, selectedEmployeeEmail]);
  return (
    <>
      <Box>
        <Breadcrumbs aria-label="breadcrumb">
          <Box>
            <IconButton
              aria-label="back"
              color="primary"
              onClick={closeReviewEmployeeView}
              sx={{ mb: 1, mr: 1 }}
            >
              <ArrowBackIcon />
            </IconButton>
            {isAdminHistoryViewOn && cycle.parCycleName && (
              <Typography display={"inline"} variant="h5">
                {` History / ${cycle.parCycleName} / `}
              </Typography>
            )}
            {employeeParRatingStatus === RequestState.SUCCEEDED && (
              <Link display={"inline"} underline="hover" color="inherit" variant="h6" onClick={closeReviewEmployeeView}>
              <Tooltip
                arrow
                title={[
                  employeeRating.parBusinessUnit,
                  employeeRating.parDepartment,
                  employeeRating.parTeam,
                  employeeRating.parSubTeam,
                ]
                  .filter(Boolean)
                  .map((item) => item?.toUpperCase())
                  .join(" / ")}
                enterDelay={tooltipVisibilityDelay}
                enterNextDelay={tooltipVisibilityDelay}
              >
                <Box
                  sx={{
                    display: "inline-block",
                    maxWidth: "60rem",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    verticalAlign: "middle",
                    marginBottom: 0.25,
                  }}
                >
                  {[
                    employeeRating.parBusinessUnit,
                    employeeRating.parDepartment,
                    employeeRating.parTeam,
                    employeeRating.parSubTeam,
                  ]
                    .filter(Boolean)
                    .map((item, index, array) => (
                      <React.Fragment key={index}>
                        {item?.toUpperCase()}
                        {index < array.length - 1 && " / "}
                      </React.Fragment>
                    ))}
                </Box>
              </Tooltip>
              <Typography display={"inline"} variant="h5">
                {" / "}
              </Typography>
              </Link>
            )}

            <Chip
              sx={{ mt: "-5px", height: "1.8rem" }}
              label={
                <Box display={"flex"} alignItems={"center"}>
                  <Avatar
                    src={employeeMap[selectedEmployeeEmail]?.employeeThumbnail}
                    alt={selectedEmployeeEmail}
                    sx={{
                      marginRight: "8px",
                      marginLeft: "-8px",
                      width: 22,
                      height: 22,
                    }}
                  />
                  <Typography
                    display={"inline"}
                    color="text.primary"
                    variant="h5"
                  >
                    {employeeMap[selectedEmployeeEmail]?.employeeName ??
                      selectedEmployeeEmail}
                  </Typography>
                </Box>
              }
            />
          </Box>
        </Breadcrumbs>
        <Divider />
      </Box>
      <Box
        sx={{
          borderBottom: 1,
          borderColor: "divider",
          pr: 3,
          display: "flex",
          alignContent: "right",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Tabs
          value={value}
          onChange={handleTabChange}
          aria-label="icon label tabs"
          sx={{
            "&.MuiTabs-root": {
              height: "3rem",
              alignItems: "center",
            },
            "& .MuiTabs-indicator": {
              pb: "0.925rem",
            },
          }}
        >
          <Tab
            icon={<GradingIcon />}
            iconPosition="start"
            label="Lead's Feedback"
            sx={{ width: "12rem" }}
          />
          {!isAdminAuditViewOn && !isAdminHistoryViewOn ? (
            <Tab
              icon={<GroupWorkIcon />}
              iconPosition="start"
              label="360 Reviews"
              sx={{
                width: defaultTabWidth,
              }}
            />
          ) : null}
          {!isAdminAuditViewOn && !isAdminHistoryViewOn && (
            <Tab
              icon={<GroupIcon />}
              iconPosition="start"
              label="F2F"
              sx={{ width: "7rem" }}
            />
          )}
          {isAdminAuditViewOn && (
            <Tab
              icon={<GroupWorkIcon />}
              iconPosition="start"
              label="Update Status"
              sx={{ width: "12rem" }}
            />
          )}
        </Tabs>
        {!isAdminAuditViewOn && !isAdminHistoryViewOn && (
          <Button
            variant="contained"
            color="primary"
            size="small"
            sx={{ height: 40 }}
            onClick={() => setIsEmpHistoryModalOpen(true)}
          >
            PAR HISTORY
          </Button>
        )}
      </Box>

      <CustomModal
        open={isEmpHistoryModalOpen}
        onClose={() => setIsEmpHistoryModalOpen(false)}
      >
        {
          <EmployeeHistoryCard
            onClose={() => setIsEmpHistoryModalOpen(false)}
            empName={
              employeeMap[selectedEmployeeEmail]?.employeeName ??
              selectedEmployeeEmail
            }
            empEmail={selectedEmployeeEmail}
            empThumbnail={employeeMap[selectedEmployeeEmail]?.employeeThumbnail}
          />
        }
      </CustomModal>
      <Box sx={{ paddingBottom: "1%" }}>
        <TabPanel value={value} index={0}>
          <Box height={"auto"}>
            <LeadReviewPanel
              employeeId={selectedEmployeeEmail}
              cycle={cycle}
              isAdminAuditViewOn={isAdminAuditViewOn}
              isAdminHistoryViewOn={isAdminHistoryViewOn}
            />
          </Box>
        </TabPanel>
        <TabPanel
          value={value}
          index={isAdminAuditViewOn || isAdminHistoryViewOn ? -1 : 1}
        >
          <Box sx={{ position: "relative" }} height={"55vh"} overflow={"auto"}>
            <TableContainer sx={{ height: "calc(100vh - 360px)" }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell
                      sx={{ width: "40%", fontWeight: "bold", color: "grey" }}
                    >
                      Name
                    </TableCell>
                    <TableCell
                      sx={{ width: "20%", fontWeight: "bold", color: "grey" }}
                    >
                      Status
                    </TableCell>
                    <TableCell
                      sx={{ width: "30%", fontWeight: "bold", color: "grey" }}
                    >
                      Requested by
                    </TableCell>
                    <TableCell sx={{ width: "10%" }}></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reviewSliceState === RequestState.LOADING && (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        align="center"
                        style={{ border: "none" }}
                      >
                        <LoadingEffect
                          message={uiMessages.loading.pageLoading}
                        />
                      </TableCell>
                    </TableRow>
                  )}

                  {reviewSliceState === RequestState.SUCCEEDED &&
                    (reviewers?.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          align="center"
                          style={{ border: "none" }}
                        >
                          <Typography color={"GrayText"}>
                            No requests available
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      reviewers.map((reviewer) => (
                        <TableRow hover key={reviewer.reviewerEmail}>
                          <TableCell sx={{ py: 1 }}>
                            <Box display="flex" alignItems="center">
                              <Avatar
                                src={
                                  employeeMap[reviewer.reviewerEmail]
                                    ?.employeeThumbnail
                                }
                                alt={
                                  employeeMap[reviewer.reviewerEmail]
                                    ?.employeeName || reviewer.reviewerEmail
                                }
                                sx={{
                                  marginRight: 2,
                                  height: 60,
                                  width: 60,
                                }}
                              />

                              <Box>
                                <Typography variant="h5">
                                  {
                                    employeeMap[reviewer.reviewerEmail]
                                      ?.employeeName
                                  }
                                </Typography>
                                <Typography
                                  display={"block"}
                                  color="GrayText"
                                  mt={-0.5}
                                >
                                  {reviewer.reviewerEmail}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell sx={{ py: 1 }}>
                            <ParStatusChip
                              content={reviewer?.reviewStatus || ""}
                            />
                          </TableCell>
                          <TableCell sx={{ py: 1 }}>
                            {reviewer?.isLeadRequested && (
                              <Chip
                                size="small"
                                label={userInfo?.email}
                                sx={{
                                  height: "1.23rem",
                                  paddingX: "0.2rem",
                                  backgroundColor: colors.blueAccent[900],
                                }}
                              />
                            )}

                            {reviewer?.isEmployeeRequested && (
                              <Chip
                                size="small"
                                label={selectedEmployeeEmail}
                                sx={{
                                  height: "1.23rem",
                                  paddingX: "0.2rem",
                                  backgroundColor: colors.redAccent[900],
                                }}
                              />
                            )}
                          </TableCell>
                          <TableCell sx={{ py: 1 }}>
                            {(reviewer.reviewStatus ===
                              ParThreeSixtyReviewStatus.COMPLETED ||
                              reviewer.reviewStatus ===
                                ParThreeSixtyReviewStatus.REJECTED) && (
                              <Tooltip
                                arrow
                                title="View Feedback"
                                enterDelay={tooltipVisibilityDelay}
                                enterNextDelay={tooltipVisibilityDelay}
                              >
                                <IconButton
                                  onClick={() =>
                                    openReviewViewModal(reviewer.reviewerEmail)
                                  }
                                  sx={{
                                    color: "primary.main",
                                    "&:hover": {
                                      bgcolor: "primary.main",
                                      color: "white",
                                    },
                                  }}
                                >
                                  <VisibilityIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Box
              sx={{
                position: "absolute",
                bottom: 5,
                right: 30,
              }}
            >
              <Tooltip
                arrow
                title="Request"
                enterDelay={tooltipVisibilityDelay}
                enterNextDelay={tooltipVisibilityDelay}
              >
                <span>
                  <Fab
                    disabled={
                      isThreeSixtyDeadlinePassed ||
                      employeeRating.parLeadStatus === ParLeadStatus.SHARED
                    }
                    color="primary"
                    aria-label="add"
                    onClick={openReviewRequestModal}
                  >
                    <AddIcon />
                  </Fab>
                </span>
              </Tooltip>
            </Box>
          </Box>
          <CustomModal
            open={reviewRequestModal}
            onClose={closeReviewRequestModal}
          >
            {cycle.parCycleId && selectedEmployeeEmail && (
              <ReviewRequestModal
                onClose={closeReviewRequestModal}
                parCycleId={cycle.parCycleId}
                selectedEmployeeEmail={selectedEmployeeEmail}
              />
            )}
          </CustomModal>
          <CustomModal
            open={reviewViewModal}
            onClose={closeReviewViewModal}
            width="70vw"
          >
            {cycle?.parCycleId && (
              <ReviewViewModal
                onClose={closeReviewViewModal}
                parCycle={cycle}
                employeeEmail={reviewObject.reviewerEmail}
                reviewObject={reviewObject}
              />
            )}
          </CustomModal>
        </TabPanel>

        <TabPanel
          value={value}
          index={isAdminAuditViewOn || isAdminHistoryViewOn ? -1 : 2}
        >
          <F2fPanel employeeId={selectedEmployeeEmail} parCycle={cycle} />
        </TabPanel>

        <TabPanel value={value} index={isAdminAuditViewOn ? 1 : 3}>
          <UpdateStatusPanel parCycle={cycle} />
        </TabPanel>
      </Box>
    </>
  );
};

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: "10px 10px 0px 10px" }}>{children}</Box>
      )}
    </div>
  );
};
