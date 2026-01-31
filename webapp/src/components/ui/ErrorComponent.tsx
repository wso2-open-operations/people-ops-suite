// Copyright (c) 2024, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import React from "react";
import { Fade, Stack, Box, Typography } from "@mui/material";
import ErrorImage from "../../assets/images/error.svg"

const ErrorComponent: React.FC = () => {
  return (
    <Fade in={true}>
      <Stack
        sx={{
          p: 2,
          backgroundColor: "background.default",
          width: "100%",
          height: "100%",
          borderRadius: 3,
          border: 1,
          borderColor: "divider",
        }}
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        gap={2}
      >
        <Box>
          <img
            src={ErrorImage}
            height="120px"
            alt="Error"
          />
        </Box>
        <Box sx={{ mt: 1 }}>
          <Typography align="center" variant="h3" color="secondary.dark">
            {`Oops! Internal Server Error`}
          </Typography>
          <Typography
            align="center"
            fontWeight={500}
            sx={{ mt: 2 }}
            variant="body1"
          >
            {`We are trying to fix the problem`}
          </Typography>
        </Box>
      </Stack>
    </Fade>
  );
};

export default ErrorComponent;
