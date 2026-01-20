import { Box, TextField, Typography, Autocomplete } from "@mui/material";
import {
  BusinessUnit,
  Team,
  SubTeam,
  Unit,
} from "@root/src/slices/organizationSlice/organization";

export type OrganizationTreeFiltersProps = {
  values: any;
  setFieldValue: (field: string, value: any) => void;
  fieldSx: any;

  businessUnits: BusinessUnit[];
  teams: Team[];
  subTeams: SubTeam[];
  units: Unit[];

  onSelectBusinessUnit: (buId?: number) => void;
  onSelectTeam: (teamId?: number) => void;
  onSelectSubTeam: (subTeamId?: number) => void;
};

export function OrganizationTreeFilters({
  values,
  setFieldValue,
  fieldSx,
  businessUnits,
  teams,
  subTeams,
  units,
  onSelectBusinessUnit,
  onSelectTeam,
  onSelectSubTeam,
}: OrganizationTreeFiltersProps) {

  const treeItemSx = {
    position: "relative",
    pl: 3,
    // py: 1,
    // horizontal connector
    "&::before": {
      content: '""',
      position: "absolute",
      top: "24px",
      left: "8px",
      width: "12px",
      height: "1px",
      bgcolor: "text.disabled",
    },
    // vertical connector
    "&::after": {
      content: '""',
      position: "absolute",
      top: 0,
      left: "8px",
      width: "1px",
      height: "24px",
      bgcolor: "text.disabled",
    },
  };

  return (
    <Box sx={{
        border: 1,
        borderColor: "divider",
        borderRadius: 1,
        p: 2,
        // display: "inline-block",
        width: "fit-content"
    }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          mb: 1,
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          Organization
        </Typography>
        <Typography variant="body2" color="text.secondary">
          (Business Unit → Team → Sub Team → Unit)
        </Typography>
      </Box>

      <Box sx={{ pl: 0.5 }}>
        <Box sx={treeItemSx}>
          {/* Business Unit */}
          <Autocomplete<BusinessUnit, false, false, false>
            options={businessUnits}
            getOptionLabel={(o) => o.name}
            value={
              businessUnits.find((b) => b.name === values.businessUnit) ?? null
            }
            onChange={(_, selected) => {
              setFieldValue("businessUnit", selected?.name);
              // Reset dependent fields
              setFieldValue("team", undefined);
              setFieldValue("subTeam", undefined);
              setFieldValue("unit", undefined);
              onSelectBusinessUnit(selected?.id);
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                size="small"
                label="Business Unit"
                sx={{...fieldSx, width: 400}}
              />
            )}
          />
          {/* Team */}
          <Box sx={{ pl: 2 }}>
            <Box sx={treeItemSx}>
              <Autocomplete<Team, false, false, false>
                options={teams}
                getOptionLabel={(o) => o.name}
                value={teams.find((t) => t.name === values.team) ?? null}
                onChange={(_, selected) => {
                  setFieldValue("team", selected?.name);
                  // Reset dependent fields
                  setFieldValue("subTeam", undefined);
                  setFieldValue("unit", undefined);
                  onSelectTeam(selected?.id);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    size="small"
                    label="Team"
                    sx={{...fieldSx, width: 400, mt: 1}}
                  />
                )}
              />
              {/* Sub Team */}
              <Box sx={{ pl: 2 }}>
                <Box sx={treeItemSx}>
                  <Autocomplete<SubTeam, false, false, false>
                    options={subTeams}
                    getOptionLabel={(o) => o.name}
                    value={
                      subTeams.find((st) => st.name === values.subTeam) ?? null
                    }
                    onChange={(_, selected) => {
                      setFieldValue("subTeam", selected?.name);
                      // Reset dependent field
                      setFieldValue("unit", undefined);
                      onSelectSubTeam(selected?.id);
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        size="small"
                        label="Sub Team"
                        sx={{...fieldSx, width: 400, mt: 1}}
                      />
                    )}
                  />
                  {/* Unit */}
                  <Box sx={{ pl: 2 }}>
                    <Box sx={treeItemSx}>
                      <Autocomplete<Unit, false, false, false>
                        options={units}
                        getOptionLabel={(o) => o.name}
                        value={
                          units.find((u) => u.name === values.unit) ?? null
                        }
                        onChange={(_, selected) => {
                          setFieldValue("unit", selected?.name);
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            size="small"
                            label="Unit"
                            sx={{...fieldSx, width: 400, mt: 1}}
                          />
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
