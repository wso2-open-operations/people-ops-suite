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

import { Tab, Tabs, useTheme, Box } from "@mui/material";
import { SyntheticEvent, ReactElement } from "react";

export interface TabItem {
  label: string;
  value: string;
  icon?: ReactElement; 
}

interface SegmentedTabsProps {
  items: TabItem[];
  value: string;
  onChange: (newValue: string) => void;
}

export default function SegmentedTabs({ items, value, onChange }: SegmentedTabsProps) {
  const theme = useTheme();

  const handleChange = (_event: SyntheticEvent, newValue: string) => {
    onChange(newValue);
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Tabs
        value={value}
        onChange={handleChange}
        variant="fullWidth"
        sx={{
          backgroundColor: theme.palette.mode === "light"
            ? "rgba(0, 0, 0, 0.04)"
            : "rgba(255, 255, 255, 0.05)",
          borderRadius: "12px",
          padding: "3px",
          minHeight: "unset",
          "& .MuiTabs-indicator": { display: "none" },
        }}
      >
        {items.map((tab) => (
          <Tab
            key={tab.value}
            label={tab.label}
            value={tab.value}
            icon={tab.icon}
            iconPosition="start"
            sx={{
              borderRadius: "8px",
              textTransform: "none",
              fontWeight: 600,
              fontSize: "0.9rem",
              minHeight: "30px",
              color: theme.palette.text.secondary,
              transition: "all 0.3s ease",
              "&:hover": {
                backgroundColor: "rgba(0,0,0,0.04)",
                color: theme.palette.text.primary,
              },
              "&.Mui-selected": {
                backgroundColor: theme.palette.background.paper,
                color: theme.palette.primary.main,
                boxShadow: "0px 1px 4px rgba(0,0,0,0.1)",
              },
              "& .MuiTab-iconWrapper": {
                marginBottom: "0px",
                marginRight: "8px",
              },
            }}
          />
        ))}
      </Tabs>
    </Box>
  );
}
