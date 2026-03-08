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
// KIND, either express or implied. See the License for the
// specific language governing permissions and limitations
// under the License.
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import { Avatar, Box, Collapse, IconButton, Typography, useTheme } from "@mui/material";

import { memo } from "react";

import { FunctionalLead, Head } from "@services/organization";

interface CollapsibleOrgCardProps {
  name: string;
  headCount: number;
  head?: Head;
  functionalLead?: FunctionalLead;
  isExpanded: boolean;
  isHighlighted?: boolean;
  onToggleExpand: () => void;
  onSelect: () => void;
  onEdit: () => void;
}

export const CollapsibleOrgCard = memo(
  ({
    name,
    headCount,
    head,
    functionalLead,
    isExpanded,
    isHighlighted,
    onToggleExpand,
    onSelect,
    onEdit,
  }: CollapsibleOrgCardProps) => {
    const theme = useTheme();

    return (
      <Box
        sx={{
          border: isHighlighted
            ? `1.5px solid ${theme.palette.customBorder.secondary.b1.active}`
            : `1.5px solid transparent`,
          p: "2px",
          borderRadius: "6px",
        }}
      >
        <Box
          onClick={onSelect}
          sx={{
            backgroundColor: theme.palette.surface.secondary.active,
            borderTop: `2px solid ${theme.palette.customBorder.brand.b1.active}`,
            borderRadius: "6px",
            padding: "12px 16px",
            boxShadow: "0px 1px 6px 0px rgba(0, 0, 0, 0.12)",
            cursor: "pointer",
            transition: "border 0.2s ease",
          }}
        >
          <Box sx={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Header Section */}
            <Box sx={{ display: "flex", flexDirection: "column" }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    color: theme.palette.customText.primary.p2.active,
                    fontSize: "18px",
                    fontWeight: 500,
                    lineHeight: 1.3,
                  }}
                >
                  {name}
                </Typography>

                <IconButton
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleExpand();
                  }}
                  size="small"
                  sx={{
                    width: "20px",
                    height: "20px",
                    padding: 0,
                    color: theme.palette.customText.primary.p3.active,
                    transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.3s ease",
                  }}
                >
                  <ExpandMoreIcon sx={{ fontSize: "20px" }} />
                </IconButton>
              </Box>

              {/* Expanded Content */}
              <Collapse in={isExpanded} timeout="auto">
                <Box sx={{ display: "flex", flexDirection: "column", gap: "8px", mt: "8px" }}>
                  {/* Head */}
                  {head && (
                    <Box
                      sx={{
                        backgroundColor: theme.palette.surface.secondary.active,
                        display: "flex",
                        gap: "8px",
                        alignItems: "center",
                        padding: "4px",
                        borderRadius: "4px",
                      }}
                    >
                      <Avatar
                        src={head.avatar}
                        sx={{
                          width: "30px",
                          height: "30px",
                          borderRadius: "4px",
                          fontSize: "12px",
                        }}
                      >
                        {head.name.charAt(0)}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          sx={{
                            fontSize: "12px",
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
                          {head.name}
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: "10px",
                            fontWeight: 500,
                            lineHeight: 1.6,
                            color: theme.palette.customText.primary.p4.active,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {head.title}
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  {/* Functional Lead */}
                  {functionalLead && (
                    <Box
                      sx={{
                        backgroundColor: theme.palette.surface.secondary.active,
                        display: "flex",
                        gap: "8px",
                        alignItems: "center",
                        padding: "4px",
                        borderRadius: "4px",
                      }}
                    >
                      <Avatar
                        src={functionalLead.avatar}
                        sx={{
                          width: "30px",
                          height: "30px",
                          borderRadius: "4px",
                          fontSize: "12px",
                        }}
                      >
                        {functionalLead.name.charAt(0)}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          sx={{
                            fontSize: "12px",
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
                          {functionalLead.name}
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: "10px",
                            fontWeight: 500,
                            lineHeight: 1.6,
                            color: theme.palette.customText.primary.p4.active,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {functionalLead.title}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </Box>
              </Collapse>
            </Box>

            {/* Divider - Only show when expanded */}
            {isExpanded && (
              <Box
                sx={{
                  height: "1px",
                  backgroundColor: theme.palette.customBorder.primary.b2.active,
                }}
              />
            )}

            {/* Bottom Section */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <PeopleAltOutlinedIcon
                  sx={{
                    fontSize: "16px",
                    color: theme.palette.customText.primary.p3.active,
                  }}
                />
                <Typography
                  variant="body2"
                  sx={{
                    color: theme.palette.customText.primary.p3.active,
                    fontSize: "14px",
                  }}
                >
                  {headCount}
                </Typography>
              </Box>

              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                size="small"
                sx={{
                  width: "16px",
                  height: "16px",
                  padding: 0,
                  color: theme.palette.customText.primary.p3.active,
                  "&:hover": {
                    color: theme.palette.primary.main,
                  },
                }}
              >
                <EditOutlinedIcon sx={{ fontSize: "16px" }} />
              </IconButton>
            </Box>
          </Box>
        </Box>
      </Box>
    );
  },
);

CollapsibleOrgCard.displayName = "CollapsibleOrgCard";
