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
import { useAppDispatch } from "@slices/store";
import { enqueueSnackbarMessage } from "@slices/commonSlice/common";

export interface Certification {
  name: string;
  issued_by: string;
  year: number;
  link: string;
}
interface Props {
  open: boolean;
  onClose: () => void;
  push: (cert: Certification) => void;
  replace: (index: number, value: Certification) => void;
  editItem?: Certification;
  editIndex?: number | null;
}

const certSchema = yup.object({
  name: yup.string().required("Certification name is required"),
  year: yup
    .number()
    .typeError("Year must be a number")
    .integer("Year must be an integer")
    .min(1900, "Year must be a valid year")
    .required("Year is required"),
  issued_by: yup.string().required("Issued By is required"),
  link: yup.string().url("Must be a valid URL").required("Link is required"),
});

const EMPTY_VALUES = {
  name: "",
  issued_by: "",
  year: "",
  link: "",
};

export default function CertificationModal({
  open,
  onClose,
  push,
  replace,
  editItem,
  editIndex,
}: Props) {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const initialValues = editItem ? { ...editItem } : { ...EMPTY_VALUES };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <Formik
        initialValues={initialValues}
        enableReinitialize
        validationSchema={certSchema}
        onSubmit={async (cert, { resetForm, setTouched, validateForm }) => {
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
            ...cert,
            year: Number(cert.year),
          };

          if (editIndex !== null && editIndex !== undefined) {
            replace(editIndex, cleaned);
          } else {
            push(cleaned);
          }

          dispatch(
            enqueueSnackbarMessage({
              message: editIndex !== null && editIndex !== undefined 
                ? "Certification updated successfully!" 
                : "Certification added successfully!",
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
              {editItem ? "Edit Certification" : "Add Certification"}
            </DialogTitle>
            <DialogContent
              sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}
            >
              <TextField
                label="Name"
                name="name"
                value={values.name}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.name && Boolean(errors.name)}
                helperText={
                  touched.name
                    ? typeof errors.name === "string"
                      ? errors.name
                      : undefined
                    : undefined
                }
              />
              <TextField
                label="Issued By"
                name="issued_by"
                value={values.issued_by}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.issued_by && Boolean(errors.issued_by)}
                helperText={touched.issued_by && errors.issued_by}
              />
              <TextField
                label="Year"
                name="year"
                value={values.year}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.year && Boolean(errors.year)}
                helperText={
                  touched.year
                    ? typeof errors.year === "string"
                      ? errors.year
                      : undefined
                    : undefined
                }
              />
              <TextField
                label="Link"
                name="link"
                value={values.link}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.link && Boolean(errors.link)}
                helperText={touched.link && errors.link}
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
