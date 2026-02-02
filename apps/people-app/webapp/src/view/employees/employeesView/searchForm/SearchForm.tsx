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
  EmployeeGenders
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
import type { EmployeeFilterAttributes } from "@slices/employeeSlice/employee";
import {
  fetchManagerEmails,
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
  const filter = employeeState.employeeFilter as EmployeeFilterAttributes;
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
  const [searchText, setSearchText] = useState(filter.searchString ?? "");

  useEffect(() => {
    setSearchText(filter.searchString ?? "");
  }, [filter.searchString]);

  useEffect(() => {
    dispatch(fetchManagerEmails());
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
    return offices.filter((o) => o.location === filter.location);
  }, [offices, filter.location]);

  const updateFilter = useCallback(
    (patch: Partial<EmployeeFilterAttributes>) => {
      dispatch(
        setEmployeeFilter({
          ...filter,
          ...patch,
          page: DEFAULT_PAGE_VALUE,
          perPage: DEFAULT_PER_PAGE_VALUE,
        } as EmployeeFilterAttributes),
      );
    },
    [dispatch, filter],
  );

  const clearAll = () => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    dispatch(
      setEmployeeFilter({
        page: DEFAULT_PAGE_VALUE,
        perPage: DEFAULT_PER_PAGE_VALUE,
        searchString: filter.searchString ?? "",
      } as EmployeeFilterAttributes),
    );
  };

  function hasAnyActiveFilters(filter: EmployeeFilterAttributes): boolean {
    const {
      businessUnitId,
      teamId,
      subTeamId,
      unitId,
      careerFunctionId,
      designationId,
      gender,
      employmentTypeId,
      location,
      officeId,
    } = filter;

    return Boolean(
      businessUnitId ||
      teamId ||
      subTeamId ||
      unitId ||
      careerFunctionId ||
      gender ||
      designationId ||
      employmentTypeId ||
      location ||
      officeId,
    );
  }

  const active = useMemo(() => hasAnyActiveFilters(filter), [filter]);
  const chips = useMemo(() => {
    const items: ChipItem[] = [];

    const addChipItem = (key: string, label: string, onDelete: () => void) => {
      items.push({ key, label, onDelete });
    };

    if (filter.businessUnitId) {
      addChipItem(
        "businessUnit",
        `Business Unit: ${filter.businessUnitId}`,
        () =>
          updateFilter({
            businessUnitId: undefined,
            teamId: undefined,
            subTeamId: undefined,
            unitId: undefined,
          }),
      );
    }
    if (filter.teamId) {
      addChipItem("team", `Team: ${filter.teamId}`, () =>
        updateFilter({
          teamId: undefined,
          subTeamId: undefined,
          unitId: undefined,
        }),
      );
    }
    if (filter.subTeamId) {
      addChipItem("subTeam", `Sub Team: ${filter.subTeamId}`, () =>
        updateFilter({ subTeamId: undefined, unitId: undefined }),
      );
    }
    if (filter.unitId) {
      addChipItem("unit", `Unit: ${filter.unitId}`, () =>
        updateFilter({ unitId: undefined }),
      );
    }
    if (filter.gender) {
      addChipItem("gender", `Gender: ${filter.gender}`, () =>
        updateFilter({ gender: undefined }),
      );
    }
    if (filter.careerFunctionId) {
      addChipItem(
        "careerFunction",
        `Career Function: ${filter.careerFunctionId}`,
        () => updateFilter({ careerFunctionId: undefined }),
      );
    }
    if (filter.designationId) {
      addChipItem("designation", `Designation: ${filter.designationId}`, () =>
        updateFilter({ designationId: undefined }),
      );
    }
    if (filter.employmentTypeId) {
      addChipItem(
        "employmentType",
        `Employment Type: ${filter.employmentTypeId}`,
        () => updateFilter({ employmentTypeId: undefined }),
      );
    }
    if (filter.managerEmail) {
      addChipItem(
        "managerEmail",
        `Manager Email: ${filter.managerEmail}`,
        () => updateFilter({ managerEmail: undefined }),
      );
    }
    if (filter.location) {
      addChipItem("location", `Location: ${filter.location}`, () =>
        updateFilter({ location: undefined }),
      );
    }
    if (filter.officeId) {
      addChipItem("office", `Office: ${filter.officeId}`, () =>
        updateFilter({ officeId: undefined }),
      );
    }
    return items;
  }, [filter, updateFilter]);

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
                updateFilter({ searchString: value });
              }, 500);
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
                      updateFilter({ searchString: "" });
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
                <Typography
                  variant="h5"
                  fontWeight={600}
                  sx={{ letterSpacing: 1 }}
                >
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
                businessUnits.find((businessUnit) => businessUnit.id === filter.businessUnitId)?.name
              }
              options={businessUnits}
              getLabel={(businessUnit) => businessUnit.name}
              onChange={(businessUnit) => {
                updateFilter({
                  businessUnitId: businessUnit.id,
                  teamId: undefined,
                  subTeamId: undefined,
                  unitId: undefined,
                });
                dispatch(fetchTeams({ id: businessUnit.id }));
              }}
              onClear={() =>
                updateFilter({
                  businessUnitId: undefined,
                  teamId: undefined,
                  subTeamId: undefined,
                  unitId: undefined,
                })
              }
            />

            <FilterChipSelect
              label="Team"
              value={teams.find((team) => team.id === filter.teamId)?.name}
              options={teams}
              parent="Business Unit"
              noParentSelected={!filter.businessUnitId}
              getLabel={(team) => team.name}
              onChange={(team) => {
                updateFilter({
                  teamId: team.id,
                  subTeamId: undefined,
                  unitId: undefined,
                });
                dispatch(fetchSubTeams({ id: team.id }));
              }}
              onClear={() =>
                updateFilter({
                  teamId: undefined,
                  subTeamId: undefined,
                  unitId: undefined,
                })
              }
            />
            <FilterChipSelect
              label="Sub Team"
              value={subTeams.find((subTeam) => subTeam.id === filter.subTeamId)?.name}
              options={subTeams}
              parent="Team"
              noParentSelected={!filter.teamId}
              getLabel={(subTeam) => subTeam.name}
              onChange={(subTeam) => {
                updateFilter({ subTeamId: subTeam.id, unitId: undefined });
                dispatch(fetchUnits({ id: subTeam.id }));
              }}
              onClear={() =>
                updateFilter({ subTeamId: undefined, unitId: undefined })
              }
            />
            <FilterChipSelect
              label="Unit"
              value={units.find((unit) => unit.id === filter.unitId)?.name}
              options={units}
              parent="Sub Team"
              noParentSelected={!filter.subTeamId}
              getLabel={(unit) => unit.name}
              onChange={(unit) => updateFilter({ unitId: unit.id })}
              onClear={() => updateFilter({ unitId: undefined })}
            />
            <FilterChipSelect
              label="Career Function"
              value={
                careerFunctions.find((careerFunction) => careerFunction.id === filter.careerFunctionId)
                  ?.careerFunction
              }
              options={careerFunctions}
              getLabel={(careerFunction) => careerFunction.careerFunction}
              onChange={(careerFunction) => {
                updateFilter({
                  careerFunctionId: careerFunction.id,
                  designationId: undefined,
                });
                dispatch(fetchDesignations({ careerFunctionId: careerFunction.id }));
              }}
              onClear={() =>
                updateFilter({
                  careerFunctionId: undefined,
                  designationId: undefined,
                })
              }
            />
            <FilterChipSelect
              label="Designation"
              value={
                designations.find((designation) => designation.id === filter.designationId)
                  ?.designation
              }
              options={designations}
              parent="Career Function"
              noParentSelected={!filter.careerFunctionId}
              getLabel={(designation) => designation.designation}
              onChange={(designation) => {
                updateFilter({ designationId: designation.id });
              }}
              onClear={() => updateFilter({ designationId: undefined })}
            />
            <FilterChipSelect
              label="Location"
              value={filter.location}
              options={locations}
              getLabel={(location) => location}
              onChange={(location) => {
                updateFilter({ location });
              }}
              onClear={() =>
                updateFilter({ location: undefined, officeId: undefined })
              }
            />
            <FilterChipSelect
              label="Office"
              value={
                filteredOfficesByLocation.find((office) => office.id === filter.officeId)
                  ?.name
              }
              parent="Location"
              noParentSelected={!filter.location}
              options={filteredOfficesByLocation}
              getLabel={(office) => office.name}
              onChange={(office) => {
                updateFilter({ officeId: office.id });
              }}
              onClear={() => updateFilter({ officeId: undefined })}
            />
            <FilterChipSelect
              label="Employment Type"
              value={
                employmentTypes.find((employeeType) => employeeType.id === filter.employmentTypeId)
                  ?.name
              }
              options={employmentTypes}
              getLabel={(employeeType) => employeeType.name}
              onChange={(employeeType) => updateFilter({ employmentTypeId: employeeType.id })}
              onClear={() => updateFilter({ employmentTypeId: undefined })}
            />
            <FilterChipSelect
              label="Manager Email"
              value={
                employeeState.managerEmails.find((managerEmail) => managerEmail === filter.managerEmail)
              }
              options={employeeState.managerEmails}
              getLabel={(managerEmail) => managerEmail}
              onChange={(managerEmail) => updateFilter({ managerEmail })}
              onClear={() => updateFilter({ managerEmail: undefined })}
            />
            <FilterChipSelect
              label="Gender"
              value={filter.gender}
              options={EmployeeGenders}
              getLabel={(gender) => gender}
              onChange={(gender) => updateFilter({ gender })}
              onClear={() => updateFilter({ gender: undefined })}
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
                        : theme.palette.grey[100],
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
                    ".MuiButton-root:hover &": {
                      color: theme.palette.error.main,
                    },
                  }}
                />
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontSize: "12px",
                    fontWeight: 600,
                    transition: "color 0.2s ease",
                    ".MuiButton-root:hover &": {
                      color: theme.palette.error.main,
                    },
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
        appliedFilter={filter}
        onApply={updateFilter}
        clearAll={clearAll}
        businessUnits={businessUnits}
        teams={teams}
        subTeams={subTeams}
        units={units}
        careerFunctions={careerFunctions}
        designations={designations}
        employmentTypes={employmentTypes}
        managerEmails={employeeState.managerEmails}
        locations={locations}
        filteredOfficesByLocation={filteredOfficesByLocation}
      />
    </Box>
  );
}
