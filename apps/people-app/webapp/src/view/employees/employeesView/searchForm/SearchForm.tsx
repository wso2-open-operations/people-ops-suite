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
import { FilterAlt, FilterAltOutlined } from "@mui/icons-material";
import ClearIcon from "@mui/icons-material/Clear";
import GroupsIcon from "@mui/icons-material/Groups";
import SearchIcon from "@mui/icons-material/Search";
import {
  Box,
  Button,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import { BaseTextField } from "@root/src/component/common/FieldInput/BasicFieldInput/BaseTextField";
import type { EmployeeSearchPayload } from "@slices/employeeSlice/employee";
import {
  EmployeeStatus,
  fetchManagers,
  setEmployeeFilter,
  setFilterAppliedOnce,
} from "@slices/employeeSlice/employee";
import {
  fetchBusinessUnits,
  fetchCareerFunctions,
  fetchDesignations,
  fetchEmploymentTypes,
  fetchOffices,
  fetchSubTeams,
  fetchTeams,
  fetchUnits,
} from "@slices/organizationSlice/organization";
import { useAppDispatch, useAppSelector } from "@slices/store";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FilterChipSelect } from "./FilterChipSelect";
import { FilterDrawer } from "./FilterDrawer";

type ChipItem = {
  key: string;
  label: string;
  onDelete: () => void;
};

