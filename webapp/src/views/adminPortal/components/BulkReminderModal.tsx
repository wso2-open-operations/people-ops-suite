// Copyright (c) 2024, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import {
  Typography,
  TextField,
  MenuItem,
  Button,
  Grid,
  Divider,
} from "@mui/material";
import LoadingButton from "@mui/lab/LoadingButton";
import {
  sendAllEmployeeReminder,
  sendAllLeadReminder,
  sendAllSpecialRatingReminder,
  sendAllThreeSixtyReminder,
} from "@slices/reminderSlice";
import { useAppDispatch } from "@slices/store";
import { useFormik } from "formik";
import * as yup from "yup";

interface BulkReminderModalProps {
  onClose: () => void;
  isAdmin?: boolean;
  isLead?: boolean;
}

export const BulkReminderModal = ({
  onClose,
  isAdmin,
  isLead,
}: BulkReminderModalProps) => {
  const dispatch = useAppDispatch();

  const validationSchema = yup.object().shape({
    selectedRminderType: yup.string().required("Required"),
  });

  const {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    handleSubmit,
    isSubmitting,
  } = useFormik({
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
          <Grid item xs={12} sm={3}>
            <Typography pt={1}>Reminder type:</Typography>
          </Grid>
          <Grid item xs={12} sm={9} md={6}>
            <TextField
              select
              size="small"
              fullWidth
              name="selectedRminderType"
              label="Select Type"
              value={values.selectedRminderType}
              onChange={handleChange}
              onBlur={handleBlur}
              error={
                touched.selectedRminderType &&
                Boolean(errors.selectedRminderType)
              }
              helperText={
                touched.selectedRminderType && errors.selectedRminderType
              }
              variant="outlined"
            >
              <MenuItem
                sx={{ display: isLead ? "none" : "block" }}
                value="employee"
              >
                Employee Reminder
              </MenuItem>
              <MenuItem
                sx={{ display: isLead ? "none" : "block" }}
                value="lead"
              >
                Lead Reminder
              </MenuItem>
              <MenuItem
                sx={{ display: isLead ? "none" : "block" }}
                value="specialRating"
              >
                Top 5%/20% Rating Reminder
              </MenuItem>
              <MenuItem
                sx={{ display: isAdmin ? "none" : "block" }}
                value="threeSixty"
              >
                360 Reminder
              </MenuItem>
            </TextField>
          </Grid>
          <Grid item md={3} sm={0} />
          <Grid
            item
            sm={12}
            display="flex"
            justifyContent="flex-end"
            gap={2}
            mt={3}
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
