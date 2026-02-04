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
  BusinessUnit,
  CareerFunction,
  Designation,
  EmploymentType,
  fetchBusinessUnits,
  fetchCareerFunctions,
  fetchDesignations,
  fetchEmploymentTypes,
  fetchOffices,
  fetchSubTeams,
  fetchTeams,
  fetchUnits,
  Office,
  SubTeam,
  Team,
  Unit,
} from "@slices/organizationSlice/organization";
import { useAppDispatch, useAppSelector } from "@slices/store";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FilterChipSelect, FilterChipSelectProps } from "./FilterChipSelect";
import { FilterDrawer } from "./FilterDrawer";

type ChipMeta<K extends string, T> =
  { kind: K;} & FilterChipSelectProps<T>;

// Add the new filter chip to this union type when a new filter chip is added in the SearchForm
type ChipConfig =
  | ChipMeta<"businessUnit", BusinessUnit>
  | ChipMeta<"team", Team>
  | ChipMeta<"subTeam", SubTeam>
  | ChipMeta<"unit", Unit>
  | ChipMeta<"careerFunction", CareerFunction>
  | ChipMeta<"designation", Designation>
  | ChipMeta<"manager", string>
  | ChipMeta<"office", Office>
  | ChipMeta<"employmentType", EmploymentType>
  | ChipMeta<"location", string>
  | ChipMeta<"employeeStatus", EmployeeStatus>
  | ChipMeta<"gender", string>;

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
        filters: {},
        pagination: {
          page: DEFAULT_PAGE_VALUE,
          perPage: DEFAULT_PER_PAGE_VALUE,
        },
      } satisfies EmployeeSearchPayload),
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
    [filterPayload.filters],
  );
  const managerEmails = useMemo(() => {
    return employeeState.managers.map((manager) => manager.workEmail);
  }, [employeeState.managers]);

  const filterChipConfigs = useMemo<ChipConfig[]>(() => [
      {
        kind: "businessUnit",
        label: "Business Unit",
        value: businessUnits.find(
          (bu) => bu.id === filterPayload.filters.businessUnitId,
        )?.name,
        options: businessUnits,
        getLabel: (businessUnit: BusinessUnit) => businessUnit.name,
        onChange: (businessUnit: BusinessUnit) => {
          updateSearchPayload({
            filters: {
              businessUnitId: businessUnit.id,
              teamId: undefined,
              subTeamId: undefined,
              unitId: undefined,
            },
          });
          dispatch(fetchTeams({ id: businessUnit.id }));
        },
        onClear: () =>
          updateSearchPayload({
            filters: {
              businessUnitId: undefined,
              teamId: undefined,
              subTeamId: undefined,
              unitId: undefined,
            },
          }),
      },
      {
        kind: "team",
        label: "Team",
        value: teams.find((team) => team.id === filterPayload.filters.teamId)
          ?.name,
        options: teams,
        parent: "Business Unit",
        noParentSelected: !filterPayload.filters.businessUnitId,
        getLabel: (team: Team) => team.name,
        onChange: (team: Team) => {
          updateSearchPayload({
            filters: {
              teamId: team.id,
              subTeamId: undefined,
              unitId: undefined,
            },
          });
          dispatch(fetchSubTeams({ id: team.id }));
        },
        onClear: () =>
          updateSearchPayload({
            filters: {
              teamId: undefined,
              subTeamId: undefined,
              unitId: undefined,
            },
          }),
      },
      {
        kind: "subTeam",
        label: "Sub Team",
        value: subTeams.find(
          (subTeam) => subTeam.id === filterPayload.filters.subTeamId,
        )?.name,
        options: subTeams,
        parent: "Team",
        noParentSelected: !filterPayload.filters.teamId,
        getLabel: (subTeam: SubTeam) => subTeam.name,
        onChange: (subTeam: SubTeam) => {
          updateSearchPayload({
            filters: { subTeamId: subTeam.id, unitId: undefined },
          });
          dispatch(fetchUnits({ id: subTeam.id }));
        },
        onClear: () =>
          updateSearchPayload({
            filters: { subTeamId: undefined, unitId: undefined },
          }),
      },
      {
        kind: "unit",
        label: "Unit",
        value: units.find((unit) => unit.id === filterPayload.filters.unitId)
          ?.name,
        options: units,
        parent: "Sub Team",
        noParentSelected: !filterPayload.filters.subTeamId,
        getLabel: (unit: Unit) => unit.name,
        onChange: (unit: Unit) =>
          updateSearchPayload({ filters: { unitId: unit.id } }),
        onClear: () => updateSearchPayload({ filters: { unitId: undefined } }),
      },
      {
        kind: "careerFunction",
        label: "Career Function",
        value: careerFunctions.find(
          (cf) => cf.id === filterPayload.filters.careerFunctionId,
        )?.careerFunction,
        options: careerFunctions,
        getLabel: (careerFunction: CareerFunction) =>
          careerFunction.careerFunction,
        onChange: (careerFunction: CareerFunction) => {
          updateSearchPayload({
            filters: {
              careerFunctionId: careerFunction.id,
              designationId: undefined,
            },
          });
          dispatch(fetchDesignations({ careerFunctionId: careerFunction.id }));
        },
        onClear: () =>
          updateSearchPayload({
            filters: {
              careerFunctionId: undefined,
              designationId: undefined,
            },
          }),
      },
      {
        kind: "designation",
        label: "Designation",
        value: designations.find(
          (designation) =>
            designation.id === filterPayload.filters.designationId,
        )?.designation,
        options: designations,
        parent: "Career Function",
        noParentSelected: !filterPayload.filters.careerFunctionId,
        getLabel: (designation: Designation) => designation.designation,
        onChange: (designation: Designation) => {
          updateSearchPayload({
            filters: { designationId: designation.id },
          });
        },
        onClear: () =>
          updateSearchPayload({ filters: { designationId: undefined } }),
      },
      {
        kind: "location",
        label: "Location",
        value: filterPayload.filters.location,
        options: locations,
        getLabel: (location: string) => location,
        onChange: (location: string) => {
          updateSearchPayload({
            filters: { location, officeId: undefined },
          });
        },
        onClear: () =>
          updateSearchPayload({
            filters: { location: undefined, officeId: undefined },
          }),
      },
      {
        kind: "office",
        label: "Office",
        value: filteredOfficesByLocation.find(
          (office) => office.id === filterPayload.filters.officeId,
        )?.name,
        parent: "Location",
        noParentSelected: !filterPayload.filters.location,
        options: filteredOfficesByLocation,
        getLabel: (office: Office) => office.name,
        onChange: (office: Office) => {
          updateSearchPayload({ filters: { officeId: office.id } });
        },
        onClear: () =>
          updateSearchPayload({ filters: { officeId: undefined } }),
      },
      {
        kind: "employmentType",
        label: "Employment Type",
        value: employmentTypes.find(
          (et) => et.id === filterPayload.filters.employmentTypeId,
        )?.name,
        options: employmentTypes,
        getLabel: (employeeType: EmploymentType) => employeeType.name,
        onChange: (employeeType: EmploymentType) =>
          updateSearchPayload({
            filters: { employmentTypeId: employeeType.id },
          }),
        onClear: () =>
          updateSearchPayload({
            filters: { employmentTypeId: undefined },
          }),
      },
      {
        kind: "manager",
        label: "Manager",
        value: managerEmails.find(
          (email) => email === filterPayload.filters.managerEmail,
        ),
        options: managerEmails,
        getLabel: (managerEmail: string) => managerEmail,
        onChange: (managerEmail: string) =>
          updateSearchPayload({ filters: { managerEmail } }),
        onClear: () =>
          updateSearchPayload({ filters: { managerEmail: undefined } }),
      },
      {
        kind: "employeeStatus",
        label: "Employee Status",
        value: filterPayload.filters.employeeStatus,
        options: Object.values(EmployeeStatus),
        getLabel: (status: EmployeeStatus) => status,
        onChange: (status: EmployeeStatus) =>
          updateSearchPayload({ filters: { employeeStatus: status } }),
        onClear: () =>
          updateSearchPayload({ filters: { employeeStatus: undefined } }),
      },
      {
        kind: "gender",
        label: "Gender",
        value: filterPayload.filters.gender,
        options: EmployeeGenders,
        getLabel: (gender: string) => gender,
        onChange: (gender: string) =>
          updateSearchPayload({ filters: { gender } }),
        onClear: () => updateSearchPayload({ filters: { gender: undefined } }),
      },
    ], [
    businessUnits,
    careerFunctions,
    designations,
    dispatch,
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
    filteredOfficesByLocation,
    locations,
    managerEmails,
    subTeams,
    teams,
    units,
    updateSearchPayload,
  ]);

  const assertNever = (x: never): never => {
    throw new Error("Unhandled chip kind");
  };

  const hasActiveFilters = useMemo(() => {
    return hasAnyActiveFilters(filterPayload.filters);
  }, [filterPayload.filters]);

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
            {filterChipConfigs.map((config) => {
              switch (config.kind) {
                case "businessUnit": {
                  const { kind, ...props } = config;
                  return <FilterChipSelect<BusinessUnit> key={kind} {...props} />;
                }
                case "team": {
                  const { kind, ...props } = config;
                  return <FilterChipSelect<Team> key={kind} {...props} />;
                }
                case "subTeam": {
                  const { kind, ...props } = config;
                  return <FilterChipSelect<SubTeam> key={kind} {...props} />;
                }
                case "unit": {
                  const { kind, ...props } = config;
                  return <FilterChipSelect<Unit> key={kind} {...props} />;
                }
                case "careerFunction": {
                  const { kind, ...props } = config;
                  return <FilterChipSelect<CareerFunction> key={kind} {...props} />;
                }
                case "designation": {
                  const { kind, ...props } = config;
                  return <FilterChipSelect<Designation> key={kind} {...props} />;
                }
                case "employmentType": {
                  const { kind, ...props } = config;
                  return <FilterChipSelect<EmploymentType> key={kind} {...props} />;
                }
                case "employeeStatus": {
                  const { kind, ...props } = config;
                  return <FilterChipSelect<EmployeeStatus> key={kind} {...props} />;
                }
                case "office": {
                  const { kind, ...props } = config;
                  return <FilterChipSelect<Office> key={kind} {...props} />;
                }
                case "location":
                case "manager":
                case "gender": {
                  const { kind, ...props } = config;
                  return <FilterChipSelect<string> key={kind} {...props} />;
                }
                default:
                  return assertNever(config);
              }
            })}

            {hasActiveFilters && (
              <Button
                variant="text"
                onClick={clearAll}
                sx={{
                  textTransform: "none",
                  height: "32px",
                  borderRadius: "50px",
                  px: 2,
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
