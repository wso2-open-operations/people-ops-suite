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

import { Box, LinearProgress, Typography } from "@mui/material";
import type { PreLoaderProps } from "@utils/types";

const PreLoader = (props: PreLoaderProps) => {
  return (
    <Box
      sx={{
        background: (theme) => theme.palette.background.default,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100%",
        width: "100%",
        flex: 1,
      }}
    >
      {props.isLoading && (
        <LinearProgress
          sx={{
            width: "150px",
            mb: 2,
          }}
        />
      )}
      <Typography
        variant="caption"
        sx={{
          color: (theme) => theme.palette.customText.primary.p1.active
        }}
      >
        {props.message}
      </Typography>
    </Box>
  );
};

export default PreLoader;
