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
  Box,
  Button,
  Drawer,
  Grid,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import {
  OrganizationSelection,
  OrganizationTreeFilters,
} from "./OrganizationTreeFilters";
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
import { EmployeeGenders, Countries } from "@config/constant";
import { useAppDispatch } from "@slices/store";

type FilterDrawerProps = {
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  filter: EmployeeFilterAttributes;
  updateFilter: (patch: Partial<EmployeeFilterAttributes>) => void;
  clearAll: () => void;
  fieldSx: any;
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
  filter,
  updateFilter,
  clearAll,
  fieldSx,
  businessUnits,
  teams,
  subTeams,
  units,
  designations,
  employmentTypes,
}: FilterDrawerProps) {
    
  const dispatch = useAppDispatch();

  return (
    <Drawer
      anchor="right"
      open={drawerOpen}
      onClose={() => setDrawerOpen(false)}
    >
      <Box sx={{ width: 720, p: 2 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 1,
          }}
        >
          <Typography variant="h6">Filters</Typography>
          <Button variant="text" onClick={clearAll}>
            Clear all
          </Button>
        </Box>

        <Grid container spacing={2} alignItems="stretch">
          <Grid item xs={12} md={6} sx={{ display: "flex" }}>
            <OrganizationTreeFilters
              value={
                {
                  businessUnit: filter.businessUnit,
                  team: filter.team,
                  subTeam: filter.subTeam,
                  unit: filter.unit,
                } as OrganizationSelection
              }
              fieldSx={fieldSx}
              businessUnits={businessUnits}
              teams={teams}
              subTeams={subTeams}
              units={units}
              onChangeBusinessUnit={(selected: BusinessUnit | null) => {
                updateFilter({
                  businessUnit: selected?.name,
                  team: undefined,
                  subTeam: undefined,
                  unit: undefined,
                });
                if (selected?.id) dispatch(fetchTeams({ id: selected.id }));
              }}
              onChangeTeam={(selected: Team | null) => {
                updateFilter({
                  team: selected?.name,
                  subTeam: undefined,
                  unit: undefined,
                });
                if (selected?.id) dispatch(fetchSubTeams({ id: selected.id }));
              }}
              onChangeSubTeam={(selected: SubTeam | null) => {
                updateFilter({ subTeam: selected?.name, unit: undefined });
                if (selected?.id) dispatch(fetchUnits({ id: selected.id }));
              }}
              onChangeUnit={(selected: Unit | null) => {
                updateFilter({ unit: selected?.name });
              }}
            />
          </Grid>

          <Grid item xs={12} md={6} sx={{ display: "flex" }}>
            <Box
              sx={{
                border: 1,
                borderColor: "divider",
                borderRadius: 1,
                p: 2,
                width: "100%",
                height: "100%",
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                Other Filters
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    size="small"
                    fullWidth
                    label="Gender"
                    value={filter.gender ?? ""}
                    onChange={(e) =>
                      updateFilter({ gender: e.target.value || undefined })
                    }
                    sx={fieldSx}
                  >
                    {EmployeeGenders.map((g) => (
                      <MenuItem key={g} value={g}>
                        {g}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    size="small"
                    fullWidth
                    label="Country"
                    value={filter.country ?? ""}
                    onChange={(e) =>
                      updateFilter({ country: e.target.value || undefined })
                    }
                    sx={fieldSx}
                  >
                    {Countries.map((c) => (
                      <MenuItem key={c} value={c}>
                        {c}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    size="small"
                    fullWidth
                    label="Designation"
                    value={filter.designation ?? ""}
                    onChange={(e) =>
                      updateFilter({ designation: e.target.value || undefined })
                    }
                    sx={fieldSx}
                  >
                    {designations.map((d) => (
                      <MenuItem key={d.id} value={d.designation}>
                        {d.designation}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    size="small"
                    fullWidth
                    label="Employment Type"
                    value={filter.employmentType ?? ""}
                    onChange={(e) =>
                      updateFilter({
                        employmentType: e.target.value || undefined,
                      })
                    }
                    sx={fieldSx}
                  >
                    {employmentTypes.map((et) => (
                      <MenuItem key={et.id} value={et.name}>
                        {et.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
              </Grid>
            </Box>
          </Grid>
        </Grid>

        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
          <Button
            variant="contained"
            color="secondary"
            onClick={() => setDrawerOpen(false)}
          >
            Done
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
}
