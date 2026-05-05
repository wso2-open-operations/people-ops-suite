// Copyright (c) 2025 WSO2 LLC. (https://www.wso2.com).
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
import LoadingButton from "@mui/lab/LoadingButton";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Divider,
  Grid,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { useFormik } from "formik";
import * as yup from "yup";

import { useEffect, useState } from "react";

import CommentPaper from "@component/common/CommentPaper";
import { ConfirmationDialog } from "@component/common/ConfirmationDialog";
import CustomRichTextField from "@component/common/CustomRichText";
import { LoadingEffect } from "@component/ui/Loading";
import { SnackMessage, autoSaveCountdownDuration, parUiText, uiMessages } from "@config/constant";
import { parRatingNotAssigned } from "@root/src/slices/employeeHistorySlice/employeeHistory";
import { RequestState } from "@root/src/utils/types";
import { selectUserEmail } from "@slices/authSlice/auth";
import { ShowSnackBarMessage } from "@slices/commonSlice/common";
import { selectEmployeeMap } from "@slices/metaSlice/meta";
import { ParCycle } from "@slices/parCycleSlice/parCycle";
import { useAppDispatch, useAppSelector } from "@slices/store";
import {
  ParThreeSixtyReviewStatus,
  fetchSelectedReview,
  postReviews,
  selectSelectedThreeSixtyReview,
  selectSelectedThreeSixtyReviewStatus,
  updateSelectedReview,
} from "@slices/threeSixtyReviewSlice/threeSixtyReview";

dayjs.extend(utc);

interface ReviewProvideModalProps {
  parCycle: Partial<ParCycle>;
  employeeEmail: string;
  threeSixtyReviewQuestion: string;
  threeSixtyReviewRatings: string[];
  onClose: () => void;
  isRejectSelected?: boolean;
  isOfferedFeedback?: boolean;
}

