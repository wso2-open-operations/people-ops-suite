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
import { alpha } from "@mui/material";
import type { Components, Theme } from "@mui/material/styles";

export const muiSwitch = (colors: any): Components<Theme>["MuiSwitch"] => ({
  styleOverrides: {
    root: {
      width: 58,
      height: 38,
      padding: 0.5,
      "& .MuiSwitch-switchBase": {
        padding: 0,
        margin: "7px",
        transitionDuration: "300ms",
        color: alpha(colors.fill.secondary.main.active, 0.59),
        "&.Mui-checked": {
          transform: "translateX(20px)",
          color: colors.fill.secondary.main.active,
          "& + .MuiSwitch-track": {
            backgroundColor: colors.fill.secondary.light.active,
          },
        },
        "&.Mui-disabled": {
          color: alpha(colors.fill.secondary.main.active, 0.35),
          "& + .MuiSwitch-track": {
            backgroundColor: colors.fill.secondary.main.disabled,
          },
        },
      },
      "& .MuiSwitch-thumb": {
        width: 24,
        height: 24,
      },
      "& .MuiSwitch-track": {
        borderRadius: 38 / 2,
        backgroundColor: alpha(colors.fill.secondary.light.active, 0.59),
        opacity: 1,
      },
    },
  },
});
