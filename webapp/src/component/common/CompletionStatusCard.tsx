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

import Box from "@mui/material/Box";
import LinearProgress from "@mui/material/LinearProgress";
import { Typography } from "@mui/material";

interface CardProps {
  name: string;
  completed: number;
  total: number;
  hideLeftCount?: boolean;
}

export const CompletionStatusCard = ({
  name,
  completed,
  total,
  hideLeftCount,
}: CardProps) => {
  return (
    <Box pt={1.5}>
      <Typography py={1}>
        {name}
        {!hideLeftCount && <> {` : ${total - completed}`} Pending</>}
      </Typography>
      <LinearProgress
        variant="determinate"
        value={(completed * 100) / total}
        sx={{ height: 15, borderRadius: 2 }}
      />
    </Box>
  );
};
