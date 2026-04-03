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
// KIND, either express or implied. See the License for the
// specific language governing permissions and limitations
// under the License.
import ClearIcon from "@mui/icons-material/Clear";
import {
  Box,
  IconButton,
  InputAdornment,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import { ChevronLeftIcon, ChevronRightIcon, SearchIcon } from "lucide-react";

import { useState } from "react";

import { OrganizationInfo } from "@slices/organizationSlice/organizationStructure.ts";

import { type MatchSearch, itemToMatchSearch } from "./../utils/globalSearch.ts";

interface GlobalSearchProps {
  isDisabled: boolean;
  orgItems: OrganizationInfo;
  searchMatches: MatchSearch[];
  activeMatchIndex: number;
  setSearchMatches: React.Dispatch<React.SetStateAction<MatchSearch[]>>;
  setActiveMatchIndex: React.Dispatch<React.SetStateAction<number>>;
}

export default function GlobalSearch({
  isDisabled,
  orgItems,
  searchMatches,
  activeMatchIndex,
  setSearchMatches,
  setActiveMatchIndex,
}: GlobalSearchProps) {
  const theme = useTheme();
  const [globalSearchTerm, setGlobalSearchTerm] = useState<string>("");

  const goToPreviousMatch = () => {
    setActiveMatchIndex((i) =>
      searchMatches.length ? (i - 1 + searchMatches.length) % searchMatches.length : -1,
    );
  };

  const goToNextMatch = () => {
    setActiveMatchIndex((i) => (searchMatches.length ? (i + 1) % searchMatches.length : -1));
  };

  // Global search handlers
  const handleGlobalSearch = () => {
    if (!globalSearchTerm.trim()) {
      setSearchMatches([]);
      setActiveMatchIndex(-1);
      return;
    }

    const term = globalSearchTerm.toLowerCase();
    const allOrgItems = [
      ...orgItems.businessUnits,
      ...orgItems.teams,
      ...orgItems.subTeams,
      ...orgItems.units,
    ];

    const matches = allOrgItems.filter((item) => item.name.toLowerCase().includes(term));
    const searchResults: MatchSearch[] = matches.map((match) => itemToMatchSearch(orgItems, match));

    setSearchMatches(searchResults);
    setActiveMatchIndex(searchResults.length ? 0 : -1);
  };

  const handleClearGlobalSearch = () => {
    setGlobalSearchTerm("");
    setSearchMatches([]);
    setActiveMatchIndex(-1);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
      <Tooltip
        placement="top"
        title={isDisabled ? "Clear other filters to enable global search" : ""}
        disableHoverListener={!isDisabled}
        disableFocusListener={!isDisabled}
        disableTouchListener={!isDisabled}
      >
        <TextField
          placeholder="Search..."
          value={globalSearchTerm}
          onChange={(e) => setGlobalSearchTerm(e.target.value)}
          disabled={isDisabled}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleGlobalSearch();
            }
          }}
          size="small"
          sx={{
            backgroundColor: theme.palette.surface.secondary.active,
          }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon size={16} color={theme.palette.customText.primary.p3.active} />
                </InputAdornment>
              ),
              endAdornment: globalSearchTerm ? (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={handleClearGlobalSearch}
                    sx={{
                      padding: 0,
                      color: theme.palette.customText.primary.p3.active,
                      "&:hover": {
                        color: theme.palette.customText.primary.p2.active,
                      },
                    }}
                  >
                    <ClearIcon sx={{ fontSize: "16px" }} />
                  </IconButton>
                </InputAdornment>
              ) : null,
            },
          }}
        />
      </Tooltip>
      {/* Right: prev / next chevrons */}
      {searchMatches.length > 0 ? (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0 }}>
          <ChevronLeftIcon
            size={14}
            color={theme.palette.customText.primary.p3.active}
            onClick={goToPreviousMatch}
            style={{ cursor: "pointer" }}
          />
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            {[String(activeMatchIndex + 1), "/", String(searchMatches.length)].map((token, i) => (
              <Typography
                variant="caption"
                key={i}
                sx={{
                  color: theme.palette.customText.primary.p3.active,
                }}
              >
                {token}
              </Typography>
            ))}
          </Box>
          <ChevronRightIcon
            size={12}
            color={theme.palette.customText.primary.p3.active}
            onClick={goToNextMatch}
            style={{ cursor: "pointer" }}
          />
        </Box>
      ) : null}
    </Box>
  );
}
