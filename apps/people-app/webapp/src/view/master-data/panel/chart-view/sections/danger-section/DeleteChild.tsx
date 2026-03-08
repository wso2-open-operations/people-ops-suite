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
import { Autocomplete, Box, Button, TextField, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";

import { BusinessUnit, SubTeam, Team, Unit } from "@services/organization";

import { TeamCard } from "@view/master-data/components/edit-modal/TeamCard";

// Union type for all possible child types
type ChildItem = BusinessUnit | Team | SubTeam | Unit;

interface DeleteChildProps {
  children: ChildItem[];
  childType: "Business Units" | "Teams" | "Sub-Teams" | "Units";
  selectedChild: ChildItem | null;
  onChildSelect: (child: ChildItem | null) => void;
  onDelete: () => void;
}

export const DeleteChild: React.FC<DeleteChildProps> = ({
  children,
  childType,
  selectedChild,
  onChildSelect,
  onDelete,
}) => {
  const theme = useTheme();

  // Don't render if there are no children
  if (!children || children.length === 0) {
    return null;
  }

  // Get singular form of childType for messages
  const singularChildType = childType.endsWith("s")
    ? childType.slice(0, -1).toLowerCase()
    : childType.toLowerCase();

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        padding: "12px",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: "2px",
        }}
      >
        <Typography
          variant="body2"
          sx={{
            color: theme.palette.customText.primary.p2.active,
          }}
        >
          Delete {childType.toLowerCase()}
        </Typography>

        <Typography
          variant="caption"
          sx={{
            color: theme.palette.customText.primary.p3.active,
            whiteSpace: "pre-wrap",
          }}
        >
          You can delete {childType.toLowerCase()} that no longer exist. All employees previously
          under the {singularChildType} will be unassigned from that {singularChildType}.
        </Typography>
      </Box>

      <Box
        sx={{
          display: "flex",
          gap: 2,
          width: "100%",
          justifyContent: "space-between",
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            flex: 0.8,
            gap: 1.5,
          }}
        >
          <Autocomplete
            options={children}
            getOptionLabel={(option) => option.name}
            value={selectedChild}
            onChange={(_, newValue) => onChildSelect(newValue)}
            renderInput={(params) => (
              <TextField {...params} placeholder={`Select ${singularChildType}`} />
            )}
            sx={{
              flex: 0.8,
              paddingY: 0,
            }}
          />

          {/* Team Card - Display when child is selected */}
          {selectedChild && (
            <TeamCard
              teamName={selectedChild.name}
              headCount={selectedChild.headCount}
              teamHead={selectedChild.head}
              functionLead={selectedChild.functionalLead}
            />
          )}
        </Box>

        <Button
          variant="outlined"
          sx={{ height: "fit-content" }}
          color="error"
          onClick={onDelete}
          disabled={!selectedChild}
        >
          Delete
        </Button>
      </Box>
    </Box>
  );
};
