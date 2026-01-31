// Copyright (c) 2024, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import { useState, useEffect, useRef } from "react";
import { Box, Button, Grid, Typography } from "@mui/material";
import { useFormik } from "formik";
import * as yup from "yup";
import { parUiText, snackMessages, uiMessages } from "@config/constant";
import { ParCycle, ParEmployeeStatus, ParRating } from "@utils/types";
import { useAppDispatch, useAppSelector } from "@slices/store";
import {
  fetchCurrentParCycleOfEmployee,
  updateParRatingOfEmployee,
  updateSelectedParEmployeeComment,
} from "@slices/employeeSlice";
import { selectEmployeeInfo, selectUserEmail } from "@slices/authSlice";
import { ConfirmationDialog } from "@components/common/ConfirmationDialog";
import { showSnackBarMessage } from "@slices/commonSlice/common";
import { selectEmployeeMap } from "@slices/metaSlice";
import CustomRichTextField from "@components/common/CustomRichText";
import CommentPaper from "@components/common/CommentPaper";

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
      })
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
        dispatch(showSnackBarMessage(snackMessages.success.employeeParDraftSaved, "success"));
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
        dispatch(showSnackBarMessage(snackMessages.success.employeeParShared, "success"));
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
  }, [values.parEmployeeComment, employeeRatings?.parEmployeeComment, isValid, isConfirmationDialogOpen]);

  return (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="start"
      alignItems="left"
      sx={{ minHeight: "calc(100vh - 22rem)" }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          flex: 1,
        }}
      >
        <Box paddingY={2}>
          <Grid container spacing={1}>
            <Grid item xs={12} sm={12} maxHeight={65} overflow={"auto"}>
              <Typography paddingTop={1} fontWeight={"bold"}>
                {currentCycle.parCycleConfigurations?.employeeParQuestion
                  ? currentCycle.parCycleConfigurations?.employeeParQuestion
                  : parUiText.EmptyEmployeeQuestionText}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={12}>
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
                    touched.parEmployeeComment && errors.parEmployeeComment ? errors.parEmployeeComment.toString() : ""
                  }
                  placeholder="Enter your comment here"
                  setFieldTouched={setFieldTouched}
                />
              )}
            </Grid>
          </Grid>
        </Box>
        <Box display="flex" justifyContent="space-between">
          <Box mt={-1}>{isDraftSaved && <Typography color={"GrayText"}>Draft Saved</Typography>}</Box>
          <Box display={"flex"} gap={1}>
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
