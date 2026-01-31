// Copyright (c) 2024, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

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
import { SyntheticEvent, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import OngoingPanel from "./panels/OngoingPanel";
import HistoryPanel from "./panels/HistoryPanel";
import { defaultTabWidth } from "@config/constant";

const AdminPortal = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [value, setValue] = useState<number>(0);

  enum ParCycleViewTabs {
    ONGOING = "ongoing",
    HISTORY = "history",
    SPECIAL = "special",
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

  useEffect(() => {
    const currentTab = searchParams.get("tab");
    if (
      currentTab &&
      Object.values(ParCycleViewTabs).includes(currentTab as ParCycleViewTabs)
    ) {
      setValue(
        Object.values(ParCycleViewTabs).indexOf(currentTab as ParCycleViewTabs)
      );
    } else {
      searchParams.set("tab", ParCycleViewTabs.ONGOING);
      setSearchParams(searchParams);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleChange = (event: SyntheticEvent, newValue: number) => {
    setValue(newValue);
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
              <IconButton color="primary" component="label" onClick={() => {}}>
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
              value={value}
              onChange={handleChange}
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
                  icon={tab.icon}
                  iconPosition="start"
                  label={tab.label}
                  onClick={() => setSearchParams({ tab: tab.value })}
                  sx={{ width: defaultTabWidth }}
                />
              ))}
            </Tabs>
          </Box>
          {tabsAndPanelsData.map((tab, index) => (
            <TabPanel key={index} value={value} index={index}>
              {tab.component}
            </TabPanel>
          ))}
        </Paper>
      </Stack>
    </Fade>
  );
};

export default AdminPortal;

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
