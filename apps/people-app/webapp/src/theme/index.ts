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
import { type PaletteMode, alpha } from "@mui/material";

import designTokens from "../styles/design-tokens.json";
import { muiAutocomplete } from "./components/autocomplete";
import { muiButton } from "./components/button";
import { muiSwitch } from "./components/switch";
import { muiTextField } from "./components/textfield";
import { muiTooltip } from "./components/tooltip";
import "./types";

// Helper function to remove 'ff' suffix from hex colors
const cleanHexColor = (color: string): string => {
  if (color.endsWith("ff")) {
    return color.slice(0, -2);
  }
  return color;
};

// Extract and transform color tokens from design tokens
const extractColors = () => {
  const { variables } = designTokens;

  return {
    neutral: Object.entries(variables.colors.neutral).reduce(
      (acc, [key, token]: [string, any]) => {
        acc[key] = cleanHexColor(token.value);
        return acc;
      },
      {} as Record<string, string>,
    ),

    primary: Object.entries(variables.colors.primary).reduce(
      (acc, [key, token]: [string, any]) => {
        acc[key] = cleanHexColor(token.value);
        return acc;
      },
      {} as Record<string, string>,
    ),

    secondary: Object.entries(variables.colors.secondary).reduce(
      (acc, [key, token]: [string, any]) => {
        acc[key] = cleanHexColor(token.value);
        return acc;
      },
      {} as Record<string, string>,
    ),
  };
};

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
    caption: font["p-s-500"].value,
    overline: font["p-xs"].value,
  };
};

