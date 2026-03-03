// Copyright (c) 2024, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import {
  Box,
  Grid,
  Chip,
  Avatar,
  Divider,
  useTheme,
  TextField,
  Accordion,
  Typography,
  IconButton,
  AccordionDetails,
  AccordionSummary,
} from "@mui/material";
import {
  fetchHistoryReviews,
  resetEmpRatingHistorySate,
  resetEmpReviewHistorySate,
  selectEmployeeHistoryRating,
  fetchHistoryParRatingOfEmployee,
  selectEmployeeHistoryReviewStatus,
  selectEmployeeHistoryRatingStatus,
  fetchParticipatedParCyclesOfEmployee,
  selectParticipatedParCyclesOfEmployee,
  selectParticipatedParCyclesOfEmployeeState,
} from "@slices/employeeHistorySlice/employeeHistory";
import { tokens } from "../../theme";
import CommentPaper from "./CommentPaper";
import { useEffect, useState } from "react";
import { uiMessages } from "@config/constant";
import CloseIcon from "@mui/icons-material/Close";
import { selectEmployeeMap } from "@slices/metaSlice/meta";
import { LoadingEffect } from "@component/ui/Loading";
import ErrorComponent from "@component/ui/ErrorComponent";
import EmployeeChip from "@component/common/EmployeeChip";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { ParSpecialRating, RequestState } from "@utils/types";
import { useAppDispatch, useAppSelector } from "@slices/store";
import ThreeSixtyFeedbackSection from "@views/leadPortal/components/FeedbackComponent";
import ThreeSixtyHistoryFeedbackSection from "@views/leadPortal/components/HistoryFeedbackComponent";
import { fetchReviews } from "@slices/threeSixtyReviewSlice";

interface EmployeeHistoryCardProps {
  onClose: () => void;
  empName: string;
  empEmail: string;
  empThumbnail: string;
}

