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
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import {
  Autocomplete,
  Avatar,
  Box,
  Button,
  CircularProgress,
  IconButton,
  TextField,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

import { useState } from "react";

import ConfirmationDialog from "@root/src/component/common/ConfirmationDialog";
import { Head } from "@root/src/services/organization";
import { EmployeeBasicInfo, useGetEmployeesBasicInfoQuery } from "@services/employee";

import { truncateName } from "../../utils";

const NAME_TRUNCATE_LENGTH = 16;
const DESIGNATION_TRUNCATE_LENGTH = 20;

type LeadPanelType = "head" | "functionalLead";

interface PendingSwap {
  panel: LeadPanelType;
  employee: EmployeeBasicInfo;
}

interface EmployeeOptionProps {
  listItemProps: React.HTMLAttributes<HTMLLIElement>;
  employee: EmployeeBasicInfo;
}

const EmployeeOption: React.FC<EmployeeOptionProps> = ({ listItemProps, employee }) => {
  const theme = useTheme();
  const label = employee.designation ?? employee.workEmail;

  return (
    <Box
      component="li"
      {...listItemProps}
      sx={{
        display: "flex",
        gap: 1.5,
        alignItems: "center",
        py: "10px !important",
        px: "12px !important",
      }}
    >
      <Avatar
        src={employee.employeeThumbnail ?? undefined}
        sx={{ borderRadius: "8px", fontSize: 12, height: "40px", width: "40px" }}
      >
        {employee.firstName.charAt(0)}
      </Avatar>

      <Box sx={{ display: "flex", flexDirection: "column" }}>
        <Typography variant="body2" sx={{ color: theme.palette.customText.primary.p2.active }}>
          {employee.firstName} {employee.lastName}
        </Typography>

        <Typography variant="caption" sx={{ color: theme.palette.customText.primary.p4.active }}>
          {label}
        </Typography>
      </Box>
    </Box>
  );
};

const EmployeePreview: React.FC<{ employee: EmployeeBasicInfo }> = ({ employee }) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: "flex",
        gap: 1.5,
        alignItems: "center",
        p: 1,
        borderRadius: "6px",
        backgroundColor: theme.palette.surface.secondary.active,
        border: `1px solid ${theme.palette.customBorder.primary.b2.active}`,
      }}
    >
      <Avatar
        src={employee.employeeThumbnail ?? undefined}
        sx={{ width: 36, height: 36, borderRadius: "8px" }}
      >
        {employee.firstName.charAt(0)}
      </Avatar>

      <Box>
        <Typography variant="body2" sx={{ color: theme.palette.customText.primary.p2.active }}>
          {employee.firstName} {employee.lastName}
        </Typography>

        <Typography variant="caption" sx={{ color: theme.palette.customText.primary.p4.active }}>
          {employee.designation ?? employee.workEmail}
        </Typography>
      </Box>
    </Box>
  );
};

interface SelectLeadPanelProps {
  onRequestConfirm: (employee: EmployeeBasicInfo) => void;
}

