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
  Chip,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import TuneOutlinedIcon from "@mui/icons-material/TuneOutlined";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "@slices/store";
import { setEmployeeFilter } from "@slices/employeeSlice/employee";
import {
  fetchBusinessUnits,
  fetchDesignations,
  fetchEmploymentTypes,
  fetchSubTeams,
  fetchTeams,
  fetchUnits,
} from "@slices/organizationSlice/organization";
import type { EmployeeFilterAttributes } from "@slices/employeeSlice/employee";
import { FilterDrawer } from "./FilterDrawer";
import { FilterChipSelect } from "./FilterChipSelect";
import { Countries, EmployeeGenders } from "@config/constant";

type SearchFormProps = { page: number; perPage: number };

type ChipItem = {
  key: string;
  label: string;
  onDelete: () => void;
};

export function SearchForm({ page, perPage }: SearchFormProps) {

  const dispatch = useAppDispatch();
  const employeeState = useAppSelector((state) => state.employee);
  const filter = employeeState.employeeFilter as EmployeeFilterAttributes;

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

  const fieldSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: 1,
      borderColor: "divider",
      backgroundColor: "transparent",
    },
  };

  const updateFilter = useCallback(
    (patch: Partial<EmployeeFilterAttributes>) => {
      dispatch(
        setEmployeeFilter({
          ...filter,
          ...patch,
          page: 1,
          perPage,
        } as EmployeeFilterAttributes)
      );
    },
    [dispatch, filter, perPage]
  );

  const clearAll = () => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    dispatch(
      setEmployeeFilter({
        page: 1,
        perPage,
        searchString: "",
      } as EmployeeFilterAttributes)
    );
  };

  const chips = useMemo(() => {
    const items: ChipItem[] = [];

    const add = (key: string, label: string, onDelete: () => void) => {
      items.push({ key, label, onDelete });
    };

    if (filter.searchString) {
      add("searchString", `Search: ${filter.searchString}`, () =>
        updateFilter({ searchString: "" })
      );
    }
    if (filter.businessUnit) {
      add("businessUnit", `Business Unit: ${filter.businessUnit}`, () =>
        updateFilter({
          businessUnit: undefined,
          team: undefined,
          subTeam: undefined,
          unit: undefined,
        })
      );
    }
    if (filter.team) {
      add("team", `Team: ${filter.team}`, () =>
        updateFilter({ team: undefined, subTeam: undefined, unit: undefined })
      );
    }
    if (filter.subTeam) {
      add("subTeam", `Sub Team: ${filter.subTeam}`, () =>
        updateFilter({ subTeam: undefined, unit: undefined })
      );
    }
    if (filter.unit) {
      add("unit", `Unit: ${filter.unit}`, () =>
        updateFilter({ unit: undefined })
      );
    }
    if (filter.gender) {
      add("gender", `Gender: ${filter.gender}`, () =>
        updateFilter({ gender: undefined })
      );
    }
    if (filter.country) {
      add("country", `Country: ${filter.country}`, () =>
        updateFilter({ country: undefined })
      );
    }
    if (filter.designation) {
      add("designation", `Designation: ${filter.designation}`, () =>
        updateFilter({ designation: undefined })
      );
    }
    if (filter.employmentType) {
      add("employmentType", `Employment Type: ${filter.employmentType}`, () =>
        updateFilter({ employmentType: undefined })
      );
    }
    return items;
  }, [filter, updateFilter]);

  return (
    <Box sx={{ mb: 2 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography
          variant="h5"
          sx={(theme) => ({ color: theme.palette.text.secondary })}
        >
          Search Employees
        </Typography>

        <Button
          variant="text"
          startIcon={
            <TuneOutlinedIcon
              sx={{ color: (theme) => theme.palette.secondary.contrastText }}
            />
          }
          onClick={() => setDrawerOpen(true)}
          sx={{ minWidth: "120px" }}
        >
          <Typography
            variant="h6"
            sx={{ color: (theme) => theme.palette.secondary.contrastText }}
          >
            Filters
          </Typography>
        </Button>
      </Box>

      {/* Search */}
      <Box sx={{ mt: 1 }}>
        <TextField
          size="small"
          fullWidth
          id="searchString"
          name="searchString"
          label=""
          value={searchText}
          sx={fieldSx}
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
      </Box>

      {/* Chips */}
      {chips.length > 0 && (
        <Box sx={{ mt: 1 }}>
          <Stack
            direction="row"
            spacing={1}
            useFlexGap
            flexWrap="wrap"
            alignItems="center"
          >
            {/* Search chip (plain) */}
            {filter.searchString && (
              <Chip
                size="small"
                label={`Search: ${filter.searchString}`}
                onDelete={() => {
                  setSearchText("");
                  updateFilter({ searchString: "" });
                }}
              />
            )}

            {/* Dropdown chips */}
            {filter.businessUnit && (
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
            )}

            {filter.team && (
              <FilterChipSelect
                label="Team"
                value={filter.team}
                options={teams}
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
            )}

            {filter.subTeam && (
              <FilterChipSelect
                label="Sub Team"
                value={filter.subTeam}
                options={subTeams}
                getLabel={(st) => st.name}
                onChange={(st) => {
                  updateFilter({ subTeam: st.name, unit: undefined });
                  dispatch(fetchUnits({ id: st.id }));
                }}
                onClear={() =>
                  updateFilter({ subTeam: undefined, unit: undefined })
                }
              />
            )}

            {filter.unit && (
              <FilterChipSelect
                label="Unit"
                value={filter.unit}
                options={units}
                getLabel={(u) => u.name}
                onChange={(u) => updateFilter({ unit: u.name })}
                onClear={() => updateFilter({ unit: undefined })}
              />
            )}

            {/* Keep the rest as plain chips OR convert similarly */}
            {filter.gender && (
              <FilterChipSelect
                label="Gender"
                value={filter.gender}
                options={EmployeeGenders}
                getLabel={(gender) => gender}
                onChange={(gender) => updateFilter({ gender: gender })}
                onClear={() => updateFilter({ gender: undefined })}
              />
            )}

            {filter.country && (
              <FilterChipSelect
                label="Country"
                value={filter.country}
                options={Countries}
                getLabel={(country) => country}
                onChange={(country) => updateFilter({ country: country })}
                onClear={() => updateFilter({ country: undefined })}
              />
            )}

            {filter.designation && (
              <FilterChipSelect
                label="Designation"
                value={filter.designation}
                options={designations}
                getLabel={(d) => d.designation}
                onChange={(d) => updateFilter({ designation: d.designation })}
                onClear={() => updateFilter({ designation: undefined })}
              />
            )}

            {filter.employmentType && (
              <FilterChipSelect
                label="Employment Type"
                value={filter.employmentType}
                options={employmentTypes}
                getLabel={(et) => et.name}
                onChange={(et) => updateFilter({ employmentType: et.name })}
                onClear={() => updateFilter({ employmentType: undefined })}
              />
            )}

            <Box sx={{ flex: 1 }} />
            <Button
              variant="text"
              onClick={clearAll}
              sx={{ whiteSpace: "nowrap" }}
            >
              Clear all
            </Button>
          </Stack>
        </Box>
      )}

      <FilterDrawer
        drawerOpen={drawerOpen}
        setDrawerOpen={setDrawerOpen}
        filter={filter}
        updateFilter={updateFilter}
        clearAll={clearAll}
        fieldSx={fieldSx}
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
