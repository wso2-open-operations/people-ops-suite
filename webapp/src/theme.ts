// Copyright (c) 2024, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import { PaletteMode } from "@mui/material";
import designTokens from "./styles/design-tokens.json";
// Extract font/typography tokens
const extractTypography = () => {
  const { font } = designTokens;

  return {
    h1: font.h1.value,
    h2: font.h2.value,
    h3: font.h3.value,
    h4: font.h4.value,
    h5: font.h5.value,
    h6: font.h6.value,
    body1: font["p-r"].value,
    body2: font["p-m"].value,
    caption: font["p-s"].value,
    overline: font["p-xs"].value,
  };
};
// color design tokens export
export const tokens = (mode: PaletteMode) => ({
  ...(mode === "dark"
    ? {
        grey: {
          100: "#e0e0e0",
          200: "#c2c2c2",
          300: "#a3a3a3",
          400: "#858585",
          500: "#666666",
          600: "#525252",
          700: "#3d3d3d",
          800: "#292929",
          900: "#141414",
        },
        primary: {
          100: "#d0d1d5",
          200: "#a1a4ab",
          300: "#727681",
          400: "#1F2A40",
          500: "#141b2d",
          600: "#101624",
          700: "#0c101b",
          800: "#080b12",
          900: "#040509",
        },
        greenAccent: {
          100: "#dbf5ee",
          200: "#b7ebde",
          300: "#94e2cd",
          400: "#70d8bd",
          500: "#4cceac",
          600: "#3da58a",
          700: "#2e7c67",
          800: "#1e5245",
          900: "#0f2922",
        },
        redAccent: {
          100: "#f8dcdb",
          200: "#f1b9b7",
          300: "#e99592",
          400: "#e2726e",
          500: "#db4f4a",
          600: "#af3f3b",
          700: "#832f2c",
          800: "#58201e",
          900: "#2c100f",
        },
        blueAccent: {
          100: "#e1e2fe",
          200: "#c3c6fd",
          300: "#a4a9fc",
          400: "#868dfb",
          500: "#6870fa",
          600: "#535ac8",
          700: "#3e4396",
          800: "#2a2d64",
          900: "#151632",
        },
        yellowAccent: {
          100: "#fff9c4",
          200: "#e5e0b0",
          300: "#ccc79c",
          400: "#b2ae89",
          500: "#999575",
          600: "#7f7c62",
          700: "#66634e",
          800: "#4c4a3a",
          900: "#333126",
        },
      }
    : {
        grey: {
          100: "#141414",
          200: "#292929",
          300: "#3d3d3d",
          400: "#525252",
          500: "#666666",
          600: "#858585",
          700: "#a3a3a3",
          800: "#c2c2c2",
          900: "#e0e0e0",
        },
        primary: {
          100: "#040509",
          200: "#080b12",
          300: "#0c101b",
          400: "#f2f0f0", // manually changed
          500: "#141b2d",
          600: "#1F2A40",
          700: "#727681",
          800: "#a1a4ab",
          900: "#d0d1d5",
        },
        greenAccent: {
          100: "#0f2922",
          200: "#1e5245",
          300: "#2e7c67",
          400: "#3da58a",
          500: "#4cceac",
          600: "#70d8bd",
          700: "#94e2cd",
          800: "#b7ebde",
          900: "#dbf5ee",
        },
        redAccent: {
          100: "#2c100f",
          200: "#58201e",
          300: "#832f2c",
          400: "#af3f3b",
          500: "#db4f4a",
          600: "#e2726e",
          700: "#e99592",
          800: "#f1b9b7",
          900: "#f8dcdb",
        },
        blueAccent: {
          100: "#151632",
          200: "#2a2d64",
          300: "#3e4396",
          400: "#535ac8",
          500: "#6870fa",
          600: "#868dfb",
          700: "#a4a9fc",
          800: "#c3c6fd",
          900: "#e1e2fe",
        },
        yellowAccent: {
          100: "#333126",
          200: "#4c4a3a",
          300: "#66634e",
          400: "#7f7c62",
          500: "#999575",
          600: "#b2ae89",
          700: "#ccc79c",
          800: "#e5e0b0",
          900: "#fff9c4",
        },
      }),

  customColors: {
    white: "#ffffff",
    lightGray: "#e7ebf0",
    orange: "#ff7300",
    lightOrange: "#ffe3cc",
    darkOrange: "#331700",
    offWhite: "#eeeeee",
    darkGray: "#0d0d0d",
    gray: "#919090",
    green: "#36b37e",
    darkBlue: "#212a30",
    secondaryBlue: {
      main: "#5686e1",
      light: "#dde6f9",
      shade: "#3c5d9d",
      dark: "#2b4370",
    },
    primaryBlue: {
      main: "#021d5f",
      shade: "#344a7e",
      pale: "#99a4bf",
      light: "#e5e8ef",
    },
  },
});

