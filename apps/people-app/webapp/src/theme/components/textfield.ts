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

export const muiTextField = (colors: any): Components<Theme>["MuiTextField"] => ({
  styleOverrides: {
    root: {
      "& .MuiOutlinedInput-root": {
        borderRadius: 6,
        fontSize: "16px",
        fontWeight: 400,
        fontFamily: "'Geist', sans-serif",
        lineHeight: 1.5,
        "& .MuiOutlinedInput-input": {
          color: colors.text.primary.p2.active,
          padding: "8px 12px",
          "&::placeholder": {
            color: colors.text.primary.p3.active || "#666",
            fontSize: "14px",
            fontFamily: "'Geist', sans-serif",
            fontWeight: 400,
            opacity: 1,
          },
        },
        "& fieldset": {
          borderColor: colors.border.primary.b2.active || "#e5e5e5",
          borderWidth: "1px",
        },
        "&:hover fieldset": {
          borderColor: colors.border.primary.b2.hover || "#ccc",
        },
        "&.Mui-focused fieldset": {
          borderColor: colors.border.secondary.b1.active || "#00bfff",
          borderWidth: "1px",
        },
        "&.Mui-error fieldset": {
          borderColor: "#F23B0D",
        },
        "&.Mui-disabled": {
          "& fieldset": {
            borderColor: colors.border.primary.b2.active || "#e5e5e5",
          },
          "& .MuiOutlinedInput-input": {
            color: colors.text.primary.p4.active || "#a6a6a6",
          },
        },
      },
      "& .MuiInputLabel-root": {
        fontSize: "14px",
        fontWeight: 400,
        fontFamily: "'Geist', sans-serif",
        color: colors.text.primary.p3.active || "#666",
        "&.Mui-focused": {
          color: colors.text.primary.p2.active || "#333",
        },
        "&.Mui-error": {
          color: "#F23B0D",
        },
        "&.Mui-disabled": {
          color: colors.text.primary.p4.active || "#a6a6a6",
        },
        "&.MuiInputLabel-shrink": {
          fontSize: "18px",
        },
      },
      "& .MuiFormHelperText-root": {
        fontSize: "12px",
        fontWeight: 400,
        fontFamily: "'Geist', sans-serif",
        marginLeft: "2px",
        marginTop: "4px",
        "&.Mui-error": {
          color: "#F23B0D",
        },
      },
    },
  },
});
