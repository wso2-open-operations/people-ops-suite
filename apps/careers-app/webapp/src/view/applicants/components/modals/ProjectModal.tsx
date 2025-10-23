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
  push: (proj: any) => void;
  replace: (index: number, value: any) => void;
  editItem?: any;
  editIndex?: number | null;
}

const projSchema = yup.object({
  name: yup.string().required("Project name is required"),
  description: yup.string().required("Description is required"),
});

const EMPTY_VALUES = {
  name: "",
  description: "",
  technologies: "",
  github: "",
};

export default function ProjectModal({
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
        validationSchema={projSchema}
        onSubmit={(proj, { resetForm }) => {
          if (editIndex !== null && editIndex !== undefined) {
            replace(editIndex, proj);
          } else {
            push(proj);
          }

          resetForm();
          onClose();
        }}
      >
        {({ values, handleChange, handleBlur, touched, errors }) => (
          <Form>
            <DialogTitle fontWeight="bold">
              {editItem ? "Edit Project" : "Add Project"}
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
                label="Description"
                name="description"
                value={values.description}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.description && Boolean(errors.description)}
                helperText={
                  touched.description
                    ? typeof errors.description === "string"
                      ? errors.description
                      : undefined
                    : undefined
                }
              />
              <TextField
                label="Technologies"
                name="technologies"
                value={values.technologies}
                onChange={handleChange}
              />
              <TextField
                label="GitHub Link"
                name="github"
                value={values.github}
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
