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

export const muiButton: Components<Theme>["MuiButton"] = {
  defaultProps: {
    disableElevation: true,
  },
  styleOverrides: {
    root: {
      textTransform: "none",
      borderRadius: 6,
      fontWeight: 500,
    },
  },
  variants: [
    {
      props: { variant: "primary" as any },
      style: ({ theme }) => ({
        backgroundColor: theme.palette.fill.primary.main.clicked,
        color: theme.palette.customText.brand.p2.active,
        boxShadow: "none" as const,
        "&:hover": {
          backgroundColor: theme.palette.fill.primary.main.hover,
          boxShadow: "none" as const,
        },
        "&.Mui-disabled": {
          backgroundColor: theme.palette.fill.primary.main.disabled,
          color: theme.palette.customText.brand.p2.disabled,
        },
      }),
    },

    {
      props: { variant: "secondary" as any },
      style: ({ theme }) => ({
        backgroundColor: theme.palette.secondary.main,
        color: theme.palette.secondary.contrastText,
        "&:hover": { backgroundColor: theme.palette.secondary.dark },
      }),
    },

    // Outlined variant with primary/brand colors (default)
    {
      props: { variant: "outlined" },
      style: ({ theme }) => ({
        backgroundColor: "transparent",
        border: `1px solid ${theme.palette.customBorder.brand.b1.active}`,
        color: theme.palette.customText.brand.p1.active,
        "&:hover": {
          backgroundColor: theme.palette.fill.primary.light.active,
        },
        "&.Mui-disabled": {
          backgroundColor: "transparent",
          color: theme.palette.customText.brand.p1.disabled,
          borderColor: theme.palette.customBorder.brand.b1.disabled,
        },
      }),
    },

    // Outlined variant with neutral colors
    {
      props: { variant: "outlined", color: "neutral" },
      style: ({ theme }) => ({
        backgroundColor: "transparent",
        border: `1px solid ${theme.palette.customBorder.primary.b3.active}`,
        color: theme.palette.customText.primary.p3.active,
        "&:hover": {
          border: `1px solid ${theme.palette.customBorder.primary.b3.hover}`,
          backgroundColor: theme.palette.fill.neutral.light.active,
        },
        "&.Mui-disabled": {
          backgroundColor: "transparent",
          borderColor: theme.palette.customBorder.primary.b3.disabled,
          color: theme.palette.customText.primary.p2.disabled,
        },
      }),
    },

    // Outlined variant with neutral-to-brand transition on hover
    {
      props: { variant: "outlined", color: "brand" },
      style: ({ theme }) => ({
        backgroundColor: "transparent",
        border: `1px solid ${theme.palette.customBorder.primary.b3.active}`,
        color: theme.palette.customText.primary.p3.active,
        "&:hover": {
          border: `1px solid ${theme.palette.customBorder.brand.b1.active}`,
          color: theme.palette.customText.brand.p1.active,
          backgroundColor: theme.palette.fill.primary.light.active,
        },
        "&.Mui-disabled": {
          backgroundColor: "transparent",
          borderColor: theme.palette.customBorder.brand.b1.disabled,
          color: theme.palette.customText.brand.p1.disabled,
        },
      }),
    },

    // Outlined variant with error/danger colors
    {
      props: { variant: "outlined", color: "error" },
      style: ({ theme }) => ({
        backgroundColor: "transparent",
        border: `1px solid ${theme.palette.customBorder.primary.b3.active}`,
        color: theme.palette.error.main,
        padding: "6px 16px",
        borderRadius: "6px",
        "&:hover": {
          border: `1px solid ${theme.palette.error.main}`,
          backgroundColor: "rgba(242, 59, 13, 0.04)",
        },
        "&.Mui-disabled": {
          backgroundColor: "transparent",
          borderColor: theme.palette.customBorder.primary.b3.active,
          color: theme.palette.error.main,
          opacity: 0.5,
        },
      }),
    },
  ],
};
