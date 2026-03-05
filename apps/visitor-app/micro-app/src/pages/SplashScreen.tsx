// Copyright (c) 2026, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// WSO2 LLC. licenses this file to you under the Apache License,
// Version 2.0 (the "License"); you may not use this file except
// in compliance with the License. You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing,
// software distributed under the License is distributed on an
// "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
// KIND, either express or implied. See the License for the
// specific language governing permissions and limitations
// under the License.

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";

const SplashScreen: React.FC = () => {
  return (
    <Box
      sx={{
        height: "100vh",
        width: "100vw",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "#FFFFFF",
      }}
    >
      <Stack alignItems="center" spacing={3}>
        {/* App Icon */}
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: "16px",
            overflow: "hidden",
            boxShadow: 3,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg
            width="80"
            height="80"
            viewBox="0 0 512 512"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FF7300" />
                <stop offset="100%" stopColor="#FF8C33" />
              </linearGradient>
            </defs>
            <rect width="512" height="512" rx="108" fill="url(#bg)" />
            <rect
              x="136"
              y="96"
              width="240"
              height="320"
              rx="24"
              fill="#fff"
              opacity="0.95"
            />
            <circle cx="256" cy="210" r="48" fill="#FF7300" />
            <path
              d="M186 330 c0-38.7 31.3-70 70-70 s70 31.3 70 70"
              fill="#FF7300"
            />
            <rect x="224" y="80" width="64" height="40" rx="8" fill="#fff" />
            <rect x="240" y="72" width="32" height="24" rx="6" fill="#E56600" />
          </svg>
        </Box>

        {/* App Title */}
        <Box sx={{ textAlign: "center" }}>
          <Typography variant="h5" sx={{ fontWeight: 700, color: "#4B5064" }}>
            Visitor App
          </Typography>
          <Typography variant="body2" sx={{ color: "#7E87AD", mt: 0.5 }}>
            Manage your visitors
          </Typography>
        </Box>

        {/* Loading Dots */}
        <Stack direction="row" spacing={0.75} sx={{ mt: 2 }}>
          <Box
            className="loading-dot"
            sx={{
              width: 8,
              height: 8,
              bgcolor: "#FF7300",
              borderRadius: "50%",
            }}
            style={{ animationDelay: "0s" }}
          />
          <Box
            className="loading-dot"
            sx={{
              width: 8,
              height: 8,
              bgcolor: "#FF7300",
              borderRadius: "50%",
            }}
            style={{ animationDelay: "0.2s" }}
          />
          <Box
            className="loading-dot"
            sx={{
              width: 8,
              height: 8,
              bgcolor: "#FF7300",
              borderRadius: "50%",
            }}
            style={{ animationDelay: "0.4s" }}
          />
        </Stack>
      </Stack>
    </Box>
  );
};

export default SplashScreen;
