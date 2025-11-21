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
  MenuItem,
  TextField,
} from "@mui/material";
import { Formik, Form } from "formik";
import { useTheme } from "@mui/material/styles";
import * as yup from "yup";
import { useAppDispatch } from "@slices/store";
import { enqueueSnackbarMessage } from "@slices/commonSlice/common";

export interface Language {
  language: string;
  proficiency: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  push: (lang: Language) => void;
  replace: (index: number, value: Language) => void;
  editItem?: Language;
  editIndex?: number | null;
}

const langSchema = yup.object({
  language: yup.string().required("Language is required"),
  proficiency: yup.string().required("Proficiency is required"),
});

const EMPTY_VALUES = {
  language: "",
  proficiency: "",
};

export default function LanguageModal({
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
        validationSchema={langSchema}
        onSubmit={async (lang, { resetForm, setTouched, validateForm }) => {
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

          if (editIndex !== null && editIndex !== undefined) {
            replace(editIndex, lang);
          } else {
            push(lang);
          }

          dispatch(
            enqueueSnackbarMessage({
              message: editIndex !== null && editIndex !== undefined 
                ? "Language updated successfully!" 
                : "Language added successfully!",
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
              {editItem ? "Edit Language" : "Add Language"}
            </DialogTitle>
            <DialogContent
              sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}
            >
              <TextField
                label="Language"
                name="language"
                value={values.language}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.language && Boolean(errors.language)}
                helperText={
                  touched.language
                    ? typeof errors.language === "string"
                      ? errors.language
                      : undefined
                    : undefined
                }
              />
              <TextField
                select
                label="Proficiency"
                name="proficiency"
                value={values.proficiency}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.proficiency && Boolean(errors.proficiency)}
                helperText={
                  touched.proficiency
                    ? typeof errors.proficiency === "string"
                      ? errors.proficiency
                      : undefined
                    : undefined
                }
              >
                <MenuItem value="Beginner">Beginner</MenuItem>
                <MenuItem value="Intermediate">Intermediate</MenuItem>
                <MenuItem value="Fluent">Fluent</MenuItem>
                <MenuItem value="Native">Native</MenuItem>
              </TextField>
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
