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
import { Avatar, Box, Button, Chip, Divider, Grid, Typography } from "@mui/material";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

import { useEffect } from "react";

import { LoadingEffect } from "@component/ui/Loading";
import { ParCycle } from "@root/src/slices/parCycleSlice/parCycle";
import { selectEmployeeMap } from "@slices/metaSlice/meta";
import { useAppDispatch, useAppSelector } from "@slices/store";
import {
  ParThreeSixtyReviewStatus,
  fetchSelectedReview,
  selectSelectedThreeSixtyReview,
  selectSelectedThreeSixtyReviewStatus,
  updateSelectedReview,
} from "@slices/threeSixtyReviewSlice/threeSixtyReview";
import { RequestState } from "@utils/types";

import CommentPaper from "./CommentPaper";
import { uiMessages } from "@root/src/config/constant";

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

export const ReviewViewModal = ({
  onClose,
  parCycle,
  employeeEmail,
  reviewObject,
}: ReviewViewModalProps) => {
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
        }),
      );
    } else {
      dispatch(updateSelectedReview({ ...reviewObject }));
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeEmail, parCycle, reviewObject]);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <Typography variant="h5">
            360° Feedback
          </Typography>
          {(threeSixtyReviewStatus === RequestState.SUCCEEDED || reviewObject) &&
            threeSixtyReviewContent.reviewStatus === ParThreeSixtyReviewStatus.REJECTED && (
              <Chip
                label={threeSixtyReviewContent.reviewStatus}
                color="error"
                size="small"
                sx={{ ml: 2 }}
              />
            )}
        </Box>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Avatar
            src={employeeMap[employeeEmail]?.employeeThumbnail}
            alt={employeeMap[employeeEmail]?.employeeName || employeeEmail}
            sizes="xl"
            sx={{ height: 50, width: 50 }}
          />
          <Box ml={2}>
            <Typography variant="h3" sx={{ fontSize: 20 }}>
              {employeeMap[employeeEmail]?.employeeName}
            </Typography>
            <Typography variant="h6" color="text.secondary">
              {employeeEmail}
            </Typography>
          </Box>
        </Box>
      </Box>

      {threeSixtyReviewStatus === RequestState.LOADING && (
        <Box
          sx={{ minHeight: 193, display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <LoadingEffect message={uiMessages.loading.pageLoading} />
        </Box>
      )}

      {(threeSixtyReviewStatus === RequestState.SUCCEEDED || reviewObject) && (
        <Box sx={{ mt: 3 }}>
          {threeSixtyReviewContent.reviewStatus !== ParThreeSixtyReviewStatus.REJECTED && (
            <Box sx={{ mb: 3 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid size={{ xs: 12, sm: 2 }}>
                  <Typography variant="body1" fontWeight="medium">
                    Rating:
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 10 }}>
                  <Chip
                    size="small"
                    label={threeSixtyReviewContent.reviewRating}
                    color="primary"
                    variant="outlined"
                  />
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
