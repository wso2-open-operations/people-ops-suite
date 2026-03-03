// Copyright (c) 2024, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import React from "react";
import { Box, Typography } from "@mui/material";
import Groups3Icon from "@mui/icons-material/Groups3";

interface NoDataViewProps {
  text: string;
}

const NoDataView: React.FC<NoDataViewProps> = ({ text }) => {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        backgroundColor: "#ffffff",
        padding: 5,
        borderRadius: 2,
        height: "100%",
      }}
    >
      <Groups3Icon
        fontSize="large"
        sx={{
          color: "primary.main",
          marginRight: 2,
        }}
      />
      <Typography
        variant="h5"
        sx={{
          color: "primary.main",
          fontWeight: "bold",
        }}
      >
        {text}
      </Typography>
    </Box>
  );
};

export default NoDataView;
