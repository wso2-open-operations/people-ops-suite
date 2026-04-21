import AddIcon from "@mui/icons-material/Add";
import ClearIcon from "@mui/icons-material/Clear";
import { Box, IconButton, InputAdornment, TextField, Typography, useTheme } from "@mui/material";
import { SearchIcon } from "lucide-react";

import { OrgStructureState } from "@slices/organizationSlice/organizationStructure";
import { NodeType } from "@utils/types";
import OrgStructureCard from "@view/master-data/components/OrgStructureCard";

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
        height: "100%",
        minHeight: 0,
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

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 2.5,
          width: "100%",
          p: 2,
          flex: 1,
          minHeight: 0,
          paddingBottom: 0,
        }}
      >
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
            value={searchTerm ?? ""}
            onChange={(e) => onSearch(e.target.value)}
            placeholder={placeholder}
            disabled={isSearchDisabled}
            InputProps={{
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

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            width: "100%",
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            position: "relative",
            pr: 0.5,
            pb: 1,
            overscrollBehaviorY: "contain",
          }}
        >
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

          <Box
            sx={{
              position: "sticky",
              bottom: -10,
              left: 0,
              right: 0,
              flexShrink: 0,
              height: 32,
              pointerEvents: "none",
              background: `linear-gradient(to bottom, rgba(0,0,0,0), ${theme.palette.surface.secondary.active})`,
              backdropFilter: "blur(2px)",
              WebkitBackdropFilter: "blur(2px)",
              zIndex: 10,
            }}
          />
        </Box>
      </Box>
    </Box>
  );
}
