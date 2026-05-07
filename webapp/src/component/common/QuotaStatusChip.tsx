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

import { Chip, Grid, useTheme } from "@mui/material";

interface QuotaChipProps {
  isHeading: boolean;
  type: string;
  available: number;
  allocated: number;
}

const QuotaChip: React.FC<QuotaChipProps> = ({ isHeading, type, available, allocated }) => {
  const theme = useTheme();

  let chipLabel = "N/A";
  const typographyText = `${type} Slots :`;

  if (available !== 0) {
    chipLabel = `${allocated} / ${available}`;
  }

  const chipBg = theme.palette.mode === "dark" ? "#5CD1FF" : "#D9D9D9";

  return (
    <Grid
      container
      alignItems="center"
      spacing={1}
      textAlign={"center"}
      display="flex"
      justifyContent="center"
    >
      <Grid>
        <Chip
          label={isHeading ? `${typographyText} ${chipLabel}` : chipLabel}
          sx={{ backgroundColor: chipBg, color: "#0D0D0D" }}
        />
      </Grid>
    </Grid>
  );
};

export default QuotaChip;