const SelectLeadPanel: React.FC<SelectLeadPanelProps> = ({ onRequestConfirm }) => {
  const [selected, setSelected] = useState<EmployeeBasicInfo | null>(null);
  const { data: employees = [], isLoading } = useGetEmployeesBasicInfoQuery();

  return (
    <Box
      sx={{
        display: "flex",
        gap: 1.5,
        borderRadius: "6px",
        minWidth: "500px",
        justifyContent: "space-between",
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1, flex: 0.9 }}>
        <Autocomplete
          options={employees}
          loading={isLoading}
          value={selected}
          onChange={(_, val) => setSelected(val)}
          getOptionLabel={(o) => `${o.firstName} ${o.lastName}`}
          isOptionEqualToValue={(a, b) => a.employeeId === b.employeeId}
          slotProps={{ paper: { sx: { mt: 0.5 } } }}
          renderOption={(props, employee) => (
            <EmployeeOption key={employee.employeeId} listItemProps={props} employee={employee} />
          )}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Search employee..."
              InputProps={{
                ...params.InputProps,
                sx: { padding: "4px !important" },
                endAdornment: (
                  <>
                    {isLoading && <CircularProgress size={14} />}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
        />
        {selected && <EmployeePreview employee={selected} />}
      </Box>

      <Box sx={{ display: "flex", alignItems: "flex-start" }}>
        <Button
          size="small"
          variant="outlined"
          disabled={!selected}
          onClick={() => selected && onRequestConfirm(selected)}
        >
          Confirm
        </Button>
      </Box>
    </Box>
  );
};

interface LeadRowProps {
  label: string;
  lead: Head;
  isExpanded: boolean;
  onToggle: () => void;
}

const LeadRow: React.FC<LeadRowProps> = ({ label, lead, isExpanded, onToggle }) => {
  const theme = useTheme();

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: "8px", minWidth: "200px" }}>
      <Typography
        variant="body2"
        sx={{ color: theme.palette.customText.primary.p3.active, fontWeight: 500 }}
      >
        {label}
      </Typography>

      <Box sx={{ display: "flex", gap: "16px", alignItems: "center" }}>
        {/* Lead identity */}
        <Box sx={{ display: "flex", gap: "8px", alignItems: "center", flex: 1 }}>
          <Avatar src={lead.avatar} sx={{ width: 40, height: 40, borderRadius: "8px" }}>
            {lead.name.charAt(0)}
          </Avatar>

          <Box sx={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <Typography
              variant="body1"
              sx={{
                color: theme.palette.customText.primary.p2.active,
                textTransform: "capitalize",
              }}
            >
              {truncateName(lead.name, NAME_TRUNCATE_LENGTH)}
            </Typography>

            <Typography
              variant="caption"
              sx={{
                color: theme.palette.customText.primary.p4.active,
                textTransform: "capitalize",
                fontWeight: 400,
              }}
            >
              {truncateName(lead.title, DESIGNATION_TRUNCATE_LENGTH)}
            </Typography>
          </Box>
        </Box>

        {/* Toggle swap panel */}
        <IconButton
          onClick={onToggle}
          sx={{
            ml: 2,
            height: 37,
            width: 37,
            border: `1px solid ${theme.palette.customBorder.primary.b3.active}`,
            borderRadius: "6px",
            padding: "6px 12px",
            "&:hover": {
              backgroundColor: theme.palette.fill.neutral.light.hover,
              border: `1px solid ${theme.palette.customBorder.primary.b3.hover}`,
            },
          }}
        >
          {isExpanded ? (
            <CloseIcon
              sx={{ width: 16, height: 16, color: theme.palette.customText.primary.p2.active }}
            />
          ) : (
            <SwapHorizIcon
              sx={{ width: 16, height: 16, color: theme.palette.customText.primary.p2.active }}
            />
          )}
        </IconButton>
      </Box>
    </Box>
  );
};

interface SwappableLeadProps {
  label: string;
  lead: Head;
  isExpanded: boolean;
  onToggle: () => void;
  onRequestConfirm: (employee: EmployeeBasicInfo) => void;
}

const SwappableLead: React.FC<SwappableLeadProps> = ({
  label,
  lead,
  isExpanded,
  onToggle,
  onRequestConfirm,
}) => (
  <Box
    sx={{
      width: "fit-content",
      minWidth: "250px",
      display: "flex",
      flexDirection: "column",
      gap: 1,
    }}
  >
    <LeadRow label={label} lead={lead} isExpanded={isExpanded} onToggle={onToggle} />
    {isExpanded && <SelectLeadPanel onRequestConfirm={onRequestConfirm} />}
  </Box>
);

export interface SwapLeadsProps {
  head?: Head;
  functionalLead?: Head;
  onSwapHead: (employee: EmployeeBasicInfo, reason: string) => void;
  onSwapFunctionalLead: (employee: EmployeeBasicInfo, reason: string) => void;
}

export const SwapLeads: React.FC<SwapLeadsProps> = ({
  head,
  functionalLead,
  onSwapHead,
  onSwapFunctionalLead,
}) => {
  const [activePanel, setActivePanel] = useState<LeadPanelType | null>(null);
  const [pendingSwap, setPendingSwap] = useState<PendingSwap | null>(null);

  const handleRequestConfirm = (panel: LeadPanelType) => (employee: EmployeeBasicInfo) => {
    setPendingSwap({ panel, employee });
  };

  const handleConfirm = (_reason: string) => {
    if (!pendingSwap) return;
    const { panel, employee } = pendingSwap;

    if (panel === "head") {
      onSwapHead(employee, _reason);
    } else {
      onSwapFunctionalLead(employee, _reason);
    }

    setPendingSwap(null);
    setActivePanel(null);
  };

  const handleCancel = () => setPendingSwap(null);

  const togglePanel = (panel: LeadPanelType) =>
    setActivePanel((current) => (current === panel ? null : panel));

  return (
    <>
      <ConfirmationDialog
        open={pendingSwap !== null}
        title="Swap Leads"
        message="This action will replace the current lead. Are you sure?"
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />

      <Box sx={{ display: "flex", flexDirection: "column", width: "100%", px: 0.5, gap: 2 }}>
        {head && (
          <SwappableLead
            label="Business Unit Head"
            lead={head}
            isExpanded={activePanel === "head"}
            onToggle={() => togglePanel("head")}
            onRequestConfirm={handleRequestConfirm("head")}
          />
        )}

        {functionalLead && (
          <SwappableLead
            label="Functional Lead"
            lead={functionalLead}
            isExpanded={activePanel === "functionalLead"}
            onToggle={() => togglePanel("functionalLead")}
            onRequestConfirm={handleRequestConfirm("functionalLead")}
          />
        )}
      </Box>
    </>
  );
};
