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
  Box,
  Chip,
  Tooltip,
  useTheme,
  Accordion,
  Typography,
  IconButton,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import React from "react";
import { selectEmployeeMap } from "@slices/metaSlice/meta";
import { LoadingEffect } from "@component/ui/Loading";
import NoDataView from "@component/common/NoDataView";
import CommentPaper from "@component/common/CommentPaper";
import { base64Regex, uiMessages } from "@config/constant";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { useAppDispatch, useAppSelector } from "@slices/store";
import { enqueueSnackbarMessage } from "@slices/commonSlice/common";
import { RequestState } from "@utils/types";
import { ParThreeSixtyReviewStatus, ThreeSixtyReview } from "@slices/threeSixtyReviewSlice/threeSixtyReview";
import { selectThreeSixtyReviews, selectThreeSixtyReviewStatus } from "@slices/threeSixtyReviewSlice/threeSixtyReview";

interface ThreeSixtyFeedbackSectionProps {
  isAdminsSelfProfile: boolean;
}

const ThreeSixtyFeedbackSection: React.FC<ThreeSixtyFeedbackSectionProps> = ({ isAdminsSelfProfile }) => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const employeeMap = useAppSelector(selectEmployeeMap);
  const threeSixtyReviewStatus = useAppSelector(selectThreeSixtyReviewStatus);
  const threeSixtyReviews = useAppSelector(selectThreeSixtyReviews);

  const copyReviewToClipboard = (review: ThreeSixtyReview) => {
    const reviewerName = employeeMap[review.reviewerEmail]?.employeeName;
    const reviewerEmail = review.reviewerEmail;
    const rating = review.reviewRating;
    const comment = base64Regex.test(review.reviewComment ?? "")
      ? decodeURIComponent(atob(review.reviewComment ?? ""))
      : "No comment provided";

    const textToCopy = `${reviewerName} (${reviewerEmail}):\nRating: ${rating}\nFeedback: ${comment}`;

    navigator.clipboard
      .writeText(textToCopy)
      .then(() => {
        dispatch(
          enqueueSnackbarMessage({
            message: "Review copied to clipboard",
            type: "info",
          })
        );
      })
      .catch((err) => {
        dispatch(
          enqueueSnackbarMessage({
            message: "Unable to copy review to clipboard",
            type: "error",
          })
        );
      });
  };

  const renderReviews = () => {
    const completedReviews = threeSixtyReviews.filter(
      (review) => review.reviewStatus === ParThreeSixtyReviewStatus.COMPLETED
    );

    if (completedReviews.length === 0) {
      return <NoDataView text="All 360° feedback were rejected" />;
    }

    return (
      <Box sx={{ maxHeight: "1000px", overflow: "auto" }}>
        {completedReviews.map((review, index) => (
          <Accordion
            key={review.reviewerEmail}
            sx={{
              mb: 2,
              "& .MuiAccordionSummary-root": {
                minHeight: 1,
                py: 0,
              },
              "& .MuiAccordionSummary-content": {
                margin: 1,
              },
              "& .MuiCollapse-wrapper": {
                mt: -1,
              },
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls={`panel${index}-content`}
              id={`panel${index}-header`}
            >
              <Box sx={{ display: "flex", alignItems: "center", width: "100%", position: "relative" }}>
                <Typography variant="body1" sx={{ fontWeight: "medium", mr: "auto" }}>
                  {employeeMap[review.reviewerEmail]?.employeeName}{" "}
                  <span style={{ color: "GrayText" }}>({review.reviewerEmail})</span>
                </Typography>

                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Chip
                    size="small"
                    label={`Rating: ${review.reviewRating}`}
                    sx={{
                      height: "1.5rem",
                      backgroundColor: theme.palette.secondaryShades["900"],
                      mr: 1,
                    }}
                  />

                  <Tooltip title="Copy review">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        copyReviewToClipboard(review);
                      }}
                    >
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ position: "relative" }}>
                <CommentPaper
                  comment={
                    base64Regex.test(review.reviewComment ?? "")
                      ? decodeURIComponent(atob(review.reviewComment ?? ""))
                      : null
                  }
                />
              </Box>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    );
  };

  return (
    <Accordion disabled={threeSixtyReviews.length === 0}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="h6">360° Feedback</Typography>
      </AccordionSummary>
      <AccordionDetails>
        {threeSixtyReviewStatus === RequestState.LOADING && <LoadingEffect message={uiMessages.loading.pageLoading} />}
        {threeSixtyReviewStatus === RequestState.SUCCEEDED && !isAdminsSelfProfile ? (
          <>{threeSixtyReviews.length > 0 ? renderReviews() : <NoDataView text="No 360° feedback received" />}</>
        ) : (
          <>{threeSixtyReviewStatus === RequestState.SUCCEEDED && <NoDataView text="Self profile restricted" />}</>
        )}
      </AccordionDetails>
    </Accordion>
  );
};

export default ThreeSixtyFeedbackSection;
