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
import { FormContainer } from "../../components/common/FormContainer"
import { SyntheticEvent } from "react";
import { useSearchParams } from "react-router-dom";
import Title from "../../components/common/Title";

import {
  Box,
  Fade,
  Paper,
  Tab,
  Tabs,
  IconButton,
  Stack,
} from "@mui/material";
import DataUsageIcon from "@mui/icons-material/DataUsage";
import HistoryIcon from "@mui/icons-material/History";
import ShieldIcon from "@mui/icons-material/Shield";

import OngoingPanel from "./panels/OngoingPanel";
import HistoryPanel from "./panels/HistoryPanel";
import { defaultTabWidth } from "@config/constant";
import { NewThemeWrapper } from "@src/theme/NewThemeWrapper";

enum ParCycleViewTabs {
  ONGOING = "ongoing",
  HISTORY = "history",
}

const tabsAndPanelsData = [
  {
    label: "Ongoing",
    icon: <DataUsageIcon fontSize="small" />,
    value: ParCycleViewTabs.ONGOING,
    component: <OngoingPanel />,
  },
  {
    label: "History",
    icon: <HistoryIcon fontSize="small" />,
    value: ParCycleViewTabs.HISTORY,
    component: <HistoryPanel />,
  },
];

const AdminPortalContent = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") || ParCycleViewTabs.ONGOING;
  const value = tabsAndPanelsData.findIndex(tab => tab.value === currentTab);
  const safeValue = value === -1 ? 0 : value;

  const handleTabChange = (_event: SyntheticEvent, newValue: number) => {
    const newTabValue = tabsAndPanelsData[newValue].value;
    setSearchParams({ tab: newTabValue });
  };

  return (
    <Fade in={true}>
      <Stack
        sx={{ height: "100%" }}
      >
        <FormContainer>
          <Title
            firstWord="Admin"
            secondWord="Portal"
            icon={<ShieldIcon fontSize="medium" />}
          />
            <Tabs
              value={safeValue}
              onChange={handleTabChange}
              variant="scrollable" // Crucial for mobile responsiveness
              scrollButtons="auto"
              allowScrollButtonsMobile
              aria-label="admin portal tabs"
              sx={{
                px: { xs: 1, md: 1 },
                "& .MuiTab-root": {
                 
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  textTransform: "none", // Modern look (no ALL CAPS)

                },
              }}
            >
              {tabsAndPanelsData.map((tab, index) => (
                <Tab
                  key={index}
                  label={tab.label}
                  icon={tab.icon}
                  iconPosition="start"
                />
              ))}
            </Tabs>

          {/* --- Content Section (Scrollable) --- */}
          <Box
            sx={{
              flexGrow: 1,      // Fills remaining vertical space
              overflowY: "auto", // Enables internal scrolling
              p: 0,             // Padding handled by TabPanel or inner content
            }}
          >
            {tabsAndPanelsData.map((tab, index) => (
              <TabPanel key={index} value={safeValue} index={index}>
                {tab.component}
              </TabPanel>
            ))}
          </Box>



        </FormContainer>
      </Stack>
    </Fade>
  );
};

export default function AdminPortal() {
  return (
    <NewThemeWrapper>
      <AdminPortalContent />
    </NewThemeWrapper>
  );
}

// --- Optimized TabPanel ---
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  // Render logic optimized: 
  // We use `display: none` instead of unmounting to keep state alive if needed,
  // OR standard conditional rendering. Standard conditional is better for performance.
  if (value !== index) return null;

  return (
    <div
      role="tabpanel"
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      style={{ height: "100%" }} // Ensure panel fills the scrollable area
      {...other}
    >
      <Box
        sx={{
          p: { xs: 2, md: 3 }, // Responsive padding inside the panel
          height: "100%"
        }}
      >
        {children}
      </Box>
    </div>
  );
};