// Color Design Tokens with mode support
export const tokens = (mode: PaletteMode) => {
  const colors = extractColors();

  return {
    ...(mode === "dark"
      ? {
          // Colors - Dark mode
          neutral: colors.neutral,
          secondary: colors.secondary,
          primary: colors.primary,

          // Text colors - Dark mode
          text: {
            primary: {
              p1: {
                active: colors.neutral.white,
                hover: "#ffffff",
                disabled: alpha(colors.neutral.white, 0.59),
              },
              p2: {
                active: colors.neutral["300"],
                hover: "#ffffff",
                disabled: alpha(colors.neutral["300"], 0.59),
              },
              p3: {
                active: colors.neutral["800"],
                hover: "#ffffff",
                disabled: alpha(colors.neutral["800"], 0.59),
              },
              p4: {
                active: colors.neutral["1300"],
                hover: "#ffffff",
                disabled: alpha(colors.neutral["1300"], 0.59),
              },
            },
            secondary: {
              p1: { active: colors.secondary["900"], hover: "#FF6A0096", disabled: "#ff730096" },
              p2: { active: colors.secondary["1000"], hover: "#FF6A0096", disabled: "#ff730096" },
            },
            brand: {
              p1: {
                active: colors.primary["1200"],
                hover: "#FF6A0096",
                disabled: alpha(colors.primary["1200"], 0.59),
              },
              p2: { active: colors.primary.main, hover: "#FF6A0096", disabled: "#ff73005c" },
            },
          },

          // Border colors - Dark mode
          border: {
            primary: {
              b1: {
                active: colors.neutral["1300"],
                hover: "#ffffff",
                clicked: "#ffffff",
                disabled: "#ffffff",
              },
              b2: {
                active: colors.neutral["1600"],
                hover: colors.neutral["1400"],
                clicked: "#ffffff",
                disabled: "#ffffff",
              },
              b3: {
                active: "#2e3338",
                hover: "#394046",
                clicked: "#ffffff",
                disabled: "#ffffff",
              },
            },
            secondary: {
              b1: {
                active: "#0099cc",
                hover: "#2ecbff",
                clicked: "#06b1f4",
                disabled: "#00bfff96",
              },
            },
            brand: {
              b1: {
                active: colors.primary["1300"],
                hover: "#e56000",
                clicked: "#ffffff",
                disabled: "#ffffff",
              },
            },
          },

          // Navigation colors - Dark mode
          navigation: {
            text: colors.neutral["800"],
            hover: colors.neutral["400"],
            textClicked: colors.neutral.white,
            hoverBg: colors.neutral["1800"],
            clickedBg: colors.primary["1200"],
            border: colors.neutral["1700"],
          },

          // Surface colors - Dark mode
          surface: {
            primary: {
              active: colors.neutral["1800"],
              hover: colors.neutral["1900"],
            },
            secondary: {
              active: "#171717",
            },
            navbar: {
              active: colors.neutral["1900"],
              hover: colors.secondary["1700"],
            },
          },

          // Fill colors - Dark mode
          fill: {
            primary: {
              main: {
                active: colors.primary["1700"],
                hover: colors.primary["1600"],
                clicked: colors.primary["1800"],
                disabled: alpha(colors.primary["1700"], 0.59),
              },
              light: {
                active: colors.primary["1800"],
                hover: "#411b01",
                clicked: "#FFFFFF",
                disabled: alpha(colors.primary["1800"], 0.59),
              },
              dark: {
                active: colors.primary["1400"],
                hover: "#FFFFFF",
                clicked: "#FFFFFF",
                disabled: "#FFFFFF",
              },
            },
            secondary: {
              main: {
                active: colors.secondary["1000"],
                hover: colors.secondary["1100"],
                clicked: colors.secondary["1200"],
                disabled: "#0A475C96",
              },
              light: {
                active: colors.secondary["1400"],
                hover: colors.secondary["1300"],
                clicked: colors.secondary["1500"],
                disabled: "#0A475C96",
              },
            },
            neutral: {
              main: {
                active: "#FFFFFF",
                hover: colors.neutral.black,
                clicked: "#FFFFFF",
                disabled: "#ffffff96",
              },
              light: {
                active: colors.neutral["1800"],
                hover: colors.neutral["1700"],
                clicked: "#000000",
                disabled: "#ffffff96",
              },
              dark: {
                active: colors.neutral["1700"],
                hover: "#FFFFFF",
                clicked: "#FFFFFF",
                disabled: "#ffffff96",
              },
            },
            xmas: {
              active: "#B8D3E0d7",
            },
          },

          // Shadow colors - Dark mode
          shadow: {
            primary: {
              active: "#000000CC",
              hover: colors.neutral["1900"],
            },
          },
        }
      : {
          // Light mode colors
          neutral: colors.neutral,
          primary: colors.primary,
          secondary: colors.secondary,

          // Text colors - Light mode
          text: {
            primary: {
              p1: {
                active: colors.neutral.black,
                hover: "#FFFFFF",
                disabled: alpha(colors.neutral.black, 0.59),
              },
              p2: {
                active: colors.neutral["1600"],
                hover: "#FFFFFF",
                disabled: alpha(colors.neutral["1600"], 0.59),
              },
              p3: {
                active: colors.neutral["1200"],
                hover: "#FFFFFF",
                disabled: alpha(colors.neutral["1200"], 0.59),
              },
              p4: {
                active: colors.neutral["700"],
                hover: "#FFFFFF",
                disabled: alpha(colors.neutral["700"], 0.59),
              },
            },
            secondary: {
              p1: { active: colors.secondary["800"], hover: "#FFFFFF", disabled: "#FFFFFF" },
              p2: { active: colors.secondary.main, hover: "#FFFFFF", disabled: "#FFFFFF" },
            },
            brand: {
              p1: { active: colors.primary["1100"], hover: "#FFFFFF", disabled: "#ff730096" },
              p2: { active: colors.neutral.white, hover: "#FF6A0096", disabled: "#ffffff96" },
            },
          },

          // Border colors - Light mode
          border: {
            primary: {
              b1: {
                active: colors.neutral["700"],
                hover: "#ffffff",
                clicked: "#ffffff",
                disabled: alpha(colors.neutral[700], 0.59),
              },
              b2: {
                active: colors.neutral["200"],
                hover: colors.neutral["400"],
                clicked: "#ffffff",
                disabled: "#ffffff",
              },
              b3: {
                active: "#D1D9E0",
                hover: "#C2CDD6",
                clicked: "#ffffff",
                disabled: "#D2D9E096",
              },
            },
            secondary: {
              b1: {
                active: "#00BFFF",
                hover: "#2ECBFF",
                clicked: "#06b1f4",
                disabled: "#00bfff96",
              },
            },
            brand: {
              b1: {
                active: colors.primary.main,
                hover: "#E96F0C",
                clicked: "#ffffff",
                disabled: alpha(colors.primary.main, 0.59),
              },
            },
          },

          // Surface colors - Light mode
          surface: {
            primary: {
              active: colors.neutral.light_white,
              hover: colors.neutral.white,
            },
            secondary: {
              active: colors.neutral.white,
            },
            navbar: {
              active: colors.neutral["1900"],
              hover: "#FFFFFF",
            },
          },

          // Fill colors - Light mode
          fill: {
            primary: {
              main: {
                active: colors.primary.main,
                hover: colors.primary["900"],
                clicked: colors.primary["1100"],
                disabled: "#FF730096",
              },
              light: {
                active: colors.primary["100"],
                hover: colors.primary["200"],
                clicked: colors.primary["300"],
                disabled: alpha(colors.primary["100"], 0.5),
              },
              dark: {
                active: colors.primary["1200"],
                hover: colors.primary["1100"],
                clicked: colors.primary["1300"],
                disabled: alpha(colors.primary["1200"], 0.5),
              },
            },
            secondary: {
              main: {
                active: colors.secondary.main,
                hover: colors.secondary["600"],
                clicked: colors.secondary["800"],
                disabled: "#00CEFF96",
              },
              light: {
                active: colors.secondary["0"],
                hover: colors.secondary["100"],
                clicked: colors.secondary["200"],
                disabled: alpha(colors.secondary["0"], 0.5),
              },
            },
            neutral: {
              main: {
                active: colors.neutral.white,
                hover: colors.neutral["100"],
                clicked: colors.neutral["200"],
                disabled: alpha(colors.neutral.white, 0.5),
              },
              light: {
                active: colors.neutral["100"],
                hover: colors.neutral.white,
                clicked: colors.neutral["200"],
                disabled: alpha(colors.neutral["100"], 0.5),
              },
              dark: {
                active: colors.neutral["1700"],
                hover: colors.neutral["1600"],
                clicked: colors.neutral["1800"],
                disabled: alpha(colors.neutral["1700"], 0.5),
              },
            },
            xmas: {
              active: "#A6C8D9",
            },
          },

          // Navigation colors - Light mode
          navigation: {
            text: colors.neutral["800"],
            hover: colors.neutral["400"],
            textClicked: colors.neutral.white,
            hoverBg: colors.neutral["1800"],
            clickedBg: colors.primary["1200"],
            border: colors.neutral["1700"],
          },

          // Shadow colors - Light mode
          shadow: {
            primary: {
              active: "#00000014",
              hover: colors.neutral["1900"],
            },
          },
        }),
  };
};

