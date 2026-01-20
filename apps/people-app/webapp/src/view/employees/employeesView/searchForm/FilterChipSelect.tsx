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

import { Chip, Menu, MenuItem } from "@mui/material";
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
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  const chipLabel = useMemo(() => `${label}: ${value}`, [label, value]);

  return (
    <>
      <Chip
        size="small"
        label={chipLabel}
        onClick={(e) => setAnchorEl(e.currentTarget)}
        onDelete={onClear}
        variant="outlined"
      />

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        PaperProps={{ sx: { maxHeight: 360 } }}
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
