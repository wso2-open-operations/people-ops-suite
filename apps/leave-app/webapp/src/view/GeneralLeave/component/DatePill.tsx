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

import { Box, Typography, useTheme } from "@mui/material";

interface DatePillProps {
  partOfDay: string;
  isSelected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}

export default function DatePill({
  partOfDay,
  isSelected = false,
  onClick,
  disabled = false,
}: DatePillProps) {
  const theme = useTheme();

  return (
    <Box
      py={1}
      width={1}
      borderRadius="0.5rem"
      textAlign="center"
      border="1px solid"
      maxWidth="20rem"
      onClick={onClick}
      sx={{
        borderColor: isSelected ? theme.palette.primary.main : theme.palette.grey[300],
        backgroundColor: isSelected ? theme.palette.primary.main : "transparent",
        cursor: disabled ? "not-allowed" : onClick ? "pointer" : "default",
        opacity: disabled ? 0.5 : 1,
        transition: "all 0.2s ease",
        "&:hover":
          onClick && !disabled
            ? {
                borderColor: theme.palette.primary.main,
                transform: "translateY(-1px)",
                boxShadow: "0 2px 8px rgba(255, 115, 0, 0.2)",
              }
            : {},
        "&:active": onClick
          ? {
              transform: "translateY(0)",
            }
          : {},
      }}
    >
      <Typography
        variant="subtitle2"
        sx={{
          color: isSelected ? theme.palette.common.white : theme.palette.grey[600],
          fontWeight: 400,
          transition: "color 0.2s ease",
        }}
      >
        {partOfDay}
      </Typography>
    </Box>
  );
}
