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
import { EmployeeSearchPayload, EmployeeStatus, Filters } from "@slices/employeeSlice/employee";
import {
  BusinessUnit,
  CareerFunction,
  Designation,
  EmploymentType,
  fetchDesignations,
  fetchSubTeams,
  fetchTeams,
  fetchUnits,
  Office,
  SubTeam,
  Team,
  Unit,
} from "@slices/organizationSlice/organization";
import { useAppDispatch } from "@slices/store";
import { useEffect, useState } from "react";
import {
  CareerFunctionAndDesignationFilters,
  CareerFunctionsAndDesignationsSelection,
} from "./CareerFunctionAndDesignationFilters";
import {
  LocationAndOfficeFilters,
  LocationAndOfficeSelection,
} from "./LocationAndOfficeFilters";
import {
  OrganizationSelection,
  OrganizationTreeFilters,
} from "./OrganizationTreeFilters";

type FilterDrawerProps = {
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  setFiltersAppliedOnce: (applied: boolean) => void;
  appliedFilter: EmployeeSearchPayload;
  onApply: (next: Partial<EmployeeSearchPayload>) => void;
  clearAll: () => void;
  businessUnits: BusinessUnit[];
  teams: Team[];
  subTeams: SubTeam[];
  units: Unit[];
  careerFunctions: CareerFunction[];
  designations: Designation[];
  employmentTypes: EmploymentType[];
  managerEmails: string[];
  locations: string[];
  filteredOfficesByLocation: Office[];
};

export function FilterDrawer({
  drawerOpen,
  setDrawerOpen,
  setFiltersAppliedOnce,
  appliedFilter,
  onApply,
  clearAll,
  businessUnits,
  teams,
  subTeams,
  units,
  careerFunctions,
  designations,
  employmentTypes,
  managerEmails,
  locations,
  filteredOfficesByLocation,
}: FilterDrawerProps) {
  const dispatch = useAppDispatch();
  const [draft, setDraft] = useState<EmployeeSearchPayload>(appliedFilter);

  useEffect(() => {
    if (drawerOpen) {
      setDraft(appliedFilter);
    }
  }, [drawerOpen, appliedFilter]);

  const set = (patch: Partial<Filters>) => {
    setDraft((p) => ({ filters: { ...p.filters, ...patch } }));
  };

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
                    businessUnitId: draft.filters.businessUnitId,
                    teamId: draft.filters.teamId,
                    subTeamId: draft.filters.subTeamId,
                    unitId: draft.filters.unitId,
                  } as OrganizationSelection
                }
                businessUnits={businessUnits}
                teams={teams}
                subTeams={subTeams}
                units={units}
                onChangeBusinessUnit={(selected: BusinessUnit | null) => {
                  set({
                    businessUnitId: selected?.id,
                    teamId: undefined,
                    subTeamId: undefined,
                    unitId: undefined,
                  });
                  if (selected?.id) dispatch(fetchTeams({ id: selected.id }));
                }}
                onChangeTeam={(selected: Team | null) => {
                  set({
                    teamId: selected?.id,
                    subTeamId: undefined,
                    unitId: undefined,
                  });
                  if (selected?.id)
                    dispatch(fetchSubTeams({ id: selected.id }));
                }}
                onChangeSubTeam={(selected: SubTeam | null) => {
                  set({ subTeamId: selected?.id, unitId: undefined });
                  if (selected?.id) dispatch(fetchUnits({ id: selected.id }));
                }}
                onChangeUnit={(selected: Unit | null) => {
                  set({ unitId: selected?.id });
                }}
              />
            </Grid>
            <Grid item>
              <Divider />
            </Grid>
            <Grid item>
              <CareerFunctionAndDesignationFilters
                value={
                  {
                    careerFunctionId: draft.filters.careerFunctionId,
                    designationId: draft.filters.designationId,
                  } as CareerFunctionsAndDesignationsSelection
                }
                careerFunctions={careerFunctions}
                designations={designations}
                onChangeCareerFunction={(selected: CareerFunction | null) => {
                  set({
                    careerFunctionId: selected?.id,
                    designationId: undefined,
                  });
                  if (selected?.id)
                    dispatch(
                      fetchDesignations({ careerFunctionId: selected.id }),
                    );
                }}
                onChangeDesignation={(selected: Designation | null) => {
                  set({ designationId: selected?.id });
                }}
              />
            </Grid>
            <Grid item>
              <Divider />
            </Grid>
            <Grid item>
              <LocationAndOfficeFilters
                value={
                  {
                    location: draft.filters.location,
                    officeId: draft.filters.officeId,
                  } as LocationAndOfficeSelection
                }
                locations={locations}
                offices={filteredOfficesByLocation}
                onChangeLocation={(selected: string | null) => {
                  set({ location: selected  || undefined, officeId: undefined });
                }}
                onChangeOffice={(selected: Office | null) => {
                  set({ officeId: selected?.id });
                }}
              />
            </Grid>
            <Grid item>
              <Divider />
            </Grid>
            <Grid item>
              <Autocomplete<EmploymentType, false, false, false>
                options={employmentTypes.map((et) => et)}
                getOptionLabel={(o) => o.name}
                value={
                  employmentTypes.find(
                    (et) => et.id === draft.filters.employmentTypeId,
                  ) ?? null
                }
                autoHighlight
                autoSelect
                onChange={(_, selected) =>
                  set({ employmentTypeId: selected?.id || undefined })
                }
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
            <Grid item>
              <Autocomplete<string, false, false, false>
                options={managerEmails}
                getOptionLabel={(email) => email}
                value={
                  managerEmails.find((e) => e === draft.filters.managerEmail) ?? null
                }
                autoHighlight
                autoSelect
                onChange={(_, selected) =>
                  set({ managerEmail: selected || undefined })
                }
                ListboxProps={{ style: { maxHeight: 240, overflow: "auto" } }}
                renderInput={(params) => (
                  <BaseTextField
                    {...params}
                    size="small"
                    label="Manager Email"
                  />
                )}
              />
            </Grid>
            <Grid item>
              <Autocomplete<string, false, false, false>
                options={EmployeeGenders}
                getOptionLabel={(o) => o}
                value={EmployeeGenders.find((g) => g === draft.filters.gender) ?? null}
                autoHighlight
                autoSelect
                onChange={(_, selected) =>
                  set({ gender: selected || undefined })
                }
                renderInput={(params) => (
                  <BaseTextField {...params} size="small" label="Gender" />
                )}
              />
            </Grid>
            <Grid item>
              <Autocomplete<EmployeeStatus, false, false, false>
                options={Object.values(EmployeeStatus)}
                getOptionLabel={(o) => o}
                value={ Object.values(EmployeeStatus).find((es) => es === draft.filters.employeeStatus) ?? null }
                autoHighlight
                autoSelect
                onChange={(_, selected) =>
                  set({ employeeStatus: selected || undefined })
                }
                renderInput={(params) => (
                  <BaseTextField {...params} size="small" label="Employee Status" />
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
              const nextDraft = {
                filters: {
                  ...draft.filters,
                },
                pagination: {
                  page: DEFAULT_PAGE_VALUE,
                  perPage: DEFAULT_PER_PAGE_VALUE,
                },
              };  
              onApply(nextDraft);  
              setDraft(nextDraft);  
              setDrawerOpen(false);
              setFiltersAppliedOnce(true);
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
