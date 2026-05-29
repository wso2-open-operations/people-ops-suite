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

import { useEffect, useState } from "react";

import { useFormik } from "formik";
import * as yup from "yup";

import {
  Autocomplete,
  Box,
  Button,
  Chip,
  Fade,
  Grid,
  Paper,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";

import SettingsIcon from "@mui/icons-material/Settings";

import { gradients, uiMessages } from "@config/constant";
import { ParConfigurations, RequestState } from "@utils/types";

import {
  fetchConfigurations,
  selectConfigStatus,
  selectGlobalConfig,
  updateConfigurations,
} from "@slices/metaSlice/meta";
import { useAppDispatch, useAppSelector } from "@slices/store";

import { ConfirmationDialog } from "@component/common/ConfirmationDialog";
import Title from "@component/common/Title";
import { LoadingEffect } from "@component/ui/Loading";

const GlobalSettingsView = () => {
  const globalConfigStatus = useAppSelector(selectConfigStatus);
  const dispatch = useAppDispatch();
  const globalConfig = useAppSelector(selectGlobalConfig);
  const theme = useTheme();

  const [isConfirmationDialogOpen, setIsConfirmationDialogOpen] = useState(false);
  const openConfirmationDialog = () => setIsConfirmationDialogOpen(true);
  const closeConfirmationDialog = () => {
    setSubmitting(false);
    setIsConfirmationDialogOpen(false);
  };

  const [hasFormValuesChanged, setHasFormValuesChanged] = useState(false);

  const validationSchema = yup.object().shape({
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

  const {
    values,
    errors,
    touched,
    setValues,
    handleChange,
    handleBlur,
    isSubmitting,
    handleSubmit,
    setFieldValue,
    setSubmitting,
  } = useFormik({
    initialValues: {
      employeeParQuestion: "",
      threeSixtyReviewQuestion: "",
      parRatings: [] as string[],
      threeSixtyReviewRatings: [] as string[],
    },
    validationSchema,
    onSubmit: () => {
      openConfirmationDialog();
    },
  });

  const handleConfirmationProceed = async () => {
    closeConfirmationDialog();

    const { employeeParQuestion, threeSixtyReviewQuestion, parRatings, threeSixtyReviewRatings } =
      values;

    const formattedValues = {
      employeeParQuestion: employeeParQuestion.trim(),
      threeSixtyReviewQuestion: threeSixtyReviewQuestion.trim(),
      parRatings,
      threeSixtyReviewRatings,
    };

    await dispatch(updateConfigurations(formattedValues));
    setSubmitting(false);
  };

  const setFormValues = (globalConfig: ParConfigurations) => {
    setValues({
      employeeParQuestion: globalConfig.employeeParQuestion || "",
      threeSixtyReviewQuestion: globalConfig.threeSixtyReviewQuestion || "",
      parRatings: globalConfig.parRatings || [],
      threeSixtyReviewRatings: globalConfig.threeSixtyReviewRatings || [],
    });
  };

  const clearEdits = () => {
    setFormValues(globalConfig);
  };

  useEffect(() => {
    const hasChanged = Object.entries(values).some(
      ([key, value]) =>
        key in globalConfig && globalConfig[key as keyof ParConfigurations] !== value,
    );
    setHasFormValuesChanged(hasChanged);
  }, [values, globalConfig, globalConfigStatus]);

  useEffect(() => {
    const fetchGlobalConfigurations = async () => {
      await dispatch(fetchConfigurations());
    };

    fetchGlobalConfigurations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (globalConfigStatus === RequestState.SUCCEEDED) {
      setFormValues(globalConfig);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalConfigStatus, globalConfig]);

  return (
    <Fade in={true}>
      <Grid sx={{ height: "100%" }}>
        <Paper
          sx={{
            width: "100%",
            height: "100%",
            borderRadius: "0.5rem",
            padding: "10px",
            background: theme.palette.mode === "dark" ? gradients.dark : gradients.light,
            boxShadow: "none",
            border: "none",
            overflowX: "hidden",
            boxSizing: "border-box",
          }}
        >
          <Grid>
            <Title
              firstWord="PAR"
              secondWord="Settings"
              icon={<SettingsIcon fontSize="medium" />}
            />
            <Box alignItems="center">
              <Grid size={{ xs: 12, sm: 12 }} paddingY={2} mx={4}>
                <Typography variant="h4" gutterBottom>
                  Global PAR Configurations
                </Typography>
              </Grid>

              {globalConfigStatus === RequestState.LOADING && (
                <LoadingEffect message={uiMessages.loading.pageLoading} isCircularLoading={true} />
              )}

              {globalConfigStatus === RequestState.SUCCEEDED && (
                <Box mx={5}>
                  <form onSubmit={handleSubmit}>
                    <Grid container spacing={1}>
                      <Box
                        paddingY={1}
                        sx={{
                          height: "calc(100vh - 350px)",
                          overflow: "auto",
                          borderBottom: (theme) => `1px solid ${theme.palette.neutral[800]}`,
                        }}
                      >
                        <Grid container spacing={1}>
                          <Grid size={{ xs: 12, sm: 3 }}>
                            <Typography paddingTop={1}>Employee PAR question:</Typography>
                          </Grid>
                          <Grid size={{ xs: 12, sm: 8 }}>
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
                                touched.employeeParQuestion && Boolean(errors.employeeParQuestion)
                              }
                              helperText={touched.employeeParQuestion && errors.employeeParQuestion}
                            />
                          </Grid>
                          <Grid size={{ xs: 12, sm: 1 }} />

                          <Grid size={{ xs: 12, sm: 3 }}>
                            <Typography paddingTop={1}>360° feedback question:</Typography>
                          </Grid>
                          <Grid size={{ xs: 12, sm: 8 }}>
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
                                touched.threeSixtyReviewQuestion && errors.threeSixtyReviewQuestion
                              }
                            />
                          </Grid>
                          <Grid size={{ xs: 12, sm: 1 }} />

                          <Grid size={{ xs: 12, sm: 3 }}>
                            <Typography paddingTop={1}>PAR ratings:</Typography>
                          </Grid>
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <Autocomplete
                              multiple
                              id="parRatings"
                              options={[]}
                              value={values.parRatings}
                              freeSolo
                              onChange={(_event, newValue) => {
                                setFieldValue("parRatings", newValue);
                              }}
                              renderTags={(value, getTagProps) =>
                                value.map((option, index) => (
                                  <Chip
                                    variant="outlined"
                                    label={option}
                                    {...getTagProps({ index })}
                                  />
                                ))
                              }
                              renderInput={(params) => (
                                <TextField
                                  aria-label="par ratings"
                                  {...params}
                                  variant="outlined"
                                  size="small"
                                  sx={{ minWidth: 300 }}
                                  onBlur={handleBlur}
                                  error={touched.parRatings && Boolean(errors.parRatings)}
                                  helperText={touched.parRatings && errors.parRatings}
                                />
                              )}
                            />
                          </Grid>
                          <Grid size={{ xs: 12, sm: 3 }} />

                          <Grid size={{ xs: 12, sm: 3 }}>
                            <Typography paddingTop={1}>360° feedback ratings:</Typography>
                          </Grid>
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <Autocomplete
                              multiple
                              id="threeSixtyReviewRatings"
                              options={[]}
                              value={values.threeSixtyReviewRatings}
                              freeSolo
                              onChange={(_event, newValue) => {
                                setFieldValue("threeSixtyReviewRatings", newValue);
                              }}
                              renderTags={(value, getTagProps) =>
                                value.map((option, index) => (
                                  <Chip
                                    variant="outlined"
                                    label={option}
                                    {...getTagProps({ index })}
                                  />
                                ))
                              }
                              renderInput={(params) => (
                                <TextField
                                  aria-label="360° ratings"
                                  {...params}
                                  variant="outlined"
                                  size="small"
                                  sx={{ minWidth: 300 }}
                                  onBlur={handleBlur}
                                  error={
                                    touched.threeSixtyReviewRatings &&
                                    Boolean(errors.threeSixtyReviewRatings)
                                  }
                                  helperText={
                                    touched.threeSixtyReviewRatings &&
                                    errors.threeSixtyReviewRatings
                                  }
                                />
                              )}
                            />
                          </Grid>
                          <Grid size={{ xs: 12, sm: 3 }} />
                        </Grid>
                      </Box>
                      <Grid size={{ sm: 12 }} display="flex" gap={1} my={2}>
                        <Button
                          variant="outlined"
                          onClick={clearEdits}
                          disabled={!hasFormValuesChanged}
                        >
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
                </Box>
              )}
              <ConfirmationDialog
                open={isConfirmationDialogOpen}
                onClose={closeConfirmationDialog}
                title={uiMessages.dialog.updateGlobalParConfigs.title}
                message={uiMessages.dialog.updateGlobalParConfigs.message}
                okText={uiMessages.dialog.updateGlobalParConfigs.okText}
                onConfirm={handleConfirmationProceed}
                ariaLabelledby="alert-par-update-global-configs-title"
                ariaDescribedby="alert-par-update-global-configs-description"
              />
            </Box>
          </Grid>
        </Paper>
      </Grid>
    </Fade>
  );
};

export default GlobalSettingsView;
