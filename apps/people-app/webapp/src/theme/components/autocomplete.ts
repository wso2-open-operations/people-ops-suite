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
import type { Components, Theme } from "@mui/material/styles";

export const muiAutocomplete = (colors: any): Components<Theme>["MuiAutocomplete"] => ({
  styleOverrides: {
    // Dropdown/popup container styles
    paper: {
      backgroundColor: colors.surface.secondary.active,
      border: `1px solid ${colors.border.primary.b2.active}`,
      borderRadius: "4px",
      marginTop: "2px",
      boxShadow: "none",
      overflow: "hidden",
    },

    // Listbox (options container)
    listbox: {
      padding: 0,
    },

    // Individual option styles
    option: {
      width: "100% !important",
      color: `${colors.text.primary.p3.active} !important`,
      backgroundColor: "transparent !important",

      "&:hover": {
        backgroundColor: `${colors.fill.neutral.light.active} !important`,
        color: `${colors.text.primary.p3.active} !important`,
      },

      "&.Mui-focused": {
        backgroundColor: `${colors.fill.neutral.light.active} !important`,
        color: `${colors.text.primary.p3.active} !important`,
      },

      "&[aria-selected='true']": {
        backgroundColor: `${colors.fill.secondary.light.active} !important`,
        color: `${colors.text.primary.p2.active} !important`,

        "&:hover": {
          backgroundColor: `${colors.fill.secondary.light.active} !important`,
          color: `${colors.text.primary.p2.active} !important`,
        },

        "&.Mui-focused": {
          backgroundColor: `${colors.fill.secondary.light.active} !important`,
          color: `${colors.text.primary.p2.active} !important`,
        },
      },
    },
  },
});
