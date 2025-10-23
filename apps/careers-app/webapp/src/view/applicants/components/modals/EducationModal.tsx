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
import { Formik, Form } from "formik";
import * as yup from "yup";

interface Props {
  open: boolean;
  onClose: () => void;
  push: (edu: any) => void;
  replace: (index: number, value: any) => void;
  editItem?: any;
  editIndex?: number | null;
}

const eduSchema = yup.object({
  degree: yup.string().required("Degree is required"),
  institution: yup.string().required("Institution is required"),
});

const EMPTY_VALUES = {
  degree: "",
  institution: "",
  location: "",
  gpa_zscore: "",
  start_year: "",
  end_year: "",
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
  const initialValues = editItem ? { ...editItem } : EMPTY_VALUES;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <Formik
        initialValues={initialValues}
        enableReinitialize
        validationSchema={eduSchema}
        onSubmit={(edu, { resetForm }) => {
          const cleaned = {
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
              />
              <TextField
                label="GPA"
                name="gpa_zscore"
                value={values.gpa_zscore}
                onChange={handleChange}
              />
              <TextField
                label="Start Year"
                name="start_year"
                value={values.start_year}
                onChange={handleChange}
              />
              <TextField
                label="End Year"
                name="end_year"
                value={values.end_year}
                onChange={handleChange}
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
