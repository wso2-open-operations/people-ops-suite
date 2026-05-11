// Copyright (c) 2024, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.
import { Box, CircularProgress, LinearProgress, Typography } from "@mui/material";

export const LoadingEffect = (props: { message: string | null; isCircularLoading?: boolean }) => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100%",
        width: "100%",
        gap: 2,
        background: "transparent",
      }}
    >
      {props.isCircularLoading ? <CircularProgress /> : <LinearProgress sx={{ width: "70px" }} />}
      <Typography variant="body1" color="text.secondary">
        {props.message}
      </Typography>
    </Box>
  );
};
