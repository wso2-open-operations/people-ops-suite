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
import { Box, Stack, Typography, useTheme } from "@mui/material";

import { ReactNode } from "react";

interface TitleProps {
  firstWord: string;
  secondWord: string;
  borderEnabled?: boolean;
  icon?: ReactNode;
}

export default function Title({ firstWord, secondWord, borderEnabled = true, icon }: TitleProps) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        width: "100%",
        pb: borderEnabled ? 1 : 0,
        borderBottom: borderEnabled
          ? `1px solid ${theme.palette.customBorder.territory.active}`
          : "none",
      }}
    >
      <Stack
        direction="row"
        gap={1}
        alignItems="center"
        justifyContent={{ xs: "center", md: "flex-start" }}
      >
        {icon && (
          <Box
            sx={{
              display: "flex",
              color: theme.palette.brandColors.lightOrange,
            }}
          >
            {icon}
          </Box>
        )}
        <Typography
          variant="h5"
          component="h2"
          fontWeight={600}
          sx={{
            color: theme.palette.customText.primary.p1.active,
          }}
        >
          <Box component="span" sx={{ color: theme.palette.brandColors.lightOrange }}>
            {firstWord}
          </Box>{" "}
          {secondWord}
        </Typography>
      </Stack>
    </Box>
  );
}
