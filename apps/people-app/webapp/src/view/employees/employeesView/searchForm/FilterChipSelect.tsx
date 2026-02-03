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

import { KeyboardArrowDown, KeyboardArrowUp } from "@mui/icons-material";
import CloseIcon from "@mui/icons-material/Close";
import {
  alpha,
  Box,
  Chip,
  Menu,
  MenuItem,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import { useMemo, useState } from "react";

type FilterChipSelectProps<T> = {
  label: string;
  value: string | number | undefined;
  options: T[];
  getLabel: (o: T) => string;
  onChange: (o: T) => void;
  onClear: () => void;
  parent?: string;
  noParentSelected?: boolean;
};

export function FilterChipSelect<T>({
  label,
  value,
  options,
  getLabel,
  onChange,
  onClear,
  parent,
  noParentSelected = false,
}: FilterChipSelectProps<T>) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const brandOrange = theme.palette.secondary.contrastText;
  const hasValue = value !== undefined && value !== null;
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  const chipText = useMemo(() => {
    return (
      <Box
        sx={{ display: "flex", alignItems: "center", gap: hasValue ? 1 : 0.5 }}
      >
        <Typography
          variant="caption"
          sx={{
            lineHeight: 1,
            display: "flex",
            alignItems: "center",
            fontSize: "10px",
            fontWeight: 700,
            letterSpacing: "0.05em",
            color: theme.palette.grey[500],
            textTransform: "uppercase",
          }}
        >
          {hasValue ? `${label} :` : `${label}`}
        </Typography>
        {hasValue ? (
          <Typography
            variant="body2"
            sx={{
              lineHeight: 1,
              display: "flex",
              alignItems: "center",
              fontSize: "12px",
              fontWeight: 900,
              color: isDark ? theme.palette.grey[100] : theme.palette.grey[700],
            }}
          >
            {`${value}`}
          </Typography>
        ) : (
          <Typography
            variant="body2"
            sx={{
              lineHeight: 1,
              display: "flex",
              alignItems: "center",
              fontSize: "12px",
              fontWeight: 900,
              color: theme.palette.grey[400],
            }}
          >
            {""}
          </Typography>
        )}
        {open ? (
          <KeyboardArrowUp
            className="arrow-icon"
            sx={{
              fontSize: "16px",
              color: theme.palette.grey[500],
              ".MuiChip-root:hover &": { color: theme.palette.primary.main },
            }}
          />
        ) : (
          <KeyboardArrowDown
            className="arrow-icon"
            sx={{
              fontSize: 16,
              fontWeight: 900,
              color: theme.palette.grey[500],
              ".MuiChip-root:hover &": { color: brandOrange },
            }}
          />
        )}
      </Box>
    );
  }, [
    hasValue,
    theme.palette.grey,
    theme.palette.primary.main,
    label,
    isDark,
    value,
    open,
    brandOrange,
  ]);

  const openMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const closeMenu = () => {
    setAnchorEl(null);
  };

  const tooltipTitle =
    parent && noParentSelected
      ? `Select ${parent} first`
      : options.length === 0
        ? "No options available"
        : "";

  console.log(noParentSelected);

  return (
    <>
      <Tooltip title={tooltipTitle} arrow>
        <span
          style={{
            pointerEvents:
              noParentSelected || options.length === 0 ? "auto" : "auto",
            cursor:
              (parent && noParentSelected) || options.length === 0
                ? "not-allowed"
                : "pointer",
          }}
        >
          <Chip
            label={chipText}
            clickable={false}
            onClick={openMenu}
            disabled={noParentSelected || options.length === 0}
            deleteIcon={
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0 4px",
                  height: "100%",
                  width: "28px",
                  color: isDark
                    ? theme.palette.grey[300]
                    : theme.palette.grey[400],
                  transition: "all 0.2s ease",
                  "&:hover": {
                    color: theme.palette.error.main,
                    backgroundColor: isDark
                      ? alpha("#fff", 0.05)
                      : theme.palette.grey[200],
                  },
                }}
              >
                <CloseIcon sx={{ fontSize: 16 }} />
              </Box>
            }
            sx={{
              height: "32px",
              p: 0,
              backgroundColor: isDark
                ? theme.palette.background.default
                : "#fff",
              borderRadius: "50px",
              border: `1px solid ${hasValue ? alpha(brandOrange, 1) : theme.palette.grey[500]}`,
              transition: "all 0.1s ease-in-out",
              "&:active": {
                transform: "scale(0.98)",
              },
              "& .MuiChip-label": {
                pl: "12px",
                pr: "8px",
                borderRight: hasValue
                  ? `1px solid ${isDark ? alpha(theme.palette.grey[100], 0.1) : theme.palette.grey[200]}`
                  : "none",
                height: "100%",
                display: "flex",
                alignItems: "center",
                py: 0,
              },
              "& .MuiChip-deleteIcon": {
                margin: 0,
                height: "100%",
                borderRadius: "0 50px 50px 0",
              },
            }}
            onDelete={hasValue ? onClear : undefined}
            variant="outlined"
          />
        </span>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={closeMenu}
        slotProps={{
          paper: { sx: { maxHeight: 360, minWidth: 240 } },
        }}
      >
        {options.length > 0 ? (
          options.map((o, idx) => {
            const optionLabel = getLabel(o);
            return (
              <MenuItem
                key={`${optionLabel}-${idx}`}
                selected={optionLabel === String(hasValue)}
                onClick={() => {
                  onChange(o);
                  closeMenu();
                }}
              >
                {optionLabel}
              </MenuItem>
            );
          })
        ) : (
          <MenuItem disabled key="no-options">
            No options available
          </MenuItem>
        )}
      </Menu>
    </>
  );
}