export function SearchForm() {
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const employeeState = useAppSelector((state) => state.employee);
  const filterPayload = employeeState.employeeFilter as EmployeeSearchPayload;
  const filtersAppliedOnce = useAppSelector(
    (state) => state.employee.filterAppliedOnce,
  );

  const {
    businessUnits,
    teams,
    subTeams,
    units,
    careerFunctions,
    designations,
    employmentTypes,
    offices,
  } = useAppSelector((state) => state.organization);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const debounceRef = useRef<number | null>(null);
  const [searchText, setSearchText] = useState(
    filterPayload.searchString ?? "",
  );

  useEffect(() => {
    setSearchText(filterPayload.searchString ?? "");
  }, [filterPayload.searchString]);

  useEffect(() => {
    dispatch(fetchManagers());
    dispatch(fetchEmploymentTypes());
    dispatch(fetchDesignations({}));
    dispatch(fetchBusinessUnits());
    dispatch(fetchCareerFunctions());
    dispatch(fetchOffices());
  }, [dispatch]);

  const locations: string[] = useMemo(() => {
    return Array.from(new Set(offices.map((office) => office.location)));
  }, [offices]);

  const filteredOfficesByLocation = useMemo(() => {
    return offices.filter((o) => o.location === filterPayload.filters.location);
  }, [offices, filterPayload.filters.location]);

  const filterRef = useRef<EmployeeSearchPayload>(filterPayload);
  useEffect(() => {
    filterRef.current = filterPayload;
  }, [filterPayload]);

  const updateSearchPayload = useCallback(
    (patch: Partial<EmployeeSearchPayload>) => {
      const nextPayload = {
        searchString: patch.searchString ?? filterRef.current.searchString,
        filters: {
          ...filterRef.current.filters,
          ...patch.filters,
        },
        pagination: patch.pagination ?? filterRef.current.pagination,
      };
      dispatch(setEmployeeFilter(nextPayload));
    },
    [dispatch],
  );

  const clearAll = () => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    dispatch(
      setEmployeeFilter({
        searchString: searchText,
        pagination: {
          page: DEFAULT_PAGE_VALUE,
          perPage: DEFAULT_PER_PAGE_VALUE,
        },
      } as EmployeeSearchPayload),
    );
  };

  function hasAnyActiveFilters(
    filters: EmployeeSearchPayload["filters"],
  ): boolean {
    const {
      businessUnitId,
      teamId,
      subTeamId,
      unitId,
      careerFunctionId,
      designationId,
      gender,
      employmentTypeId,
      managerEmail,
      location,
      officeId,
    } = filters;

    return Boolean(
      businessUnitId ||
      teamId ||
      subTeamId ||
      unitId ||
      careerFunctionId ||
      gender ||
      designationId ||
      employmentTypeId ||
      managerEmail ||
      location ||
      officeId,
    );
  }

  const active = useMemo(
    () => hasAnyActiveFilters(filterPayload.filters),
    [filterPayload],
  );
  const managerEmails = useMemo(() => {
    return employeeState.managers.map((manager) => manager.workEmail);
  }, [employeeState.managers]);
  const chips = useMemo(() => {
    const items: ChipItem[] = [];

    const addChipItem = (chipItem: ChipItem) => {
      items.push(chipItem);
    };

    if (filterPayload.filters.businessUnitId) {
      addChipItem({
        key: "businessUnit",
        label: `Business Unit: ${businessUnits.find((bu) => bu.id === filterPayload.filters.businessUnitId)?.name}`,
        onDelete: () =>
          updateSearchPayload({
            filters: {
              businessUnitId: undefined,
              teamId: undefined,
              subTeamId: undefined,
              unitId: undefined,
            },
          }),}
      );
    }
    if (filterPayload.filters.teamId) {
      addChipItem({
        key: "team",
        label: `Team: ${teams.find((team) => team.id === filterPayload.filters.teamId)?.name}`,
        onDelete: () =>
          updateSearchPayload({
            filters: {
              teamId: undefined,
              subTeamId: undefined,
              unitId: undefined,
            },
          }),}
      );
    }
    if (filterPayload.filters.subTeamId) {
      addChipItem({
        key: "subTeam",
        label: `Sub Team: ${subTeams.find((subTeam) => subTeam.id === filterPayload.filters.subTeamId)?.name}`,
        onDelete: () =>
          updateSearchPayload({
            filters: { subTeamId: undefined, unitId: undefined },
          }),
      }
      );
    }
    if (filterPayload.filters.unitId) {
      addChipItem({
        key: "unit",
        label: `Unit: ${units.find((unit) => unit.id === filterPayload.filters.unitId)?.name}`,
        onDelete: () => updateSearchPayload({ filters: { unitId: undefined } }),
      });
    }
    if (filterPayload.filters.gender) {
      addChipItem({
        key: "gender",
        label: `Gender: ${filterPayload.filters.gender}`,
        onDelete: () => updateSearchPayload({ filters: { gender: undefined } }),
      });
    }
    if (filterPayload.filters.careerFunctionId) {
      addChipItem({
        key: "careerFunction",
        label: `Career Function: ${careerFunctions.find((cf) => cf.id === filterPayload.filters.careerFunctionId)?.careerFunction}`,
        onDelete: () => updateSearchPayload({ filters: { careerFunctionId: undefined } }),
      });
    }
    if (filterPayload.filters.designationId) {
      addChipItem({
        key: "designation",
        label: `Designation: ${designations.find((designation) => designation.id === filterPayload.filters.designationId)?.designation}`,
        onDelete: () => updateSearchPayload({ filters: { designationId: undefined } }),
      });
    }
    if (filterPayload.filters.employmentTypeId) {
      addChipItem({
        key: "employmentType",
        label: `Employment Type: ${employmentTypes.find((et) => et.id === filterPayload.filters.employmentTypeId)?.name}`,
        onDelete: () => updateSearchPayload({ filters: { employmentTypeId: undefined } }),
      });
    }
    if (filterPayload.filters.managerEmail) {
      addChipItem({
        key: "managerEmail",
        label: `Manager Email: ${filterPayload.filters.managerEmail}`,
        onDelete: () => updateSearchPayload({ filters: { managerEmail: undefined } }),
      });
    }
    if (filterPayload.filters.employeeStatus) {
      addChipItem({
        key: "employeeStatus",
        label: `Employee Status: ${filterPayload.filters.employeeStatus}`,
        onDelete: () => updateSearchPayload({ filters: { employeeStatus: undefined } }),
      });
    }
    if (filterPayload.filters.location) {
      addChipItem({
        key: "location",
        label: `Location: ${filterPayload.filters.location}`,
        onDelete: () => updateSearchPayload({ filters: { location: undefined } }),
      });
    }
    if (filterPayload.filters.officeId) {
      addChipItem({
        key: "office",
        label: `Office: ${offices.find((office) => office.id === filterPayload.filters.officeId)?.name}`,
        onDelete: () => updateSearchPayload({ filters: { officeId: undefined } }),
      });
    }
    return items;
  }, [
    businessUnits,
    careerFunctions,
    designations,
    employmentTypes,
    filterPayload.filters.businessUnitId,
    filterPayload.filters.careerFunctionId,
    filterPayload.filters.designationId,
    filterPayload.filters.employeeStatus,
    filterPayload.filters.employmentTypeId,
    filterPayload.filters.gender,
    filterPayload.filters.location,
    filterPayload.filters.managerEmail,
    filterPayload.filters.officeId,
    filterPayload.filters.subTeamId,
    filterPayload.filters.teamId,
    filterPayload.filters.unitId,
    offices,
    subTeams,
    teams,
    units,
    updateSearchPayload,
  ]);

  return (
    <Box sx={{ my: 2 }}>
      {/* Search */}
      <Grid
        container
        justifyContent="flex-end"
        spacing={2}
        alignItems="flex-end"
      >
        <Grid item flex={1}>
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              gap: 0.5,
              alignItems: "center",
            }}
          >
            <Box sx={{ ml: 0.8, mt: 0.5 }}>
              <GroupsIcon />
            </Box>
            <Stack
              sx={{
                p: 0.8,
              }}
              flexDirection="row"
              gap={1}
            >
              <Typography variant="h5" fontWeight="bold">
                Employees
              </Typography>
            </Stack>
          </Box>
        </Grid>
        <Grid item sx={{ display: "flex", alignItems: "center", width: "40%" }}>
          <BaseTextField
            id="searchString"
            size="small"
            name="searchString"
            label="Search"
            value={searchText}
            onChange={(e) => {
              const value = e.target.value;
              setSearchText(value);
              if (debounceRef.current) window.clearTimeout(debounceRef.current);
              debounceRef.current = window.setTimeout(() => {
                updateSearchPayload({ searchString: value });
              }, 300);
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="Clear search"
                    edge="end"
                    size="small"
                    disabled={!searchText}
                    onClick={() => {
                      if (debounceRef.current)
                        window.clearTimeout(debounceRef.current);
                      setSearchText("");
                      updateSearchPayload({ searchString: "" });
                    }}
                  >
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        <Grid item>
          <Box sx={{ display: "flex", alignItems: "center", height: "40px" }}>
            <Tooltip title="Filters">
              <Button
                variant="outlined"
                color="secondary"
                onClick={() => {
                  setDrawerOpen(true);
                }}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  textTransform: "none",
                  p: 1,
                  height: "40px",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  {active ? (
                    <FilterAlt sx={{ fontSize: 28 }} />
                  ) : (
                    <FilterAltOutlined sx={{ fontSize: 28 }} />
                  )}
                </Box>
                <Typography variant="h5" sx={{ letterSpacing: 1 }}>
                  Filters
                </Typography>
              </Button>
            </Tooltip>
          </Box>
        </Grid>
      </Grid>

      <Divider sx={{ my: 2 }} />

      {/* Chips */}

      <Box sx={{ mt: 1 }}>
        {/* Dropdown chips */}
        {filtersAppliedOnce && (
          <Stack
            direction="row"
            spacing={2}
            useFlexGap
            flexWrap="wrap"
            alignItems="center"
          >
            <FilterChipSelect
              label="Business Unit"
              value={
                businessUnits.find(
                  (businessUnit) =>
                    businessUnit.id === filterPayload.filters.businessUnitId,
                )?.name
              }
              options={businessUnits}
              getLabel={(businessUnit) => businessUnit.name}
              onChange={(businessUnit) => {
                updateSearchPayload({
                  filters: {
                    businessUnitId: businessUnit.id,
                    teamId: undefined,
                    subTeamId: undefined,
                    unitId: undefined,
                  },
                });
                dispatch(fetchTeams({ id: businessUnit.id }));
              }}
              onClear={() =>
                updateSearchPayload({
                  filters: {
                    businessUnitId: undefined,
                    teamId: undefined,
                    subTeamId: undefined,
                    unitId: undefined,
                  },
                })
              }
            />

            <FilterChipSelect
              label="Team"
              value={
                teams.find((team) => team.id === filterPayload.filters.teamId)
                  ?.name
              }
              options={teams}
              parent="Business Unit"
              noParentSelected={!filterPayload.filters.businessUnitId}
              getLabel={(team) => team.name}
              onChange={(team) => {
                updateSearchPayload({
                  filters: {
                    teamId: team.id,
                    subTeamId: undefined,
                    unitId: undefined,
                  },
                });
                dispatch(fetchSubTeams({ id: team.id }));
              }}
              onClear={() =>
                updateSearchPayload({
                  filters: {
                    teamId: undefined,
                    subTeamId: undefined,
                    unitId: undefined,
                  },
                })
              }
            />
            <FilterChipSelect
              label="Sub Team"
              value={
                subTeams.find(
                  (subTeam) => subTeam.id === filterPayload.filters.subTeamId,
                )?.name
              }
              options={subTeams}
              parent="Team"
              noParentSelected={!filterPayload.filters.teamId}
              getLabel={(subTeam) => subTeam.name}
              onChange={(subTeam) => {
                updateSearchPayload({
                  filters: { subTeamId: subTeam.id, unitId: undefined },
                });
                dispatch(fetchUnits({ id: subTeam.id }));
              }}
              onClear={() =>
                updateSearchPayload({
                  filters: { subTeamId: undefined, unitId: undefined },
                })
              }
            />
            <FilterChipSelect
              label="Unit"
              value={
                units.find((unit) => unit.id === filterPayload.filters.unitId)
                  ?.name
              }
              options={units}
              parent="Sub Team"
              noParentSelected={!filterPayload.filters.subTeamId}
              getLabel={(unit) => unit.name}
              onChange={(unit) =>
                updateSearchPayload({ filters: { unitId: unit.id } })
              }
              onClear={() =>
                updateSearchPayload({ filters: { unitId: undefined } })
              }
            />
            <FilterChipSelect
              label="Career Function"
              value={
                careerFunctions.find(
                  (careerFunction) =>
                    careerFunction.id ===
                    filterPayload.filters.careerFunctionId,
                )?.careerFunction
              }
              options={careerFunctions}
              getLabel={(careerFunction) => careerFunction.careerFunction}
              onChange={(careerFunction) => {
                updateSearchPayload({
                  filters: {
                    careerFunctionId: careerFunction.id,
                    designationId: undefined,
                  },
                });
                dispatch(
                  fetchDesignations({ careerFunctionId: careerFunction.id }),
                );
              }}
              onClear={() =>
                updateSearchPayload({
                  filters: {
                    careerFunctionId: undefined,
                    designationId: undefined,
                  },
                })
              }
            />
            <FilterChipSelect
              label="Designation"
              value={
                designations.find(
                  (designation) =>
                    designation.id === filterPayload.filters.designationId,
                )?.designation
              }
              options={designations}
              parent="Career Function"
              noParentSelected={!filterPayload.filters.careerFunctionId}
              getLabel={(designation) => designation.designation}
              onChange={(designation) => {
                updateSearchPayload({
                  filters: { designationId: designation.id },
                });
              }}
              onClear={() =>
                updateSearchPayload({ filters: { designationId: undefined } })
              }
            />
            <FilterChipSelect
              label="Location"
              value={filterPayload.filters.location}
              options={locations}
              getLabel={(location) => location}
              onChange={(location) => {
                updateSearchPayload({
                  filters: { location, officeId: undefined },
                });
              }}
              onClear={() =>
                updateSearchPayload({
                  filters: { location: undefined, officeId: undefined },
                })
              }
            />
            <FilterChipSelect
              label="Office"
              value={
                filteredOfficesByLocation.find(
                  (office) => office.id === filterPayload.filters.officeId,
                )?.name
              }
              parent="Location"
              noParentSelected={!filterPayload.filters.location}
              options={filteredOfficesByLocation}
              getLabel={(office) => office.name}
              onChange={(office) => {
                updateSearchPayload({ filters: { officeId: office.id } });
              }}
              onClear={() =>
                updateSearchPayload({ filters: { officeId: undefined } })
              }
            />
            <FilterChipSelect
              label="Employment Type"
              value={
                employmentTypes.find(
                  (employeeType) =>
                    employeeType.id === filterPayload.filters.employmentTypeId,
                )?.name
              }
              options={employmentTypes}
              getLabel={(employeeType) => employeeType.name}
              onChange={(employeeType) =>
                updateSearchPayload({
                  filters: { employmentTypeId: employeeType.id },
                })
              }
              onClear={() =>
                updateSearchPayload({
                  filters: { employmentTypeId: undefined },
                })
              }
            />
            <FilterChipSelect
              label="Manager Email"
              value={managerEmails.find(
                (email) => email === filterPayload.filters.managerEmail,
              )}
              options={managerEmails}
              getLabel={(managerEmail) => managerEmail}
              onChange={(managerEmail) =>
                updateSearchPayload({ filters: { managerEmail } })
              }
              onClear={() =>
                updateSearchPayload({ filters: { managerEmail: undefined } })
              }
            />
            <FilterChipSelect
              label="Employee Status"
              value={filterPayload.filters.employeeStatus}
              options={Object.values(EmployeeStatus)}
              getLabel={(status) => status}
              onChange={(status) =>
                updateSearchPayload({ filters: { employeeStatus: status } })
              }
              onClear={() =>
                updateSearchPayload({ filters: { employeeStatus: undefined } })
              }
            />
            <FilterChipSelect
              label="Gender"
              value={filterPayload.filters.gender}
              options={EmployeeGenders}
              getLabel={(gender) => gender}
              onChange={(gender) =>
                updateSearchPayload({ filters: { gender } })
              }
              onClear={() =>
                updateSearchPayload({ filters: { gender: undefined } })
              }
            />

            {chips.length > 0 && (
              <Button
                variant="text"
                onClick={clearAll}
                sx={{
                  textTransform: "none",
                  height: "32px",
                  borderRadius: "50px",
                  px: 2,
                  // border: `1px solid ${theme.palette.divider}`,
                  transition: "all 0.2s ease",
                  "&:hover": {
                    backgroundColor:
                      theme.palette.mode === "dark"
                        ? theme.palette.grey[800]
                        : theme.palette.grey[300],
                    borderColor: theme.palette.error.main,
                  },
                }}
              >
                <ClearIcon
                  fontSize="small"
                  sx={{
                    mr: 0.5,
                    fontSize: 16,
                    transition: "color 0.2s ease",
                  }}
                />
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontSize: "12px",
                    fontWeight: 600,
                    transition: "color 0.2s ease",
                  }}
                >
                  Clear filters
                </Typography>
              </Button>
            )}
          </Stack>
        )}
      </Box>

      <FilterDrawer
        drawerOpen={drawerOpen}
        setDrawerOpen={setDrawerOpen}
        setFiltersAppliedOnce={(value) => dispatch(setFilterAppliedOnce(value))}
        appliedFilter={filterPayload}
        onApply={updateSearchPayload}
        clearAll={clearAll}
        businessUnits={businessUnits}
        teams={teams}
        subTeams={subTeams}
        units={units}
        careerFunctions={careerFunctions}
        designations={designations}
        employmentTypes={employmentTypes}
        managerEmails={managerEmails}
        locations={locations}
        filteredOfficesByLocation={filteredOfficesByLocation}
      />
    </Box>
  );
}
