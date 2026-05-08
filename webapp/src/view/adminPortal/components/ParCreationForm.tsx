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

import { useState } from "react";

import dayjs from "dayjs";
import { useFormik } from "formik";
import * as yup from "yup";

import {
  Autocomplete,
  Box,
  Button,
  Chip,
  Divider,
  Grid,
  TextField,
  Typography,
} from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

import { uiMessages } from "@config/constant";

import { selectGlobalConfig } from "@slices/metaSlice/meta";
import { createParCycle } from "@slices/parCycleSlice/parCycle";
import { useAppDispatch, useAppSelector } from "@slices/store";

import { ConfirmationDialog } from "@component/common/ConfirmationDialog";
import FormDatePicker from "./FormDatePicker";

interface FormProps {
  handleFormClose: () => void;
}

interface FormRowProps {
  label: string;
  children: React.ReactNode;
  halfWidth?: boolean;
}

const FormRow = ({ label, children, halfWidth = false }: FormRowProps) => (
  <Grid size={{ xs: 12, lg: halfWidth ? 6 : 12 }}>
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", lg: "row" },
        alignItems: "flex-start",
      }}
    >
      <Typography
        variant="body2"
        sx={{
          width: { xs: "100%", lg: "240px" },
          flexShrink: 0,
          mb: { xs: 1, md: 0 },
          mt: { md: 1 },
          fontWeight: 500,
          color: (theme) => theme.palette.customText?.primary?.p2?.active || "text.secondary",
        }}
      >
        {label}
      </Typography>
      <Box sx={{ flexGrow: 1, width: "100%" }}>{children}</Box>
    </Box>
  </Grid>
);

// validationSchema moved outside the component for performance
const validationSchema = yup.object().shape({
  parCycleName: yup.string().trim().required("Required"),
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
    .max(yup.ref("parEvaluationEndDate"), "Must be earlier than the PAR evaluation closing date")
    .required("Required"),
  parThreeSixtyRatingDeadline: yup
    .date()
    .typeError("Invalid date")
    .min(yup.ref("parEvaluationStartDate"), "Must be later than PAR creation date")
    .max(yup.ref("parEvaluationEndDate"), "Must be earlier than the PAR evaluation closing date")
    .required("Required"),
  parLeadDeadline: yup
    .date()
    .typeError("Invalid date")
    .min(yup.ref("parEmployeeDeadline"), "Must be later than employee PAR deadline date")
    .max(yup.ref("parEvaluationEndDate"), "Must be earlier than the PAR evaluation closing date")
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
    .max(yup.ref("parEvaluationEndDate"), "Must be earlier than the PAR evaluation closing date")
    .required("Required"),
  employeeParQuestion: yup.string().trim().required("Required"),
  threeSixtyReviewQuestion: yup.string().trim().required("Required"),
  parRatings: yup
    .array()
    .of(yup.string())
    .min(1, "At least one rating is required")
    .required("At least one rating is required"),
  threeSixtyReviewRatings: yup
    .array()
    .of(yup.string())
    .min(1, "At least one rating is required")
    .required("At least one rating is required"),
});

