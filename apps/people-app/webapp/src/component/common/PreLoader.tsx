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
import {
  Box,
  ThemeProvider,
  Typography,
  createTheme,
  useTheme as useMuiTheme,
} from "@mui/material";

import { useMemo } from "react";

import { APP_NAME } from "@root/src/config/config";
import { useWso2LogoColoredPulse } from "@root/src/hooks/useWso2Logo";
import { themeSettings as updatedThemeSettings } from "@src/theme/index";

interface PreLoaderProps {
  message?: string;
  isLoading?: boolean;
  hideImage?: boolean;
  marqueeOn?: boolean;
}

const PreLoader = (props: PreLoaderProps) => {
  const loadingMsg = [APP_NAME, props.message];
  const legacyTheme = useMuiTheme();
  const updatedTheme = useMemo(
    () => createTheme(updatedThemeSettings(legacyTheme.palette.mode)),
    [legacyTheme.palette.mode],
  );
  const { hideImage = true, marqueeOn = false } = props;

  const wso2Logo = useWso2LogoColoredPulse();

  return (
    <ThemeProvider theme={updatedTheme}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          width: "100%",
          backgroundColor: updatedTheme.palette.surface.primary.active,
          gap: 2.5,
        }}
      >
        {!hideImage && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
            <img alt="logo" width="150" height="auto" src={wso2Logo} />
          </Box>
        )}

        {/* {props.message && props.isLoading && (
        <LinearProgress
          sx={{
            position: "relative",
            width: "150px",
            borderRadius: "8px",
            backgroundColor: "#D9E8F2",
            "& .MuiLinearProgress-bar": {
              background: "linear-gradient(90deg, #E8F4FC 0%, #1B2A49 38.94%, #17223A 78.85%)",
            },
          }}
        />
      )} */}

        {props.message && marqueeOn && (
          <Box
            sx={{
              position: "relative",
              top: props.isLoading ? 4 : -16,
              height: "24px",
              overflow: "hidden",
              textAlign: "center",
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                animation: "vertical-marquee 3s cubic-bezier(0.76, 0, 0.24, 1) infinite",
                "@keyframes vertical-marquee": {
                  "0%, 40%": { transform: "translateY(0%)" },
                  "55%, 90%": { transform: "translateY(-33.33%)" },
                  "100%": { transform: "translateY(-66.66%)" },
                },
              }}
            >
              <Typography
                variant="h5"
                sx={{
                  color: updatedTheme.palette.customText.primary.p2.active,
                  height: "24px",
                  lineHeight: "24px",
                }}
              >
                {loadingMsg[0]}
              </Typography>

              <Typography
                variant="h5"
                sx={{
                  color: updatedTheme.palette.customText.primary.p2.active,
                  height: "24px",
                  lineHeight: "24px",
                }}
              >
                {loadingMsg[1]}
              </Typography>

              {/* Duplicate of first element to create seamless loop */}
              <Typography
                variant="h5"
                sx={{
                  color: updatedTheme.palette.customText.primary.p2.active,
                  height: "24px",
                  lineHeight: "24px",
                }}
              >
                {loadingMsg[0]}
              </Typography>
            </Box>
          </Box>
        )}

        {props.message && !marqueeOn && (
          <Typography
            variant="h5"
            sx={{
              position: "relative",
              top: props.isLoading ? 4 : -16,
              color: updatedTheme.palette.customText.primary.p2.active,
              textAlign: "center",
            }}
          >
            {props.message}
          </Typography>
        )}
      </Box>
    </ThemeProvider>
  );
};

export default PreLoader;
