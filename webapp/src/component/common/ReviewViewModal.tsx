// Copyright (c) 2025, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import {
  fetchSelectedReview,
  updateSelectedReview,
  selectSelectedThreeSixtyReview,
  selectSelectedThreeSixtyReviewStatus,
} from "@slices/threeSixtyReviewSlice";
import dayjs from "dayjs";
import { useEffect } from "react";
import utc from "dayjs/plugin/utc";
import CommentPaper from "./CommentPaper";
import { selectEmployeeMap } from "@slices/metaSlice";
import { LoadingEffect } from "@components/ui/Loading";
import { useAppDispatch, useAppSelector } from "@slices/store";
import { ParCycle, ParThreeSixtyReviewStatus, RequestState } from "@utils/types";
import { Typography, Button, Grid, Box, Divider, Avatar, Chip } from "@mui/material";
dayjs.extend(utc);

interface ReviewViewModalProps {
  onClose: () => void;
  parCycle: Partial<ParCycle>;
  employeeEmail: string;
  reviewObject?: {
    reviewRating: string;
    reviewComment: string;
  };
  isOfferedFeedback?: boolean;
}

export const ReviewViewModal = ({ onClose, parCycle, employeeEmail, reviewObject }: ReviewViewModalProps) => {
  const dispatch = useAppDispatch();
  const employeeMap = useAppSelector(selectEmployeeMap);
  const threeSixtyReviewContent = useAppSelector(selectSelectedThreeSixtyReview);
  const threeSixtyReviewStatus = useAppSelector(selectSelectedThreeSixtyReviewStatus);
  useEffect(() => {
    if (!reviewObject) {
      dispatch(
        fetchSelectedReview({
          employeeId: employeeEmail,
          parCycleId: parCycle.parCycleId!,
        })
      );
    } else {
      dispatch(updateSelectedReview({ ...reviewObject }));
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeEmail, parCycle, reviewObject]);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <Typography variant="h4" component="h1">
            360° Feedback
          </Typography>
          {(threeSixtyReviewStatus === RequestState.SUCCEEDED || reviewObject) &&
            threeSixtyReviewContent.reviewStatus === ParThreeSixtyReviewStatus.REJECTED && (
              <Chip label={threeSixtyReviewContent.reviewStatus} color="error" size="small" sx={{ ml: 2 }} />
            )}
        </Box>
        <Divider sx={{ bgcolor: "primary.main" }} />
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", mb: 4 }}>
        <Avatar
          src={employeeMap[employeeEmail]?.employeeThumbnail}
          alt={employeeMap[employeeEmail]?.employeeName || employeeEmail}
          sx={{
            width: 100,
            height: 100,
            mr: 3,
          }}
        />
        <Box>
          <Typography variant="h5" component="h2" sx={{ mb: 1 }}>
            {employeeMap[employeeEmail]?.employeeName}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {employeeEmail}
          </Typography>
        </Box>
      </Box>

      {threeSixtyReviewStatus === RequestState.LOADING && (
        <Box sx={{ minHeight: 470, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <LoadingEffect message={""} />
        </Box>
      )}

      {(threeSixtyReviewStatus === RequestState.SUCCEEDED || reviewObject) && (
        <Box sx={{ mt: 3 }}>
          {threeSixtyReviewContent.reviewStatus !== ParThreeSixtyReviewStatus.REJECTED && (
            <Box sx={{ mb: 3 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={2}>
                  <Typography variant="body1" fontWeight="medium">
                    Rating:
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={10}>
                  <Chip size="small" label={threeSixtyReviewContent.reviewRating} color="primary" variant="outlined" />
                </Grid>
              </Grid>
            </Box>
          )}
          <Box sx={{ mb: 3 }}>
            <Typography variant="body1" fontWeight="medium" sx={{ mb: 2 }}>
              {threeSixtyReviewContent.reviewStatus !== ParThreeSixtyReviewStatus.REJECTED
                ? "Feedback:"
                : "Rejection Reason:"}
            </Typography>
            <CommentPaper comment={threeSixtyReviewContent.reviewComment} />
          </Box>
          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 4 }}>
            <Button variant="outlined" onClick={onClose} size="medium">
              Close
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
};