export const ParCreationForm = ({ handleFormClose }: FormProps) => {
  const dispatch = useAppDispatch();
  const globalConfig = useAppSelector(selectGlobalConfig);

  const [isConfirmationDialogOpen, setIsConfirmationDialogOpen] = useState(false);
  const openConfirmationDialog = () => setIsConfirmationDialogOpen(true);
  const closeConfirmationDialog = () => {
    setIsConfirmationDialogOpen(false);
    setSubmitting(false);
  };

  const {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    handleSubmit,
    isSubmitting,
    setSubmitting,
    setFieldValue,
  } = useFormik({
    initialValues: {
      parCycleName: "",
      parCycleStartDate: "",
      parCycleEndDate: "",
      parEvaluationStartDate: dayjs(),
      parEvaluationEndDate: "",
      parEmployeeDeadline: "",
      parThreeSixtyRatingDeadline: "",
      parLeadDeadline: "",
      parSpecialRatingDeadline: "",
      parF2FDeadline: "",
      employeeParQuestion: globalConfig.employeeParQuestion,
      threeSixtyReviewQuestion: globalConfig.threeSixtyReviewQuestion,
      parRatings: globalConfig.parRatings,
      threeSixtyReviewRatings: globalConfig.threeSixtyReviewRatings,
    },
    validationSchema,
    onSubmit: () => {
      openConfirmationDialog();
    },
  });

  const handleConfirmationProceed = async () => {
    setSubmitting(true);
    closeConfirmationDialog();

    const {
      parCycleName,
      parCycleStartDate,
      parCycleEndDate,
      parEvaluationStartDate,
      parEvaluationEndDate,
      parEmployeeDeadline,
      parThreeSixtyRatingDeadline,
      parLeadDeadline,
      parSpecialRatingDeadline,
      parF2FDeadline,
      employeeParQuestion,
      threeSixtyReviewQuestion,
      parRatings,
      threeSixtyReviewRatings,
    } = values;

    const formattedValues = {
      parCycleName,
      parCycleStartDate: dayjs(parCycleStartDate).format("YYYY-MM-DD"),
      parCycleEndDate: dayjs(parCycleEndDate).format("YYYY-MM-DD"),
      parEvaluationStartDate: dayjs(parEvaluationStartDate).format("YYYY-MM-DD"),
      parEvaluationEndDate: dayjs(parEvaluationEndDate).format("YYYY-MM-DD"),
      parEmployeeDeadline: dayjs(parEmployeeDeadline).format("YYYY-MM-DD"),
      parThreeSixtyRatingDeadline: dayjs(parThreeSixtyRatingDeadline).format("YYYY-MM-DD"),
      parLeadDeadline: dayjs(parLeadDeadline).format("YYYY-MM-DD"),
      parSpecialRatingDeadline: dayjs(parSpecialRatingDeadline).format("YYYY-MM-DD"),
      parF2FDeadline: dayjs(parF2FDeadline).format("YYYY-MM-DD"),
      parCycleConfigurations: {
        employeeParQuestion: employeeParQuestion.trim(),
        threeSixtyReviewQuestion: threeSixtyReviewQuestion.trim(),
        parRatings,
        threeSixtyReviewRatings,
      },
    };

    const resultAction = await dispatch(createParCycle(formattedValues));
    if (createParCycle.fulfilled.match(resultAction)) {
      handleFormClose();
    }

    setSubmitting(false);
  };

  return (
    <Box sx={{ overflow: "hidden", display: "flex", flexDirection: "column", height: "100%" }}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" pt={1} pb={1}>
          Create PAR Cycle
        </Typography>
        <Divider />
      </Box>

      <Box component="form" onSubmit={handleSubmit} sx={{ flexGrow: 1, overflow: "auto", pr: 1 }}>
        <Grid container spacing={1}>
          <FormRow label="Name:">
            <TextField
              aria-label="par cycle name"
              size="small"
              fullWidth
              name="parCycleName"
              value={values.parCycleName}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.parCycleName && Boolean(errors.parCycleName)}
              helperText={touched.parCycleName && errors.parCycleName}
            />
          </FormRow>

          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <FormRow label="PAR cycle start date:" halfWidth>
              <FormDatePicker
                name="parCycleStartDate"
                value={values.parCycleStartDate}
                onChange={setFieldValue}
                onBlur={handleBlur}
                error={touched.parCycleStartDate && errors.parCycleStartDate}
                helperText={touched.parCycleStartDate && errors.parCycleStartDate}
              />
            </FormRow>

            <FormRow label="PAR cycle end date:" halfWidth>
              <FormDatePicker
                name="parCycleEndDate"
                value={values.parCycleEndDate}
                onChange={setFieldValue}
                onBlur={handleBlur}
                minDate={values.parCycleStartDate}
                disabled={!Boolean(values.parCycleStartDate)}
                error={touched.parCycleEndDate && errors.parCycleEndDate}
                helperText={touched.parCycleEndDate && errors.parCycleEndDate}
              />
            </FormRow>

            <FormRow label="PAR creation date:" halfWidth>
              <DatePicker
                disabled
                value={dayjs(values.parEvaluationStartDate)}
                onChange={() => { }}
                slotProps={{ textField: { size: "small", fullWidth: true, disabled: true } }}
              />
            </FormRow>

            <FormRow label="PAR evaluation closing date:" halfWidth>
              <FormDatePicker
                name="parEvaluationEndDate"
                value={values.parEvaluationEndDate}
                onChange={setFieldValue}
                onBlur={handleBlur}
                minDate={dayjs().add(1, "day")}
                disabled={!Boolean(values.parCycleStartDate)}
                error={touched.parEvaluationEndDate && errors.parEvaluationEndDate}
                helperText={touched.parEvaluationEndDate && errors.parEvaluationEndDate}
              />
            </FormRow>

            <FormRow label="Deadline for employee PAR:" halfWidth>
              <FormDatePicker
                name="parEmployeeDeadline"
                value={values.parEmployeeDeadline}
                onChange={setFieldValue}
                onBlur={handleBlur}
                minDate={dayjs().add(1, "day")}
                maxDate={values.parEvaluationEndDate}
                disabled={!Boolean(values.parEvaluationEndDate)}
                error={touched.parEmployeeDeadline && errors.parEmployeeDeadline}
                helperText={touched.parEmployeeDeadline && errors.parEmployeeDeadline}
              />
            </FormRow>

            <FormRow label="Deadline for 360° feedback:" halfWidth>
              <FormDatePicker
                name="parThreeSixtyRatingDeadline"
                value={values.parThreeSixtyRatingDeadline}
                onChange={setFieldValue}
                onBlur={handleBlur}
                minDate={dayjs().add(1, "day")}
                maxDate={values.parEvaluationEndDate}
                disabled={!Boolean(values.parEvaluationEndDate)}
                error={touched.parThreeSixtyRatingDeadline && errors.parThreeSixtyRatingDeadline}
                helperText={
                  touched.parThreeSixtyRatingDeadline && errors.parThreeSixtyRatingDeadline
                }
              />
            </FormRow>

            <FormRow label="Deadline for lead's feedback:" halfWidth>
              <FormDatePicker
                name="parLeadDeadline"
                value={values.parLeadDeadline}
                onChange={setFieldValue}
                onBlur={handleBlur}
                minDate={dayjs().add(1, "day")}
                maxDate={values.parEvaluationEndDate}
                disabled={!Boolean(values.parEvaluationEndDate)}
                error={touched.parLeadDeadline && errors.parLeadDeadline}
                helperText={touched.parLeadDeadline && errors.parLeadDeadline}
              />
            </FormRow>
            <FormRow label="Top 5%/20% rating submission:" halfWidth>
              <FormDatePicker
                name="parSpecialRatingDeadline"
                value={values.parSpecialRatingDeadline}
                onChange={setFieldValue}
                onBlur={handleBlur}
                minDate={dayjs().add(1, "day")}
                maxDate={values.parEvaluationEndDate}
                disabled={!Boolean(values.parEvaluationEndDate)}
                error={touched.parSpecialRatingDeadline && errors.parSpecialRatingDeadline}
                helperText={touched.parSpecialRatingDeadline && errors.parSpecialRatingDeadline}
              />
            </FormRow>

            <FormRow label="PAR F2F deadline:" halfWidth>
              <FormDatePicker
                name="parF2FDeadline"
                value={values.parF2FDeadline}
                onChange={setFieldValue}
                onBlur={handleBlur}
                minDate={dayjs().add(1, "day")}
                maxDate={values.parEvaluationEndDate}
                disabled={!Boolean(values.parEvaluationEndDate)}
                error={touched.parF2FDeadline && errors.parF2FDeadline}
                helperText={touched.parF2FDeadline && errors.parF2FDeadline}
              />
            </FormRow>
          </LocalizationProvider>

          {/* PAR Configurations */}
          <FormRow label="Employee PAR question:">
            <TextField
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
          </FormRow>

          <FormRow label="360° feedback question:">
            <TextField
              size="small"
              multiline
              fullWidth
              minRows={4}
              name="threeSixtyReviewQuestion"
              value={values.threeSixtyReviewQuestion}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.threeSixtyReviewQuestion && Boolean(errors.threeSixtyReviewQuestion)}
              helperText={touched.threeSixtyReviewQuestion && errors.threeSixtyReviewQuestion}
            />
          </FormRow>

          <FormRow label="PAR ratings:">
            <Autocomplete
              multiple
              options={[]}
              value={values.parRatings}
              freeSolo
              onChange={(event, newValue) => setFieldValue("parRatings", newValue)}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip variant="outlined" label={option} {...getTagProps({ index })} />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  variant="outlined"
                  size="small"
                  onBlur={handleBlur}
                  error={touched.parRatings && Boolean(errors.parRatings)}
                  helperText={touched.parRatings && errors.parRatings}
                />
              )}
            />
          </FormRow>

          <FormRow label="360° feedback ratings:">
            <Autocomplete
              multiple
              options={[]}
              value={values.threeSixtyReviewRatings}
              freeSolo
              onChange={(event, newValue) => setFieldValue("threeSixtyReviewRatings", newValue)}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip variant="outlined" label={option} {...getTagProps({ index })} />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  variant="outlined"
                  size="small"
                  onBlur={handleBlur}
                  error={touched.threeSixtyReviewRatings && Boolean(errors.threeSixtyReviewRatings)}
                  helperText={touched.threeSixtyReviewRatings && errors.threeSixtyReviewRatings}
                />
              )}
            />
          </FormRow>

          {/* Buttons */}
          <Grid size={{ xs: 12 }} display="flex" justifyContent="flex-end" gap={2} pt={3} pb={4}>
            <Button variant="outlined" onClick={handleFormClose}>
              Cancel
            </Button>
            <Button variant="contained" type="submit" disabled={isSubmitting}>
              Start Cycle
            </Button>
          </Grid>
        </Grid>
      </Box>

      <ConfirmationDialog
        open={isConfirmationDialogOpen}
        onClose={closeConfirmationDialog}
        title={uiMessages.dialog.createParCycle.title}
        message={uiMessages.dialog.createParCycle.message}
        okText={uiMessages.dialog.createParCycle.okText}
        onConfirm={handleConfirmationProceed}
        ariaLabelledby="alert-par-creation-dialog-title"
        ariaDescribedby="alert-par-creation-dialog-description"
      />
    </Box>
  );
};
