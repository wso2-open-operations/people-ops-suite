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

import { SvgIconComponent } from "@mui/icons-material";
import { Box, Stack, Typography, useTheme } from "@mui/material";

interface LeaveSelectionIconProps {
  Icon: SvgIconComponent;
  label: string;
  isSelected: boolean;
  onClick?: () => void;
}
export default function LeaveSelectionIcon({
  Icon: Icon,
  label,
  isSelected,
  onClick,
}: LeaveSelectionIconProps) {
  const theme = useTheme();

  return (
    <Stack
      direction="column"
      justifyContent="space-between"
      alignItems="center"
      gap={1.5}
      width={1}
      height="100%"
      onClick={onClick}
      sx={{
        cursor: onClick ? "pointer" : "default",
        transition: "all 0.2s ease",
        "&:hover": onClick
          ? {
              transform: "translateY(-2px)",
              "& .icon-box": {
                borderColor: theme.palette.primary.main,
                boxShadow: "0 2px 8px rgba(255, 115, 0, 0.2)",
              },
            }
          : {},
      }}
    >
      <Box
        className="icon-box"
        borderRadius="0.5rem"
        border="1px solid"
        width="3rem"
        height="3rem"
        display="flex"
        alignItems="center"
        justifyContent="center"
        sx={{
          borderColor: isSelected ? theme.palette.primary.main : theme.palette.grey[300],
          backgroundColor: isSelected ? theme.palette.primary.main : "transparent",
          transition: "all 0.2s ease",
        }}
      >
        <Icon
          fontSize="large"
          sx={{
            color: isSelected ? theme.palette.common.white : theme.palette.grey[600],
            transition: "color 0.2s ease",
          }}
        />
      </Box>
      <Typography
        variant="subtitle2"
        textAlign="center"
        sx={{
          color: isSelected ? theme.palette.primary.main : theme.palette.grey[600],
          fontWeight: isSelected ? 600 : 400,
          transition: "all 0.2s ease",
        }}
      >
        {label}
      </Typography>
    </Stack>
  );
}
