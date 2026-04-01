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
import { Box, Dialog, DialogContent, DialogTitle, IconButton, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";

import ErrorHandler from "@component/common/ErrorHandler";
import {
  BusinessUnitState,
  SubTeamState,
  TeamState,
  UnitState,
} from "@root/src/slices/organizationSlice/organizationStructure";
import { RootState, useAppSelector } from "@root/src/slices/store";
import { NodeType } from "@root/src/utils/types";
import { convertDataTypeToLabel } from "@root/src/utils/utils";

import { useOrgEntityActions } from "../panel/chart-view/hooks/useOrgEntityActions";
import { DeleteCurrent } from "../panel/chart-view/sections/danger-section/DeleteCurrent";
import { RenameField } from "../panel/chart-view/sections/general-section/RenameField";
import { SwapLeads } from "../panel/chart-view/sections/leads-section/SwapLeads";
import { SectionHeader } from "./edit-modal/SectionHeader";

interface EditModalProps {
  open: boolean;
  uniqueId: string;
  nodeType: NodeType;
  onClose: () => void;
}

export const EditModal: React.FC<EditModalProps> = ({ open, onClose, uniqueId, nodeType }) => {
  const theme = useTheme();
  const orgInfo = useAppSelector(
    (state: RootState) => state.organizationStructure.organizationInfo,
  );

  const data: BusinessUnitState | TeamState | SubTeamState | UnitState | null = (() => {
    if (!orgInfo) return null;

    switch (nodeType) {
      case NodeType.BusinessUnit:
        return orgInfo.businessUnits.find((item) => item.uniqueId === uniqueId) ?? null;
      case NodeType.Team:
        return orgInfo.teams.find((item) => item.uniqueId === uniqueId) ?? null;
      case NodeType.SubTeam:
        return orgInfo.subTeams.find((item) => item.uniqueId === uniqueId) ?? null;
      case NodeType.Unit:
        return orgInfo.units.find((item) => item.uniqueId === uniqueId) ?? null;
      default:
        return null;
    }
  })();

  if (!data) {
    return <ErrorHandler message={"Something went wrong. Please try again..."} />;
  }

  const { handleLeadSwap, handleHeadSwap, handleDeleteCurrent, handleRenameCurrent, isRenaming } =
    useOrgEntityActions({ data, onClose });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      slotProps={{
        paper: {
          sx: {
            position: "relative",
            width: "700px",
            maxHeight: "600px",
            borderRadius: "8px",
            boxShadow: "0px 4px 24px rgba(0, 0, 0, 0.1)",
            backgroundColor: theme.palette.fill.secondary.light.active,
            padding: "4px",
          },
        },
      }}
    >
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
          Edit {convertDataTypeToLabel(data.type)}
        </Typography>

        <IconButton
          onClick={onClose}
          sx={{
            color: theme.palette.customText.primary.p2.active,
            p: 0,
          }}
        >
          <CloseIcon />
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
            entityType={data.type}
            currentName={data.name}
            onRenameSuccess={handleRenameCurrent}
            isSubmitting={isRenaming}
          />
        </Box>

        {/* Leads Section */}
        {data.head && (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2.5,
            }}
          >
            <SectionHeader title="Manage Leads" />

            <SwapLeads
              head={data.head}
              functionalLead={"functionalLead" in data ? data.functionalLead : undefined}
              onSwapHead={handleHeadSwap}
              onSwapFunctionalLead={handleLeadSwap}
            />

            {/* {children.length > 0 && (
              <ManageChildren
                children={children}
                childType={childTypeLabel}
                onTransfer={handleChildTransfer}
              />
            )} */}
          </Box>
        )}

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
              border: `1px solid ${theme.palette.error.light}`,
              borderRadius: "6px",
            }}
          >
            <DeleteCurrent onDelete={handleDeleteCurrent} />

            {/* <Box
              sx={{
                width: "100%",
                height: "1px",
                backgroundColor: theme.palette.customBorder.primary.b2.active,
              }}
            /> */}

            {/* 
            {children.length > 0 && (
              <DeleteChild
                children={children}
                childType={childTypeLabel}
                selectedChild={selectedChildToDelete}
                onChildSelect={setSelectedChildToDelete}
                onDelete={handleDeleteChildren}
              />
            )} */}
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};
