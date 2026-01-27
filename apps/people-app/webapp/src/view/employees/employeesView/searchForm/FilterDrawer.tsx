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

import {
  DEFAULT_PAGE_VALUE,
  DEFAULT_PER_PAGE_VALUE,
  EmployeeGenders,
} from "@config/constant";
import ClearIcon from "@mui/icons-material/Clear";
import {
  Autocomplete,
  Box,
  Button,
  Divider,
  Drawer,
  Grid,
  IconButton,
  Typography,
} from "@mui/material";
import { BaseTextField } from "@root/src/component/common/FieldInput/BasicFieldInput/BaseTextField";
import { EmployeeFilterAttributes } from "@slices/employeeSlice/employee";
import {
  BusinessUnit,
  Designation,
  EmploymentType,
  fetchSubTeams,
  fetchTeams,
  fetchUnits,
  SubTeam,
  Team,
  Unit,
} from "@slices/organizationSlice/organization";
import { useAppDispatch } from "@slices/store";
import { useEffect, useMemo, useState } from "react";
import {
  OrganizationSelection,
  OrganizationTreeFilters,
} from "./OrganizationTreeFilters";

type FilterDrawerProps = {
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  appliedFilter: EmployeeFilterAttributes;
  onApply: (next: Partial<EmployeeFilterAttributes>) => void;
  clearAll: () => void;
  businessUnits: BusinessUnit[];
  teams: Team[];
  subTeams: SubTeam[];
  units: Unit[];
  designations: Designation[];
  employmentTypes: EmploymentType[];
};

export function FilterDrawer({
  drawerOpen,
  setDrawerOpen,
  appliedFilter,
  onApply,
  clearAll,
  businessUnits,
  teams,
  subTeams,
  units,
  designations,
  employmentTypes,
}: FilterDrawerProps) {
  const dispatch = useAppDispatch();
  const [draft, setDraft] = useState<EmployeeFilterAttributes>(appliedFilter);

  useEffect(() => {
    if (drawerOpen) {
      setDraft(appliedFilter);
    }
  }, [drawerOpen, appliedFilter]);

  const set = (patch: Partial<EmployeeFilterAttributes>) => {
    setDraft((p) => ({ ...p, ...patch }));
  };

  const designationOptions = useMemo(() => designations, [designations]);

  const selectedDesignation = useMemo(
    () => designationOptions.find(d => d.designation === draft.designation) ?? null,
    [designationOptions, draft.designation]
  );

  return (
    <Drawer
      anchor="right"
      open={drawerOpen}
      onClose={() => setDrawerOpen(false)}
    >
      <Box sx={{ width: 600, mt: 6 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            pl: 4,
            pr: 2,
            py: 1.5,
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
          <Typography variant="h5" color="primary">
            Filters
          </Typography>
          <IconButton
            size="small"
            color="primary"
            sx={{
              textTransform: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onClick={() => setDrawerOpen(false)}
          >
            <ClearIcon />
          </IconButton>
        </Box>

        <Box sx={{ flex: 1, overflowY: "auto", px: 4, py: 2 }}>
          <Grid container direction="column" spacing={4}>
            <Grid item>
              <OrganizationTreeFilters
                value={
                  {
                    businessUnit: draft.businessUnit,
                    team: draft.team,
                    subTeam: draft.subTeam,
                    unit: draft.unit,
                  } as OrganizationSelection
                }
                businessUnits={businessUnits}
                teams={teams}
                subTeams={subTeams}
                units={units}
                onChangeBusinessUnit={(selected: BusinessUnit | null) => {
                  set({
                    businessUnit: selected?.name,
                    team: undefined,
                    subTeam: undefined,
                    unit: undefined,
                  });
                  if (selected?.id) dispatch(fetchTeams({ id: selected.id }));
                }}
                onChangeTeam={(selected: Team | null) => {
                  set({
                    team: selected?.name,
                    subTeam: undefined,
                    unit: undefined,
                  });
                  if (selected?.id)
                    dispatch(fetchSubTeams({ id: selected.id }));
                }}
                onChangeSubTeam={(selected: SubTeam | null) => {
                  set({ subTeam: selected?.name, unit: undefined });
                  if (selected?.id) dispatch(fetchUnits({ id: selected.id }));
                }}
                onChangeUnit={(selected: Unit | null) => {
                  set({ unit: selected?.name });
                }}
              />
            </Grid>
            <Grid item>
              <Divider />
            </Grid>
            <Grid item>
              <Autocomplete<string, false, false, false>
                options={EmployeeGenders}
                getOptionLabel={(o) => o}
                value={
                  EmployeeGenders.find((g) => g === draft.gender) ?? null
                }
                autoHighlight
                autoSelect
                onChange={(_, selected) => set({ gender: selected || undefined })}
                renderInput={(params) => (
                  <BaseTextField
                    {...params}
                    size="small"
                    label="Gender"
                  />
                )}
              />
            </Grid>
            <Grid item>
              <Autocomplete<Designation, false, false, false>
                options={designationOptions}
                getOptionLabel={(o) => o.designation}
                value={
                  selectedDesignation
                }
                autoHighlight
                autoSelect
                onChange={(_, selected) => set({ designation: selected?.designation })}
                renderOption={(props, option) => (
                  <li {...props} key={option.id}>{option.designation}</li>
                )}
                ListboxProps={{ style: { maxHeight: 240, overflow: "auto" } }}
                renderInput={(params) => (
                  <BaseTextField
                    {...params}
                    size="small"
                    label="Designation"
                  />
                )}
              />
            </Grid>
            <Grid item>
              <Autocomplete<string, false, false, false>
                options={employmentTypes.map((et) => et.name)}
                getOptionLabel={(o) => o}
                value={
                  employmentTypes.find((et) => et.name === draft.employmentType)?.name ?? null
                }
                autoHighlight
                autoSelect
                onChange={(_, selected) => set({ employmentType: selected || undefined })}
                ListboxProps={{ style: { maxHeight: 240, overflow: "auto" } }}
                renderInput={(params) => (
                  <BaseTextField
                    {...params}
                    size="small"
                    label="Employment Type"
                  />
                )}
              />
            </Grid>
          </Grid>
        </Box>

        <Box
          sx={{
            mt: 2,
            pt: 3,
            px: 2,
            width: "100%",
            display: "flex",
            justifyContent: "flex-end",
            gap: 2,
            borderTop: 1,
            borderColor: "divider",
          }}
        >
          <Button
            variant="outlined"
            color="primary"
            sx={{ textTransform: "none" }}
            onClick={clearAll}
          >
            Clear all
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            onClick={() => {
              onApply(draft);
              setDrawerOpen(false);
              set({
                page: DEFAULT_PAGE_VALUE,
                perPage: DEFAULT_PER_PAGE_VALUE,
              });
            }}
            sx={{ textTransform: "none" }}
          >
            Apply
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
}
