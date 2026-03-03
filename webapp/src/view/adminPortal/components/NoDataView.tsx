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
        backgroundColor: "background.default",
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
