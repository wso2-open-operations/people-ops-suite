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
import { UnitType } from "@root/src/utils/utils";
import { EmployeeBasicInfo } from "@services/employee";
import {
  BusinessUnit,
  Company,
  SubTeam,
  Team,
  Unit,
  useDeleteBusinessUnitMutation,
  useDeleteBusinessUnitTeamMutation,
  useDeleteSubTeamUnitMutation,
  useDeleteTeamSubTeamMutation,
  useUpdateBusinessUnitMutation,
  useUpdateBusinessUnitTeamMutation,
  useUpdateSubTeamMutation,
  useUpdateSubTeamUnitMutation,
  useUpdateTeamMutation,
  useUpdateTeamSubTeamMutation,
  useUpdateUnitMutation,
} from "@services/organization";

import { getEntityTypeName } from "../utils";
import { RenameField } from "./edit-modal/RenameField";
import { SectionHeader } from "./edit-modal/SectionHeader";
import { SwapLeads } from "../sections/leads-section/SwapLeads";
import { DeleteCurrent } from "../sections/danger-section/DeleteCurrent";

interface EditModalProps {
  open: boolean;
  onClose: () => void;
  data: Company | BusinessUnit | Team | SubTeam | Unit;
  type: string;
  parentNode: Company | BusinessUnit | Team | SubTeam | null;
}

export const EditModal: React.FC<EditModalProps> = ({ open, onClose, data, parentNode }) => {
  const theme = useTheme();

  const [updateBusinessUnit, { isLoading: isUpdatingBU, isError: isErrorUpdatingBU }] =
    useUpdateBusinessUnitMutation();
  const [updateTeam, { isLoading: isUpdatingTeam, isError: isErrorUpdatingTeam }] =
    useUpdateTeamMutation();
  const [updateSubTeam, { isLoading: isUpdatingSubTeam, isError: isErrorUpdatingSubTeam }] =
    useUpdateSubTeamMutation();
  const [updateUnit, { isLoading: isUpdatingUnit, isError: isErrorUpdatingUnit }] =
    useUpdateUnitMutation();

  const [updateBusinessUnitTeam, { isLoading: isUpdatingBUTeam, isError: isErrorUpdatingBUTeam }] =
    useUpdateBusinessUnitTeamMutation();
  const [
    updateTeamSubTeam,
    { isLoading: isUpdatingTeamSubTeam, isError: isErrorUpdatingTeamSubTeam },
  ] = useUpdateTeamSubTeamMutation();
  const [
    updateSubTeamUnit,
    { isLoading: isUpdatingSubTeamUnit, isError: isErrorUpdatingSubTeamUnit },
  ] = useUpdateSubTeamUnitMutation();

  const [deleteBusinessUnit, { isLoading: isDeletingBU, isError: isErrorDeletingBU }] =
    useDeleteBusinessUnitMutation();
  const [deleteBusinessUnitTeam, { isLoading: isDeletingBUTeam, isError: isErrorDeletingBUTeam }] =
    useDeleteBusinessUnitTeamMutation();
  const [
    deleteTeamSubTeam,
    { isLoading: isDeletingTeamSubTeam, isError: isErrorDeletingTeamSubTeam },
  ] = useDeleteTeamSubTeamMutation();
  const [
    deleteSubTeamUnit,
    { isLoading: isDeletingSubTeamUnit, isError: isErrorDeletingSubTeamUnit },
  ] = useDeleteSubTeamUnitMutation();

  const isLoading =
    isUpdatingBU ||
    isUpdatingTeam ||
    isUpdatingSubTeam ||
    isUpdatingUnit ||
    isUpdatingBUTeam ||
    isUpdatingTeamSubTeam ||
    isUpdatingSubTeamUnit ||
    isDeletingBU ||
    isDeletingBUTeam ||
    isDeletingTeamSubTeam ||
    isDeletingSubTeamUnit;

  const isError =
    isErrorUpdatingBU ||
    isErrorUpdatingTeam ||
    isErrorUpdatingSubTeam ||
    isErrorUpdatingUnit ||
    isErrorUpdatingBUTeam ||
    isErrorUpdatingTeamSubTeam ||
    isErrorUpdatingSubTeamUnit ||
    isErrorDeletingBU ||
    isErrorDeletingBUTeam ||
    isErrorDeletingTeamSubTeam ||
    isErrorDeletingSubTeamUnit;

  const entityTypeName = getEntityTypeName(data);

  const handleLeadSwap = async (
    entityId: string,
    parentId: string | null,
    selectedEmployee: EmployeeBasicInfo,
  ) => {
    const payload = { functionalLeadEmail: selectedEmployee.workEmail };

    switch (entityTypeName) {
      case UnitType.Team:
        if (parentId) await updateBusinessUnitTeam({ buId: parentId, teamId: entityId, payload });
        break;
      case UnitType.SubTeam:
        if (parentId) await updateTeamSubTeam({ teamId: parentId, subTeamId: entityId, payload });
        break;
      case UnitType.Unit:
        if (parentId) await updateSubTeamUnit({ subTeamId: parentId, unitId: entityId, payload });
        break;
    }
  };

  const handleHeadSwap = async (
    entityType: string,
    entityId: string,
    selectedEmployee: EmployeeBasicInfo,
    _reason: string,
  ) => {
    const payload = { headEmail: selectedEmployee.workEmail };

    switch (entityType) {
      case UnitType.BusinessUnit:
        await updateBusinessUnit({ id: entityId, payload });
        break;
      case UnitType.Team:
        await updateTeam({ id: entityId, payload });
        break;
      case UnitType.SubTeam:
        await updateSubTeam({ id: entityId, payload });
        break;
      case UnitType.Unit:
        await updateUnit({ id: entityId, payload });
        break;
    }
  };

  const handleDeleteCurrent = async () => {
    switch (entityTypeName) {
      case UnitType.BusinessUnit:
        await deleteBusinessUnit({ id: data.id });
        break;
      case UnitType.Team:
        if (parentNode) await deleteBusinessUnitTeam({ buId: parentNode.id, teamId: data.id });
        break;
      case UnitType.SubTeam:
        if (parentNode) await deleteTeamSubTeam({ teamId: parentNode.id, subTeamId: data.id });
        break;
      case UnitType.Unit:
        if (parentNode) await deleteSubTeamUnit({ subTeamId: parentNode.id, unitId: data.id });
        break;
    }
  };

  const handleRenameCurrent = async (entityName: string) => {
    const payload = { name: entityName };

    switch (entityTypeName) {
      case UnitType.BusinessUnit:
        await updateBusinessUnit({ id: data.id, payload });
        break;
      case UnitType.Team:
        await updateTeam({ id: data.id, payload });
        break;
      case UnitType.SubTeam:
        await updateSubTeam({ id: data.id, payload });
        break;
      case UnitType.Unit:
        await updateUnit({ id: data.id, payload });
        break;
    }
  };

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
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2.5,
          }}
        >
          <SectionHeader title="Manage Leads" />

          <SwapLeads
            entityType={entityTypeName}
            entityId={data.id}
            parentNode={parentNode}
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
