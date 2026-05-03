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
import { Box, LinearProgress, Typography, useTheme } from "@mui/material";

import Wso2Logo from "@assets/images/wso2-logo.png";
import Wso2LogoWhite from "@assets/images/wso2-logo-white.png";
import type { PreLoaderProps } from "@utils/types";

const PreLoader = (props: PreLoaderProps) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const background = isDark
    ? "radial-gradient(circle at top left, #1E325C 0%, #121C30 50%, #070A11 100%)"
    : "radial-gradient(circle at center, #FFFFFF 0%, #EAF0F7 40%, #C8D5E5 100%)";
  return (
    <Box
      sx={{
        background,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        width: "100%",
        gap: 2,
      }}
    >
      <img
        src={isDark ? Wso2LogoWhite : Wso2Logo}
        alt="WSO2"
        style={{ height: 20, marginBottom: 5 }}
      />

      {props.isLoading && (
        <LinearProgress sx={{ width: "150px" }} />
      )}

      <Typography
        variant="body2"
        sx={{
          color: isDark ? "rgba(255,255,255,0.7)" : theme.palette.text.secondary,
          letterSpacing: 0.5,
        }}
      >
        {props.message}
      </Typography>
    </Box>
  );
};

export default PreLoader;
