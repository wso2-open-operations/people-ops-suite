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
import InfoIcon from "@mui/icons-material/Info";
import LoadingButton from "@mui/lab/LoadingButton";
import {
  Box,
  Button,
  FormControl,
  Grid,
  IconButton,
  MenuItem,
  Select,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { useFormik } from "formik";
import { isEqual } from "lodash";
import * as yup from "yup";

import { useEffect } from "react";

import { SnackMessage, tooltipVisibilityDelay, uiMessages } from "@config/constant";
import {
  ParEmployeeStatus,
  ParF2fStatus,
  ParLeadStatus,
} from "@root/src/slices/employeeHistorySlice/employeeHistory";
import { ParCycle } from "@root/src/slices/parCycleSlice/parCycle";
import { ShowSnackBarMessage } from "@slices/commonSlice/common";
import {
  fetchParRatingOfEmployee,
  selectEmployeeRatings,
  updateParRatingOfEmployee,
} from "@slices/employeeSlice/employee";
import { useAppDispatch, useAppSelector } from "@slices/store";

interface UpdateStatusPanelProps {
  parCycle: Partial<ParCycle>;
}

export const UpdateStatusPanel = ({ parCycle }: UpdateStatusPanelProps) => {
  const dispatch = useAppDispatch();
  const employeeRating = useAppSelector(selectEmployeeRatings);

  const validationSchema = yup.object().shape({
    parEmployeeStatus: yup.string().required("Required"),
    parLeadStatus: yup.string().required("Required"),
    parF2fStatus: yup.string().required("Required"),
    parF2fDate: yup.date().required("Required"),
  });

  const {
    values,
    errors,
    setFieldValue,
    handleBlur,
    handleSubmit,
    handleChange,
    touched,
    isSubmitting,
  } = useFormik({
    initialValues: {
      parEmployeeStatus: employeeRating.parEmployeeStatus,
      parLeadStatus: employeeRating.parLeadStatus,
      parF2fStatus: employeeRating.parF2fStatus,
      parF2fDate:
        dayjs(employeeRating.parF2fDate).format("YYYY-MM-DD") || dayjs().format("YYYY-MM-DD"),
    },
    validationSchema,
    onSubmit: async (values) => {
      const utcDate = dayjs(values.parF2fDate).utc().format("YYYY-MM-DD");
      const formValues: {
        parEmployeeStatus: ParEmployeeStatus;
        parLeadStatus: ParLeadStatus;
        parF2fStatus: ParF2fStatus;
        parF2fDate?: string;
      } = {
        parEmployeeStatus: values.parEmployeeStatus as ParEmployeeStatus,
        parLeadStatus: values.parLeadStatus as ParLeadStatus,
        parF2fStatus: values.parF2fStatus as ParF2fStatus,
      };

      if (values.parF2fStatus === ParF2fStatus.COMPLETED) {
        formValues.parF2fDate = utcDate;
      }

      const resultAction = await dispatch(
        updateParRatingOfEmployee({
          employeeId: employeeRating.parEmployeeEmail,
          parCycleId: parCycle.parCycleId,
          parRatingId: employeeRating.parRatingId,
          values: formValues,
        }),
      );

      if (updateParRatingOfEmployee.fulfilled.match(resultAction)) {
        const updatedRatingResultAction = await dispatch(
          fetchParRatingOfEmployee({
            employeeId: employeeRating.parEmployeeEmail,
            parCycleId: parCycle.parCycleId!,
          }),
        );
        if (fetchParRatingOfEmployee.fulfilled.match(updatedRatingResultAction)) {
          setFieldValue(
            "parF2fDate",
            dayjs(updatedRatingResultAction.payload.parF2fDate).format("YYYY-MM-DD"),
          );
          setFieldValue("parEmployeeStatus", updatedRatingResultAction.payload.parEmployeeStatus);
          setFieldValue("parLeadStatus", updatedRatingResultAction.payload.parLeadStatus);
          setFieldValue("parF2fStatus", updatedRatingResultAction.payload.parF2fStatus);
        }

        dispatch(ShowSnackBarMessage(SnackMessage.success.adminParStatusUpdate, "success"));
      }
    },
  });

  const resetForm = () => {
    setFieldValue("parEmployeeStatus", employeeRating.parEmployeeStatus);
    setFieldValue("parLeadStatus", employeeRating.parLeadStatus);
    setFieldValue("parF2fStatus", employeeRating.parF2fStatus);
    setFieldValue("parF2fDate", dayjs(employeeRating.parF2fDate).format("YYYY-MM-DD"));
  };

  const hasChanges = !isEqual(
    {
      parEmployeeStatus: employeeRating.parEmployeeStatus,
      parLeadStatus: employeeRating.parLeadStatus,
      parF2fStatus: employeeRating.parF2fStatus,
      parF2fDate: dayjs(employeeRating.parF2fDate).format("YYYY-MM-DD"),
    },
    values,
  );

  useEffect(() => {
    if (values.parLeadStatus === ParLeadStatus.SHARED) {
      setFieldValue("parEmployeeStatus", ParEmployeeStatus.SHARED_BLOCKED);
    }
  }, [values.parLeadStatus, setFieldValue]);

  useEffect(() => {
    setFieldValue("parF2fDate", dayjs(employeeRating.parF2fDate).format("YYYY-MM-DD"));
    setFieldValue("parEmployeeStatus", employeeRating.parEmployeeStatus);
    setFieldValue("parLeadStatus", employeeRating.parLeadStatus);
    setFieldValue("parF2fStatus", employeeRating.parF2fStatus);
  }, [employeeRating, setFieldValue]);

  return (
    <Box>
      <form onSubmit={handleSubmit}>
        <Grid container maxWidth={"35%"}>
          <Grid size={{ xs: 5 }} display={"flex"} alignItems={"center"} my={1}>
            <Typography>
              {"Employee PAR Status: "}
              <Tooltip
                arrow
                title={uiMessages.tooltip.adminParEmployeeStatusExplanation}
                enterDelay={tooltipVisibilityDelay}
                enterNextDelay={tooltipVisibilityDelay}
              >
                <IconButton
                  aria-label="info"
                  sx={{
                    "&:hover": {
                      backgroundColor: "transparent",
                    },
                  }}
                >
                  <InfoIcon sx={{ fontSize: "1.3rem", color: "primary.main" }} />
                </IconButton>
              </Tooltip>
            </Typography>
          </Grid>
          <Grid size={{ xs: 7 }} display={"flex"} alignItems={"center"} my={1}>
            <FormControl sx={{ minWidth: "16.2rem" }}>
              <Select
                disabled={
                  (values.parLeadStatus === ParLeadStatus.SHARED &&
                    employeeRating.parLeadStatus !== ParLeadStatus.SHARED) ||
                  values.parLeadStatus === ParLeadStatus.SHARED
                }
                id="parEmployeeStatus"
                value={values.parEmployeeStatus}
                onChange={handleChange}
                onBlur={handleBlur}
                name="parEmployeeStatus"
                size="small"
                error={touched.parEmployeeStatus && Boolean(errors.parEmployeeStatus)}
              >
                <MenuItem value={ParEmployeeStatus.PENDING}>Pending</MenuItem>
                <MenuItem value={ParEmployeeStatus.DRAFT}>Draft</MenuItem>
                <MenuItem value={ParEmployeeStatus.SHARED}>Shared</MenuItem>
                <MenuItem disabled value={ParEmployeeStatus.SHARED_BLOCKED}>
                  Shared-Blocked
                </MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 5 }} display={"flex"} alignItems={"center"} my={1}>
            <Typography>
              {"Lead's feedback Status: "}
              <Tooltip
                arrow
                title={uiMessages.tooltip.adminParLeadStatusExplanation}
                enterDelay={tooltipVisibilityDelay}
                enterNextDelay={tooltipVisibilityDelay}
              >
                <IconButton
                  aria-label="info"
                  sx={{
                    "&:hover": {
                      backgroundColor: "transparent",
                    },
                  }}
                >
                  <InfoIcon sx={{ fontSize: "1.3rem", color: "primary.main" }} />
                </IconButton>
              </Tooltip>
            </Typography>
          </Grid>
          <Grid size={{ xs: 7 }} display={"flex"} alignItems={"center"} my={1}>
            <FormControl sx={{ minWidth: "16.2rem" }}>
              <Select
                id="parLeadStatus"
                value={values.parLeadStatus}
                onChange={(newValue) => {
                  if (
                    values.parLeadStatus === ParLeadStatus.SHARED &&
                    newValue.target.value !== ParLeadStatus.SHARED
                  ) {
                    if (employeeRating.parEmployeeStatus === ParEmployeeStatus.SHARED_BLOCKED) {
                      setFieldValue("parEmployeeStatus", ParEmployeeStatus.DRAFT);
                    } else {
                      setFieldValue("parEmployeeStatus", employeeRating.parEmployeeStatus);
                    }
                  }
                  setFieldValue("parLeadStatus", newValue.target.value);
                }}
                onBlur={handleBlur}
                name="parLeadStatus"
                size="small"
                error={touched.parLeadStatus && Boolean(errors.parLeadStatus)}
              >
                <MenuItem value={ParLeadStatus.PENDING}>Pending</MenuItem>
                <MenuItem value={ParLeadStatus.DRAFT}>Draft</MenuItem>
                <MenuItem value={ParLeadStatus.SHARED}>Shared</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 5 }} display={"flex"} alignItems={"center"} my={1}>
            <Typography>
              {"F2F Status: "}
              <Tooltip
                arrow
                title={uiMessages.tooltip.adminParF2fStatusExplanation}
                enterDelay={tooltipVisibilityDelay}
                enterNextDelay={tooltipVisibilityDelay}
              >
                <IconButton
                  aria-label="info"
                  sx={{
                    "&:hover": {
                      backgroundColor: "transparent",
                    },
                  }}
                >
                  <InfoIcon sx={{ fontSize: "1.3rem", color: "primary.main" }} />
                </IconButton>
              </Tooltip>
            </Typography>
          </Grid>
          <Grid size={{ xs: 7 }} display={"flex"} alignItems={"center"} my={1}>
            <FormControl sx={{ minWidth: "16.2rem" }}>
              <Select
                disabled={
                  values.parLeadStatus !== ParLeadStatus.SHARED ||
                  employeeRating.parF2fStatus === ParF2fStatus.COMPLETED
                }
                id="parF2fStatus"
                value={values.parF2fStatus}
                onChange={handleChange}
                onBlur={handleBlur}
                name="parF2fStatus"
                size="small"
                error={touched.parF2fStatus && Boolean(errors.parF2fStatus)}
              >
                <MenuItem
                  disabled={employeeRating.parF2fStatus === ParF2fStatus.COMPLETED}
                  value={ParF2fStatus.PENDING}
                >
                  Pending
                </MenuItem>
                <MenuItem value={ParF2fStatus.COMPLETED}>Completed</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Grid size={{ xs: 5 }} display={"flex"} alignItems={"center"} my={1}>
              <Typography mr={13}>F2F Date:</Typography>
            </Grid>

            <Grid size={{ xs: 7 }} display={"flex"} alignItems={"center"} my={1}>
              <DatePicker
                label="PAR F2F Date"
                enableAccessibleFieldDOMStructure={false}
                disabled={
                  employeeRating.parF2fStatus === ParF2fStatus.COMPLETED ||
                  values.parF2fStatus !== ParF2fStatus.COMPLETED
                }
                // Convert string from Formik back to Dayjs for the UI
                value={values.parF2fDate ? dayjs(values.parF2fDate) : null}
                onChange={(newValue) => {
                  // Save as string in Formik
                  setFieldValue(
                    "parF2fDate",
                    newValue ? dayjs(newValue).format("YYYY-MM-DD") : null,
                  );
                }}
                // Use slots instead of renderInput
                slots={{
                  textField: TextField,
                }}
                slotProps={{
                  textField: {
                    size: "small",
                    name: "parF2fDate",
                    onBlur: handleBlur,
                    error: touched.parF2fDate && Boolean(errors.parF2fDate),
                    helperText: (touched.parF2fDate && errors.parF2fDate) as string,
                    "aria-label": "par f2f date",
                  },
                }}
                maxDate={dayjs()} // dayjs() is already the current date
                minDate={dayjs(parCycle?.parCycleStartDate)}
              />
            </Grid>
          </LocalizationProvider>
          <Grid size={{ xs: 12 }} display={"flex"} my={5}>
            <Button variant="outlined" onClick={resetForm} sx={{ mr: 2 }}>
              Cancel
            </Button>
            <LoadingButton
              disabled={!hasChanges}
              type="submit"
              loading={isSubmitting}
              variant={isSubmitting ? "outlined" : "contained"}
            >
              <span>Update</span>
            </LoadingButton>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
};
