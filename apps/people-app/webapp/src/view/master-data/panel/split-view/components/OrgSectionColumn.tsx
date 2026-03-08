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

import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import ClearIcon from "@mui/icons-material/Clear";
import SearchIcon from "@mui/icons-material/Search";
import { Box, IconButton, InputAdornment, TextField, Typography, useTheme } from "@mui/material";

import { ReactNode } from "react";

interface OrgSectionColumnProps {
  title: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onAdd?: () => void;
  children: ReactNode;
}

export const OrgSectionColumn = ({
  title,
  searchValue,
  onSearchChange,
  onAdd,
  children,
}: OrgSectionColumnProps) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        backgroundColor: theme.palette.surface.secondary.active,
        border: `1px solid ${theme.palette.customBorder.primary.b3.active}`,
        borderRadius: "8px",
        display: "flex",
        flexDirection: "column",
        flex: "1 0 0",
        minWidth: 0,
        height: "100%",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "12px",
        }}
      >
        <Typography
          sx={{
            fontSize: "18px",
            fontWeight: 500,
            lineHeight: 1.3,
            color: theme.palette.customText.primary.p2.active,
          }}
        >
          {title}
        </Typography>
      </Box>

      {/* Content Area */}
      <Box
        sx={{
          borderTop: `1px solid ${theme.palette.customBorder.primary.b3.active}`,
          display: "flex",
          flexDirection: "column",
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
          padding: "12px",
          gap: "20px",
        }}
      >
        {/* Search and Add Button */}
        <Box sx={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <TextField
            placeholder="Search..."
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            size="small"
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon
                    sx={{
                      color: theme.palette.customText.primary.p3.active,
                      fontSize: "16px",
                    }}
                  />
                </InputAdornment>
              ),
              endAdornment: searchValue ? (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => onSearchChange("")}
                    size="small"
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
            }}
            sx={{
              flex: 1,
              "& .MuiOutlinedInput-root": {
                backgroundColor: theme.palette.fill.neutral.light.active,
                height: "40px",
                borderRadius: "8px",
                "& fieldset": {
                  border: "none",
                },
                "&:hover fieldset": {
                  border: "none",
                },
                "&.Mui-focused fieldset": {
                  border: "none",
                },
              },
              "& .MuiInputBase-input": {
                color: theme.palette.customText.primary.p3.active,
                fontSize: "14px",
                padding: "8px 12px",
                "&::placeholder": {
                  color: theme.palette.customText.primary.p3.active,
                  opacity: 1,
                },
              },
            }}
          />

          {onAdd && (
            <IconButton
              onClick={onAdd}
              sx={{
                width: "40px",
                height: "40px",
                borderRadius: "8px",
                backgroundColor: theme.palette.fill.neutral.light.active,
                color: theme.palette.customText.primary.p3.active,
                "&:hover": {
                  backgroundColor: theme.palette.fill.neutral.light.hover,
                },
              }}
            >
              <AddCircleOutlineIcon sx={{ fontSize: "20px" }} />
            </IconButton>
          )}
        </Box>

        {/* Cards Container */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            flex: 1,
            minHeight: 0,
            overflow: "auto",
            "&::-webkit-scrollbar": {
              width: "6px",
            },
            "&::-webkit-scrollbar-track": {
              backgroundColor: "transparent",
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: theme.palette.customBorder.primary.b2.active,
              borderRadius: "3px",
            },
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
};
