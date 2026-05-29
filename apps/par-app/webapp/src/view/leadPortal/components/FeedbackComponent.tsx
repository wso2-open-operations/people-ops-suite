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
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Chip,
  IconButton,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";

import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

import { base64Regex, uiMessages } from "@config/constant";
import { RequestState } from "@utils/types";

import { enqueueSnackbarMessage } from "@slices/commonSlice/common";
import { selectEmployeeMap } from "@slices/metaSlice/meta";
import { useAppDispatch, useAppSelector } from "@slices/store";
import {
  ParThreeSixtyReviewStatus,
  ThreeSixtyReview,
  selectThreeSixtyReviewStatus,
  selectThreeSixtyReviews,
} from "@slices/threeSixtyReviewSlice/threeSixtyReview";

import CommentPaper from "@component/common/CommentPaper";
import NoDataView from "@component/common/NoDataView";
import { LoadingEffect } from "@component/ui/Loading";

interface ThreeSixtyFeedbackSectionProps {
  isAdminsSelfProfile: boolean;
}

const ThreeSixtyFeedbackSection = ({ isAdminsSelfProfile }: ThreeSixtyFeedbackSectionProps) => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const employeeMap = useAppSelector(selectEmployeeMap);
  const threeSixtyReviewStatus = useAppSelector(selectThreeSixtyReviewStatus);
  const threeSixtyReviews = useAppSelector(selectThreeSixtyReviews);

  const copyReviewToClipboard = async (review: ThreeSixtyReview) => {
    const reviewerName = employeeMap[review.reviewerEmail]?.employeeName;
    const reviewerEmail = review.reviewerEmail;
    const rating = review.reviewRating;
    const comment = base64Regex.test(review.reviewComment ?? "")
      ? decodeURIComponent(atob(review.reviewComment ?? ""))
      : "No comment provided";

    const textToCopy = `${reviewerName} (${reviewerEmail}):\nRating: ${rating}\nFeedback: ${comment}`;

    try {
      await navigator.clipboard.writeText(textToCopy);
      dispatch(
        enqueueSnackbarMessage({
          message: "Review copied to clipboard",
          type: "info",
        }),
      );
    } catch {
      dispatch(
        enqueueSnackbarMessage({
          message: "Unable to copy review to clipboard",
          type: "error",
        }),
      );
    }
  };

  const renderReviews = () => {
    const completedReviews = threeSixtyReviews.filter(
      (review) => review.reviewStatus === ParThreeSixtyReviewStatus.COMPLETED,
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
              <Box
                sx={{ display: "flex", alignItems: "center", width: "100%", position: "relative" }}
              >
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
        {threeSixtyReviewStatus === RequestState.LOADING && (
          <LoadingEffect message={uiMessages.loading.pageLoading} />
        )}
        {threeSixtyReviewStatus === RequestState.SUCCEEDED && (
          isAdminsSelfProfile
            ? <NoDataView text="Self profile restricted" />
            : threeSixtyReviews.length > 0
              ? renderReviews()
              : <NoDataView text="No 360° feedback received" />
        )}
      </AccordionDetails>
    </Accordion>
  );
};

export default ThreeSixtyFeedbackSection;
