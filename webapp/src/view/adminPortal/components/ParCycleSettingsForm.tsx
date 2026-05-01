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
  Breadcrumbs,
  Button,
  Divider,
  Grid,
  Link,
  TextField,
  Typography,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { useFormik } from "formik";
import * as yup from "yup";

import { useEffect, useState } from "react";

import { ConfirmationDialog } from "@component/common/ConfirmationDialog";
import FormDatePicker from "@view/adminPortal/components/FormDatePicker";
import { SnackMessage, uiMessages } from "@config/constant";
import {
  fetchOpenParCycle,
  selectCurrentCycle,
  updateParCycle,
} from "@root/src/slices/parCycleSlice/parCycle";
import { ShowSnackBarMessage } from "@slices/commonSlice/common";
import { useAppDispatch, useAppSelector } from "@slices/store";

interface FormProps {
  closeParCycleSettings: () => void;
}

export const ParCycleSettingsForm = ({ closeParCycleSettings }: FormProps) => {
  const dispatch = useAppDispatch();
  const currentCycle = useAppSelector(selectCurrentCycle);

  const [isConfirmationDialogOpen, setIsConfirmationDialogOpen] = useState(false);
  const openConfirmationDialog = () => setIsConfirmationDialogOpen(true);
  const closeConfirmationDialog = () => {
    setIsConfirmationDialogOpen(false);
    setSubmitting(false);
  };
  const [hasFormValuesChanged, setHasFormValuesChanged] = useState(false);

  const validationSchema = yup.object().shape({
    parCycleStartDate: yup.date().typeError("Invalid date").required("Required"),

    parCycleEndDate: yup
      .date()
      .typeError("Invalid Date")
      .min(yup.ref("parCycleStartDate"), "Must be later than the cycle start date")
      .required("Required"),

    parEvaluationEndDate: yup
      .date()
      .typeError("Invalid date")
      .min(yup.ref("parEvaluationStartDate"), "Must be later than PAR creation date")
      .required("Required"),

    parEmployeeDeadline: yup
      .date()
      .typeError("Invalid date")
      .min(yup.ref("parEvaluationStartDate"), "Must be later than PAR creation date")
      .max(yup.ref("parEvaluationEndDate"), "Must be earlier than the PAR cycle closing date")
      .required("Required"),

    parThreeSixtyRatingDeadline: yup
      .date()
      .typeError("Invalid date")
      .min(yup.ref("parEvaluationStartDate"), "Must be later than PAR creation date")
      .max(yup.ref("parEvaluationEndDate"), "Must be earlier than the PAR cycle closing date")
      .required("Required"),

    parLeadDeadline: yup
      .date()
      .typeError("Invalid date")
      .min(yup.ref("parEmployeeDeadline"), "Must be later than employee PAR deadline")
      .max(yup.ref("parEvaluationEndDate"), "Must be earlier than the PAR cycle closing date")
      .test(
        "isAfterEmployeeDeadline",
        "Must be later than employee PAR deadline",
        (value, context) => {
          const employeeDeadline = context.parent.parEmployeeDeadline;
          if (value !== undefined && value !== null) {
            return value > employeeDeadline;
          }
          return false;
        },
      )
      .required("Required"),

    parSpecialRatingDeadline: yup
      .date()
      .typeError("Invalid date")
      .min(yup.ref("parEvaluationStartDate"), "Must be later than PAR creation date")
      .max(yup.ref("parEvaluationEndDate"), "Must be earlier than the PAR cycle closing date")
      .required("Required"),

    employeeParQuestion: yup.string().trim().required("Required"),
    threeSixtyReviewQuestion: yup.string().trim().required("Required"),
  });

  const {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    isSubmitting,
    handleSubmit,
    setSubmitting,
    setFieldValue,
  } = useFormik({
    initialValues: {
      parCycleStartDate: currentCycle.parCycleStartDate || "",
      parCycleEndDate: currentCycle.parCycleEndDate || "",
      parEvaluationStartDate: currentCycle.parEvaluationStartDate
        ? dayjs(currentCycle.parEvaluationStartDate)
        : null,
      parEvaluationEndDate: currentCycle.parEvaluationEndDate || "",
      parEmployeeDeadline: currentCycle.parEmployeeDeadline || "",
      parThreeSixtyRatingDeadline: currentCycle.parThreeSixtyRatingDeadline || "",
      parLeadDeadline: currentCycle.parLeadDeadline || "",
      parSpecialRatingDeadline: currentCycle.parSpecialRatingDeadline || "",
      parF2FDeadline: currentCycle.parF2FDeadline || "",
      employeeParQuestion: currentCycle.parCycleConfigurations?.employeeParQuestion || "",
      threeSixtyReviewQuestion: currentCycle.parCycleConfigurations?.threeSixtyReviewQuestion || "",
    },
    validationSchema,
    onSubmit: () => {
      openConfirmationDialog();
    },
  });

  const handleConfirmationProceed = async () => {
    setSubmitting(true);

    const {
      parCycleStartDate,
      parCycleEndDate,
      parEvaluationEndDate,
      parEmployeeDeadline,
      parThreeSixtyRatingDeadline,
      parLeadDeadline,
      parSpecialRatingDeadline,
      parF2FDeadline,
      employeeParQuestion,
      threeSixtyReviewQuestion,
    } = values;

    const formattedValues = {
      parCycleStartDate: dayjs(parCycleStartDate).format("YYYY-MM-DD"),
      parCycleEndDate: dayjs(parCycleEndDate).format("YYYY-MM-DD"),
      parEvaluationEndDate: dayjs(parEvaluationEndDate).format("YYYY-MM-DD"),
      parEmployeeDeadline: dayjs(parEmployeeDeadline).format("YYYY-MM-DD"),
      parThreeSixtyRatingDeadline: dayjs(parThreeSixtyRatingDeadline).format("YYYY-MM-DD"),
      parLeadDeadline: dayjs(parLeadDeadline).format("YYYY-MM-DD"),
      parSpecialRatingDeadline: dayjs(parSpecialRatingDeadline).format("YYYY-MM-DD"),
      parF2FDeadline: dayjs(parF2FDeadline).format("YYYY-MM-DD"),
      parCycleConfigurations: {
        employeeParQuestion: employeeParQuestion.trim(),
        threeSixtyReviewQuestion: threeSixtyReviewQuestion.trim(),
      },
    };

    if (currentCycle?.parCycleId) {
      const resultAction = await dispatch(
        updateParCycle({
          parCycleId: currentCycle.parCycleId,
          values: formattedValues,
        }),
      );
      if (updateParCycle.fulfilled.match(resultAction)) {
        closeConfirmationDialog();
        dispatch(fetchOpenParCycle());
        closeParCycleSettings();
      }
    } else {
      dispatch(ShowSnackBarMessage(SnackMessage.error.parCycleUpdate, "error"));
    }
    setSubmitting(false);
  };

  useEffect(() => {
    const hasChanged =
      values.parCycleStartDate !== dayjs(currentCycle.parCycleStartDate).format("YYYY-MM-DD") ||
      values.parCycleEndDate !== dayjs(currentCycle.parCycleEndDate).format("YYYY-MM-DD") ||
      values.parEvaluationEndDate !==
        dayjs(currentCycle.parEvaluationEndDate).format("YYYY-MM-DD") ||
      values.parEmployeeDeadline !== dayjs(currentCycle.parEmployeeDeadline).format("YYYY-MM-DD") ||
      values.parThreeSixtyRatingDeadline !==
        dayjs(currentCycle.parThreeSixtyRatingDeadline).format("YYYY-MM-DD") ||
      values.parLeadDeadline !== dayjs(currentCycle.parLeadDeadline).format("YYYY-MM-DD") ||
      values.parSpecialRatingDeadline !==
        dayjs(currentCycle.parSpecialRatingDeadline).format("YYYY-MM-DD") ||
      values.employeeParQuestion !== currentCycle.parCycleConfigurations?.employeeParQuestion ||
      values.threeSixtyReviewQuestion !==
        currentCycle.parCycleConfigurations?.threeSixtyReviewQuestion;

    setHasFormValuesChanged(hasChanged);
  }, [values, currentCycle]);

  return (
    <Box>
      <Breadcrumbs aria-label="breadcrumb" sx={{ paddingBottom: 2 }}>
        <Link underline="hover" color="inherit" onClick={closeParCycleSettings}>
          Home
        </Link>
        <Typography color="text.primary">PAR Cycle Settings</Typography>
      </Breadcrumbs>
      <Grid size={{ xs: 12, sm: 12 }} paddingBottom={1}>
        <Typography variant="h4" gutterBottom>
          PAR Cycle Settings
        </Typography>
        <Divider />
      </Grid>
      <form onSubmit={handleSubmit}>
        <Grid container spacing={1} sx={{ height: "100%" }}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Grid size={{ xs: 12, sm: 3 }}>
              <Typography paddingTop={1}>PAR cycle starts from:</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 2 }}>
              <FormDatePicker
                name="parCycleStartDate"
                value={values.parCycleStartDate}
                onChange={setFieldValue}
                onBlur={handleBlur}
                error={touched.parCycleStartDate && errors.parCycleStartDate}
                helperText={touched.parCycleStartDate && (errors.parCycleStartDate as string)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 1 }}>
              <Typography paddingTop={1} textAlign={"end"}>
                to:
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 2 }}>
              <FormDatePicker
                name="parCycleEndDate"
                value={values.parCycleEndDate}
                onChange={setFieldValue}
                onBlur={handleBlur}
                disabled={!Boolean(values.parCycleStartDate)}
                minDate={values.parCycleStartDate || undefined}
                error={touched.parCycleEndDate && errors.parCycleEndDate}
                helperText={touched.parCycleEndDate && (errors.parCycleEndDate as string)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }} />

            <Grid size={{ xs: 12, sm: 3 }}>
              <Typography paddingTop={1}>PAR creation date:</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 2 }}>
              <FormDatePicker
                name="parEvaluationStartDate"
                value={values.parEvaluationStartDate}
                onChange={() => {}}
                disabled
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 7 }} />

            <Grid size={{ xs: 12, sm: 3 }}>
              <Typography paddingTop={1}>PAR evaluation closing date:</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 2 }}>
              <FormDatePicker
                name="parEvaluationEndDate"
                value={values.parEvaluationEndDate}
                onChange={setFieldValue}
                onBlur={handleBlur}
                disabled={!Boolean(values.parCycleStartDate)}
                minDate={
                  values.parEvaluationStartDate
                    ? dayjs(values.parEvaluationStartDate).add(1, "day").format("YYYY-MM-DD")
                    : undefined
                }
                error={touched.parEvaluationEndDate && errors.parEvaluationEndDate}
                helperText={touched.parEvaluationEndDate && (errors.parEvaluationEndDate as string)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 7 }} />

            <Grid size={{ xs: 12, sm: 3 }}>
              <Typography paddingTop={1}>Deadline for employee PAR:</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 2 }}>
              <FormDatePicker
                name="parEmployeeDeadline"
                value={values.parEmployeeDeadline}
                onChange={setFieldValue}
                onBlur={handleBlur}
                disabled={!Boolean(values.parEvaluationEndDate)}
                minDate={
                  values.parEvaluationStartDate
                    ? dayjs(values.parEvaluationStartDate).add(1, "day").format("YYYY-MM-DD")
                    : undefined
                }
                maxDate={values.parEvaluationEndDate || undefined}
                error={touched.parEmployeeDeadline && errors.parEmployeeDeadline}
                helperText={touched.parEmployeeDeadline && (errors.parEmployeeDeadline as string)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 7 }} />

            <Grid size={{ xs: 12, sm: 3 }}>
              <Typography paddingTop={1}>Deadline for 360° feedback:</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 2 }}>
              <FormDatePicker
                name="parThreeSixtyRatingDeadline"
                value={values.parThreeSixtyRatingDeadline}
                onChange={setFieldValue}
                onBlur={handleBlur}
                disabled={!Boolean(values.parEvaluationEndDate)}
                minDate={
                  values.parEvaluationStartDate
                    ? dayjs(values.parEvaluationStartDate).add(1, "day").format("YYYY-MM-DD")
                    : undefined
                }
                maxDate={values.parEvaluationEndDate || undefined}
                error={touched.parThreeSixtyRatingDeadline && errors.parThreeSixtyRatingDeadline}
                helperText={
                  touched.parThreeSixtyRatingDeadline &&
                  (errors.parThreeSixtyRatingDeadline as string)
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 7 }} />

            <Grid size={{ xs: 12, sm: 3 }}>
              <Typography paddingTop={1}>Deadline for lead's feedback:</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 2 }}>
              <FormDatePicker
                name="parLeadDeadline"
                value={values.parLeadDeadline}
                onChange={setFieldValue}
                onBlur={handleBlur}
                disabled={!Boolean(values.parEvaluationEndDate)}
                minDate={
                  values.parEvaluationStartDate
                    ? dayjs(values.parEvaluationStartDate).add(1, "day").format("YYYY-MM-DD")
                    : undefined
                }
                maxDate={values.parEvaluationEndDate || undefined}
                error={touched.parLeadDeadline && errors.parLeadDeadline}
                helperText={touched.parLeadDeadline && (errors.parLeadDeadline as string)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 7 }} />

            <Grid size={{ xs: 12, sm: 3 }}>
              <Typography paddingTop={1}>Top 5%/20% rating submission:</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 2 }}>
              <FormDatePicker
                name="parSpecialRatingDeadline"
                value={values.parSpecialRatingDeadline}
                onChange={setFieldValue}
                onBlur={handleBlur}
                disabled={!Boolean(values.parEvaluationEndDate)}
                minDate={
                  values.parEvaluationStartDate
                    ? dayjs(values.parEvaluationStartDate).add(1, "day").format("YYYY-MM-DD")
                    : undefined
                }
                maxDate={values.parEvaluationEndDate || undefined}
                error={touched.parSpecialRatingDeadline && errors.parSpecialRatingDeadline}
                helperText={
                  touched.parSpecialRatingDeadline && (errors.parSpecialRatingDeadline as string)
                }
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 7 }} />

            <Grid size={{ xs: 12, sm: 3 }}>
              <Typography paddingTop={1}>PAR F2F deadline:</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 2 }}>
              <FormDatePicker
                name="parF2FDeadline"
                value={values.parF2FDeadline}
                onChange={setFieldValue}
                onBlur={handleBlur}
                disabled={!Boolean(values.parEvaluationEndDate)}
                minDate={dayjs().add(1, "day").format("YYYY-MM-DD")}
                maxDate={values.parEvaluationEndDate || undefined}
                error={touched.parF2FDeadline && errors.parF2FDeadline}
                helperText={touched.parF2FDeadline && (errors.parF2FDeadline as string)}
              />
            </Grid>
          </LocalizationProvider>

          {/* PAR Configuration */}
          <Box width={"100%"} p={1}>
            <Grid container spacing={1}>
              <Grid size={{ xs: 12, sm: 3 }}>
                <Typography paddingTop={1}>Employee PAR question:</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  aria-label="employee par question"
                  size="small"
                  multiline
                  fullWidth
                  minRows={4}
                  name="employeeParQuestion"
                  value={values.employeeParQuestion}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.employeeParQuestion && Boolean(errors.employeeParQuestion)}
                  helperText={touched.employeeParQuestion && errors.employeeParQuestion}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 3 }} />
              <Grid size={{ xs: 12, sm: 3 }}>
                <Typography paddingTop={1}>360° feedback question:</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  aria-label="three sixty review question"
                  size="small"
                  multiline
                  fullWidth
                  minRows={4}
                  name="threeSixtyReviewQuestion"
                  value={values.threeSixtyReviewQuestion}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={
                    touched.threeSixtyReviewQuestion && Boolean(errors.threeSixtyReviewQuestion)
                  }
                  helperText={touched.threeSixtyReviewQuestion && errors.threeSixtyReviewQuestion}
                />
              </Grid>
            </Grid>
          </Box>
          <Grid size={{ sm: 12 }} display="flex" gap={1}>
            <Button variant="outlined" onClick={closeParCycleSettings}>
              Cancel
            </Button>
            <Button
              variant="contained"
              type="submit"
              disabled={isSubmitting || !hasFormValuesChanged}
            >
              Save
            </Button>
          </Grid>
        </Grid>
      </form>
      <ConfirmationDialog
        open={isConfirmationDialogOpen}
        onClose={closeConfirmationDialog}
        title={uiMessages.dialog.updateParCycleSettings.title}
        message={uiMessages.dialog.updateParCycleSettings.message}
        okText={uiMessages.dialog.updateParCycleSettings.okText}
        onConfirm={handleConfirmationProceed}
        ariaLabelledby="alert-par-update-settings-dialog-title"
        ariaDescribedby="alert-par-update-settings-dialog-description"
      />
    </Box>
  );
};
