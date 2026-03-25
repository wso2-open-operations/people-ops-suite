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
import { Chip, Grid } from "@mui/material";

import React from "react";

interface QuotaChipProps {
  isHeading: boolean;
  type: string;
  available: number;
  allocated: number;
}

const QuotaChip: React.FC<QuotaChipProps> = ({ isHeading, type, available, allocated }) => {
  let chipLabel = "N/A";
  let typographyText = `${type} Slots :`;
  let isWarningColor = false;

  if (allocated < available) {
    isWarningColor = true;
  }

  if (available !== 0) {
    chipLabel = `${allocated} / ${available}`;
  }

  // Hardcoded Colors
  const warningColor = "#ed6c02"; // Standard MUI Warning Orange/Yellow
  const successColor = "#2e7d32"; // Standard MUI Success Green
  const defaultColor = "#e0e0e0"; // Standard MUI Default Gray

  return (
    <Grid
      container
      alignItems="center"
      spacing={1}
      textAlign={"center"}
      display="flex"
      justifyContent="center"
    >
      {isHeading ? (
        <Grid>
          <Chip
            label={`${typographyText} ${chipLabel}`}
            sx={{
              backgroundColor: isWarningColor ? warningColor : defaultColor,
              color: isWarningColor ? "#fff" : "inherit", // Keeps text readable
            }}
          />
        </Grid>
      ) : (
        <Grid>
          <Chip
            label={chipLabel}
            sx={{
              backgroundColor: isWarningColor ? warningColor : successColor,
              color: "#fff", // Keeps text white on dark backgrounds
            }}
          />
        </Grid>
      )}
    </Grid>
  );
};

export default QuotaChip;
