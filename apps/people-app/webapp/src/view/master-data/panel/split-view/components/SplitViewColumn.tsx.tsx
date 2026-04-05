import AddIcon from "@mui/icons-material/Add";
import ClearIcon from "@mui/icons-material/Clear";
import { Box, IconButton, InputAdornment, TextField, Typography, useTheme } from "@mui/material";
import { SearchIcon } from "lucide-react";

import { OrgStructureState } from "@root/src/slices/organizationSlice/organizationStructure";
import { NodeType } from "@root/src/utils/types";

import OrgStructureCard from "../../../components/OrgStructureCard";

interface SplitViewColumnProps<T extends OrgStructureState> {
  title: string;
  placeholder: string;
  nodeType: NodeType;
  searchTerm: string | null;
  selectedOrgItemId: number | null;
  isSearchDisabled?: boolean;
  isAddDisabled?: boolean;
  onSearch: (value: string) => void;
  onAdd: () => void;
  onEdit: (item: T, nodeType: NodeType) => void;
  onClick: (item: T) => void;
  orgItems: T[];
}

export default function SplitViewColumn<T extends OrgStructureState>(
  props: SplitViewColumnProps<T>,
) {
  const {
    title,
    placeholder,
    nodeType,
    searchTerm,
    selectedOrgItemId,
    isSearchDisabled = false,
    isAddDisabled = false,
    onSearch,
    onAdd,
    onEdit,
    onClick,
    orgItems,
  } = props;

  const theme = useTheme();

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        border: `1px solid ${theme.palette.customBorder.primary.b3.active}`,
        borderRadius: 1,
        backgroundColor: theme.palette.surface.secondary.active,
      }}
    >
      <Box
        sx={{
          py: 1.5,
          borderBottom: `1px solid ${theme.palette.customBorder.primary.b3.active}`,
        }}
      >
        <Typography
          variant="h6"
          sx={{
            color: theme.palette.customText.primary.p2.active,
            textAlign: "center",
          }}
        >
          {title}
        </Typography>
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, width: "100%", p: 2 }}>
        <Box
          sx={{
            width: "100%",
            display: "flex",
            gap: 1,
            justifyContent: "center",
            alignItems: "stretch",
          }}
        >
          <TextField
            value={searchTerm}
            onChange={(e) => onSearch(e.target.value)}
            placeholder={placeholder}
            disabled={isSearchDisabled}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start" sx={{ margin: 0 }}>
                    <SearchIcon size={18} />
                  </InputAdornment>
                ),
                endAdornment: searchTerm ? (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => onSearch("")}
                      sx={{
                        padding: 0,
                        color: theme.palette.customText.primary.p3.active,
                        "&:hover": {
                          color: theme.palette.customText.primary.p2.active,
                        },
                      }}
                    >
                      <ClearIcon sx={{ fontSize: "16px" }} />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              },
            }}
            sx={{
              width: "100%",
            }}
          />

          <Box
            sx={{
              alignSelf: "stretch",
              display: "flex",
              alignItems: "center",
              border: `1px solid ${theme.palette.customBorder.primary.b3.active}`,
              px: "6px",
              borderRadius: "6px",
              cursor: isAddDisabled ? "not-allowed" : "pointer",
              opacity: isAddDisabled ? 0.4 : 1,
              pointerEvents: isAddDisabled ? "none" : "auto",
            }}
            onClick={onAdd}
          >
            <AddIcon sx={{ color: theme.palette.customText.primary.p3.active }} />
          </Box>
        </Box>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, width: "100%" }}>
          {orgItems.map((item) => (
            <OrgStructureCard
              key={item.id}
              name={item.name}
              headCount={item.headCount}
              hasChildren={Boolean(item.head || ("functionalLead" in item && item.functionalLead))}
              togglePeopleSectionVisibility={true}
              teamHead={item.head}
              functionLead={"functionalLead" in item ? item.functionalLead : undefined}
              onEdit={() => onEdit(item, nodeType)}
              onClick={() => onClick(item)}
              isPeopleSectionVertical={true}
              isHighlighted={selectedOrgItemId === item.id}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
}
