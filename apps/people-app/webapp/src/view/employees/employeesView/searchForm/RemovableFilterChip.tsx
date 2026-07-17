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

import { alpha, Chip, useTheme } from "@mui/material";

type RemovableFilterChipProps = {
  label: string;
  onDelete: () => void;
};

/**
 * A styled, removable chip used to display a single selected value of a
 * multi-select filter (e.g. an employment type or employee status) in the
 * active-filters row. Clicking the delete icon invokes `onDelete`.
 */
export function RemovableFilterChip({ label, onDelete }: RemovableFilterChipProps) {
  const theme = useTheme();
  const accentColor = theme.palette.secondary.contrastText;
  return (
    <Chip
      label={label}
      variant="outlined"
      onDelete={onDelete}
      sx={{
        height: "32px",
        borderRadius: "50px",
        fontSize: "12px",
        fontWeight: 600,
        color: theme.palette.mode === "dark" ? theme.palette.grey[100] : theme.palette.grey[800],
        backgroundColor: alpha(accentColor, theme.palette.mode === "dark" ? 0.12 : 0.06),
        border: `1.5px solid ${accentColor}`,
        "& .MuiChip-deleteIcon": {
          color: theme.palette.text.disabled,
          "&:hover": { color: theme.palette.error.main },
        },
      }}
    />
  );
}

/**
 * Remove a single value from a multi-select filter array, returning `undefined`
 * when the array becomes empty so the filter is cleared rather than sent empty.
 */
export function dropFilterValue<T>(values: T[], value: T): T[] | undefined {
  const next = values.filter((v) => v !== value);
  return next.length ? next : undefined;
}
