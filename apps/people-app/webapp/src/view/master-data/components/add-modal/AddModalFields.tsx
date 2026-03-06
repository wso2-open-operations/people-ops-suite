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
import AddIcon from "@mui/icons-material/Add";
import { Autocomplete, Avatar, Box, CircularProgress, TextField, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Controller } from "react-hook-form";
import type { Control } from "react-hook-form";

import { EmployeeBasicInfo } from "@services/employee";

import type { AddOrgFormValues, OrgItemOption } from "./types";

export const FieldLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const theme = useTheme();

  return (
    <Typography
      variant="body2"
      sx={{
        fontWeight: 500,
        color: theme.palette.customText.primary.p3.active,
        letterSpacing: "0.14px",
      }}
    >
      {children}
    </Typography>
  );
};

interface EmployeeOptionProps {
  listItemProps: React.HTMLAttributes<HTMLLIElement>;
  employee: EmployeeBasicInfo;
}

export const EmployeeOption: React.FC<EmployeeOptionProps> = ({ listItemProps, employee }) => {
  const theme = useTheme();
  const label = employee.designation ?? employee.workEmail;

  return (
    <Box
      component="li"
      {...listItemProps}
      sx={{
        display: "flex",
        gap: 1.5,
        alignItems: "center",
        py: "10px !important",
        px: "12px !important",
      }}
    >
      <Avatar
        src={employee.employeeThumbnail ?? undefined}
        sx={{ borderRadius: "8px", fontSize: 12, height: 40, width: 40 }}
      >
        {employee.firstName.charAt(0)}
      </Avatar>

      <Box sx={{ display: "flex", flexDirection: "column" }}>
        <Typography variant="body2" sx={{ color: theme.palette.customText.primary.p2.active }}>
          {employee.firstName} {employee.lastName}
        </Typography>
        <Typography variant="caption" sx={{ color: theme.palette.customText.primary.p4.active }}>
          {label}
        </Typography>
      </Box>
    </Box>
  );
};

interface OrgItemAutocompleteFieldProps {
  control: Control<AddOrgFormValues>;
  options: OrgItemOption[];
  filterOptions: (options: OrgItemOption[], state: { inputValue: string }) => OrgItemOption[];
  childLabel: string;
  onChange: (value: OrgItemOption | null) => void;
}

export const OrgItemAutocompleteField: React.FC<OrgItemAutocompleteFieldProps> = ({
  control,
  options,
  filterOptions,
  childLabel,
  onChange,
}) => {
  const theme = useTheme();

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <FieldLabel>{childLabel}s</FieldLabel>

      <Controller
        name="orgItem"
        control={control}
        render={({ field }) => (
          <Autocomplete<OrgItemOption, false, false, false>
            options={options}
            filterOptions={filterOptions}
            getOptionLabel={(o) => o.name}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            value={field.value}
            onChange={(_, val) => onChange(val)}
            renderOption={(props, option) => (
              <Box
                component="li"
                {...props}
                key={option.id}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  py: "10px !important",
                  px: "12px !important",
                }}
              >
                {option.isNew && (
                  <AddIcon
                    sx={{
                      fontSize: 16,
                      color: theme.palette.customText.secondary.p1.active,
                    }}
                  />
                )}
                <Typography
                  variant="body2"
                  sx={{
                    color: option.isNew
                      ? theme.palette.customText.secondary.p1.active
                      : theme.palette.customText.primary.p3.active,
                    fontWeight: option.isNew ? 500 : 400,
                  }}
                >
                  {option.isNew ? `Add "${option.name}"` : option.name}
                </Typography>
              </Box>
            )}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder={`Select an existing ${childLabel.toLowerCase()}`}
                size="small"
              />
            )}
          />
        )}
      />
    </Box>
  );
};

interface EmployeeAutocompleteFieldProps {
  control: Control<AddOrgFormValues>;
  name: "head" | "functionalLead";
  label: string;
  employees: EmployeeBasicInfo[];
  isLoading: boolean;
}

export const EmployeeAutocompleteField: React.FC<EmployeeAutocompleteFieldProps> = ({
  control,
  name,
  label,
  employees,
  isLoading,
}) => (
  <Box sx={{ display: "flex", flexDirection: "column", gap: "8px" }}>
    <FieldLabel>{label}</FieldLabel>

    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <Autocomplete<EmployeeBasicInfo, false, false, false>
          options={employees}
          loading={isLoading}
          getOptionLabel={(o) => `${o.firstName} ${o.lastName}`}
          isOptionEqualToValue={(a, b) => a.employeeId === b.employeeId}
          value={field.value}
          onChange={(_, val) => field.onChange(val)}
          renderOption={(props, employee) => (
            <EmployeeOption key={employee.employeeId} listItemProps={props} employee={employee} />
          )}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Search employee..."
              size="small"
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {isLoading && <CircularProgress size={14} />}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
        />
      )}
    />
  </Box>
);