// MUI Theme Settings
export const themeSettings = (mode: PaletteMode) => {
  const colors = tokens(mode);
  const typography = extractTypography();

  return {
    palette: {
      mode: mode,
      primary: {
        main: colors.primary.main,
        light: colors.primary["400"],
        dark: colors.primary["1000"],
        contrastText: "#ffffff",
      },
      secondary: {
        main: colors.secondary.main,
        light: colors.secondary["400"],
        dark: colors.secondary["900"],
        contrastText: "#ffffff",
      },
      error: {
        main: "#F23B0D",
        light: "#FF704D",
        dark: "#BD1C0F",
      },
      warning: {
        main: "#ff9800",
        light: "#ffb74d",
        dark: "#f57c00",
      },
      info: {
        main: colors.secondary.main,
        light: colors.secondary["400"],
        dark: colors.secondary["900"],
      },
      success: {
        main: "#4caf50",
        light: "#81c784",
        dark: "#388e3c",
      },
      neutral: colors.neutral,
      primaryShades: colors.primary,
      secondaryShades: colors.secondary,
      customBorder: colors.border,
      customNavigation: colors.navigation,
      surface: colors.surface,
      fill: colors.fill,
      customText: colors.text,
      shadow: colors.shadow,
    },
    typography: {
      fontFamily: '"Inter", "Poppins", system-ui, sans-serif',
      fontSize: 14,
      h1: {
        fontSize: typography.h1.fontSize,
        fontWeight: typography.h1.fontWeight,
        lineHeight: `${typography.h1.lineHeight}px`,
        letterSpacing: `${typography.h1.letterSpacing}px`,
      },
      h2: {
        fontSize: typography.h2.fontSize,
        fontWeight: typography.h2.fontWeight,
        lineHeight: `${typography.h2.lineHeight}px`,
        letterSpacing: `${typography.h2.letterSpacing}px`,
      },
      h3: {
        fontSize: typography.h3.fontSize,
        fontWeight: typography.h3.fontWeight,
        lineHeight: `${typography.h3.lineHeight}px`,
        letterSpacing: `${typography.h3.letterSpacing}px`,
      },
      h4: {
        fontSize: typography.h4.fontSize,
        fontWeight: typography.h4.fontWeight,
        lineHeight: `${typography.h4.lineHeight}px`,
        letterSpacing: `${typography.h4.letterSpacing}px`,
      },
      h5: {
        fontSize: typography.h5.fontSize,
        fontWeight: typography.h5.fontWeight,
        lineHeight: `${typography.h5.lineHeight}px`,
        letterSpacing: `${typography.h5.letterSpacing}px`,
      },
      h6: {
        fontSize: typography.h6.fontSize,
        fontWeight: typography.h6.fontWeight,
        lineHeight: `${typography.h6.lineHeight}px`,
        letterSpacing: `${typography.h6.letterSpacing}px`,
      },
      body1: {
        fontSize: typography.body1.fontSize,
        fontWeight: typography.body1.fontWeight,
        lineHeight: `${typography.body1.lineHeight}px`,
        letterSpacing: `${typography.body1.letterSpacing}px`,
      },
      body2: {
        fontSize: typography.body2.fontSize,
        fontWeight: typography.body2.fontWeight,
        lineHeight: `${typography.body2.lineHeight}px`,
        letterSpacing: `${typography.body2.letterSpacing}px`,
      },
      caption: {
        fontSize: typography.caption.fontSize,
        fontWeight: typography.caption.fontWeight,
        lineHeight: `${typography.caption.lineHeight}px`,
        letterSpacing: `${typography.caption.letterSpacing}px`,
      },
      overline: {
        fontSize: typography.overline.fontSize,
        fontWeight: typography.overline.fontWeight,
        lineHeight: `${typography.overline.lineHeight}px`,
        letterSpacing: `${typography.overline.letterSpacing}px`,
      },
    },
    components: {
      MuiButton: muiButton,
      MuiTextField: muiTextField(colors),
      MuiSwitch: muiSwitch(colors),
      MuiTooltip: muiTooltip(colors),
      MuiAutocomplete: muiAutocomplete(colors),
    },
    breakpoints: {
      values: {
        xs: 0,
        sm: 700,
        md: 960,
        lg: 1280,
        xl: 1920,
      },
    },
    shape: {
      borderRadius: 8,
    },
    spacing: 8,
  };
};

export default themeSettings;
