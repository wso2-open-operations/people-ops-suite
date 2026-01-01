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

import CloseIcon from "@mui/icons-material/Close";
import { Box, Button, Card, CardContent, Stack, Typography, useTheme } from "@mui/material";

export interface LeaveCardProps {
  id: string;
  type: string;
  startDate: string;
  endDate: string;
  duration: string;
  status: "approved" | "pending" | "rejected";
  month: string;
  day: string;
  onDelete?: (id: string) => void;
}

export default function LeaveCard({
  id,
  duration,
  type,
  startDate,
  endDate,
  month,
  day,
  onDelete,
}: LeaveCardProps) {
  const theme = useTheme();

  const isCancelDisabled = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const leaveStart = new Date(startDate);
    leaveStart.setHours(0, 0, 0, 0);
    const diffInDays = (leaveStart.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
    return diffInDays < 1;
  };

  return (
    <Card
      sx={{
        borderRadius: "12px",
        border: `1px solid ${theme.palette.divider}`,
        alignItems: "center",
        boxShadow: "0 2px 8px rgba(5, 5, 5, 0.08)",
        "&:hover": {
          boxShadow: "0 4px 16px rgba(0, 0, 0, 0.12)",
          transform: "translateY(-2px)",
          transition: "all 0.2s ease",
        },
      }}
    >
      <CardContent sx={{ p: "1.25rem" }}>
        <Stack direction="row" spacing="1rem" alignItems="center">
          <Stack spacing="1rem" flex={1}>
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.text.primary,
                fontWeight: 600,
              }}
            >
              {type.toLocaleUpperCase()} LEAVE
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
                    {month}
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
                    {day}
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
                  {startDate} - {endDate}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: theme.palette.text.secondary,
                  }}
                >
                  {duration}
                </Typography>
              </Stack>
            </Stack>
          </Stack>
          {!(type === "sabbatical") && (
            <Button
              size="small"
              onClick={() => onDelete?.(id)}
              disabled={isCancelDisabled()}
              startIcon={<CloseIcon fontSize="small" />}
              sx={{
                color: isCancelDisabled() ? theme.palette.text.disabled : theme.palette.error.main,
                textTransform: "none",
                fontWeight: 500,
                "&:hover": {
                  backgroundColor: theme.palette.error.light,
                  color: theme.palette.error.dark,
                },
                "&.Mui-disabled": {
                  color: theme.palette.text.disabled,
                },
              }}
            >
              Cancel
            </Button>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
