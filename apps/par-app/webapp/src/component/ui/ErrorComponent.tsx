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

import React from "react";

import { Box, Fade, Stack, Typography } from "@mui/material";

import ErrorImage from "@assets/images/error.svg";

const ErrorComponent: React.FC = () => {
  return (
    <Fade in={true}>
      <Stack
        sx={{
          p: 2,
          backgroundColor: "background.default",
          width: "100%",
          height: "100%",
          borderRadius: 3,
          border: 1,
          borderColor: "divider",
        }}
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        gap={2}
      >
        <Box>
          <img src={ErrorImage} height="120px" alt="Error" />
        </Box>
        <Box sx={{ mt: 1 }}>
          <Typography align="center" variant="h3" color="secondary.dark">
            {`Oops! Internal Server Error`}
          </Typography>
          <Typography align="center" fontWeight={500} sx={{ mt: 2 }} variant="body1">
            {`We are trying to fix the problem`}
          </Typography>
        </Box>
      </Stack>
    </Fade>
  );
};

export default ErrorComponent;
