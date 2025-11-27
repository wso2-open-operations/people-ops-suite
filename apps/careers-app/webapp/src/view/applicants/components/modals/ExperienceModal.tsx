// Copyright (c) 2025 WSO2 LLC. (https://www.wso2.com).
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
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { Formik, Form } from "formik";
import { useTheme } from "@mui/material/styles";
import * as yup from "yup";
import dayjs from "dayjs";
import { useAppDispatch } from "@slices/store";
import { enqueueSnackbarMessage } from "@slices/commonSlice/common";  

export interface Experience {
  job_title: string;
  company: string;
  location: string;
  start_date: string;
  end_date: string | null;
  current: boolean;
}

interface Props {
  open: boolean;
  onClose: () => void;
  push: (exp: Experience) => void;
  replace: (index: number, value: Experience) => void;
  editItem?: Experience;
  editIndex?: number | null;
}

const expSchema = yup.object({
  job_title: yup.string().required("Job title is required"),
  company: yup.string().required("Company is required"),
  location: yup.string().required("Location is required"),
  start_date: yup.date().required("Start date is required"),
  current: yup.boolean(),
  end_date: yup
    .date()
    .nullable()
    .when("current", {
      is: false,
      then: (schema) => schema
        .required("End date is required when not currently working")
        .min(yup.ref("start_date"), "End date cannot be before start date"),
      otherwise: (schema) => schema.nullable(),
    }),
});

const EMPTY_VALUES = {
  job_title: "",
  company: "",
  location: "",
  start_date: null,
  end_date: null,
  current: false,
};

export default function ExperienceModal({
  open,
  onClose,
  push,
  replace,
  editItem,
  editIndex,
}: Props) {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const initialValues = editItem
    ? {
        job_title: editItem.job_title || "",
        company: editItem.company || "",
        location: editItem.location || "",
        start_date: editItem.start_date ? dayjs(editItem.start_date) : null,
        end_date: editItem.current || !editItem.end_date
          ? null
          : dayjs(editItem.end_date),
        current: !!editItem.current,
      }
    : { ...EMPTY_VALUES };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <Formik
        initialValues={initialValues}
        validationSchema={expSchema}
        enableReinitialize
        onSubmit={async (exp, { resetForm, setTouched, validateForm }) => {
          // Validate all fields
          const validationErrors = await validateForm();
          
          // Check for validation errors
          if (Object.keys(validationErrors).length > 0) {
            // Mark all fields with errors as touched
            setTouched(
              Object.keys(validationErrors).reduce((acc: any, key) => {
                acc[key] = true;
                return acc;
              }, {})
            );
            
            // Find the first error message
            const firstError = Object.values(validationErrors)[0];
            
            dispatch(
              enqueueSnackbarMessage({
                message: typeof firstError === "string" 
                  ? firstError 
                  : "Please fill all the required fields correctly.",
                type: "error",
              })
            );
            return;
          }

          const cleaned = {
            job_title: exp.job_title,
            company: exp.company,
            location: exp.location,
            start_date: exp.start_date ? exp.start_date.format("YYYY-MM-DD") : "",
            end_date: exp.current || !exp.end_date ? null : exp.end_date.format("YYYY-MM-DD"),
            current: exp.current,
          };

          if (editIndex !== null && editIndex !== undefined) {
            replace(editIndex, cleaned);
          } else {
            push(cleaned);
          }

          dispatch(
            enqueueSnackbarMessage({
              message: editIndex !== null && editIndex !== undefined 
                ? "Experience updated successfully!" 
                : "Experience added successfully!",
              type: "success",
            })
          );

          resetForm();
          onClose();
        }}
      >
        {({ values, handleChange, setFieldValue, handleBlur, touched, errors }) => (
          <Form>
            <DialogTitle fontWeight="bold">
              {editItem ? "Edit Experience" : "Add Experience"}
            </DialogTitle>
            <DialogContent
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
                mt: 1,
              }}
            >
              <TextField
                label="Title"
                name="job_title"
                value={values.job_title}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.job_title && Boolean(errors.job_title)}
                helperText={
                  touched.job_title
                    ? typeof errors.job_title === "string"
                      ? errors.job_title
                      : undefined
                    : undefined
                }
              />
              <TextField
                label="Company"
                name="company"
                value={values.company}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.company && Boolean(errors.company)}
                helperText={
                  touched.company
                    ? typeof errors.company === "string"
                      ? errors.company
                      : undefined
                    : undefined
                }
              />
              <TextField
                label="Office Location"
                name="location"
                value={values.location}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.location && Boolean(errors.location)}
                helperText={
                  touched.location
                    ? typeof errors.location === "string"
                      ? errors.location
                      : undefined
                    : undefined
                }
              />

              <DatePicker
                label="Start Date"
                value={values.start_date}
                onChange={(newValue) => setFieldValue("start_date", newValue)}
                slotProps={{
                  textField: {
                    error: touched.start_date && Boolean(errors.start_date),
                    helperText: touched.start_date && errors.start_date
                      ? typeof errors.start_date === "string"
                        ? errors.start_date
                        : undefined
                      : undefined,
                    onBlur: handleBlur,
                    name: "start_date",
                  },
                }}
              />

              <FormControlLabel
                control={
                  <Checkbox
                    checked={values.current}
                    onChange={(e) => {
                      setFieldValue("current", e.target.checked);
                      if (e.target.checked) {
                        setFieldValue("end_date", null);
                      }
                    }}
                    name="current"
                  />
                }
                label="I currently work here"
              />

              <DatePicker
                label="End Date"
                value={values.end_date}
                onChange={(newValue) => setFieldValue("end_date", newValue)}
                disabled={values.current}
                slotProps={{
                  textField: {
                    error: touched.end_date && Boolean(errors.end_date),
                    helperText: touched.end_date && errors.end_date
                      ? typeof errors.end_date === "string"
                        ? errors.end_date
                        : undefined
                      : undefined,
                    onBlur: handleBlur,
                    name: "end_date",
                  },
                }}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={onClose}>Cancel</Button>
              <Button
                type="submit"
                variant="contained"
                sx={{ bgcolor: theme.palette.brand.orange }}
              >
                Save
              </Button>
            </DialogActions>
          </Form>
        )}
      </Formik>
    </Dialog>
  );
}
