// Copyright (c) 2025 WSO2 LLC. (https://www.wso2.com).
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

import { Box, Stack, useTheme } from "@mui/material";
import Wso2Logo from "@assets/images/wso2-logo.svg";
import StateWithImage from "@component/ui/StateWithImage";
import ErrorSvg from "@assets/images/error.svg";
import { ErrorHandlerProps } from "@root/src/utils/types";

const ErrorHandler = (props: ErrorHandlerProps) => {
  const theme = useTheme();
  return (
    <Box
      sx={{
        bgcolor: "background.default",
        color: "text.primary",
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Stack spacing={4} alignItems="center" maxWidth="md">
        <Box
          component="img"
          alt="WSO2 Logo"
          src={Wso2Logo}
          sx={{
            width: "150px",
            height: "auto",
            filter: theme.palette.mode === 'dark' ? 'brightness(0) invert(1)' : 'none',
          }}
        />
        <StateWithImage
          message={props.message || "Something went wrong! Please try again later."}
          imageUrl={ErrorSvg}
        />
      </Stack>
    </Box>
  );
};

export default ErrorHandler;
