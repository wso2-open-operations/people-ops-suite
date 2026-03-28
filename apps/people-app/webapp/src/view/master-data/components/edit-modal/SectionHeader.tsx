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
import { Box, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";

interface SectionHeaderProps {
  title: string;
  isBorderVisible?: boolean;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, isBorderVisible = true }) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        width: "100%",
        paddingBottom: "8px",
        paddingLeft: "4px",
        borderBottom: isBorderVisible
          ? `1px solid ${theme.palette.customBorder.primary.b2.active}`
          : "none",
      }}
    >
      <Typography
        variant="h6"
        sx={{
          color: theme.palette.customText.primary.p2.active,
          fontWeight: 500,
        }}
      >
        {title}
      </Typography>
    </Box>
  );
};
