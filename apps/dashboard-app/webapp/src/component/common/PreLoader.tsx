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
import { Box, Container, LinearProgress, Typography } from "@mui/material";

import Wso2Logo from "@assets/images/wso2-logo.svg";
import type { PreLoaderProps } from "@utils/types";

const PreLoader = (props: PreLoaderProps) => {
  return (
    <Box
      sx={{
        background: (theme) => theme.palette.background.default,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        width: "100%",
      }}
    >
      <Container maxWidth="md">
        <Box sx={{ width: "100%", display: "flex", justifyContent: "center" }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              gap: 2,
            }}
          >
            <Box
              component="img"
              src={Wso2Logo}
              alt="WSO2"
              sx={{
                width: "110px",
                height: "auto",
                display: "block",
                margin: "0 auto",
              }}
            />
            {props.isLoading && (
              <LinearProgress
                sx={{
                  width: "150px",
                }}
              />
            )}
            <Typography
              variant="inherit"
              sx={{
                fontSize: "14px",
                fontWeight: 500,
                textAlign: "center",
                color: (theme) =>
                  theme.palette.mode === "light"
                    ? theme.palette.grey[600]
                    : theme.palette.grey[300],
              }}
            >
              {props.message}
            </Typography>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default PreLoader;
