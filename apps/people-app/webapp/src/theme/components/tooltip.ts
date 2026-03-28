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

export const muiTooltip = (colors: any): Components<Theme>["MuiTooltip"] => ({
  defaultProps: {
    arrow: true,
    placement: "right" as const,
  },
  styleOverrides: {
    tooltip: {
      backgroundColor: colors.neutral["1700"],
      color: colors.neutral.white,
      padding: "6px 8px",
      borderRadius: "4px",
      fontSize: "12px",
      boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.16), 0px 0px 2px rgba(0, 0, 0, 0.08)",
    },
    arrow: {
      color: colors.neutral["1700"],
    },
  },
});
