// Copyright (c) 2024, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import React from "react";
import Backdrop from "@mui/material/Backdrop";
import CircularProgress from "@mui/material/CircularProgress";
import { Typography, useTheme } from "@mui/material";
import LinearProgress, {
  LinearProgressProps,
} from "@mui/material/LinearProgress";
import Box from "@mui/material/Box";
import { tokens } from "../../theme";

interface BackgroundLoaderProps {
  open: boolean;
  message: string | null;
  linearProgress?: {
    total: number;
    completed: number;
    action?: () => void;
  };
}

const BackgroundLoader = (props: BackgroundLoaderProps) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  return (
    <Backdrop
      sx={{
        color: colors.customColors.white,
        zIndex: (theme) => theme.zIndex.drawer + 1,
        display: "flex",
        flexDirection: "column",
      }}
      open={props.open}
    >
      {!props.linearProgress && (
        <>
          <CircularProgress color="inherit" />
          <Typography variant="h5" sx={{ marginTop: "20px" }}>
            {props.message}
          </Typography>
        </>
      )}
      {props.linearProgress && (
        <Box sx={{ width: "40%" }}>
          <LinearProgressWithLabel
            value={
              (props.linearProgress.completed / props.linearProgress.total) *
              100
            }
          />
          <Typography variant="h5" sx={{ marginTop: "20px" }}>
            {props.message}
          </Typography>
        </Box>
      )}
    </Backdrop>
  );
};

const LinearProgressWithLabel = (
  props: LinearProgressProps & { value: number }
) => {
  return (
    <Box sx={{ display: "flex", alignItems: "center" }}>
      <Box sx={{ width: "100%", mr: 1 }}>
        <LinearProgress variant="determinate" {...props} />
      </Box>
      <Box sx={{ minWidth: 35 }}>
        <Typography variant="body2" color="text.secondary">{`${Math.round(
          props.value
        )}%`}</Typography>
      </Box>
    </Box>
  );
};

export default BackgroundLoader;
