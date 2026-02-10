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

import { SyntheticEvent } from "react";
import { useSearchParams } from "react-router-dom";

import {
  Box,
  Fade,
  Paper,
  Tab,
  Tabs,
  Typography,
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
    icon: <DataUsageIcon />,
    value: ParCycleViewTabs.ONGOING,
    component: <OngoingPanel />,
  },
  {
    label: "History",
    icon: <HistoryIcon />,
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
      <Stack>
        <Paper
          square
          className="paper"
          variant="outlined"
          sx={{
            borderRadius: "5px",
            minWidth: "1200px",
            height: "fit-content",
          }}
        >
          <Stack
            sx={{
              display: "flex",
              justifyContent: "space-between",
              margin: "5px",
            }}
          >
            <Stack
              direction={"row"}
              style={{
                display: "flex",
                justifyContent: "left",
              }}
            >
              <IconButton color="primary" component="label" onClick={() => { }}>
                <ShieldIcon fontSize="large" />
              </IconButton>
              <Typography
                variant="h4"
                sx={{ marginTop: "12px", marginLeft: "10px" }}
              >
                Admin Portal
              </Typography>
            </Stack>
          </Stack>

          <Box
            sx={{
              borderBottom: 1,
              borderColor: "divider",
              padding: "0px 30px",
            }}
          >
            <Tabs
              value={safeValue}
              onChange={handleTabChange}
              aria-label="icon label tabs"
              sx={{
                "&.MuiTabs-root": {
                  height: "3rem",
                  alignItems: "center",
                },
                "& .MuiTabs-indicator": {
                  pb: "0.925rem",
                },
              }}
            >
              {tabsAndPanelsData.map((tab, index) => (
                <Tab
                  key={index}
                  label={tab.label}
                  icon={tab.icon}
                  iconPosition="start"
                  sx={{ width: defaultTabWidth }}
                />
              ))}
            </Tabs>
          </Box>
          {tabsAndPanelsData.map((tab, index) => (
            <TabPanel key={index} value={safeValue} index={index}>
              {tab.component}
            </TabPanel>
          ))}
        </Paper>
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
};

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: "10px 20px 10px 20px" }}>{children}</Box>
      )}
    </div>
  );
};
