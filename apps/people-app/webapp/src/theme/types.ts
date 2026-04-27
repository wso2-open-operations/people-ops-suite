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

// Extend MUI Button variant types
declare module "@mui/material/Button" {
  interface ButtonPropsVariantOverrides {
    submit: true;
    primary: true;
    secondary: true;
  }

  interface ButtonPropsColorOverrides {
    neutral: true;
    brand: true;
  }
}

// Extend MUI theme types
declare module "@mui/material/styles" {
  interface TypeBackground {
    primary?: string;
    secondary?: string;
    secondaryLight?: string;
    primaryLight?: string;
    lightWhite?: string;
  }

  interface TypeText {
    brand?: string;
  }

  interface Palette {
    neutral: Record<string | number, string | undefined>;
    primaryShades: Record<string, string>;
    secondaryShades: Record<string, string>;
    customBorder: {
      primary: {
        b1: {
          active: string;
          hover: string;
          clicked: string;
          disabled: string;
        };
        b2: {
          active: string;
          hover: string;
          clicked: string;
          disabled: string;
        };
        b3: {
          active: string;
          hover: string;
          clicked: string;
          disabled: string;
        };
      };
      secondary: {
        b1: {
          active: string;
          hover: string;
          clicked: string;
          disabled: string;
        };
      };
      brand: {
        b1: {
          active: string;
          hover: string;
          clicked: string;
          disabled: string;
        };
      };
    };
    customNavigation: {
      text: string;
      textClicked: string;
      hover: string;
      hoverBg: string;
      clicked: string;
      clickedBg: string;
      border: string;
    };
    surface: {
      primary: Record<string, string>;
      navbar: Record<string, string>;
      secondary: Record<string, string>;
    };
    fill: {
      primary: {
        main: Record<string, string>;
        light: Record<string, string>;
        dark: Record<string, string>;
      };
      secondary: {
        main: Record<string, string>;
        light: Record<string, string>;
      };
      neutral: {
        main: Record<string, string>;
        light: Record<string, string>;
        dark: Record<string, string>;
      };
      xmas: Record<string, string>;
    };
    shadow: {
      primary: Record<string, string>;
    };
    customText: {
      primary: {
        p1: { active: string; hover: string; disabled?: string };
        p2: { active: string; hover: string; disabled?: string };
        p3: { active: string; hover: string; disabled?: string };
        p4: { active: string; hover: string; disabled?: string };
      };
      secondary: {
        p1: { active: string; hover: string; disabled?: string };
        p2: { active: string; hover: string; disabled?: string };
      };
      brand: {
        p1: { active: string; hover: string; disabled?: string };
        p2: { active: string; hover: string; disabled?: string };
      };
    };
  }

  interface PaletteOptions {
    neutral?: Record<string | number, string | undefined>;
    primaryShades?: Record<string, string>;
    secondaryShades?: Record<string, string>;
    customBorder?: {
      primary?: {
        b1?: {
          active: string;
          hover: string;
          clicked: string;
          disabled: string;
        };
        b2?: {
          active: string;
          hover: string;
          clicked: string;
          disabled: string;
        };
        b3?: {
          active: string;
          hover: string;
          clicked: string;
          disabled: string;
        };
      };
      secondary?: {
        b1?: {
          active: string;
          hover: string;
          clicked: string;
          disabled: string;
        };
      };
      brand?: {
        b1?: {
          active: string;
          hover: string;
          clicked: string;
          disabled: string;
        };
      };
    };
    customNavigation?: {
      text?: string;
      textClicked?: string;
      bg?: string;
      hover?: string;
      hoverBg?: string;
      clicked?: string;
      clickedBg?: string;
      border: string;
    };
    surface?: {
      primary?: Record<string, string>;
      navbar?: Record<string, string>;
      secondary?: Record<string, string>;
    };
    fill?: {
      primary?: {
        main?: Record<string, string>;
        light?: Record<string, string>;
        dark?: Record<string, string>;
      };
      secondary?: {
        main?: Record<string, string>;
        light?: Record<string, string>;
      };
      neutral?: {
        main?: Record<string, string>;
        light?: Record<string, string>;
        dark?: Record<string, string>;
      };
      xmas?: Record<string, string>;
    };
    shadow?: {
      primary?: Record<string, string>;
    };
    customText?: {
      primary?: {
        p1?: { active: string; hover: string; disabled?: string };
        p2?: { active: string; hover: string; disabled?: string };
        p3?: { active: string; hover: string; disabled?: string };
        p4?: { active: string; hover: string; disabled?: string };
      };
      secondary?: {
        p1?: { active: string; hover: string; disabled?: string };
        p2?: { active: string; hover: string; disabled?: string };
      };
      brand?: {
        p1?: { active: string; hover: string; disabled?: string };
        p2?: { active: string; hover: string; disabled?: string };
      };
    };
  }
}

export {};
