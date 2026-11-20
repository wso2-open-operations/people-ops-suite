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

import { alpha, useTheme } from "@mui/material";

// Chart/UI colors for the Employee Hub. Semantic values (bg, surface, border,
// hover, text, muted, dim, red, yellow) are read from the app theme;
// blue/purple/teal are fixed, mode-aware chart colors (e.g. gender-breakdown
// pie slices) with no equivalent slot in the theme palette.
export interface EmployeeHubColors {
  bg: string;
  surface: string;
  card: string;
  border: string;
  cardBorder: string;
  hover: string;
  orange: string;
  orangeHover: string;
  orangeTint: string;
  text: string;
  muted: string;
  dim: string;
  subtle: string;
  teal: string;
  red: string;
  blue: string;
  purple: string;
  yellow: string;
}

const QUALITATIVE = {
  light: { teal: "#00A87E", blue: "#3B82F6", purple: "#A855F7" },
  dark: { teal: "#2DD4A8", blue: "#60A5FA", purple: "#C084FC" },
};

const WSO2_ORANGE = "#ff7300";
const WSO2_ORANGE_HOVER = "#e76000";

export function useEmployeeHubColors(): EmployeeHubColors {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const q = isDark ? QUALITATIVE.dark : QUALITATIVE.light;

  return {
    bg: theme.palette.background.default,
    surface: theme.palette.background.paper,
    card: theme.palette.background.paper,
    border: theme.palette.divider,
    cardBorder: theme.palette.divider,
    hover: theme.palette.action.hover,
    orange: WSO2_ORANGE,
    orangeHover: WSO2_ORANGE_HOVER,
    orangeTint: alpha(WSO2_ORANGE, isDark ? 0.16 : 0.08),
    text: theme.palette.text.primary,
    muted: theme.palette.text.secondary,
    dim: theme.palette.text.disabled,
    subtle: theme.palette.text.secondary,
    teal: q.teal,
    red: theme.palette.error.main,
    blue: q.blue,
    purple: q.purple,
    yellow: theme.palette.warning.main,
  };
}
