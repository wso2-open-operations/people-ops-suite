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
import CloseIcon from "@mui/icons-material/Close";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

import { EmployeeAutocompleteField, OrgItemAutocompleteField } from "./add-modal/AddModalFields";
import type { AddOrgFormValues, AddPageContext } from "./add-modal/types";
import { useAddOrgEntity } from "./add-modal/useAddOrgEntity";

export type { AddPageContext, AddOrgFormValues };

export interface AddPageProps {
  open: boolean;
  context: AddPageContext;
  onClose: () => void;
  onSubmit: (context: AddPageContext, values: AddOrgFormValues) => void;
}

const AddPage: React.FC<AddPageProps> = ({ open, context, onClose, onSubmit }) => {
  const theme = useTheme();

  const {
    childLabel,
    parentLabel,
    orgItemOptions,
    filterOrgItemOptions,
    employees,
    isEmployeesLoading,
    form,
    isNewItem,
    handleOrgItemChange,
    buildSubmitHandler,
    handleSubmit,
  } = useAddOrgEntity({ context });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      slotProps={{
        paper: {
          sx: {
            position: "relative",
            width: "620px",
            borderRadius: "12px",
            boxShadow: "0px 1px 8px 2px rgba(0,0,0,0.12)",
            backgroundColor: theme.palette.fill.secondary.light.active,
            padding: "4px",
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0px",
          paddingX: "12px",
          paddingY: "6px",
        }}
      >
        <Typography
          variant="body2"
          sx={{
            fontWeight: 500,
            color: theme.palette.customText.secondary.p1.active,
            letterSpacing: "0.14px",
          }}
        >
          Add {childLabel} to{" "}
          <Box
            component="span"
            sx={{ color: theme.palette.customText.primary.p2.active, fontWeight: 600 }}
          >
            {context.parentName}
          </Box>{" "}
          <Box
            component="span"
            sx={{ color: theme.palette.customText.primary.p4.active, fontWeight: 400 }}
          >
            ({parentLabel})
          </Box>
        </Typography>

        <IconButton
          onClick={onClose}
          sx={{
            color: theme.palette.customText.primary.p2.active,
            p: 0,
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent
        sx={{
          padding: 1.5,
          borderRadius: "12px",
          border: `1px solid ${theme.palette.customBorder.primary.b2.active}`,
          backgroundColor: theme.palette.surface.secondary.active,
          display: "flex",
          flexDirection: "column",
          gap: 2.5,
        }}
      >
        {/* Section header */}
        <Box sx={{ mt: 1 }}>
          <Typography
            variant="h6"
            sx={{ color: theme.palette.customText.primary.p2.active, pb: 1 }}
          >
            Add {childLabel}
          </Typography>
          <Divider sx={{ borderColor: theme.palette.customBorder.primary.b2.active }} />
        </Box>

        {/* Form */}
        <Box
          component="form"
          onSubmit={handleSubmit(buildSubmitHandler(onSubmit))}
          sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}
        >
          {/* Org-item picker (Teams / Sub Teams / Units …) */}
          <OrgItemAutocompleteField
            control={form.control}
            options={orgItemOptions}
            filterOptions={filterOrgItemOptions}
            childLabel={childLabel}
            onChange={handleOrgItemChange}
          />

          {/* Head picker — only when creating a brand-new entity */}
          {isNewItem && (
            <EmployeeAutocompleteField
              control={form.control}
              name="head"
              label={`${childLabel} Head`}
              employees={employees}
              isLoading={isEmployeesLoading}
            />
          )}

          {/* Functional Lead picker — always shown */}
          <EmployeeAutocompleteField
            control={form.control}
            name="functionalLead"
            label="Functional Lead"
            employees={employees}
            isLoading={isEmployeesLoading}
          />

          {/* Action buttons */}
          <Box sx={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
            <Button type="button" variant="outlined" size="small" onClick={onClose}>
              Cancel
            </Button>

            <Button type="submit" variant={"primary" as any} size="small">
              Add {childLabel}
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default AddPage;
