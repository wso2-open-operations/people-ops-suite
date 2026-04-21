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
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import { Box, IconButton, Typography, useTheme } from "@mui/material";

import { useState } from "react";

import { FunctionalLead, Head } from "@services/organization";
import { NodeType } from "@utils/types";
import PersonCard from "@view/master-data/components/edit-modal/PersonCard";

interface OrgStructureCardProps {
  name: string;
  type?: NodeType;
  headCount: number;
  teamHead?: Head;
  functionLead?: FunctionalLead;
  hasChildren?: boolean;
  isExpanded?: boolean;
  togglePeopleSectionVisibility?: boolean;
  isPeopleSectionVertical?: boolean;
  onCollapse?: () => void;
  onEdit?: () => void;
  onAdd?: () => void;
  onClick?: () => void;
  isHighlighted?: boolean;
}

const TYPE_LABELS = {
  COMPANY: "Company",
  BUSINESS_UNIT: "Business Unit",
  TEAM: "Team",
  SUB_TEAM: "Sub Team",
  UNIT: "Unit",
};

const STATIC_COMPANY_LEADERS = {
  chairman: {
    name: "Jonas Persson",
    title: "Chairman",
    avatar: undefined,
  },
  ceo: {
    name: "Sanjiva Weerawarana",
    title: "CEO",
    avatar: undefined,
  },
};

const OrgStructureCard = ({
  name,
  type,
  headCount,
  teamHead,
  functionLead,
  hasChildren,
  isExpanded,
  onCollapse,
  togglePeopleSectionVisibility,
  onEdit,
  onAdd,
  onClick,
  isPeopleSectionVertical,
  isHighlighted,
}: OrgStructureCardProps) => {
  const theme = useTheme();
  const isCompanyNode = type === NodeType.Company;
  const primaryPerson = isCompanyNode ? STATIC_COMPANY_LEADERS.chairman : teamHead;
  const secondaryPerson = isCompanyNode ? STATIC_COMPANY_LEADERS.ceo : functionLead;

  const [isPeopleSectionVisible, setPeopleSectionVisibility] = useState<boolean>(false);

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.();
  };

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAdd?.();
  };

  const handleCollapse = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCollapse?.();

    if (togglePeopleSectionVisibility) {
      setPeopleSectionVisibility((prev) => !prev);
    }
  };

  const handleClick = () => {
    onClick?.();
  };

  const isIconRotated = isExpanded ?? isPeopleSectionVisible;

  return (
    <Box
      sx={{
        p: 0.25,
        borderRadius: 1,
        border: isHighlighted
          ? `1px solid ${theme.palette.customBorder.secondary.b1.active}`
          : "none",
      }}
    >
      <Box
        sx={{
          minWidth: "350PX",
          backgroundColor: theme.palette.surface.secondary.active,
          borderTop: "2px solid",
          borderTopColor: theme.palette.customBorder.brand.b1.active,
          borderRadius: "6px",
          padding: "12px",
          boxShadow: "0px 1px 6px 0px rgba(0, 0, 0, 0.12)",
          display: "flex",
          cursor: "pointer",
          flexDirection: "column",
          gap: "16px",
        }}
        onClick={handleClick}
      >
        {/* Top Section */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          {/* Header: Title and Collapse Icon */}
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
              }}
            >
              {name}
            </Typography>

            <IconButton
              onClick={handleCollapse}
              size="small"
              disabled={!hasChildren}
              sx={{
                width: "20px",
                height: "20px",
                padding: 0,
                color: theme.palette.customText.primary.p3.active,
                transform: isIconRotated ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.3s ease",
                opacity: hasChildren ? 1 : 0.3,
                cursor: hasChildren ? "pointer" : "default",
              }}
            >
              <ExpandMoreIcon sx={{ fontSize: "20px" }} />
            </IconButton>
          </Box>

          {/* Team Head and Function Lead */}
          {isPeopleSectionVisible && (
            <Box
              sx={{
                display: "flex",
                gap: isPeopleSectionVertical ? "8px" : "16px",
                alignItems: "flex-start",
                width: "100%",
                flexDirection: isPeopleSectionVertical ? "column" : "row",
              }}
            >
              {/* Team Head */}
              {primaryPerson && (
                <PersonCard
                  name={primaryPerson.name}
                  title={primaryPerson.title}
                  avatar={primaryPerson.avatar}
                  designation="Head"
                />
              )}

              {/* Function Lead */}
              {secondaryPerson && (
                <PersonCard
                  name={secondaryPerson.name}
                  title={secondaryPerson.title}
                  avatar={secondaryPerson.avatar}
                  designation="Functional lead"
                />
              )}
            </Box>
          )}
        </Box>

        {/* Divider - Only for types with heads/leads */}
        {isPeopleSectionVisible && (
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
          {/* Left: Type Label and Count */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            {/* Type Badge */}
            {type && (
              <Box
                sx={{
                  backgroundColor: theme.palette.fill.primary.light.active,
                  padding: "4px 8px",
                  borderRadius: "4px",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: theme.palette.primary.main,
                    textTransform: "uppercase",
                  }}
                >
                  {TYPE_LABELS[type]}
                </Typography>
              </Box>
            )}

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
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
                }}
              >
                {headCount}
              </Typography>
            </Box>
          </Box>

          {/* Right: Action Icons */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
            }}
          >
            {onEdit && (
              <IconButton
                onClick={handleEdit}
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
            )}

            {onAdd && (
              <IconButton
                onClick={handleAdd}
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
                <AddCircleOutlineIcon sx={{ fontSize: "16px" }} />
              </IconButton>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default OrgStructureCard;
