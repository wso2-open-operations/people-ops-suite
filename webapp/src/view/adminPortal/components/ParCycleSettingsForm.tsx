// Copyright (c) 2024, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Typography,
  TextField,
  Divider,
  Grid,
  Breadcrumbs,
  Link,
} from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { useFormik } from "formik";
import * as yup from "yup";
import dayjs from "dayjs";
import { useAppDispatch, useAppSelector } from "@slices/store";
import {
  fetchOpenParCycle,
  selectCurrentCycle,
  updateParCycle,
} from "@slices/parCycleSlice";
import { snackMessages, uiMessages } from "@config/constant";
import { showSnackBarMessage } from "@slices/commonSlice/common";
import { ConfirmationDialog } from "@components/common/ConfirmationDialog";

interface FormProps {
  closeParCycleSettings: () => void;
}

export const ParCycleSettingsForm = ({ closeParCycleSettings }: FormProps) => {
  const dispatch = useAppDispatch();
  const currentCycle = useAppSelector(selectCurrentCycle);

  const [isConfirmationDialogOpen, setIsConfirmationDialogOpen] =
    useState(false);
  const openConfirmationDialog = () => setIsConfirmationDialogOpen(true);
  const closeConfirmationDialog = () => {
    setIsConfirmationDialogOpen(false);
    setSubmitting(false);
  };
  const [hasFormValuesChanged, setHasFormValuesChanged] = useState(false);

  const validationSchema = yup.object().shape({
    parCycleStartDate: yup
      .date()
      .typeError("Invalid date")
      .required("Required"),

    parCycleEndDate: yup
      .date()
      .typeError("Invalid Date")
      .min(
        yup.ref("parCycleStartDate"),
        "Must be later than the cycle start date"
      )
      .required("Required"),

    parEvaluationEndDate: yup
      .date()
      .typeError("Invalid date")
      .min(
        yup.ref("parEvaluationStartDate"),
        "Must be later than PAR creation date"
      )
      .required("Required"),

    parEmployeeDeadline: yup
      .date()
      .typeError("Invalid date")
      .min(
        yup.ref("parEvaluationStartDate"),
        "Must be later than PAR creation date"
      )
      .max(
        yup.ref("parEvaluationEndDate"),
        "Must be earlier than the PAR cycle closing date"
      )
      .required("Required"),

    parThreeSixtyRatingDeadline: yup
      .date()
      .typeError("Invalid date")
      .min(
        yup.ref("parEvaluationStartDate"),
        "Must be later than PAR creation date"
      )
      .max(
        yup.ref("parEvaluationEndDate"),
        "Must be earlier than the PAR cycle closing date"
      )
      .required("Required"),

    parLeadDeadline: yup
      .date()
      .typeError("Invalid date")
      .min(
        yup.ref("parEmployeeDeadline"),
        "Must be later than employee PAR deadline"
      )
      .max(
        yup.ref("parEvaluationEndDate"),
        "Must be earlier than the PAR cycle closing date"
      )
      .test(
        "isAfterEmployeeDeadline",
        "Must be later than employee PAR deadline",
        (value, context) => {
          const employeeDeadline = context.parent.parEmployeeDeadline;
          if (value !== undefined && value !== null) {
            return value > employeeDeadline;
          }
          return false;
        }
      )
      .required("Required"),

    parSpecialRatingDeadline: yup
      .date()
      .typeError("Invalid date")
      .min(
        yup.ref("parEvaluationStartDate"),
        "Must be later than PAR creation date"
      )
      .max(
        yup.ref("parEvaluationEndDate"),
        "Must be earlier than the PAR cycle closing date"
      )
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
      parEvaluationStartDate:
        dayjs(currentCycle.parEvaluationStartDate, "YYYY-MM-DD") || "",
      parEvaluationEndDate: currentCycle.parEvaluationEndDate || "",
      parEmployeeDeadline: currentCycle.parEmployeeDeadline || "",
      parThreeSixtyRatingDeadline:
        currentCycle.parThreeSixtyRatingDeadline || "",
      parLeadDeadline: currentCycle.parLeadDeadline || "",
      parSpecialRatingDeadline: currentCycle.parSpecialRatingDeadline || "",
      parF2FDeadline: currentCycle.parF2FDeadline || "",
      employeeParQuestion:
        currentCycle.parCycleConfigurations?.employeeParQuestion || "",
      threeSixtyReviewQuestion:
        currentCycle.parCycleConfigurations?.threeSixtyReviewQuestion || "",
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
      parThreeSixtyRatingDeadline: dayjs(parThreeSixtyRatingDeadline).format(
        "YYYY-MM-DD"
      ),
      parLeadDeadline: dayjs(parLeadDeadline).format("YYYY-MM-DD"),
      parSpecialRatingDeadline: dayjs(parSpecialRatingDeadline).format(
        "YYYY-MM-DD"
      ),
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
        })
      );
      if (updateParCycle.fulfilled.match(resultAction)) {
        closeConfirmationDialog();
        dispatch(fetchOpenParCycle());
        closeParCycleSettings();
      }
    } else {
      dispatch(
        showSnackBarMessage(snackMessages.error.parCycleUpdate, "error")
      );
    }
    setSubmitting(false);
  };

  useEffect(() => {
    const hasChanged =
      values.parCycleStartDate !==
        dayjs(currentCycle.parCycleStartDate).format("YYYY-MM-DD") ||
      values.parCycleEndDate !==
        dayjs(currentCycle.parCycleEndDate).format("YYYY-MM-DD") ||
      values.parEvaluationEndDate !==
        dayjs(currentCycle.parEvaluationEndDate).format("YYYY-MM-DD") ||
      values.parEmployeeDeadline !==
        dayjs(currentCycle.parEmployeeDeadline).format("YYYY-MM-DD") ||
      values.parThreeSixtyRatingDeadline !==
        dayjs(currentCycle.parThreeSixtyRatingDeadline).format("YYYY-MM-DD") ||
      values.parLeadDeadline !==
        dayjs(currentCycle.parLeadDeadline).format("YYYY-MM-DD") ||
      values.parSpecialRatingDeadline !==
        dayjs(currentCycle.parSpecialRatingDeadline).format("YYYY-MM-DD") ||
      values.employeeParQuestion !==
        currentCycle.parCycleConfigurations?.employeeParQuestion ||
      values.threeSixtyReviewQuestion !==
        currentCycle.parCycleConfigurations?.threeSixtyReviewQuestion;

    setHasFormValuesChanged(hasChanged);
  }, [values, currentCycle]);

  return (
    <Box alignItems="center" overflow={"auto"} height={"100%"}>
      <Breadcrumbs aria-label="breadcrumb" sx={{ paddingBottom: 2 }}>
        <Link underline="hover" color="inherit" onClick={closeParCycleSettings}>
          Home
        </Link>
        <Typography color="text.primary">PAR Cycle Settings</Typography>
      </Breadcrumbs>
      <Grid item xs={12} sm={12} paddingBottom={1}>
        <Typography variant="h4" gutterBottom>
          PAR Cycle Settings
        </Typography>
        <Divider/>
      </Grid>
      <form onSubmit={handleSubmit}>
        <Grid
          container
          spacing={1}
          sx={{ height: "100%"}}
        >
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Grid item xs={12} sm={3}>
              <Typography paddingTop={1}>PAR cycle starts from:</Typography>
            </Grid>
            <Grid item sm={2}>
              <DatePicker
                value={values.parCycleStartDate}
                onChange={(newValue: any) => {
                  setFieldValue(
                    "parCycleStartDate",
                    dayjs(newValue?.toString()).format("YYYY-MM-DD")
                  );
                }}
                renderInput={(params) => (
                  <TextField
                    aria-label="par cycle start date"
                    size="small"
                    fullWidth
                    {...params}
                    name="parCycleStartDate"
                    onBlur={handleBlur}
                    error={
                      touched.parCycleStartDate &&
                      Boolean(errors.parCycleStartDate)
                    }
                    helperText={
                      touched.parCycleStartDate && errors.parCycleStartDate
                    }
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={1}>
              <Typography paddingTop={1} textAlign={"end"}>
                to:
              </Typography>
            </Grid>
            <Grid item xs={12} sm={2}>
              <DatePicker
                disabled={!Boolean(values.parCycleStartDate)}
                value={values.parCycleEndDate}
                onChange={(newValue: any) => {
                  setFieldValue(
                    "parCycleEndDate",
                    dayjs(newValue?.toString()).format("YYYY-MM-DD")
                  );
                }}
                minDate={dayjs(values.parCycleStartDate).toDate()}
                renderInput={(params) => (
                  <TextField
                    aria-label="par cycle end date"
                    name="parCycleEndDate"
                    size="small"
                    fullWidth
                    {...params}
                    onBlur={handleBlur}
                    error={
                      touched.parCycleEndDate &&
                      Boolean(errors.parCycleEndDate)
                    }
                    helperText={
                      touched.parCycleEndDate && errors.parCycleEndDate
                    }
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={4} />

            <Grid item xs={12} sm={3}>
              <Typography paddingTop={1}>PAR creation date:</Typography>
            </Grid>
            <Grid item xs={12} sm={2}>
              <DatePicker
                disabled
                value={values.parEvaluationStartDate}
                onChange={() => {}}
                renderInput={(params) => (
                  <TextField
                    disabled
                    aria-label="par creation date"
                    size="small"
                    fullWidth
                    {...params}
                    name="parEvaluationStartDate"
                    error={
                      touched.parEvaluationStartDate &&
                      Boolean(errors.parEvaluationStartDate)
                    }
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={7} />

            <Grid item xs={12} sm={3}>
              <Typography paddingTop={1}>
                PAR evaluation closing date:
              </Typography>
            </Grid>
            <Grid item xs={12} sm={2}>
              <DatePicker
                disabled={!Boolean(values.parCycleStartDate)}
                value={values.parEvaluationEndDate}
                onChange={(newValue) => {
                  setFieldValue("parEvaluationEndDate", newValue);
                }}
                minDate={dayjs(values.parEvaluationStartDate)
                  .add(1, "day")
                  .toDate()}
                renderInput={(params) => (
                  <TextField
                    aria-label="par evaluation closing date"
                    size="small"
                    fullWidth
                    {...params}
                    name="parEvaluationEndDate"
                    onBlur={handleBlur}
                    error={
                      touched.parEvaluationEndDate &&
                      Boolean(errors.parEvaluationEndDate)
                    }
                    helperText={
                      touched.parEvaluationEndDate &&
                      errors.parEvaluationEndDate
                    }
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={7} />

            <Grid item xs={12} sm={3}>
              <Typography paddingTop={1}>
                Deadline for employee PAR:
              </Typography>
            </Grid>
            <Grid item xs={12} sm={2}>
              <DatePicker
                disabled={!Boolean(values.parEvaluationEndDate)}
                value={values.parEmployeeDeadline}
                onChange={(newValue) => {
                  setFieldValue(
                    "parEmployeeDeadline",
                    dayjs(newValue?.toString()).format("YYYY-MM-DD")
                  );
                }}
                minDate={dayjs(values.parEvaluationStartDate)
                  .add(1, "day")
                  .toDate()}
                maxDate={dayjs(values.parEvaluationEndDate).toDate()}
                renderInput={(params) => (
                  <TextField
                    aria-label="deadline for employee PAR"
                    size="small"
                    fullWidth
                    {...params}
                    name="parEmployeeDeadline"
                    onBlur={handleBlur}
                    error={
                      touched.parEmployeeDeadline &&
                      Boolean(errors.parEmployeeDeadline)
                    }
                    helperText={
                      touched.parEmployeeDeadline &&
                      errors.parEmployeeDeadline
                    }
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={7} />

            <Grid item xs={12} sm={3}>
              <Typography paddingTop={1}>
                Deadline for 360° feedback:
              </Typography>
            </Grid>
            <Grid item xs={12} sm={2}>
              <DatePicker
                disabled={!Boolean(values.parEvaluationEndDate)}
                value={values.parThreeSixtyRatingDeadline}
                onChange={(newValue) => {
                  setFieldValue(
                    "parThreeSixtyRatingDeadline",
                    dayjs(newValue?.toString()).format("YYYY-MM-DD")
                  );
                }}
                minDate={dayjs(values.parEvaluationStartDate)
                  .add(1, "day")
                  .toDate()}
                maxDate={dayjs(values.parEvaluationEndDate).toDate()}
                renderInput={(params) => (
                  <TextField
                    aria-label="deadline for 360° feedback"
                    size="small"
                    fullWidth
                    {...params}
                    name="parThreeSixtyRatingDeadline"
                    onBlur={handleBlur}
                    error={
                      touched.parThreeSixtyRatingDeadline &&
                      Boolean(errors.parThreeSixtyRatingDeadline)
                    }
                    helperText={
                      touched.parThreeSixtyRatingDeadline &&
                      errors.parThreeSixtyRatingDeadline
                    }
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={7} />

            <Grid item xs={12} sm={3}>
              <Typography paddingTop={1}>
                Deadline for lead's feedback:
              </Typography>
            </Grid>
            <Grid item xs={12} sm={2}>
              <DatePicker
                disabled={!Boolean(values.parEvaluationEndDate)}
                value={values.parLeadDeadline}
                onChange={(newValue) => {
                  setFieldValue(
                    "parLeadDeadline",
                    dayjs(newValue?.toString()).format("YYYY-MM-DD")
                  );
                }}
                minDate={dayjs(values.parEvaluationStartDate)
                  .add(1, "day")
                  .toDate()}
                maxDate={dayjs(values.parEvaluationEndDate).toDate()}
                renderInput={(params) => (
                  <TextField
                    aria-label="deadline for lead's feedback"
                    size="small"
                    fullWidth
                    {...params}
                    name="parLeadDeadline"
                    onBlur={handleBlur}
                    error={
                      touched.parLeadDeadline &&
                      Boolean(errors.parLeadDeadline)
                    }
                    helperText={
                      touched.parLeadDeadline && errors.parLeadDeadline
                    }
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={7} />

            <Grid item xs={12} sm={3}>
              <Typography paddingTop={1}>
                Top 5%/20% rating submission:
              </Typography>
            </Grid>
            <Grid item xs={12} sm={2}>
              <DatePicker
                disabled={!Boolean(values.parEvaluationEndDate)}
                value={values.parSpecialRatingDeadline}
                onChange={(newValue) => {
                  setFieldValue(
                    "parSpecialRatingDeadline",
                    dayjs(newValue?.toString()).format("YYYY-MM-DD")
                  );
                }}
                minDate={dayjs(values.parEvaluationStartDate)
                  .add(1, "day")
                  .toDate()}
                maxDate={dayjs(values.parEvaluationEndDate).toDate()}
                renderInput={(params) => (
                  <TextField
                    aria-label="top 5%/20% rating submission"
                    size="small"
                    fullWidth
                    {...params}
                    name="parSpecialRatingDeadline"
                    onBlur={handleBlur}
                    error={
                      touched.parSpecialRatingDeadline &&
                      Boolean(errors.parSpecialRatingDeadline)
                    }
                    helperText={
                      touched.parSpecialRatingDeadline &&
                      errors.parSpecialRatingDeadline
                    }
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={7} />

            <Grid item xs={12} sm={3}>
              <Typography paddingTop={1}>
                PAR F2F deadline:
              </Typography>
            </Grid>
            <Grid item xs={12} sm={2}>
              <DatePicker
                disabled={!Boolean(values.parEvaluationEndDate)}
                value={values.parF2FDeadline}
                onChange={(newValue) => {
                  setFieldValue(
                    "parF2FDeadline",
                    dayjs(newValue?.toString()).format("YYYY-MM-DD")
                  );
                }}
                minDate={dayjs().add(1, "day").toDate()}
                maxDate={dayjs(values.parEvaluationEndDate).toDate()}
                renderInput={(params) => (
                  <TextField
                    aria-label="PAR F2F Deadline"
                    size="small"
                    fullWidth
                    {...params}
                    name="parF2FDeadline"
                    onBlur={handleBlur}
                    error={
                      touched.parF2FDeadline &&
                      Boolean(errors.parF2FDeadline)
                    }
                    helperText={
                      touched.parF2FDeadline &&
                      errors.parF2FDeadline
                    }
                  />
                )}
              />
            </Grid>
          </LocalizationProvider>

          {/* PAR Configuration */}
          <Box width={"100%"} p={1}>
            <Grid container spacing={1}>
              <Grid item xs={12} sm={3}>
                <Typography paddingTop={1}>
                  Employee PAR question:
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
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
                  error={
                    touched.employeeParQuestion &&
                    Boolean(errors.employeeParQuestion)
                  }
                  helperText={
                    touched.employeeParQuestion &&
                    errors.employeeParQuestion
                  }
                />
              </Grid>
              <Grid item xs={12} sm={3} />
              <Grid item xs={12} sm={3}>
                <Typography paddingTop={1}>
                  360° feedback question:
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
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
                    touched.threeSixtyReviewQuestion &&
                    Boolean(errors.threeSixtyReviewQuestion)
                  }
                  helperText={
                    touched.threeSixtyReviewQuestion &&
                    errors.threeSixtyReviewQuestion
                  }
                />
              </Grid>
            </Grid>
          </Box>
          <Grid item sm={12} display="flex" gap={1}>
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
