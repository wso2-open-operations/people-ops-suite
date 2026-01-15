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
import { Box, LinearProgress, Typography, alpha } from "@mui/material";
import Lottie from "lottie-react";

import animatedLogo from "@assets/animations/animation-logo-dark.json";
import { APP_NAME } from "@root/src/config/config";

interface PreLoaderProps {
  message?: string;
  isLoading?: boolean;
}

const PreLoader = (props: PreLoaderProps) => {
  const loadingMsg = [APP_NAME, props.message];

  const style = {
    height: "150px",
    transform: "skewX(-5deg)",
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        width: "100%",
        backgroundColor: "#1a1a1a",
      }}
    >
      <Lottie animationData={animatedLogo} style={style} />

      {props.message && props.isLoading && (
        <LinearProgress
          sx={{
            position: "relative",
            top: -16,
            width: "150px",
            backgroundColor: alpha("#4C2300", 1),
            "& .MuiLinearProgress-bar": {
              backgroundColor: "#EB6A00",
            },
          }}
        />
      )}

      {props.message && (
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
              animation: "vertical-marquee 5s cubic-bezier(0.76, 0, 0.24, 1) infinite",
              "@keyframes vertical-marquee": {
                "0%, 35%": { transform: "translateY(0%)" },
                "50%, 85%": { transform: "translateY(-33.33%)" },
                "100%": { transform: "translateY(-66.66%)" },
              },
            }}
          >
            <Typography
              variant="h6"
              sx={{ color: alpha("#FFFFFF", 0.9), height: "24px", lineHeight: "24px" }}
            >
              {loadingMsg[0]}
            </Typography>
            <Typography
              variant="h6"
              sx={{ color: alpha("#FFFFFF", 0.9), height: "24px", lineHeight: "24px" }}
            >
              {loadingMsg[1]}
            </Typography>
            {/* Duplicate of first element to create seamless loop */}
            <Typography
              variant="h6"
              sx={{ color: alpha("#FFFFFF", 0.9), height: "24px", lineHeight: "24px" }}
            >
              {loadingMsg[0]}
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default PreLoader;
