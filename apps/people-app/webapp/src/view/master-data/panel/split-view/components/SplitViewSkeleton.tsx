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
// KIND, either express or implied. See the License for the
// specific language governing permissions and limitations
// under the License.
import { Box, Skeleton, Typography, useTheme } from "@mui/material";

const COLUMN_TITLES = ["Business Unit", "Teams", "Sub Teams", "Units"] as const;

const SKELETON_CARDS_PER_COLUMN = [3, 2, 2, 2];

function OrgStructureCardSkeleton() {
  const theme = useTheme();

  return (
    <Box sx={{ p: 0.25, borderRadius: 1 }}>
      <Box
        sx={{
          minWidth: "350PX",
          backgroundColor: theme.palette.surface.secondary.active,
          borderTop: "2px solid",
          borderTopColor: theme.palette.customBorder.brand.b1.active,
          borderRadius: "6px",
          padding: "12px",
          boxShadow: "0px 1px 6px 0px rgba(0, 0, 0, 0.12)",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Skeleton variant="rounded" width="70%" height={28} sx={{ maxWidth: 220 }} />
          <Skeleton variant="rounded" width={20} height={20} />
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Skeleton variant="rounded" width={72} height={22} sx={{ borderRadius: "4px" }} />
          <Skeleton variant="text" width={40} height={20} />
        </Box>

        <Box sx={{ display: "flex", gap: 1, alignItems: "center", width: "100%" }}>
          <Skeleton variant="circular" width={36} height={36} />
          <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 0.5 }}>
            <Skeleton variant="text" width="55%" height={16} />
            <Skeleton variant="text" width="38%" height={14} />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

function SplitViewColumnSkeleton({ title, cardCount }: { title: string; cardCount: number }) {
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
            alignItems: "center",
          }}
        >
          <Skeleton
            variant="rounded"
            height={40}
            sx={{
              flex: 1,
              borderRadius: 1,
              transform: "none",
            }}
          />
          <Skeleton
            variant="rounded"
            width={40}
            height={40}
            sx={{
              flexShrink: 0,
              borderRadius: "6px",
            }}
          />
        </Box>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, width: "100%" }}>
          {Array.from({ length: cardCount }, (_, i) => (
            <OrgStructureCardSkeleton key={i} />
          ))}
        </Box>
      </Box>
    </Box>
  );
}

export default function SplitViewSkeleton() {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Box sx={{ width: "100%", display: "flex", gap: 2 }}>
        {COLUMN_TITLES.map((title, index) => (
          <SplitViewColumnSkeleton
            key={title}
            title={title}
            cardCount={SKELETON_CARDS_PER_COLUMN[index] ?? 2}
          />
        ))}
      </Box>
    </Box>
  );
}
