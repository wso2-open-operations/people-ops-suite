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

import React, { SyntheticEvent, useEffect } from "react";

import { useSearchParams } from "react-router-dom";

import { Box, Fade, Paper, Stack, Tab, Tabs, useTheme } from "@mui/material";

import DataUsageIcon from "@mui/icons-material/DataUsage";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import GroupsIcon from "@mui/icons-material/Groups";
import HistoryToggleOffIcon from "@mui/icons-material/HistoryToggleOff";
import LinkIcon from "@mui/icons-material/Link";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutline";

import { gradients } from "@config/constant";

import { selectUserEmail } from "@slices/authSlice/auth";
import { resetSelectedEmployeeParState } from "@slices/employeeSlice/employee";
import { useAppSelector } from "@slices/store";

import EmployeeHistoryView from "@component/common/EmployeeHistoryView";
import SpecialRatingAllocationView from "@component/common/SpecialRatingAllocationView";
import Title from "@component/common/Title";
import EmployeeReportView from "./panels/EmployeeReportView";
import LeadOngoingPanel from "./panels/LeadOngoingPanel";
import ReportChainView from "./panels/ReportChainView";

const LeadPortal = () => {
  const userEmail = useAppSelector(selectUserEmail);
  const [searchParams, setSearchParams] = useSearchParams();
  const theme = useTheme();

  enum ParCycleViewTabs {
    ONGOING = "ongoing",
    HISTORY = "history",
    ALLOCATION = "allocation",
    ADDITIONAL = "additional",
    CHAIN = "chain",
  }

  const tabsAndPanelsData = [
    {
      label: "DIRECT REPORTS",
      icon: <DataUsageIcon />,
      value: ParCycleViewTabs.ONGOING,
      component: <LeadOngoingPanel />,
    },
    {
      label: "ADDITIONAL REPORTS",
      icon: <PeopleOutlineIcon />,
      value: ParCycleViewTabs.ADDITIONAL,
      component: <EmployeeReportView />,
    },
    {
      label: "REPORT CHAIN",
      icon: <LinkIcon />,
      value: ParCycleViewTabs.CHAIN,
      component: <ReportChainView />,
    },
    {
      label: "EMPLOYEE HISTORY",
      icon: <HistoryToggleOffIcon />,
      value: ParCycleViewTabs.HISTORY,
      component: <>{userEmail && <EmployeeHistoryView />}</>,
    },
    {
      label: "TOP 5%20% ALLOCATION",
      icon: <EmojiEventsIcon />,
      value: ParCycleViewTabs.ALLOCATION,
      component: <SpecialRatingAllocationView isAdminView={false} />,
    },
  ];

  const currentTab = searchParams.get("tab") || ParCycleViewTabs.ONGOING;
  const value = tabsAndPanelsData.findIndex((tab) => tab.value === currentTab);

  useEffect(() => {
    resetSelectedEmployeeParState();
  }, []);

  const handleChange = (event: SyntheticEvent, newValue: number) => {
    const tabValue = tabsAndPanelsData[newValue].value;
    setSearchParams({ tab: tabValue });
  };

  return (
    <Fade in={true}>
      <Stack sx={{ height: "100%" }}>
        <Paper
          sx={{
            width: "100%",
            height: "100%",
            borderRadius: "0.5rem",
            padding: "10px",
            background: theme.palette.mode === "dark" ? gradients.dark : gradients.light,
            boxShadow: "none",
            border: "none",
            overflowX: "hidden",
            boxSizing: "border-box",
          }}
        >
          <Title firstWord="Lead" secondWord="Portal" icon={<GroupsIcon fontSize="medium" />} />

          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <Tabs
              value={value}
              onChange={handleChange}
              aria-label="icon label tabs"
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile
              sx={{
                minHeight: 0,
                "& .MuiTab-root": {
                  minHeight: 0,
                  height: "60px",
                  px: { xs: 0.5, sm: 4 },
                  minWidth: { xs: "auto", sm: "190px" },

                  "& .MuiTab-iconWrapper": { fontSize: "1rem" },
                },
                "& .MuiTabs-indicator": { pb: "0.1rem" },
              }}
            >
              {tabsAndPanelsData.map((tab, index) => (
                <Tab
                  key={index}
                  icon={tab.icon}
                  iconPosition="start"
                  label={
                    <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
                      {tab.label}
                    </Box>
                  }
                />
              ))}
            </Tabs>
          </Box>

          <Box sx={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column" }}>
            {tabsAndPanelsData.map((tab, index) => (
              <TabPanel key={index} value={value} index={index}>
                {tab.component}
              </TabPanel>
            ))}
          </Box>
        </Paper>
      </Stack>
    </Fade>
  );
};

export default LeadPortal;

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
      {value === index && <Box sx={{ pt: 1 }}>{children}</Box>}
    </div>
  );
};
