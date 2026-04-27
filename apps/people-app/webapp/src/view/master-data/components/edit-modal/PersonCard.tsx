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
import { Avatar, Box, Tooltip, Typography, useTheme } from "@mui/material";

import { memo } from "react";

import { truncateName } from "@root/src/utils/utils";

interface PersonCardProps {
  name: string;
  title: string;
  avatar?: string;
  designation: string;
}

/**
 * Reusable component for displaying person information (Team Head or Function Lead)
 * Shows avatar, name, and title in a compact card format
 */
const PersonCard = memo<PersonCardProps>(({ name, title, avatar, designation }) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: "flex",
        gap: "8px",
        alignItems: "center",
        borderRadius: "4px",
        flex: 1,
        minWidth: 0,
      }}
    >
      <Avatar
        src={avatar}
        sx={{
          width: "36px",
          height: "36px",
          borderRadius: "4px",
        }}
      >
        {name.charAt(0)}
      </Avatar>

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          width: "100%",
        }}
      >
        <Tooltip title={name} placement="top">
          <Typography
            sx={{
              fontSize: "14px",
              fontWeight: 500,
              lineHeight: 1.6,
              letterSpacing: "0.12px",
              color: theme.palette.customText.primary.p2.active,
              textTransform: "capitalize",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {name}
          </Typography>
        </Tooltip>

        <Tooltip title={`${designation} of ${title}`} placement="top">
          <Typography
            sx={{
              fontSize: "12px",
              fontWeight: 400,
              lineHeight: 1.6,
              color: theme.palette.customText.primary.p4.active,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {designation} of {truncateName(title, 30)}
          </Typography>
        </Tooltip>
      </Box>
    </Box>
  );
});

PersonCard.displayName = "PersonCard";

export default PersonCard;
