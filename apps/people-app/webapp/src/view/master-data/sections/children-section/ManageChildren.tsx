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
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutline";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import { Box, IconButton, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";

import { BusinessUnit, SubTeam, Team, Unit } from "@services/organization";

type ChildItem = BusinessUnit | Team | SubTeam | Unit;

interface ManageChildrenProps {
  children: ChildItem[];
  childType: "Business Units" | "Teams" | "Sub-Teams" | "Units";
  onTransfer: (child: ChildItem) => void;
}

export const ManageChildren: React.FC<ManageChildrenProps> = ({
  children,
  childType,
  onTransfer,
}) => {
  const theme = useTheme();

  // Don't render if there are no children
  if (!children || children.length === 0) {
    return null;
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        width: "100%",
      }}
    >
      <Typography
        variant="body1"
        sx={{
          color: theme.palette.customText.primary.p2.active,
        }}
      >
        Manage {childType}
      </Typography>

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          width: "400px",
        }}
      >
        {children.map((child) => (
          <Box
            key={child.id}
            sx={{
              display: "flex",
              gap: "16px",
              alignItems: "center",
              width: "100%",
            }}
          >
            <Box
              sx={{
                backgroundColor: theme.palette.surface.secondary.active,
                border: `1px solid ${theme.palette.customBorder.primary.b2.active}`,
                borderRadius: "6px",
                padding: "8px 12px",
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Typography
                sx={{
                  fontSize: "14px",
                  fontFamily: "Geist, sans-serif",
                  fontWeight: 400,
                  lineHeight: 1.5,
                  color: theme.palette.customText.primary.p2.active,
                }}
              >
                {child.name}
              </Typography>

              <Box
                sx={{
                  display: "flex",
                  gap: "5px",
                  alignItems: "center",
                }}
              >
                <PeopleOutlineIcon
                  sx={{
                    width: "16px",
                    height: "10px",
                    color: theme.palette.customText.primary.p3.active,
                  }}
                />

                <Typography
                  sx={{
                    fontSize: "14px",
                    fontFamily: "Geist, sans-serif",
                    fontWeight: 400,
                    lineHeight: 1.5,
                    color: theme.palette.customText.primary.p3.active,
                  }}
                >
                  {child.headCount}
                </Typography>
              </Box>
            </Box>

            <IconButton
              onClick={() => onTransfer(child)}
              sx={{
                height: "37px",
                width: "37px",
                border: `1px solid ${theme.palette.customBorder.primary.b3.active}`,
                borderRadius: "6px",
                padding: "6px 12px",
                "&:hover": {
                  backgroundColor: theme.palette.fill.neutral.light.hover,
                  border: `1px solid ${theme.palette.customBorder.primary.b3.hover}`,
                },
              }}
            >
              <SwapHorizIcon
                sx={{
                  width: "16px",
                  height: "16px",
                  color: theme.palette.customText.primary.p2.active,
                }}
              />
            </IconButton>
          </Box>
        ))}
      </Box>
    </Box>
  );
};
