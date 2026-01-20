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

import { Box, TextField, Typography, Autocomplete } from "@mui/material";
import {
  BusinessUnit,
  Team,
  SubTeam,
  Unit,
} from "@root/src/slices/organizationSlice/organization";

export type OrganizationSelection = {
  businessUnit?: string;
  team?: string;
  subTeam?: string;
  unit?: string;
};

export type OrganizationTreeFiltersProps = {
  value: OrganizationSelection;
  fieldSx: any;

  businessUnits: BusinessUnit[];
  teams: Team[];
  subTeams: SubTeam[];
  units: Unit[];

  onChangeBusinessUnit: (selected: BusinessUnit | null) => void;
  onChangeTeam: (selected: Team | null) => void;
  onChangeSubTeam: (selected: SubTeam | null) => void;
  onChangeUnit: (selected: Unit | null) => void;
};

export function OrganizationTreeFilters({
  value,
  fieldSx,
  businessUnits,
  teams,
  subTeams,
  units,
  onChangeBusinessUnit,
  onChangeTeam,
  onChangeSubTeam,
  onChangeUnit,
}: OrganizationTreeFiltersProps) {
  const treeItemSx = {
    position: "relative",
    pl: 3,
    py: 0.5,
    // horizontal connector
    "&::before": {
      content: '""',
      position: "absolute",
      top: "24px",
      left: "12px",
      width: "12px",
      height: "1px",
      bgcolor: "text.disabled",
    },
    // vertical connector
    "&::after": {
      content: '""',
      position: "absolute",
      top: 0,
      left: "12px",
      width: "1px",
      height: "24px",
      bgcolor: "text.disabled",
    },
  };

  return (
    <Box
      sx={{
        border: 1,
        borderColor: "divider",
        borderRadius: 1,
        p: 2,
        width: "100%",
        height: "100%",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          Organization
        </Typography>
        <Typography variant="body2" color="text.secondary">
          (Business Unit → Team → Sub Team → Unit)
        </Typography>
      </Box>

      <Box sx={{ pl: 0.5 }}>
        <Box sx={treeItemSx}>
          <Autocomplete<BusinessUnit, false, false, false>
            options={businessUnits}
            getOptionLabel={(o) => o.name}
            value={businessUnits.find((b) => b.name === value.businessUnit) ?? null}
            onChange={(_, selected) => onChangeBusinessUnit(selected)}
            renderInput={(params) => (
              <TextField {...params} size="small" label="Business Unit" sx={fieldSx} fullWidth />
            )}
          />

          <Box sx={{ pl: 1.5 }}>
            <Box sx={treeItemSx}>
              <Autocomplete<Team, false, false, false>
                options={teams}
                getOptionLabel={(o) => o.name}
                value={teams.find((t) => t.name === value.team) ?? null}
                onChange={(_, selected) => onChangeTeam(selected)}
                renderInput={(params) => (
                  <TextField {...params} size="small" label="Team" sx={fieldSx} fullWidth />
                )}
              />

              <Box sx={{ pl: 1.5 }}>
                <Box sx={treeItemSx}>
                  <Autocomplete<SubTeam, false, false, false>
                    options={subTeams}
                    getOptionLabel={(o) => o.name}
                    value={subTeams.find((st) => st.name === value.subTeam) ?? null}
                    onChange={(_, selected) => onChangeSubTeam(selected)}
                    renderInput={(params) => (
                      <TextField {...params} size="small" label="Sub Team" sx={fieldSx} fullWidth />
                    )}
                  />

                  <Box sx={{ pl: 1.5 }}>
                    <Box sx={treeItemSx}>
                      <Autocomplete<Unit, false, false, false>
                        options={units}
                        getOptionLabel={(o) => o.name}
                        value={units.find((u) => u.name === value.unit) ?? null}
                        onChange={(_, selected) => onChangeUnit(selected)}
                        renderInput={(params) => (
                          <TextField {...params} size="small" label="Unit" sx={fieldSx} fullWidth />
                        )}
                      />
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
