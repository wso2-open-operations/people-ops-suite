// Copyright (c) 2024, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import React from "react";
import { Grid, Chip, Typography, useTheme } from "@mui/material";
import { tokens } from "../../../src/theme";

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
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  if (allocated < available) {
    isWarningColor = true;
  }

  if (available !== 0) {
    chipLabel = `${allocated} / ${available}`;
  }

  return (
    <Grid container alignItems="center" spacing={1} textAlign={"center"} display="flex" justifyContent="center">
      {isHeading ? (
        <>
          <Grid item>
            <Chip
              label={`${typographyText} ${chipLabel}`}
              sx={{
                backgroundColor: isWarningColor ? colors.yellowAccent[900] : "default",
              }}
            />
          </Grid>
        </>
      ) : (
        <Grid item>
          <Chip
            label={chipLabel}
            sx={{
              backgroundColor: isWarningColor ? colors.yellowAccent[900] : colors.greenAccent[600],
            }}
          />
        </Grid>
      )}
    </Grid>
  );
};

export default QuotaChip;
