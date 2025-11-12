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
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Formik, Form, FormikHelpers } from "formik";
import * as yup from "yup";
import { useAppDispatch } from "@slices/store";
import { enqueueSnackbarMessage } from "@slices/commonSlice/common";

export interface Education {
  degree: string;
  institution: string;
  location: string;
  gpa_zscore: number;
  start_year: number;
  end_year: number | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  push: (edu: Education) => void;
  replace: (index: number, value: Education) => void;
  editItem?: Education;
  editIndex?: number | null;
}

const eduSchema = yup.object({
  degree: yup.string().required("Degree is required"),
  institution: yup.string().required("Institution is required"),
  location: yup.string().required("Location is required"),
  gpa_zscore: yup
    .number()
    .typeError("GPA must be a number")
    .min(0, "GPA cannot be negative")
    .max(10, "GPA cannot exceed 10")
    .required("GPA is required")
    .test('not-zero', 'GPA is required', (value) => value !== 0 && value !== null && value !== undefined),
  start_year: yup
    .number()
    .typeError("Start year must be a number")
    .required("Start year is required")
    .test('not-zero', 'Start year is required', (value) => value !== 0 && value !== null && value !== undefined)
    .test('valid-year', 'Please enter a valid year', (value) => {
      if (!value) return false;
      return value >= 1900 && value <= new Date().getFullYear() + 10;
    }),
  end_year: yup
    .number()
    .typeError("End year must be a number")
    .nullable()
    .required("End year is required")
    .test('not-zero', 'End year is required', (value) => value !== 0 && value !== null && value !== undefined)
    .test('valid-year', 'Please enter a valid year', (value) => {
      if (!value) return false;
      return value >= 1900 && value <= new Date().getFullYear() + 10;
    })
    .test('after-start', 'End year must be after start year', function(value) {
      const { start_year } = this.parent;
      if (!value || !start_year) return true;
      return value >= start_year;
    }),
});

const EMPTY_VALUES = {
  degree: "",
  institution: "",
  location: "",
  gpa_zscore: "" as any,
  start_year: "" as any,
  end_year: "" as any,
};

export default function EducationModal({
  open,
  onClose,
  push,
  replace,
  editItem,
  editIndex,
}: Props) {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const initialValues = editItem ? { ...editItem } : EMPTY_VALUES;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <Formik
        initialValues={initialValues}
        enableReinitialize
        validationSchema={eduSchema}
        onSubmit={async (edu, { resetForm, setTouched, validateForm }) => {
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

          const cleaned: Education = {
            ...edu,
            gpa_zscore: edu.gpa_zscore ? Number(edu.gpa_zscore) : 0,
            start_year: edu.start_year ? Number(edu.start_year) : 0,
            end_year: edu.end_year ? Number(edu.end_year) : null,
          };

          if (editIndex !== null && editIndex !== undefined) {
            replace(editIndex, cleaned);
          } else {
            push(cleaned);
          }

          dispatch(
            enqueueSnackbarMessage({
              message: editIndex !== null && editIndex !== undefined 
                ? "Education updated successfully!" 
                : "Education added successfully!",
              type: "success",
            })
          );

          resetForm();
          onClose();
        }}
      >
        {({ values, handleChange, handleBlur, touched, errors }) => (
          <Form>
            <DialogTitle fontWeight="bold">
              {editItem ? "Edit Education" : "Add Education"}
            </DialogTitle>
            <DialogContent
              sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}
            >
              <TextField
                label="Degree"
                name="degree"
                value={values.degree}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.degree && Boolean(errors.degree)}
                helperText={
                  touched.degree
                    ? typeof errors.degree === "string"
                      ? errors.degree
                      : undefined
                    : undefined
                }
              />
              <TextField
                label="Institution"
                name="institution"
                value={values.institution}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.institution && Boolean(errors.institution)}
                helperText={
                  touched.institution
                    ? typeof errors.institution === "string"
                      ? errors.institution
                      : undefined
                    : undefined
                }
              />
              <TextField
                label="Location"
                name="location"
                value={values.location}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.location && Boolean(errors.location)}
                helperText={touched.location && errors.location}
              />
              <TextField
                label="GPA"
                name="gpa_zscore"
                type="number"
                value={values.gpa_zscore}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.gpa_zscore && Boolean(errors.gpa_zscore)}
                helperText={
                  touched.gpa_zscore
                    ? typeof errors.gpa_zscore === "string"
                      ? errors.gpa_zscore
                      : undefined
                    : undefined
                }
              />
              <TextField
                label="Start Year"
                name="start_year"
                type="number"
                placeholder="e.g., 2020"
                value={values.start_year}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.start_year && Boolean(errors.start_year)}
                helperText={
                  touched.start_year
                    ? typeof errors.start_year === "string"
                      ? errors.start_year
                      : undefined
                    : undefined
                }
              />
              <TextField
                label="End Year"
                name="end_year"
                type="number"
                placeholder="e.g., 2024"
                value={values.end_year}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.end_year && Boolean(errors.end_year)}
                helperText={
                  touched.end_year
                    ? typeof errors.end_year === "string"
                      ? errors.end_year
                      : undefined
                    : undefined
                }
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
