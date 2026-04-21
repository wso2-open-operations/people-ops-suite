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
import CloseIcon from "@mui/icons-material/Close";
import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
  useTheme,
} from "@mui/material";

import { useRef } from "react";

import { SPLIT_VIEW_SKELETON_DELAY_MS } from "@root/src/config/constant";
import { useMinimumLoadingVisibility } from "@root/src/hooks/useMinimumLoadingVisibility";
import {
  BusinessUnitState,
  SubTeamState,
  TeamState,
  UnitState,
} from "@root/src/slices/organizationSlice/organizationStructure";
import { RootState, useAppSelector } from "@root/src/slices/store";
import { NodeType } from "@root/src/utils/types";
import { convertDataTypeToLabel } from "@root/src/utils/utils";
import BackdropProgress from "@src/component/ui/BackdropProgress";

import { useOrgUpdateActions } from "../hooks/useOrgUpdateActions";
import { DeleteCurrent } from "../sections/danger-section/DeleteCurrent";
import { RenameField } from "../sections/general-section/RenameField";
import { SwapLeads } from "../sections/leads-section/SwapLeads";
import { SectionHeader } from "./edit-modal/SectionHeader";

interface EditModalProps {
  open: boolean;
  uniqueId: string;
  nodeType: NodeType;
  parentLoading: boolean;
  onClose: () => void;
}

export const EditModal: React.FC<EditModalProps> = ({
  open,
  onClose,
  uniqueId,
  nodeType,
  parentLoading,
}) => {
  const theme = useTheme();
  const orgInfo = useAppSelector((state: RootState) => state.organizationStructure);
  const orgData = orgInfo.organizationInfo;

  const data: BusinessUnitState | TeamState | SubTeamState | UnitState | null = (() => {
    if (!orgData) return null;

    switch (nodeType) {
      case NodeType.BusinessUnit:
        return orgData.businessUnits.find((item) => item.uniqueId === uniqueId) ?? null;
      case NodeType.Team:
        return orgData.teams.find((item) => item.uniqueId === uniqueId) ?? null;
      case NodeType.SubTeam:
        return orgData.subTeams.find((item) => item.uniqueId === uniqueId) ?? null;
      case NodeType.Unit:
        return orgData.units.find((item) => item.uniqueId === uniqueId) ?? null;
      default:
        return null;
    }
  })();

  const lastResolvedData = useRef<BusinessUnitState | TeamState | SubTeamState | UnitState | null>(
    null,
  );

  if (data) {
    lastResolvedData.current = data;
  }

  const displayData = data ?? lastResolvedData.current;

  const {
    handleLeadSwap,
    handleHeadSwap,
    handleDeleteCurrent,
    handleRenameCurrent,
    isUpdating,
    isDeleting,
  } = useOrgUpdateActions({ data: displayData });

  const showSpinner = useMinimumLoadingVisibility(
    isUpdating || isDeleting || parentLoading,
    SPLIT_VIEW_SKELETON_DELAY_MS,
  );

  if (!displayData) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      PaperProps={{
        sx: {
          position: "relative",
          width: "700px",
          maxHeight: "600px",
          borderRadius: 1.5,
          boxShadow: "0px 4px 24px rgba(0, 0, 0, 0.1)",
          backgroundColor: theme.palette.fill.secondary.light.active,
          backgroundImage: "none",
          padding: "4px",
        },
      }}
    >
      <BackdropProgress
        open={showSpinner}
        sx={{
          position: "absolute",
          zIndex: (theme) => theme.zIndex.modal + 1,
          borderRadius: "8px",
        }}
      />

      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0px",
          paddingX: "12px",
          paddingY: "4px",
        }}
      >
        <Typography
          variant="body2"
          sx={{
            color: theme.palette.customText.secondary.p1.active,
            fontWeight: 600,
          }}
        >
          Edit {convertDataTypeToLabel(displayData.type)}
        </Typography>

        <IconButton
          onClick={onClose}
          sx={{
            color: theme.palette.customText.secondary.p1.active,
            p: 0,
          }}
        >
          <CloseIcon sx={{ fontSize: 20 }} />
        </IconButton>
      </DialogTitle>

      <DialogContent
        sx={{
          padding: 1.5,
          borderRadius: "12px",
          border: `1px solid ${theme.palette.customBorder.primary.b2.active}`,
          backgroundColor: theme.palette.surface.secondary.active,
          display: "flex",
          flexDirection: "column",
          gap: 4,
          color: theme.palette.customText.primary.p2.active,
        }}
      >
        {/* General Section */}
        <Box
          sx={{
            display: "flex",
            marginTop: 1.5,
            paddingX: 0,
            flexDirection: "column",
            gap: 2.5,
          }}
        >
          <SectionHeader title="General" />

          <RenameField
            nodeType={displayData.type}
            currentName={displayData.name}
            onRenameSuccess={handleRenameCurrent}
            isSubmitting={isUpdating}
          />
        </Box>

        {/* Leads Section */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2.5,
          }}
        >
          <SectionHeader title="Manage Leads" />

          <SwapLeads
            head={displayData.head ?? null}
            functionalLead={
              "functionalLead" in displayData ? (displayData.functionalLead ?? null) : null
            }
            onSwapHead={handleHeadSwap}
            onSwapFunctionalLead={handleLeadSwap}
            nodeType={nodeType}
            isUpdating={isUpdating}
          />
        </Box>

        {/* Danger Zone Section */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 1,
          }}
        >
          <SectionHeader title="Danger Zone" isBorderVisible={false} />

          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              border: `.5px solid ${theme.palette.error.main}`,
              borderRadius: "6px",
            }}
          >
            <DeleteCurrent
              onDelete={handleDeleteCurrent}
              isDeleting={isDeleting}
              onDeleteSuccessComplete={onClose}
              nodeType={nodeType}
            />
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};
