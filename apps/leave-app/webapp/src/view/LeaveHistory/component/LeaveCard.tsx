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

import { Box, Card, CardContent, Stack, Typography, useTheme } from "@mui/material";

import { LeaveData } from "../MockData";

export default function LeaveCard(leave: LeaveData) {
  const theme = useTheme();

  return (
    <Card
      sx={{
        borderRadius: "12px",
        border: `1px solid ${theme.palette.divider}`,
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
        "&:hover": {
          boxShadow: "0 4px 16px rgba(0, 0, 0, 0.12)",
          transform: "translateY(-2px)",
          transition: "all 0.2s ease",
        },
      }}
    >
      <CardContent sx={{ p: "1.25rem" }}>
        <Stack spacing="1rem">
          <Typography
            variant="body2"
            sx={{
              color: theme.palette.text.primary,
              fontWeight: 600,
            }}
          >
            {leave.type}
          </Typography>

          <Stack direction="row" gap="1rem" alignItems="center">
            {/* Mini Calendar */}
            <Box
              sx={{
                width: "60px",
                height: "60px",
                borderRadius: "8px",
                border: `2px solid ${theme.palette.primary.main}`,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                flexShrink: 0,
              }}
            >
              {/* Month header */}
              <Box
                sx={{
                  backgroundColor: theme.palette.primary.main,
                  color: theme.palette.primary.contrastText,
                  textAlign: "center",
                  py: "2px",
                  flex: "0 0 auto",
                }}
              >
                <Typography
                  variant="overline"
                  sx={{
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  {leave.month}
                </Typography>
              </Box>

              {/* Date */}
              <Box
                sx={{
                  backgroundColor: theme.palette.background.paper,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flex: 1,
                }}
              >
                <Typography
                  variant="h5"
                  sx={{
                    color: theme.palette.text.primary,
                    fontWeight: 700,
                    lineHeight: 1,
                  }}
                >
                  {leave.day}
                </Typography>
              </Box>
            </Box>

            {/* Leave Details */}
            <Stack spacing="4px" flex={1}>
              <Typography
                variant="body2"
                sx={{
                  color: theme.palette.text.primary,
                  fontWeight: 500,
                }}
              >
                {leave.startDate} - {leave.endDate}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: theme.palette.text.secondary,
                }}
              >
                {leave.duration}
              </Typography>
            </Stack>

            {/* Status Badge */}
            <Box
              sx={{
                backgroundColor: theme.palette.primary.main,
                color: theme.palette.success.dark,
                px: "0.5rem",
                py: "0.2rem",
                borderRadius: "0.5rem",
                alignSelf: "flex-start",
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: theme.palette.common.white,
                  fontWeight: 600,
                }}
              >
                Submitted
              </Typography>
            </Box>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
