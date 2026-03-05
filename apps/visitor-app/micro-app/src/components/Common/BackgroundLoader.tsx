// Copyright (c) 2026, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// WSO2 LLC. licenses this file to you under the Apache License,
// Version 2.0 (the "License"); you may not use this file except
// in compliance with the License. You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing,
// software distributed under the License is distributed on an
// "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
// KIND, either express or implied. See the License for the
// specific language governing permissions and limitations
// under the License.

import Backdrop from "@mui/material/Backdrop";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";

interface BackgroundLoaderProps {
  message?: string;
}

const BackgroundLoader: React.FC<BackgroundLoaderProps> = ({
  message = "Processing...",
}) => {
  return (
    <Backdrop open sx={{ zIndex: 9998 }}>
      <Box
        sx={{
          bgcolor: "white",
          borderRadius: "16px",
          p: 3,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 1.5,
          boxShadow: 6,
        }}
      >
        <CircularProgress size={40} sx={{ color: "#FF7300" }} />
        <Typography variant="body2" color="text.secondary" fontWeight={500}>
          {message}
        </Typography>
      </Box>
    </Backdrop>
  );
};

export default BackgroundLoader;