// mui theme settings
export const themeSettings = (mode: PaletteMode) => {
    const typography = extractTypography();
  const colors = tokens(mode);
  return {
    palette: {
      mode: mode,
      ...(mode === "dark"
        ? {
            // palette values for dark mode
            primary: {
              main: "#5686e1",
            },
            success: {
              main: "#5686e1",
            },
            secondary: {
              main: "#021d5f",
              contrastText: "#fff",
            },
            neutral: {
              dark: colors.grey[700],
              main: colors.grey[500],
              light: colors.grey[100],
            },
            background: {
              default: colors.grey[900],
            },
            customColors: {
              white: "#ffffff",
              lightGray: "#e7ebf0",
              orange: "#ff7300",
              lightOrange: "#ffe3cc",
              darkOrange: "#331700",
              offWhite: "#eeeeee",
              darkGray: "#0d0d0d",
              gray: "#919090",
              green: "#36b37e",
              darkBlue: "#212a30",
              secondaryBlue: {
                main: "#5686e1",
                light: "#dde6f9",
                shade: "#3c5d9d",
                dark: "#2b4370",
              },
              primaryBlue: {
                main: "#021d5f",
                shade: "#344a7e",
                pale: "#99a4bf",
                light: "#e5e8ef",
              },
            },
          }
        : {
            // palette values for light mode
            primary: {
              main: "#021d5f",
            },
            success: {
              main: "#5686e1",
              contrastText: "#fff",
            },
            secondary: {
              main: "#5686e1",
              contrastText: "#fff",
            },
            neutral: {
              dark: colors.grey[700],
              main: colors.grey[500],
              light: colors.grey[100],
            },
            background: {
              default: "#f2f2f2",
              main: "#212a30",
            },
            customColors: {
              white: "#ffffff",
              lightGray: "#e7ebf0",
              orange: "#ff7300",
              lightOrange: "#ffe3cc",
              darkOrange: "#331700",
              offWhite: "#eeeeee",
              darkGray: "#0d0d0d",
              gray: "#919090",
              green: "#36b37e",
              darkBlue: "#212a30",
              secondaryBlue: {
                main: "#5686e1",
                light: "#dde6f9",
                shade: "#3c5d9d",
                dark: "#2b4370",
              },
              primaryBlue: {
                main: "#021d5f",
                shade: "#344a7e",
                pale: "#99a4bf",
                light: "#e5e8ef",
              },
            },
          }),
    },
    typography: {
      fontSize: 13,
      fontFamily: ["Poppins", "sans-serif"].join(","),
      h1: {
        fontSize: 40,
      },
      h2: {
        fontSize: 32,
      },
      h3: {
        fontSize: 24,
      },
      h4: {
        fontSize: 20,
      },
      h5: {
        fontSize: typography.h5.fontSize,
        fontWeight: typography.h5.fontWeight,
        lineHeight: `${typography.h5.lineHeight}px`,
        letterSpacing: `${typography.h5.letterSpacing}px`,
      },
      h6: {
        fontSize: 14,
      },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: "0.2rem",
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderColor:
              mode === "dark"
                ? colors.primary[400]
                : colors.customColors.primaryBlue.light,
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: `${
                mode === "dark"
                  ? colors.customColors.secondaryBlue.dark
                  : colors.customColors.primaryBlue.pale
              } !important`,
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: `${
                mode === "dark"
                  ? colors.customColors.secondaryBlue.shade
                  : colors.customColors.primaryBlue.shade
              } !important`,
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: `${
                mode === "dark"
                  ? colors.customColors.secondaryBlue.main
                  : colors.customColors.primaryBlue.main
              } !important`,
            },
            "&.Mui-error .MuiOutlinedInput-notchedOutline": {
              borderColor: `${colors.redAccent[500]} !important`,
            },
            "&.Mui-error:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: `${colors.redAccent[500]} !important`,
            },
          },
        },
      },
      MuiAlert: {
        styleOverrides: {
          standardSuccess: {
            backgroundColor: colors.greenAccent[900],
            color: colors.customColors.green,
            "& .MuiAlert-icon": {
              color: colors.customColors.green,
            },
          },
          standardError: {
            backgroundColor:
              mode === "dark" ? colors.redAccent[800] : colors.redAccent[900],
            color:
              mode === "dark" ? colors.redAccent[400] : colors.redAccent[500],
            "& .MuiAlert-icon": {
              color:
                mode === "dark" ? colors.redAccent[400] : colors.redAccent[500],
            },
          },
          standardWarning: {
            backgroundColor:
              mode === "dark"
                ? colors.customColors.darkOrange
                : colors.customColors.lightOrange,
            color: colors.customColors.orange,
            "& .MuiAlert-icon": {
              color: colors.customColors.orange,
            },
          },
          standardInfo: {
            backgroundColor:
              mode === "dark"
                ? colors.customColors.darkBlue
                : colors.customColors.primaryBlue.light,
            color:
              mode === "dark"
                ? colors.customColors.primaryBlue.light
                : colors.customColors.primaryBlue.main,
            "& .MuiAlert-icon": {
              color:
                mode === "dark"
                  ? colors.customColors.primaryBlue.light
                  : colors.customColors.primaryBlue.main,
            },
          },
        },
      },
      MuiDataGrid: {
        styleOverrides: {
          root: {
            "& .MuiDataGrid-cell:focus": {
              outline: " none",
            },
            ".MuiDataGrid-cell:focus-within, .MuiDataGrid-columnHeader:focus": {
              outline: "none",
            },
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            whiteSpace: "pre-line",
            fontSize: "0.9rem",
            backgroundColor:
              mode === "dark"
                ? colors.customColors.secondaryBlue.main
                : colors.customColors.primaryBlue.main,
          },
          arrow: {
            color:
              mode === "dark"
                ? colors.customColors.secondaryBlue.main
                : colors.customColors.primaryBlue.main,
          },
        },
      },
    },
  };
};
