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

import CloseIcon from "@mui/icons-material/Close";
import {
  Box,
  Chip,
  Menu,
  MenuItem,
  Typography,
  useTheme,
} from "@mui/material";
import { useMemo, useState } from "react";

type FilterChipSelectProps<T> = {
  label: string;
  value: string;
  options: T[];
  getLabel: (o: T) => string;
  onChange: (o: T) => void;
  onClear: () => void;
};

export function FilterChipSelect<T>({
  label,
  value,
  options,
  getLabel,
  onChange,
  onClear,
}: FilterChipSelectProps<T>) {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  const chipText = useMemo(() => {
    return (
      <>
        <Typography variant="subtitle2" noWrap sx={{
          ml:0.5,
          mr: 1
        }}>
          {`${label}: ${value}`}
        </Typography>
      </>
    );
  }, [label, value]);

  return (
    <>
      <Chip
        size="small"
        label={chipText}
        clickable
        onClick={(e) => setAnchorEl(e.currentTarget)}
        deleteIcon={
          <Box
            sx={{
              height: 24,
              width: 24,
              ml: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderLeft: `1px solid ${theme.palette.divider}`,
              borderRadius: 15,
              borderTopLeftRadius: 1,
              borderBottomLeftRadius: 1,
            }}
          >
            <CloseIcon fontSize="small" sx={{ height: 12 }}/>
          </Box>
        }
        onDelete={onClear}
        variant="outlined"
      />

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        slotProps={{
          paper: { sx: { maxHeight: 360, minWidth: 240 } },
        }}
      >
        {options.map((o, idx) => {
          const optionLabel = getLabel(o);
          return (
            <MenuItem
              key={`${optionLabel}-${idx}`}
              selected={optionLabel === value}
              onClick={() => {
                onChange(o);
                setAnchorEl(null);
              }}
            >
              {optionLabel}
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
}
