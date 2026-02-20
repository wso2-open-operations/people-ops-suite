// Copyright (c) 2024, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import { useState } from "react";
import {
  Box,
  Button,
  Typography,
  TextField,
  Divider,
  Chip,
  Autocomplete,
  Grid,
} from "@mui/material";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { useFormik } from "formik";
import * as yup from "yup";
import dayjs from "dayjs";
import { selectGlobalConfig } from "@slices/metaSlice/meta";
import { useAppDispatch, useAppSelector } from "@slices/store";
import { createParCycle } from "@slices/parCycleSlice/parCycle";
import { uiMessages } from "@config/constant";
import { ConfirmationDialog } from "@component/common/ConfirmationDialog";
import FormDatePicker from "./FormDatePicker";

interface FormProps {
  handleFormClose: () => void;
}

// Reusable Layout Wrapper for exact spacing and responsive stacking
const FormRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <>
    {/* xs=12 makes it stack on mobile. md=4 makes it side-by-side on desktop */}
    <Grid size={{ xs:12, md:4}}>
      <Typography paddingTop={1}>{label}</Typography>
    </Grid>
    <Grid size={{ xs:12, md:6}}>
      {children}
    </Grid>
    {/* Empty column to force a line break on desktop */}
    <Grid size={{ xs:12, md:2 }} sx={{ display: { xs: "none", md: "block" } }} />
  </>
);

// validationSchema moved outside the component for performance
const validationSchema = yup.object().shape({
  parCycleName: yup.string().trim().required("Required"),
  parCycleStartDate: yup.date().typeError("Invalid date").required("Required"),
  parCycleEndDate: yup.date().typeError("Invalid Date").min(yup.ref("parCycleStartDate"), "Must be later than the cycle start date").required("Required"),
  parEvaluationEndDate: yup.date().typeError("Invalid date").min(yup.ref("parEvaluationStartDate"), "Must be later than PAR creation date").required("Required"),
  parEmployeeDeadline: yup.date().typeError("Invalid date").min(yup.ref("parEvaluationStartDate"), "Must be later than PAR creation date").max(yup.ref("parEvaluationEndDate"), "Must be earlier than the PAR evaluation closing date").required("Required"),
  parThreeSixtyRatingDeadline: yup.date().typeError("Invalid date").min(yup.ref("parEvaluationStartDate"), "Must be later than PAR creation date").max(yup.ref("parEvaluationEndDate"), "Must be earlier than the PAR evaluation closing date").required("Required"),
  parLeadDeadline: yup.date().typeError("Invalid date").min(yup.ref("parEmployeeDeadline"), "Must be later than employee PAR deadline date").max(yup.ref("parEvaluationEndDate"), "Must be earlier than the PAR evaluation closing date").required("Required"),
  parSpecialRatingDeadline: yup.date().typeError("Invalid date").min(yup.ref("parEvaluationStartDate"), "Must be later than PAR creation date").max(yup.ref("parEvaluationEndDate"), "Must be earlier than the PAR evaluation closing date").required("Required"),
  employeeParQuestion: yup.string().trim().required("Required"),
  threeSixtyReviewQuestion: yup.string().trim().required("Required"),
  parRatings: yup.array().of(yup.string()).min(1, "At least one rating is required").required("At least one rating is required"),
  threeSixtyReviewRatings: yup.array().of(yup.string()).min(1, "At least one rating is required").required("At least one rating is required"),
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

  const { values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting, setSubmitting, setFieldValue } = useFormik({
    initialValues: {
      parCycleName: "",
      parCycleStartDate: "",
      parCycleEndDate: "",
      parEvaluationStartDate: dayjs().format("YYYY-MM-DD"),
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

    const formattedValues = {
      ...values,
      parCycleConfigurations: {
        employeeParQuestion: values.employeeParQuestion.trim(),
        threeSixtyReviewQuestion: values.threeSixtyReviewQuestion.trim(),
        parRatings: values.parRatings,
        threeSixtyReviewRatings: values.threeSixtyReviewRatings,
      },
    };

    const resultAction = await dispatch(createParCycle(formattedValues));
    if (createParCycle.fulfilled.match(resultAction)) {
      handleFormClose();
    }
    setSubmitting(false);
  };

  return (
    <Box alignItems="center" maxHeight={"100%"} sx={{ overflow: "hidden" }}>
      <Box pb={1} pt={0}>
        <Typography variant="h5" sx={{ mt: 0, mb: 0.5 }}>
          Create PAR Cycle
        </Typography>
        <Divider />
      </Box>

      <form onSubmit={handleSubmit}>
        <Grid container spacing={2} sx={{ overflow: "auto", maxHeight: "calc(100vh - 15rem)", pt: 1 }}>
          
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
            <FormRow label="PAR cycle start date:">
              <FormDatePicker
                name="parCycleStartDate"
                value={values.parCycleStartDate}
                onChange={setFieldValue}
                onBlur={handleBlur}
                error={touched.parCycleStartDate && errors.parCycleStartDate}
                helperText={touched.parCycleStartDate && errors.parCycleStartDate}
              />
            </FormRow>

            <FormRow label="PAR cycle end date:">
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

            <FormRow label="PAR creation date:">
              <DatePicker
                disabled
                value={dayjs(values.parEvaluationStartDate)}
                onChange={() => {}}
                slotProps={{ textField: { size: "small", fullWidth: true, disabled: true } }}
              />
            </FormRow>

            <FormRow label="PAR evaluation closing date:">
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

            <FormRow label="Deadline for employee PAR:">
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

            <FormRow label="Deadline for 360° feedback:">
              <FormDatePicker
                name="parThreeSixtyRatingDeadline"
                value={values.parThreeSixtyRatingDeadline}
                onChange={setFieldValue}
                onBlur={handleBlur}
                minDate={dayjs().add(1, "day")}
                maxDate={values.parEvaluationEndDate}
                disabled={!Boolean(values.parEvaluationEndDate)}
                error={touched.parThreeSixtyRatingDeadline && errors.parThreeSixtyRatingDeadline}
                helperText={touched.parThreeSixtyRatingDeadline && errors.parThreeSixtyRatingDeadline}
              />
            </FormRow>

            <FormRow label="Deadline for lead's feedback:">
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

            <FormRow label="Top 5%/20% rating submission:">
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

            <FormRow label="PAR F2F deadline:">
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
                value.map((option, index) => <Chip variant="outlined" label={option} {...getTagProps({ index })} />)
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
                value.map((option, index) => <Chip variant="outlined" label={option} {...getTagProps({ index })} />)
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
          <Grid size={{ xs: 12 }} display="flex" justifyContent="flex-end" gap={2} pt={2} pb={5}>
            <Button variant="outlined" onClick={handleFormClose}>
              Cancel
            </Button>
            <Button variant="contained" type="submit" disabled={isSubmitting}>
              Start Cycle
            </Button>
          </Grid>
        </Grid>
      </form>

      <ConfirmationDialog
        open={isConfirmationDialogOpen}
        onClose={closeConfirmationDialog}
        title={uiMessages.dialog.createParCycle.title}
        message={uiMessages.dialog.createParCycle.message}
        okText={uiMessages.dialog.createParCycle.okText}
        onConfirm={handleConfirmationProceed}
      />
    </Box>
  );
};