export const ReviewProvideModal = ({
  onClose,
  parCycle,
  employeeEmail,
  threeSixtyReviewQuestion,
  threeSixtyReviewRatings,
  isRejectSelected,
  isOfferedFeedback,
}: ReviewProvideModalProps) => {
  const dispatch = useAppDispatch();
  const userEmail = useAppSelector(selectUserEmail);
  const employeeMap = useAppSelector(selectEmployeeMap);
  const threeSixtyReviewContent = useAppSelector(selectSelectedThreeSixtyReview);
  const threeSixtyReviewStatus = useAppSelector(selectSelectedThreeSixtyReviewStatus);

  const [autoSaveTimeout, setAutoSaveTimeout] = useState<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const [autoSaveCountdown, setAutoSaveCountdown] = useState(autoSaveCountdownDuration);

  const [isDeadlinePassed, setIsDeadlinePassed] = useState(false);

  const [isDraft, setIsDraft] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  const [isConfirmationDialogOpen, setIsConfirmationDialogOpen] = useState(false);

  const [isRejectionSelected, setIsRejectionSelected] = useState(!!isRejectSelected);

  const openConfirmationDialog = () => setIsConfirmationDialogOpen(true);
  const closeConfirmationDialog = () => {
    setSubmitting(false);
    setIsConfirmationDialogOpen(false);
  };

  const validationSchema = yup.object().shape({
    reviewRating: isRejectionSelected ? yup.string() : yup.string().required("Required"),
    reviewComment: yup
      .string()
      .trim()
      .test("is-not-empty-html", "Required", (value) => {
        const textContent = value
          ?.replace(/<[^>]*>/g, "")
          .replace(/&nbsp;/g, " ")
          .trim();
        return textContent !== "" && textContent !== null && textContent !== undefined;
      })
      .required("Required"),
  });

  const {
    values,
    setValues,
    errors,
    touched,
    handleChange,
    handleBlur,
    handleSubmit,
    isSubmitting,
    setSubmitting,
    setFieldTouched,
    setFieldValue,
  } = useFormik({
    initialValues: {
      reviewRating: "",
      reviewComment: "",
    },
    validationSchema,

    onSubmit: async () => {
      openConfirmationDialog();
    },
  });

  const updateThreeSixtyReview = async (
    status: ParThreeSixtyReviewStatus,
    onSuccess: () => void,
  ) => {
    setSubmitting(true);

    const reviewComment = btoa(encodeURIComponent(values.reviewComment));

    const formattedValues: {
      reviewRating?: string;
      reviewComment: string;
      par360ReviewStatus: ParThreeSixtyReviewStatus;
    } = {
      reviewComment,
      par360ReviewStatus: status,
    };

    if (values.reviewRating !== "" && !isRejectionSelected) {
      formattedValues.reviewRating = values.reviewRating;
    }

    const resultAction = await dispatch(
      postReviews({
        employeeId: employeeEmail,
        parCycleId: parCycle.parCycleId!,
        values: formattedValues,
      }),
    );

    if (postReviews.fulfilled.match(resultAction)) {
      onSuccess();
    }

    setSubmitting(false);
  };

  const handleDraftSubmit = async () => {
    setIsDraft(true);
    updateThreeSixtyReview(ParThreeSixtyReviewStatus.DRAFT, async () => {
      if (userEmail && parCycle.parCycleId) {
        dispatch(
          updateSelectedReview({
            reviewComment: values.reviewComment,
            reviewRating: values.reviewRating,
          }),
        );
        dispatch(ShowSnackBarMessage(SnackMessage.success.draftSaveThreeSixtyReview, "success"));
        setIsDraft(false);
      }
    });
  };

  const handleAutoSave = async () => {
    setIsSavingDraft(true);

    updateThreeSixtyReview(ParThreeSixtyReviewStatus.DRAFT, () => {
      dispatch(
        updateSelectedReview({
          reviewComment: values.reviewComment,
          reviewRating: values.reviewRating,
        }),
      );
    });

    setTimeout(() => {
      setIsSavingDraft(false);
    }, 1000);
  };

  const handleConfirmationProceed = async () => {
    setSubmitting(true);

    updateThreeSixtyReview(
      isRejectionSelected
        ? ParThreeSixtyReviewStatus.REJECTED
        : ParThreeSixtyReviewStatus.COMPLETED,
      () => {
        closeConfirmationDialog();
        setSubmitting(false);

        dispatch(ShowSnackBarMessage(SnackMessage.success.postThreeSixtyReview, "success"));

        onClose();
      },
    );
  };

  useEffect(() => {
    dispatch(
      fetchSelectedReview({
        employeeId: employeeEmail,
        parCycleId: parCycle.parCycleId!,
      }),
    );

    const deadlineLocal = dayjs(parCycle.parThreeSixtyRatingDeadline).endOf("day");
    setIsDeadlinePassed(dayjs().isAfter(deadlineLocal));
  }, [dispatch, employeeEmail, parCycle]);

  useEffect(() => {
    if (
      threeSixtyReviewContent.reviewRating !== "" &&
      threeSixtyReviewContent.reviewRating !== undefined
    ) {
      setValues({
        reviewRating:
          threeSixtyReviewContent.reviewRating === parRatingNotAssigned
            ? ""
            : threeSixtyReviewContent.reviewRating,
        reviewComment: threeSixtyReviewContent?.reviewComment ?? "",
      });
    }

    return () => {
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setValues, threeSixtyReviewContent]);

  // Following function handles the autoSave after the timeout
  useEffect(() => {
    const autoSaveDelay = autoSaveCountdownDuration * 1000;

    const delayAutoSave = setTimeout(() => {
      if (
        values.reviewComment !== threeSixtyReviewContent?.reviewComment &&
        !errors?.reviewComment &&
        !isConfirmationDialogOpen &&
        !isRejectionSelected
      ) {
        handleAutoSave();
      }
    }, autoSaveDelay);

    setAutoSaveTimeout(delayAutoSave);

    return () => {
      if (delayAutoSave) {
        clearTimeout(delayAutoSave);
      }
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    values.reviewComment,
    threeSixtyReviewContent?.reviewComment,
    isConfirmationDialogOpen,
    isRejectionSelected,
    errors?.reviewComment,
  ]);

  // Following function handles the countdown which is visible in the employee par comment TextArea
  useEffect(() => {
    let countdownInterval: ReturnType<typeof setInterval> | null = null;

    if (
      autoSaveCountdown >= 0 &&
      !isConfirmationDialogOpen &&
      !isRejectionSelected &&
      !errors?.reviewComment &&
      values.reviewComment !== threeSixtyReviewContent?.reviewComment &&
      !isDraft
    ) {
      countdownInterval = setInterval(() => {
        setAutoSaveCountdown((prevCount) => {
          if (prevCount > 0) {
            return prevCount - 1;
          } else {
            return prevCount;
          }
        });
      }, 1000);
    } else {
      if (countdownInterval) {
        clearInterval(countdownInterval);
      }
      setAutoSaveCountdown(autoSaveCountdownDuration);
    }

    if (autoSaveCountdown >= 0) {
      setAutoSaveCountdown(autoSaveCountdownDuration);
    }

    return () => {
      if (countdownInterval) {
        window.clearInterval(countdownInterval);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    values.reviewComment,
    isConfirmationDialogOpen,
    isRejectionSelected,
    errors?.reviewComment,
    isDraft,
  ]);

  return (
    <Box sx={{ p: 1 }}>
      <Typography id="dashboard-modal-title" variant="h5" sx={{ textAlign: 'center' }}>
        Provide 360° Feedback
      </Typography>
      <Box display="flex" justifyContent="center" alignItems="center" gap={4}>
        <Box display="flex" alignItems="center">
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
            <Typography variant="h6" color={"primary.secondary"}>
              {employeeEmail}
            </Typography>
          </Box>
        </Box>
        <Box mt={1}>
          {!isRejectionSelected && !isOfferedFeedback && (
            <Button color="error" variant="outlined" onClick={() => setIsRejectionSelected(true)}>
              DECLINE
            </Button>
          )}
        </Box>
      </Box>

      <Box mt={2}>
        {!isDeadlinePassed &&
          threeSixtyReviewContent.reviewStatus === ParThreeSixtyReviewStatus.PENDING && (
            <Alert severity="info">
              {`Please share your 360° feedback before the deadline: ${dayjs
                .utc(parCycle.parThreeSixtyRatingDeadline)
                .format("D MMM 'YY")}`}
            </Alert>
          )}
        {!isDeadlinePassed &&
          threeSixtyReviewContent.reviewStatus === ParThreeSixtyReviewStatus.DRAFT && (
            <Alert severity="warning">
              {`Your 360° feedback is saved as a draft. Please share on or before the deadline: ${dayjs
                .utc(parCycle.parThreeSixtyRatingDeadline)
                .format("D MMM 'YY")}`}
            </Alert>
          )}
        {isDeadlinePassed && (
          <Alert severity="error">
            {`The deadline for sharing the 360° feedback has passed on ${dayjs
              .utc(parCycle.parThreeSixtyRatingDeadline)
              .format("D MMM 'YY")}`}
          </Alert>
        )}
      </Box>

      <form onSubmit={handleSubmit}>
        {threeSixtyReviewStatus === RequestState.LOADING && (
          <Box minHeight={340} sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            <LoadingEffect message={uiMessages.loading.pageLoading} />
          </Box>
        )}

        {(threeSixtyReviewStatus === RequestState.SUCCEEDED ||
          threeSixtyReviewStatus === RequestState.FAILED) && (
            <Grid container spacing={1} pt={1} id="modal-description">
              {!isRejectionSelected && (
                <>
                  <Grid size={{ md: 12 }} pb={2}>
                    <Box display="flex" justifyContent="space-between">
                      <Box display="flex" alignItems="center">
                        <Typography>
                          {parUiText.ThreeSixtyReviewPanelDescription}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 1 }}>
                    <Typography pt={1} sx={{ mr: 2 }}>
                      Rating:
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 11, md: 6 }} sx={{ mb: 1, pl: 3 }}>
                    <TextField
                      select
                      size="small"
                      fullWidth
                      name="reviewRating"
                      label="Select Rating"
                      value={values.reviewRating}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.reviewRating && Boolean(errors.reviewRating)}
                      helperText={touched.reviewRating && errors.reviewRating}
                      variant="outlined"
                      InputProps={{
                        readOnly: isDeadlinePassed,
                      }}
                    >
                      {threeSixtyReviewRatings.map((rating) => (
                        <MenuItem key={rating} value={rating}>
                          {rating}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid size={{ md: 3, sm: 0 }} />
                </>
              )}
              <Grid size={{ xs: 12 }}>
                <Typography pb={1}>
                  {isRejectionSelected ? "Reason :" : threeSixtyReviewQuestion}
                </Typography>
                <Box sx={{ position: "relative" }}>
                  {isDeadlinePassed ? (
                    <CommentPaper comment={values.reviewComment} />
                  ) : (
                    <CustomRichTextField
                      name="reviewComment"
                      value={values.reviewComment}
                      onChange={(value) => {
                        if (value !== values.reviewComment) {
                          setFieldValue("reviewComment", value);
                        }
                      }}
                      onBlur={handleBlur}
                      error={Boolean(touched.reviewComment && errors.reviewComment)}
                      helperText={
                        touched.reviewComment && errors.reviewComment
                          ? errors.reviewComment.toString()
                          : ""
                      }
                      placeholder="Enter your comment here"
                      setFieldTouched={setFieldTouched}
                    />
                  )}
                  {autoSaveCountdown === 0 && isSavingDraft && (
                    <Typography
                      color={"GrayText"}
                      sx={{ position: "absolute", bottom: "-1.5rem", left: 0 }}
                    >
                      Saving draft...
                    </Typography>
                  )}
                </Box>
              </Grid>
              <Grid size={{ sm: 12 }} display="flex" justifyContent="flex-end" gap={2} mt={2}>
                {isRejectionSelected && (
                  <Button color="error" variant="outlined" onClick={onClose}>
                    Cancel
                  </Button>
                )}
                {!isRejectionSelected && (
                  <Button variant="outlined" onClick={onClose}>
                    Cancel
                  </Button>
                )}
                {!isRejectionSelected && (
                  <LoadingButton
                    disabled={
                      isDeadlinePassed ||
                      !(
                        (values.reviewComment !== threeSixtyReviewContent.reviewComment &&
                          !errors?.reviewComment) ||
                        (values.reviewRating !== threeSixtyReviewContent.reviewRating &&
                          values.reviewRating !== "")
                      )
                    }
                    loading={isSubmitting}
                    variant="outlined"
                    onClick={() => handleDraftSubmit()}
                  >
                    <span>Save Draft</span>
                  </LoadingButton>
                )}
                <LoadingButton
                  color={isRejectionSelected ? "error" : "primary"}
                  type="submit"
                  disabled={isDeadlinePassed}
                  loading={isSubmitting}
                  variant={isSubmitting ? "outlined" : "contained"}
                >
                  <span>{isRejectionSelected ? "Decline" : "Share"}</span>
                </LoadingButton>
              </Grid>
            </Grid>
          )}
      </form>
      <ConfirmationDialog
        open={isConfirmationDialogOpen}
        onClose={closeConfirmationDialog}
        title={
          isRejectionSelected
            ? uiMessages.dialog.threeSixtyReviewReject.title
            : uiMessages.dialog.threeSixtyReviewShare.title
        }
        message={
          isRejectionSelected
            ? uiMessages.dialog.threeSixtyReviewReject.message
            : uiMessages.dialog.threeSixtyReviewShare.message
        }
        okText={
          isRejectionSelected
            ? uiMessages.dialog.threeSixtyReviewReject.okText
            : uiMessages.dialog.threeSixtyReviewShare.okText
        }
        onConfirm={handleConfirmationProceed}
        ariaLabelledby="alert-360-share-reject-dialog-title"
        ariaDescribedby="alert-360-share-reject-dialog-description"
        showLoading={true}
        isLoading={isSubmitting}
        isWarning={isRejectionSelected}
      />
    </Box>
  );
};