const EmployeeHistoryCard = ({ onClose, empName, empEmail, empThumbnail }: EmployeeHistoryCardProps) => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const colors = tokens(theme.palette.mode);
  const employeeMap = useAppSelector(selectEmployeeMap);
  const [cycleID, setCycleID] = useState<number | null>(-1);
  const ratings = useAppSelector(selectEmployeeHistoryRating);
  const ratingsStatus = useAppSelector(selectEmployeeHistoryRatingStatus);
  const reviewsStatus = useAppSelector(selectEmployeeHistoryReviewStatus);
  const allCycles = useAppSelector(selectParticipatedParCyclesOfEmployee);
  const cycleLoadingState = useAppSelector(selectParticipatedParCyclesOfEmployeeState);

  useEffect(
    () => {
      dispatch(fetchParticipatedParCyclesOfEmployee({ email: empEmail }));
    },
    []
  );

  const handleRowClick = (cycleId: number) => {
    if (cycleId >= 0) {
      setCycleID(cycleId);
      dispatch(
        fetchHistoryParRatingOfEmployee({
          employeeId: empEmail,
          parCycleId: cycleId,
        })
      );
      dispatch(fetchHistoryReviews({ employeeId: empEmail, parCycleId: cycleId }));
    }
  };

  const handleClose = () => {
    dispatch(resetEmpRatingHistorySate());
    dispatch(resetEmpReviewHistorySate());

    if (onClose) {
      onClose();
    }
  };

  const formatString = (str: string | undefined): string => {
    if (!str || str.trim() === "" || str === "NA") {
      return "-";
    }

    if (str.includes("@")) {
      return str;
    }
    if (str.length < 3) {
      return str;
    }

    return str
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const checkString = (str: string | undefined): boolean => {
    if (!str || str.trim() === "") {
      return false;
    }
    return true;
  };

  return (
    <>
      {cycleLoadingState === RequestState.FAILED ||
        ratingsStatus === RequestState.FAILED ||
        (reviewsStatus === RequestState.FAILED && <ErrorComponent />)}

      {cycleLoadingState === RequestState.LOADING && <LoadingEffect message={uiMessages.loading.pageLoading} />}

      {cycleLoadingState === RequestState.SUCCEEDED && (
        <Box
          sx={{
            maxWidth: "1000px",
            margin: "0 auto",
            padding: "20px",
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 2,
              backgroundColor: colors.primary[300],
              p: 1,
              pl: 2,
            }}
          >
            <Typography variant="h4" color={"white"}>
              Employee History
            </Typography>

            <IconButton onClick={handleClose}>
              <CloseIcon sx={{ color: "white" }} />
            </IconButton>
          </Box>

          <TextField
            fullWidth
            select
            SelectProps={{
              native: true,
            }}
            variant="outlined"
            value={cycleID !== null ? cycleID : "-1"}
            onChange={(e) => handleRowClick(Number(e.target.value))}
          >
            {allCycles.length > 0 &&
              allCycles.map((cycle) => (
                <option key={cycle.parCycleId} value={cycle.parCycleId}>
                  {cycle.parCycleName}
                </option>
              ))}
            {allCycles.length === 0 ? (
              <option value="-1">No previous par cycles found</option>
            ) : (
              <option value="-1">Please select a par cycle</option>
            )}
          </TextField>

          {(ratingsStatus || reviewsStatus) === RequestState.LOADING && (
            <LoadingEffect message={uiMessages.loading.pageLoading} />
          )}

          {ratingsStatus === RequestState.SUCCEEDED && reviewsStatus === RequestState.SUCCEEDED && (
            <>
              <Grid
                container
                spacing={1}
                direction="row"
                sx={{
                  justifyContent: "space-evenly",
                  alignItems: "center",
                  marginTop: 2,
                }}
              >
                <Grid item xs>
                  <Avatar
                    variant="rounded"
                    src={empThumbnail}
                    alt={"Employee Thumbnail"}
                    sx={{
                      width: "100px",
                      height: "100px",
                      margin: "auto auto",
                    }}
                  />
                </Grid>
                {ratings.parSpecialRating === ParSpecialRating.NONE && ratings.parRating === ParSpecialRating.NONE ? (
                  <></>
                ) : (
                  <Grid item xs>
                    <Box mt={2} display="flex" flexDirection="column" gap={1}>
                      <Box display="flex" gap={1} flexWrap="wrap">
                        {ratings.parSpecialRating !== ParSpecialRating.NONE && (
                          <EmployeeChip isSpecial={true} isFromLead={false} text={ratings.parSpecialRating!} />
                        )}
                        {ratings.parRating !== ParSpecialRating.NONE && (
                          <EmployeeChip isSpecial={false} isFromLead={true} text={ratings.parRating!} />
                        )}
                      </Box>
                      {ratings.parRatingSharedBy && (
                        <Box mt={1}>
                          <Chip size="small" label={` PAR shared by: ${ratings.parRatingSharedBy} `} />
                        </Box>
                      )}
                    </Box>
                  </Grid>
                )}

                <Grid item xs ml={1}>
                  <Box>
                    <Typography variant="body1">{empName}</Typography>
                    <Typography variant="subtitle2" color="textSecondary">
                      Employee
                    </Typography>
                    <Typography variant="subtitle2" color="textSecondary">
                      {empEmail}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs>
                  <Box>
                    <Typography variant="body1">
                      {ratings.parLeadEmail
                        ? employeeMap[ratings.parLeadEmail]?.employeeName ?? "Not Available"
                        : "Not Available"}
                    </Typography>
                    <Typography variant="subtitle2" color="textSecondary">
                      Lead
                    </Typography>
                    <Typography variant="subtitle2" color="textSecondary">
                      {formatString(ratings.parLeadEmail)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs>
                  <Box>
                    <Typography variant="body1">{formatString(ratings.parTeam)}</Typography>
                    <Typography variant="subtitle2" color="textSecondary">
                      Team
                    </Typography>
                    <Typography variant="subtitle2" color="textSecondary">
                      {formatString(ratings.parDepartment)}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              <Divider sx={{ mt: 1 }} />

              <Accordion
                defaultExpanded={checkString(ratings.parEmployeeComment) && checkString(ratings.parLeadComment)}
                sx={{ mt: 1 }}
                disabled={!checkString(ratings.parEmployeeComment) && !checkString(ratings.parLeadComment)}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="panel2-content" id="panel2-header">
                  Employee PAR
                </AccordionSummary>
                <AccordionDetails>
                  <Divider sx={{ marginY: 1 }} />
                  <CommentPaper comment={ratings.parEmployeeComment} />
                </AccordionDetails>
              </Accordion>

              <Accordion
                defaultExpanded={checkString(ratings.parEmployeeComment) && checkString(ratings.parLeadComment)}
                sx={{ mt: 1 }}
                disabled={!checkString(ratings.parEmployeeComment) && !checkString(ratings.parLeadComment)}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="panel2-content" id="panel2-header">
                  Lead’s Feedback
                </AccordionSummary>
                <AccordionDetails>
                  {/* <Typography variant="subtitle2">Lead’s Feedback</Typography> */}
                  <Divider sx={{ marginY: 1 }} />
                  <CommentPaper comment={ratings.parLeadComment} />
                </AccordionDetails>
              </Accordion>

              {ratings.parAdminComment && (
                <Accordion
                  defaultExpanded={checkString(ratings.parEmployeeComment) && checkString(ratings.parLeadComment)}
                  sx={{ mt: 1 }}
                  disabled={!checkString(ratings.parEmployeeComment) && !checkString(ratings.parLeadComment)}
                >
                  <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="panel2-content" id="panel2-header">
                    Admin Comment
                  </AccordionSummary>
                  <AccordionDetails>
                    <Divider sx={{ marginY: 1 }} />
                    <CommentPaper comment={ratings.parLeadComment} />
                  </AccordionDetails>
                </Accordion>
              )}
              <Divider />
              <Box sx={{ mt: 1 }}>
                <ThreeSixtyHistoryFeedbackSection isAdminsSelfProfile={false} />
              </Box>
            </>
          )}
        </Box>
      )}
    </>
  );
};

export default EmployeeHistoryCard;
