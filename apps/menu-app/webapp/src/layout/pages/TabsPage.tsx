// Copyright (c) 2025 WSO2 LLC. (https://www.wso2.com).
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

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Box from "@mui/material/Box";
import {Tabs as MUITabs} from "@mui/material";
import Tab from "@mui/material/Tab";

interface TabsPageProps {
  title: string;
  tabsPage: TabProps[];
}

interface TabProps {
  tabTitle: string;
  tabPath: string;
  icon: React.ReactElement<any, string | React.JSXElementConstructor<any>>;
  page: React.ReactElement<any, string | React.JSXElementConstructor<any>>;
}

export default function TabsPage({ tabsPage }: TabsPageProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [value, setValue] = useState<number>(0);

  const tabs = useMemo(() => tabsPage.map((t) => t.tabPath), [tabsPage]);

  useEffect(() => {
    const currentTab = searchParams.get("tab");
    const tabIndex = currentTab ? tabs.indexOf(currentTab) : -1;

    if (tabIndex !== -1) {
      setValue(tabIndex);
    } else {
      setValue(0);
      if (tabs[0]) setSearchParams({ tab: tabs[0] }, { replace: true });
    }
  }, [searchParams, tabs]);

  const handleTabClick = (index: number) => {
    setValue(index);
    setSearchParams({ tab: tabs[index] });
  };

  return (
    <Box sx={{ height: "100%", transition: "color 200ms" }}>
      <Tabs tabs={tabsPage} activeIndex={value} handleTabClick={handleTabClick} />

      {/* Tab Content with animations */}
      <AnimatePresence mode="wait">
        {tabsPage.map(
          (tab, index) =>
            value === index && (
              <motion.div
                key={tabs[index] ?? index}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                style={{ width: "100%" }}
              >
                <TabPanel value={value} index={index}>
                  {tab.page}
                </TabPanel>
              </motion.div>
            )
        )}
      </AnimatePresence>
    </Box>
  );
}

interface TabToggleProps {
  tabs: TabProps[];
  activeIndex: number;
  handleTabClick: (index: number) => void;
}

export function Tabs({ tabs, activeIndex, handleTabClick }: TabToggleProps) {
  return (
    <Box sx={{ display: "flex", flexDirection: "row" }}>
      <Box
        sx={{
          width: "100%",
          borderBottom: 1,
          borderColor: "divider",
          position: "relative",
          transition: "color 200ms",
        }}
      >
        <MUITabs
          value={activeIndex}
          onChange={(_evt, newValue) => handleTabClick(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          aria-label="Tabs navigation"
          textColor="inherit"
          TabIndicatorProps={{
            sx: {
              height: 2,
              bgcolor: "text.primary",
            },
          }}
          sx={{
            "& .MuiTab-root": {
              textTransform: "none",
              minHeight: 48,
              pr: 2,
              py: 1.5,
              color: "text.secondary",
              fontSize: "14px"
            },
            "& .MuiTab-root.Mui-selected": {
              color: "text.primary",
            },
          }}
        >
          {tabs.map((tab, index) => (
            <Tab
              key={index}
              icon={tab.icon}
              iconPosition="start"
              label={tab.tabTitle}
              id={`tab-${index}`}
              aria-controls={`tabpanel-${index}`}
            />
          ))}
        </MUITabs>
      </Box>
    </Box>
  );
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

export function TabPanel({ children, value, index }: TabPanelProps) {
  const isActive = value === index;
  return (
    <Box
      role="tabpanel"
      hidden={!isActive}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      sx={{ py: 2 }}
    >
      {isActive && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
        >
          {children}
        </motion.div>
      )}
    </Box>
  );
}
