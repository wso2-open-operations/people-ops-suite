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

import { useFormik } from "formik";
import * as yup from "yup";

import LoadingButton from "@mui/lab/LoadingButton";
import { Button, Divider, Grid, MenuItem, TextField, Typography } from "@mui/material";

import {
  sendAllEmployeeReminder,
  sendAllLeadReminder,
  sendAllSpecialRatingReminder,
  sendAllThreeSixtyReminder,
} from "@slices/reminderSlice/reminder";
import { useAppDispatch } from "@slices/store";

interface BulkReminderModalProps {
  onClose: () => void;
  isAdmin?: boolean;
  isLead?: boolean;
}

export const BulkReminderModal = ({ onClose, isAdmin, isLead }: BulkReminderModalProps) => {
  const dispatch = useAppDispatch();

  const validationSchema = yup.object().shape({
    selectedRminderType: yup.string().required("Required"),
  });

  const { values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting } =
    useFormik({
      initialValues: {
        selectedRminderType: "",
      },
      validationSchema,

      onSubmit: async (values) => {
        try {
          switch (values.selectedRminderType) {
            case "employee":
              await dispatch(sendAllEmployeeReminder());
              break;
            case "lead":
              await dispatch(sendAllLeadReminder());
              break;
            case "specialRating":
              await dispatch(sendAllSpecialRatingReminder());
              break;
            case "threeSixty":
              await dispatch(sendAllThreeSixtyReminder());
              break;
          }
          onClose();
        } catch (error) {
          console.error("Error during dispatch:", error);
        }
      },
    });

  return (
    <>
      <Typography id="dashboard-modal-title" variant="h4" pb={2}>
        Send Bulk Reminders
      </Typography>
      <Divider sx={{ bgcolor: "primary.main" }} />
      <form onSubmit={handleSubmit}>
        <Grid container spacing={1} pt={4} id="dashboard-modal-description">
          <Grid size={{ xs: 12, sm: 3 }}>
            <Typography pt={1}>Reminder type:</Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 9, md: 6 }}>
            <TextField
              select
              size="small"
              fullWidth
              name="selectedRminderType"
              label="Select Type"
              value={values.selectedRminderType}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.selectedRminderType && Boolean(errors.selectedRminderType)}
              helperText={touched.selectedRminderType && errors.selectedRminderType}
              variant="outlined"
            >
              <MenuItem sx={{ display: isLead ? "none" : "block" }} value="employee">
                Employee Reminder
              </MenuItem>
              <MenuItem sx={{ display: isLead ? "none" : "block" }} value="lead">
                Lead Reminder
              </MenuItem>
              <MenuItem sx={{ display: isLead ? "none" : "block" }} value="specialRating">
                Top 5%/20% Rating Reminder
              </MenuItem>
              <MenuItem sx={{ display: isAdmin ? "none" : "block" }} value="threeSixty">
                360 Reminder
              </MenuItem>
            </TextField>
          </Grid>
          <Grid size={{ md: 3, sm: 0 }} />
          <Grid
            size={{ sm: 12 }}
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 2,
              mt: 3,
            }}
          >
            <Button variant="outlined" onClick={onClose}>
              Cancel
            </Button>
            <LoadingButton
              type="submit"
              loading={isSubmitting}
              variant={isSubmitting ? "outlined" : "contained"}
            >
              <span>Send</span>
            </LoadingButton>
          </Grid>
        </Grid>
      </form>
    </>
  );
};
