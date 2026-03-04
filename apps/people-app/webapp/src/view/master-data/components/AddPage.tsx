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
import {
  Autocomplete,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Divider,
  TextField,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Controller, useForm } from "react-hook-form";

import { useCallback, useMemo } from "react";

import { EmployeeBasicInfo, useGetEmployeesBasicInfoQuery } from "@services/employee";
import { TeamState } from "@slices/organizationSlice/organizationStructure";
import { useAppSelector } from "@slices/store";

// ─── Constants ────────────────────────────────────────────────────────────────

const ADD_NEW_TEAM_PREFIX = "__ADD_NEW__";

// ─── Types ────────────────────────────────────────────────────────────────────

/** A team option that may represent an existing team or a "create new" placeholder. */
interface TeamOption {
  id: string;
  name: string;
  isNew: boolean;
}

interface AddPageFormValues {
  team: TeamOption | null;
  head: EmployeeBasicInfo | null;
  functionalLead: EmployeeBasicInfo | null;
}

export interface AddPageProps {
  /** Called when the user cancels the dialog. */
  onCancel: () => void;
  /** Called with the submitted form values. */
  onSubmit: (values: AddPageFormValues) => void;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface EmployeeOptionProps {
  listItemProps: React.HTMLAttributes<HTMLLIElement>;
  employee: EmployeeBasicInfo;
}

const EmployeeOption: React.FC<EmployeeOptionProps> = ({ listItemProps, employee }) => {
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

// ─── Field label ──────────────────────────────────────────────────────────────

const FieldLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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

// ─── Main Component ───────────────────────────────────────────────────────────

const AddPage: React.FC<AddPageProps> = ({ onCancel, onSubmit }) => {
  const theme = useTheme();

  // ── Redux state ──────────────────────────────────────────────────────────
  const teams = useAppSelector(
    (state) => state.organizationStructure.organizationInfo?.teams ?? [],
  );

  // ── Remote data ──────────────────────────────────────────────────────────
  const { data: employees = [], isLoading: isEmployeesLoading } = useGetEmployeesBasicInfoQuery();

  // ── Form ─────────────────────────────────────────────────────────────────
  const { control, handleSubmit, watch, setValue } = useForm<AddPageFormValues>({
    defaultValues: {
      team: null,
      head: null,
      functionalLead: null,
    },
  });

  const selectedTeam = watch("team");

  /**
   * Whether the user is creating a brand-new team (typed a name not in the list).
   * When true, the "Team Head" section is shown.
   */
  const isNewTeam = selectedTeam?.isNew === true;

  // ── Team autocomplete options ─────────────────────────────────────────────
  const teamOptions: TeamOption[] = useMemo(
    () =>
      teams.map((t: TeamState) => ({
        id: t.id,
        name: t.name,
        isNew: false,
      })),
    [teams],
  );

  /**
   * Build the option list for the Teams autocomplete.
   * If the user's input doesn't match any existing team, append a "create" option.
   */
  const filterTeamOptions = useCallback(
    (options: TeamOption[], { inputValue }: { inputValue: string }): TeamOption[] => {
      const trimmed = inputValue.trim();
      const filtered = options.filter((o) => o.name.toLowerCase().includes(trimmed.toLowerCase()));

      const exactMatch = options.some((o) => o.name.toLowerCase() === trimmed.toLowerCase());

      if (trimmed && !exactMatch) {
        filtered.push({
          id: `${ADD_NEW_TEAM_PREFIX}${trimmed}`,
          name: trimmed,
          isNew: true,
        });
      }

      return filtered;
    },
    [],
  );

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleFormSubmit = (values: AddPageFormValues) => {
    onSubmit(values);
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <Box
      component="form"
      onSubmit={handleSubmit(handleFormSubmit)}
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: "4px",
        p: "4px",
        pt: "8px",
        borderRadius: "12px",
        backgroundColor: theme.palette.fill.secondary.light.active,
        boxShadow: "0px 1px 8px 2px rgba(0,0,0,0.12)",
        width: "100%",
      }}
    >
      {/* ── Modal header ─────────────────────────────────────────────── */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 1,
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
          Add a Team
        </Typography>
      </Box>

      {/* ── Content card ─────────────────────────────────────────────── */}
      <Box
        sx={{
          backgroundColor: theme.palette.surface.secondary.active,
          border: `1px solid ${theme.palette.customBorder.primary.b2.active}`,
          borderRadius: "12px",
          p: 2,
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        {/* Section header */}
        <Box>
          <Typography
            variant="h6"
            sx={{ color: theme.palette.customText.primary.p2.active, pb: 1 }}
          >
            Add teams
          </Typography>
          <Divider sx={{ borderColor: theme.palette.customBorder.primary.b2.active }} />
        </Box>

        {/* ── Teams autocomplete ──────────────────────────────────────── */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <FieldLabel>Teams</FieldLabel>

          <Box sx={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <Controller
              name="team"
              control={control}
              render={({ field }) => (
                <Autocomplete<TeamOption, false, false, false>
                  {...field}
                  options={teamOptions}
                  filterOptions={filterTeamOptions}
                  getOptionLabel={(o) => o.name}
                  isOptionEqualToValue={(a, b) => a.id === b.id}
                  value={field.value}
                  onChange={(_, val) => {
                    field.onChange(val);
                    // Reset head when switching team selection
                    setValue("head", null);
                  }}
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
                    <TextField {...params} placeholder="Select an existing team" size="small" />
                  )}
                  sx={{ flex: 1 }}
                />
              )}
            />

            <Button
              type="button"
              variant="outlined"
              color="neutral"
              size="small"
              onClick={handleSubmit(handleFormSubmit)}
              sx={{ whiteSpace: "nowrap", height: 37 }}
            >
              Add
            </Button>
          </Box>
        </Box>

        {/* ── Team Head (only shown when creating a new team) ──────────── */}
        {isNewTeam && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <FieldLabel>Team Head</FieldLabel>

            <Box sx={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <Controller
                name="head"
                control={control}
                render={({ field }) => (
                  <Autocomplete<EmployeeBasicInfo, false, false, false>
                    {...field}
                    options={employees}
                    loading={isEmployeesLoading}
                    getOptionLabel={(o) => `${o.firstName} ${o.lastName}`}
                    isOptionEqualToValue={(a, b) => a.employeeId === b.employeeId}
                    value={field.value}
                    onChange={(_, val) => field.onChange(val)}
                    renderOption={(props, employee) => (
                      <EmployeeOption
                        key={employee.employeeId}
                        listItemProps={props}
                        employee={employee}
                      />
                    )}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="Select an existing team"
                        size="small"
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {isEmployeesLoading && <CircularProgress size={14} />}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                    sx={{ flex: 1 }}
                  />
                )}
              />

              <Button
                type="button"
                variant="outlined"
                color="neutral"
                size="small"
                sx={{ whiteSpace: "nowrap", height: 37 }}
              >
                Add
              </Button>
            </Box>
          </Box>
        )}

        {/* ── Functional Lead autocomplete ────────────────────────────── */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <FieldLabel>Functional Lead</FieldLabel>

          <Box sx={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <Controller
              name="functionalLead"
              control={control}
              render={({ field }) => (
                <Autocomplete<EmployeeBasicInfo, false, false, false>
                  {...field}
                  options={employees}
                  loading={isEmployeesLoading}
                  getOptionLabel={(o) => `${o.firstName} ${o.lastName}`}
                  isOptionEqualToValue={(a, b) => a.employeeId === b.employeeId}
                  value={field.value}
                  onChange={(_, val) => field.onChange(val)}
                  renderOption={(props, employee) => (
                    <EmployeeOption
                      key={employee.employeeId}
                      listItemProps={props}
                      employee={employee}
                    />
                  )}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Select an existing team"
                      size="small"
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {isEmployeesLoading && <CircularProgress size={14} />}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                  sx={{ flex: 1 }}
                />
              )}
            />

            <Button
              type="button"
              variant="outlined"
              color="neutral"
              size="small"
              sx={{ whiteSpace: "nowrap", height: 37 }}
            >
              Add
            </Button>
          </Box>
        </Box>

        {/* ── Action buttons ──────────────────────────────────────────── */}
        <Box sx={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
          <Button type="button" variant="outlined" size="small" onClick={onCancel}>
            Cancel
          </Button>

          <Button type="submit" variant={"primary" as any} size="small">
            Add Team
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default AddPage;
