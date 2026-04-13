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
import { Box, Container, ThemeProvider, createTheme, useTheme as useMuiTheme } from "@mui/material";

import { useMemo } from "react";

import StateWithImage from "@component/ui/StateWithImage";
import Wso2Logo from "@src/assets/images/WSO2-Logo-Black.png";
import ErrorSvg from "@src/assets/images/error.svg";
import { themeSettings as updatedThemeSettings } from "@src/theme/index";

export interface ErrorHandlerProps {
  message: string | null;
}

const ErrorHandler = (props: ErrorHandlerProps) => {
  const legacyTheme = useMuiTheme();
  const updatedTheme = useMemo(
    () => createTheme(updatedThemeSettings(legacyTheme.palette.mode)),
    [legacyTheme.palette.mode],
  );
  return (
    <ThemeProvider theme={updatedTheme}>
      <Box
        sx={{
          paddingX: 2,
          paddingY: 5,
        }}
      >
        <Container maxWidth="md">
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <img alt="logo" width="150" height="auto" src={Wso2Logo} />
            <StateWithImage
              message={props.message || "Something went wrong! Please try again later."}
              imageUrl={ErrorSvg}
            />
          </Box>
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default ErrorHandler;
