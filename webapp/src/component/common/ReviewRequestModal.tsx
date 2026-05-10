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
import { Box, Button, Divider, Grid, Typography } from "@mui/material";

import { selectEmployeeInfo, selectUserEmail } from "@slices/authSlice/auth";
import { useAppDispatch, useAppSelector } from "@slices/store";
import { fetchReviewers, postReviewers } from "@slices/threeSixtyReviewSlice/threeSixtyReview";

import { EmailAutocomplete } from "../common/EmailAutoComplete";

interface ReviewRequestModalProps {
  parCycleId: number;
  selectedEmployeeEmail: string;
  onClose: () => void;
}

export const ReviewRequestModal = ({
  onClose,
  parCycleId,
  selectedEmployeeEmail,
}: ReviewRequestModalProps) => {
  const dispatch = useAppDispatch();
  const userEmail = useAppSelector(selectUserEmail);
  const userInfo = useAppSelector(selectEmployeeInfo);

  const validationSchema = yup.object().shape({
    emails: yup
      .array()
      .of(yup.string().email("Please enter a valid email"))
      .min(1, "At least one email is required")
      .required("At least one email is required"),
  });

  const { values, errors, touched, setFieldValue, handleBlur, handleSubmit, isSubmitting } =
    useFormik({
      initialValues: {
        emails: [] as string[],
      },
      validationSchema,
      onSubmit: async (values) => {
        const resultAction = await dispatch(
          postReviewers({
            employeeId: selectedEmployeeEmail,
            parCycleId,
            reviewerEmails: values.emails,
          }),
        );
        if (postReviewers.fulfilled.match(resultAction)) {
          dispatch(fetchReviewers({ employeeId: selectedEmployeeEmail, parCycleId }));
          onClose();
        }
      },
    });

  const handleEmailBlur = () => {
    handleBlur("emails");
  };

  return (
    <Box sx={{ p: 1 }}>
      <Typography id="dashboard-modal-title" variant="h4" pb={2}>
        Request 360° Feedback
      </Typography>
      <Divider sx={{ bgcolor: "primary.main" }} />
      <form onSubmit={handleSubmit}>
        <Grid container spacing={1} pt={2} id="dashboard-modal-description">
          <Grid size={{ xs: 12 }}>
            <Typography pb={2}>From:</Typography>
            <EmailAutocomplete
              value={values.emails}
              onChange={(emails) => setFieldValue("emails", emails)}
              onBlur={handleEmailBlur}
              error={touched.emails && Boolean(errors.emails)}
              helperText={touched.emails && errors.emails ? errors.emails.toString() : ""}
              emailsToSkip={
                userEmail === selectedEmployeeEmail && userInfo?.leadEmail
                  ? [userInfo?.leadEmail]
                  : [selectedEmployeeEmail]
              }
            />
          </Grid>
          <Grid size={{ xs: 12 }} display="flex" justifyContent="flex-end" gap={2} mt={2}>
            <Button variant="outlined" onClick={onClose}>
              Cancel
            </Button>
            <LoadingButton
              type="submit"
              loading={isSubmitting}
              variant={isSubmitting ? "outlined" : "contained"}
            >
              <span>Request</span>
            </LoadingButton>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
};
