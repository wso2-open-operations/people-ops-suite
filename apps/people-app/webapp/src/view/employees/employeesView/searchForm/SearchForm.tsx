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
  Countries,
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
import type { EmployeeFilterAttributes } from "@slices/employeeSlice/employee";
import {
  setEmployeeFilter,
  setFilterAppliedOnce,
} from "@slices/employeeSlice/employee";
import {
  fetchBusinessUnits,
  fetchDesignations,
  fetchEmploymentTypes,
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
    designations,
    employmentTypes,
  } = useAppSelector((state) => state.organization);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const debounceRef = useRef<number | null>(null);
  const [searchText, setSearchText] = useState(filter.searchString ?? "");

  useEffect(() => {
    setSearchText(filter.searchString ?? "");
  }, [filter.searchString]);

  useEffect(() => {
    dispatch(fetchEmploymentTypes());
    dispatch(fetchDesignations({}));
    dispatch(fetchBusinessUnits());
  }, [dispatch]);

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
      businessUnit,
      team,
      subTeam,
      unit,
      gender,
      country,
      designation,
      employmentType,
      city,
      nationality,
    } = filter;

    return Boolean(
      businessUnit ||
      team ||
      subTeam ||
      unit ||
      gender ||
      country ||
      designation ||
      employmentType ||
      city ||
      nationality,
    );
  }

  const active = useMemo(() => hasAnyActiveFilters(filter), [filter]);
  const chips = useMemo(() => {
    const items: ChipItem[] = [];

    const add = (key: string, label: string, onDelete: () => void) => {
      items.push({ key, label, onDelete });
    };

    if (filter.businessUnit) {
      add("businessUnit", `Business Unit: ${filter.businessUnit}`, () =>
        updateFilter({
          businessUnit: undefined,
          team: undefined,
          subTeam: undefined,
          unit: undefined,
        }),
      );
    }
    if (filter.team) {
      add("team", `Team: ${filter.team}`, () =>
        updateFilter({ team: undefined, subTeam: undefined, unit: undefined }),
      );
    }
    if (filter.subTeam) {
      add("subTeam", `Sub Team: ${filter.subTeam}`, () =>
        updateFilter({ subTeam: undefined, unit: undefined }),
      );
    }
    if (filter.unit) {
      add("unit", `Unit: ${filter.unit}`, () =>
        updateFilter({ unit: undefined }),
      );
    }
    if (filter.gender) {
      add("gender", `Gender: ${filter.gender}`, () =>
        updateFilter({ gender: undefined }),
      );
    }
    if (filter.country) {
      add("country", `Country: ${filter.country}`, () =>
        updateFilter({ country: undefined }),
      );
    }
    if (filter.designation) {
      add("designation", `Designation: ${filter.designation}`, () =>
        updateFilter({ designation: undefined }),
      );
    }
    if (filter.employmentType) {
      add("employmentType", `Employment Type: ${filter.employmentType}`, () =>
        updateFilter({ employmentType: undefined }),
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
              <Box
                onClick={() => setDrawerOpen(true)}
                sx={{
                  color: theme.palette.secondary.contrastText,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "opacity 0.2s",
                  "&:hover": {
                    opacity: 0.7,
                  },
                }}
              >
                {active ? (
                  <FilterAlt sx={{ fontSize: 28 }} />
                ) : (
                  <FilterAltOutlined sx={{ fontSize: 28 }} />
                )}
              </Box>
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
              value={filter.businessUnit}
              options={businessUnits}
              getLabel={(bu) => bu.name}
              onChange={(bu) => {
                updateFilter({
                  businessUnit: bu.name,
                  team: undefined,
                  subTeam: undefined,
                  unit: undefined,
                });
                dispatch(fetchTeams({ id: bu.id }));
              }}
              onClear={() =>
                updateFilter({
                  businessUnit: undefined,
                  team: undefined,
                  subTeam: undefined,
                  unit: undefined,
                })
              }
            />

            <FilterChipSelect
              label="Team"
              value={filter.team}
              options={teams}
              parent="Business Unit"
              noParentSelected={!filter.businessUnit}
              getLabel={(t) => t.name}
              onChange={(t) => {
                updateFilter({
                  team: t.name,
                  subTeam: undefined,
                  unit: undefined,
                });
                dispatch(fetchSubTeams({ id: t.id }));
              }}
              onClear={() =>
                updateFilter({
                  team: undefined,
                  subTeam: undefined,
                  unit: undefined,
                })
              }
            />
            <FilterChipSelect
              label="Sub Team"
              value={filter.subTeam}
              options={subTeams}
              parent="Team"
              noParentSelected={!filter.team}
              getLabel={(st) => st.name}
              onChange={(st) => {
                updateFilter({ subTeam: st.name, unit: undefined });
                dispatch(fetchUnits({ id: st.id }));
              }}
              onClear={() =>
                updateFilter({ subTeam: undefined, unit: undefined })
              }
            />
            <FilterChipSelect
              label="Unit"
              value={filter.unit}
              options={units}
              parent="Sub Team"
              noParentSelected={!filter.subTeam}
              getLabel={(u) => u.name}
              onChange={(u) => updateFilter({ unit: u.name })}
              onClear={() => updateFilter({ unit: undefined })}
            />
            <FilterChipSelect
              label="Gender"
              value={filter.gender}
              options={EmployeeGenders}
              getLabel={(gender) => gender}
              onChange={(gender) => updateFilter({ gender: gender })}
              onClear={() => updateFilter({ gender: undefined })}
            />
            <FilterChipSelect
              label="Country"
              value={filter.country}
              options={Countries}
              getLabel={(country) => country}
              onChange={(country) => updateFilter({ country: country })}
              onClear={() => updateFilter({ country: undefined })}
            />
            <FilterChipSelect
              label="Designation"
              value={filter.designation}
              options={designations}
              getLabel={(d) => d.designation}
              onChange={(d) => updateFilter({ designation: d.designation })}
              onClear={() => updateFilter({ designation: undefined })}
            />
            <FilterChipSelect
              label="Employment Type"
              value={filter.employmentType}
              options={employmentTypes}
              getLabel={(et) => et.name}
              onChange={(et) => updateFilter({ employmentType: et.name })}
              onClear={() => updateFilter({ employmentType: undefined })}
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
        designations={designations}
        employmentTypes={employmentTypes}
      />
    </Box>
  );
}
