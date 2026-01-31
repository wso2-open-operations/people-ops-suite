// Copyright (c) 2024, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import React from "react";
import { Box, Typography, useTheme } from "@mui/material";
import { tokens } from "../../theme";
import { useAppSelector } from "@slices/store";
import { selectMaintenanceMessage } from "@slices/healthSlice";

const MaintenancePage = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const maintenanceMessage = useAppSelector(selectMaintenanceMessage);

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        minHeight: "100vh",
        maxWidth: "600px",
        textAlign: "center",
        margin: "0 auto",
      }}
    >
      <Typography
        variant="h1"
        color={colors.customColors.orange}
        fontWeight={"bold"}
      >
        System Maintenance
      </Typography>
      <img alt="maintenance" src="/maintenance.gif" />
      <Typography
        variant="h4"
        style={{
          color: "gray",
          whiteSpace: "pre-wrap",
          wordWrap: "break-word",
          overflowWrap: "break-word",
          wordBreak: "break-all",
        }}
      >
        {
          "The PAR application is currently undergoing scheduled maintenance and is temporarily unavailable.\n\nWe apologize for any inconvenience and appreciate your patience.\n"
        }
        <b>{maintenanceMessage}</b>
      </Typography>
    </Box>
  );
};

export default MaintenancePage;
