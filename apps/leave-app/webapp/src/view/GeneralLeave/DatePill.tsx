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
import { Box, Typography } from "@mui/material";

interface DatePillProps {
  partOfDay: string;
  isSelected?: boolean;
  onClick?: () => void;
}

export default function DatePill({ partOfDay, isSelected = false, onClick }: DatePillProps) {
  return (
    <Box
      py={1}
      width={1}
      borderRadius="0.5rem"
      textAlign="center"
      border="2px solid"
      maxWidth="20rem"
      onClick={onClick}
      sx={{
        borderColor: isSelected ? "#ff7300" : "lightgrey",
        backgroundColor: isSelected ? "#ff7300" : "transparent",
        cursor: onClick ? "pointer" : "default",
        transition: "all 0.2s ease",
        "&:hover": onClick
          ? {
              borderColor: "#ff7300",
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
          color: isSelected ? "white" : "gray",
          fontWeight: isSelected ? 600 : 400,
          transition: "color 0.2s ease",
        }}
      >
        {partOfDay}
      </Typography>
    </Box>
  );
}
