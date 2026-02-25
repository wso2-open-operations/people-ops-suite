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
import BackdropProgress from "@component/ui/BackdropProgress";
import { BusinessUnit, Company, SubTeam, Team, Unit } from "@services/organization";

import { useOrgEntityActions } from "../hooks/useOrgEntityActions";
import { DeleteCurrent } from "../sections/danger-section/DeleteCurrent";
import { RenameField } from "../sections/general-section//RenameField";
import { SwapLeads } from "../sections/leads-section/SwapLeads";
import { SectionHeader } from "./edit-modal/SectionHeader";

interface EditModalProps {
  open: boolean;
  onClose: () => void;
  data: Company | BusinessUnit | Team | SubTeam | Unit;
  type: string;
  parentNode: Company | BusinessUnit | Team | SubTeam | null;
}

export const EditModal: React.FC<EditModalProps> = ({ open, onClose, data, parentNode }) => {
  const theme = useTheme();

  const {
    entityTypeName,
    handleLeadSwap,
    handleHeadSwap,
    handleDeleteCurrent,
    handleRenameCurrent,
    isLoading,
    isError,
  } = useOrgEntityActions({ data, parentNode });

  if (isError || !entityTypeName) {
    return <ErrorHandler message={"Something went wrong. Please try again..."} />;
  }

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
      <BackdropProgress
        open={isLoading}
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
          Edit {entityTypeName}
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
            entityType={entityTypeName}
            currentName={data.name}
            onRenameSuccess={handleRenameCurrent}
          />
        </Box>

        {/* Leads Section */}
        {(data.head || data.functionalLead) && (
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
              functionalLead={data.functionalLead}
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
    </Dialog >
  );
};
