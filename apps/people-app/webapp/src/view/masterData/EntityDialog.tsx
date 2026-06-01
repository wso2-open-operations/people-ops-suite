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
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Switch,
  Tooltip,
} from "@mui/material";
import { useFormik } from "formik";
import * as Yup from "yup";
import { BaseTextField } from "@component/common/FieldInput/BasicFieldInput/BaseTextField";
import EmployeeEmailSelect from "@component/EmployeeEmailSelect/EmployeeEmailSelect";
import {
  CreateEntityPayload,
  CompanyOrgChartEntity,
  UpdateEntityPayload,
} from "@slices/masterDataSlice/masterData";

interface EntityDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateEntityPayload | UpdateEntityPayload) => Promise<void>;
  entityLabel: string;
  entity?: CompanyOrgChartEntity | null;
}

const validationSchema = Yup.object({
  name: Yup.string()
    .required("Name is required")
    .max(45, "Name must be at most 45 characters"),
  headEmail: Yup.string().nullable(),
});

export default function EntityDialog({
  open,
  onClose,
  onSubmit,
  entityLabel,
  entity,
}: EntityDialogProps) {
  const isEdit = entity != null;

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      name: entity?.name ?? "",
      headEmail: entity?.headEmail ?? "",
      isActive: entity?.isActive ?? true,
    },
    validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      const payload = isEdit
        ? ({
            name: values.name,
            headEmail: values.headEmail,
            isActive: values.isActive,
          } satisfies UpdateEntityPayload)
        : ({
            name: values.name,
            headEmail: values.headEmail,
          } satisfies CreateEntityPayload);
      await onSubmit(payload);
      setSubmitting(false);
      onClose();
    },
  });

  const handleClose = () => {
    formik.resetForm();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEdit ? `Edit ${entityLabel}: ${entity?.name}` : `Add ${entityLabel}`}</DialogTitle>
      <form onSubmit={formik.handleSubmit}>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 1.5 }}>
            <BaseTextField
              label="Name"
              isRequired
              id="name"
              name="name"
              value={formik.values.name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.name && Boolean(formik.errors.name)}
              helperText={formik.touched.name && formik.errors.name}
            />
            <EmployeeEmailSelect
              mode="single"
              label={`${entityLabel} Head Email`}
              value={formik.values.headEmail}
              onChange={(email) => formik.setFieldValue("headEmail", email)}
              onBlur={() => formik.setFieldTouched("headEmail", true)}
              error={formik.touched.headEmail && Boolean(formik.errors.headEmail)}
              helperText={formik.touched.headEmail && formik.errors.headEmail}
            />
            {isEdit && (() => {
              const cannotDeactivate = Boolean(entity?.activeEmployeeCount);
              const activeCount = entity?.activeEmployeeCount ?? 0;
              const employeeWord = `employee${activeCount === 1 ? "" : "s"}`;
              const tooltipText = cannotDeactivate
                ? `This entity has ${activeCount} active ${employeeWord} and cannot be deactivated.`
                : "";
              return (
                <FormControlLabel
                  control={
                    <Tooltip title={tooltipText} arrow placement="top">
                      <span>
                        <Switch
                          id="isActive"
                          name="isActive"
                          checked={formik.values.isActive}
                          onChange={formik.handleChange}
                          disabled={cannotDeactivate}
                          sx={{
                            ...(cannotDeactivate && { opacity: 0.5 }),
                            "& .MuiSwitch-switchBase.Mui-checked": { color: "#ff7300" },
                            "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { backgroundColor: "#ff7300" },
                          }}
                        />
                      </span>
                    </Tooltip>
                  }
                  label={formik.values.isActive ? "Active" : "Inactive"}
                  sx={cannotDeactivate ? { "& .MuiFormControlLabel-label": { opacity: 0.6 } } : undefined}
                />
              );
            })()}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose} variant="outlined" color="inherit" sx={{ textTransform: "none" }}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="secondary"
            disabled={formik.isSubmitting || !formik.dirty}
            startIcon={formik.isSubmitting ? <CircularProgress size={16} /> : null}
            sx={{ textTransform: "none" }}
          >
            {isEdit ? "Save" : "Create"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
