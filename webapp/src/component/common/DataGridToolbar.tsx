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
import DensityMediumIcon from "@mui/icons-material/DensityMedium";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import FilterListIcon from "@mui/icons-material/FilterList";
import SearchIcon from "@mui/icons-material/Search";
import ViewColumnIcon from "@mui/icons-material/ViewColumn";
import { Box, IconButton, InputAdornment, Menu, MenuItem, TextField, Tooltip } from "@mui/material";
import { GridDensity, GridPreferencePanelsValue, useGridApiRef } from "@mui/x-data-grid";

import { useState } from "react";

type GridApiRef = ReturnType<typeof useGridApiRef>;

interface DataGridToolbarProps {
  apiRef: GridApiRef;
  searchText?: string;
  onSearchChange?: (text: string) => void;
}

const DENSITY_OPTIONS: { label: string; value: GridDensity }[] = [
  { label: "Compact", value: "compact" },
  { label: "Standard", value: "standard" },
  { label: "Comfortable", value: "comfortable" },
];

export const DataGridToolbar = ({ apiRef, searchText, onSearchChange }: DataGridToolbarProps) => {
  const [densityAnchor, setDensityAnchor] = useState<null | HTMLElement>(null);
  const [internalSearch, setInternalSearch] = useState("");

  const displaySearch = searchText ?? internalSearch;

  const handleSearchChange = (text: string) => {
    if (searchText === undefined) setInternalSearch(text);
    apiRef.current?.setQuickFilterValues(text ? [text] : []);
    onSearchChange?.(text);
  };

  const handleDensitySelect = (density: GridDensity) => {
    apiRef.current?.setDensity(density);
    setDensityAnchor(null);
  };

  return (
    <Box display="flex" alignItems="center" gap={0.6}>
      <Tooltip title="Columns" enterDelay={500}>
        <IconButton
          size="small"
          onClick={() => apiRef.current?.showPreferences(GridPreferencePanelsValue.columns)}
        >
          <ViewColumnIcon sx={{ fontSize: "1.1rem" }} />
        </IconButton>
      </Tooltip>
      <Tooltip title="Filters" enterDelay={500}>
        <IconButton size="small" onClick={() => apiRef.current?.showFilterPanel()}>
          <FilterListIcon sx={{ fontSize: "1.1rem" }} />
        </IconButton>
      </Tooltip>
      <Tooltip title="Density" enterDelay={500}>
        <IconButton size="small" onClick={(e) => setDensityAnchor(e.currentTarget)}>
          <DensityMediumIcon sx={{ fontSize: "1.1rem" }} />
        </IconButton>
      </Tooltip>
      <Menu anchorEl={densityAnchor} open={Boolean(densityAnchor)} onClose={() => setDensityAnchor(null)}>
        {DENSITY_OPTIONS.map(({ label, value }) => (
          <MenuItem key={value} onClick={() => handleDensitySelect(value)} dense>
            {label}
          </MenuItem>
        ))}
      </Menu>
      <Tooltip title="Export CSV" enterDelay={500}>
        <IconButton size="small" onClick={() => apiRef.current?.exportDataAsCsv()}>
          <FileDownloadIcon sx={{ fontSize: "1.1rem" }} />
        </IconButton>
      </Tooltip>
      <TextField
        size="small"
        placeholder="Search…"
        value={displaySearch}
        onChange={(e) => handleSearchChange(e.target.value)}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: "1rem" }} />
              </InputAdornment>
            ),
          },
        }}
        sx={{ width: 180, "& .MuiInputBase-root": { height: 32 } }}
      />
    </Box>
  );
};
