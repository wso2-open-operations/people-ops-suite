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

import { Box, Button, Grid, Typography } from "@mui/material";
import { useFormik } from "formik";
import * as yup from "yup";

import { useEffect, useRef, useState } from "react";

import CommentPaper from "@component/common/CommentPaper";
import { ConfirmationDialog } from "@component/common/ConfirmationDialog";
import CustomRichTextField from "@component/common/CustomRichText";
import { SnackMessage, parUiText, uiMessages } from "@config/constant";
import {
  ParEmployeeStatus,
  ParRating,
} from "@root/src/slices/employeeHistorySlice/employeeHistory";
import { ParCycle } from "@root/src/slices/parCycleSlice/parCycle";
import { selectEmployeeInfo, selectUserEmail } from "@slices/authSlice/auth";
import { ShowSnackBarMessage } from "@slices/commonSlice/common";
import {
  fetchCurrentParCycleOfEmployee,
  updateParRatingOfEmployee,
  updateSelectedParEmployeeComment,
} from "@slices/employeeSlice/employee";
import { selectEmployeeMap } from "@slices/metaSlice/meta";
import { useAppDispatch, useAppSelector } from "@slices/store";

export const ParInputForm = ({
  employeeRatings,
  currentCycle,
  isDeadlinePassed,
}: {
  employeeRatings: ParRating;
  currentCycle: Partial<ParCycle>;
  isDeadlinePassed: boolean;
}) => {
  const dispatch = useAppDispatch();
  const userEmail = useAppSelector(selectUserEmail);
  const employeeInfo = useAppSelector(selectEmployeeInfo);
  const employeeMap = useAppSelector(selectEmployeeMap);
  const [isConfirmationDialogOpen, setIsConfirmationDialogOpen] = useState(false);
  const [isDraft, setIsDraft] = useState(false);
  const [isSharingReview, setIsSharingReview] = useState(false);
  const lastChangeTimestamp = useRef(Date.now());
  const [isDraftSaved, setIsDraftSaved] = useState(false);

  const openConfirmationDialog = () => setIsConfirmationDialogOpen(true);
  const closeConfirmationDialog = () => {
    setSubmitting(false);
    setIsConfirmationDialogOpen(false);
  };

  const validationSchema = yup.object().shape({
    parEmployeeComment: yup
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
    errors,
    touched,
    handleBlur,
    isSubmitting,
    setSubmitting,
    isValid,
    handleSubmit,
    setFieldTouched,
    setFieldValue,
  } = useFormik({
    initialValues: {
      parEmployeeComment: employeeRatings?.parEmployeeComment || "",
    },
    validationSchema,
    onSubmit: () => {
      if (isDraft) {
        handleDraftSubmit();
      } else {
        openConfirmationDialog();
      }
    },
  });

  const updateParRating = async (status: ParEmployeeStatus, onSuccess: () => void) => {
    setSubmitting(true);

    const formattedValues = {
      parEmployeeComment: btoa(encodeURIComponent(values.parEmployeeComment)),
      parEmployeeStatus: status,
    };

    const resultAction = await dispatch(
      updateParRatingOfEmployee({
        employeeId: userEmail,
        parCycleId: currentCycle.parCycleId,
        parRatingId: employeeRatings?.parRatingId,
        values: formattedValues,
      }),
    );

    if (updateParRatingOfEmployee.fulfilled.match(resultAction)) {
      onSuccess();
    }

    setSubmitting(false);
  };

  const handleDraftSubmit = async () => {
    updateParRating(ParEmployeeStatus.DRAFT, () => {
      if (userEmail) {
        dispatch(fetchCurrentParCycleOfEmployee(userEmail));
        dispatch(ShowSnackBarMessage(SnackMessage.success.employeeParDraftSaved, "success"));
      }
    });
  };

  const handleConfirmationProceed = async () => {
    setIsSharingReview(true);
    updateParRating(ParEmployeeStatus.SHARED, () => {
      closeConfirmationDialog();
      setIsSharingReview(false);
      if (userEmail) {
        dispatch(fetchCurrentParCycleOfEmployee(userEmail));
        dispatch(ShowSnackBarMessage(SnackMessage.success.employeeParShared, "success"));
      }
    });
  };

  const handleAutoSave = () => {
    const saveTimestamp = Date.now();
    lastChangeTimestamp.current = saveTimestamp;

    // Store current value before API call
    const currentComment = values.parEmployeeComment;

    updateParRating(ParEmployeeStatus.DRAFT, async () => {
      // Only update if this save is still the most recent one
      if (lastChangeTimestamp.current === saveTimestamp) {
        dispatch(updateSelectedParEmployeeComment(currentComment));
        setIsDraftSaved(true);
        setTimeout(() => {
          setIsDraftSaved(false);
        }, 2000);
      }
    });
  };

  useEffect(() => {
    const autoSaveDelay = 1000;

    const delayAutoSave = setTimeout(() => {
      if (
        values.parEmployeeComment !== employeeRatings?.parEmployeeComment &&
        isValid &&
        !isDeadlinePassed &&
        !isConfirmationDialogOpen &&
        values.parEmployeeComment.trim() !== ""
      ) {
        handleAutoSave();
      }
    }, autoSaveDelay);

    return () => {
      if (delayAutoSave) {
        clearTimeout(delayAutoSave);
      }
    };
  }, [
    values.parEmployeeComment,
    employeeRatings?.parEmployeeComment,
    isValid,
    isConfirmationDialogOpen,
  ]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", flex: 1, overflow: "auto" }}>
      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", flex: 1, gap: "8px" }}
      >
        <Grid container spacing={1}>
          <Grid size={{ xs: 12 }} sx={{ overflowX: "auto", mt: 1 }}>
            <Typography
              sx={{
                fontSize: { xs: "0.75rem", sm: "1rem" },
                fontWeight: { xs: 300, sm: 400 },
                lineHeight: 1.5,
                color: "text.primary",
                pt: 0.8,
              }}
            >
              {currentCycle.parCycleConfigurations?.employeeParQuestion
                ? currentCycle.parCycleConfigurations?.employeeParQuestion
                : parUiText.EmptyEmployeeQuestionText}
            </Typography>
          </Grid>
          <Grid size={{ xs: 12 }} sx={{ overflowX: "auto", paddingTop: 1 }}>
            {isDeadlinePassed ? (
              <CommentPaper comment={values.parEmployeeComment} />
            ) : (
              <CustomRichTextField
                name="parEmployeeComment"
                value={values.parEmployeeComment}
                onChange={(value) => {
                  if (value !== values.parEmployeeComment) {
                    setFieldValue("parEmployeeComment", value);
                  }
                }}
                onBlur={handleBlur}
                error={Boolean(touched.parEmployeeComment && errors.parEmployeeComment)}
                helperText={
                  touched.parEmployeeComment && errors.parEmployeeComment
                    ? errors.parEmployeeComment.toString()
                    : ""
                }
                placeholder="Enter your comment here"
                setFieldTouched={setFieldTouched}
              />
            )}
          </Grid>
        </Grid>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            {isDraftSaved && (
              <Typography variant="caption" color="text.secondary">
                Draft Saved
              </Typography>
            )}
          </Box>
          <Box display="flex" gap={2} paddingTop={1}>
            <Button
              variant="outlined"
              type="submit"
              onClick={() => setIsDraft(true)}
              disabled={
                isSubmitting ||
                isDeadlinePassed ||
                values.parEmployeeComment === employeeRatings?.parEmployeeComment ||
                !isValid
              }
            >
              Save
            </Button>
            <Button
              variant="contained"
              type="submit"
              onClick={() => setIsDraft(false)}
              disabled={isSubmitting || isDeadlinePassed}
            >
              Share
            </Button>
          </Box>
        </Box>
      </form>
      {employeeInfo && (
        <ConfirmationDialog
          open={isConfirmationDialogOpen}
          onClose={closeConfirmationDialog}
          title={uiMessages.dialog.employeeParShare.title}
          message={
            <span>
              If you share this review, your feedback will be made available to{" "}
              <b>
                {employeeInfo?.leadEmail &&
                employeeMap[employeeInfo.leadEmail] &&
                employeeMap[employeeInfo.leadEmail].employeeName
                  ? employeeMap[employeeInfo.leadEmail].employeeName
                  : employeeInfo?.leadEmail || "your lead"}
              </b>
              , Do you wish to continue?
            </span>
          }
          okText={uiMessages.dialog.employeeParShare.okText}
          onConfirm={handleConfirmationProceed}
          ariaLabelledby="alert-par-share-dialog-title"
          ariaDescribedby="alert-par-share-dialog-description"
          showLoading={true}
          isLoading={isSharingReview}
        />
      )}
    </Box>
  );
};
