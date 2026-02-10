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

import { useSearchParams } from "react-router-dom";
import Title from "../../components/common/Title";

import {
  Box,
  Fade,
  Stack,
} from "@mui/material";
import DataUsageIcon from "@mui/icons-material/DataUsage";
import HistoryIcon from "@mui/icons-material/History";
import ShieldIcon from "@mui/icons-material/Shield";

import OngoingPanel from "./panels/OngoingPanel";
import HistoryPanel from "./panels/HistoryPanel";
import { FormContainer } from "../../components/common/FormContainer";
import SegmentedTabs from "../../components/common/SegmentedTabs";
import { NewThemeWrapper } from "@src/theme/NewThemeWrapper";

enum ParCycleViewTabs {
  ONGOING = "ongoing",
  HISTORY = "history",
}

const tabsData = [
  {
    label: "Ongoing",
    value: ParCycleViewTabs.ONGOING,
    icon: <DataUsageIcon fontSize="small" />,
    component: <OngoingPanel />,
  },
  {
    label: "History",
    value: ParCycleViewTabs.HISTORY,
    icon: <HistoryIcon fontSize="small" />,
    component: <HistoryPanel />,
  },
];

const AdminPortalContent = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") || ParCycleViewTabs.ONGOING;

  // Update the URL when a user clicks a tab
  const handleTabChange = (newValue: string) => {
    setSearchParams({ tab: newValue });
  };

  return (
    <Fade in={true}>
      <Stack sx={{ height: "100%" }}>
        <FormContainer>
          <Title
            firstWord="Admin"
            secondWord="Portal"
            icon={<ShieldIcon fontSize="medium" />}
          />
          <SegmentedTabs
            items={tabsData}
            value={currentTab}
            onChange={handleTabChange}
          />
          <Box sx={{ flexGrow: 1, overflowY: "auto", p: 0 }}>
            {tabsData.map((tab) => (
              <TabPanel key={tab.value} value={currentTab} selectedValue={tab.value}>
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

interface TabPanelProps {
  children?: React.ReactNode;
  value: string;
  selectedValue: string;
}

const TabPanel = ({ children, value, selectedValue }: TabPanelProps) => {
  if (value !== selectedValue) return null;

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, height: "100%" }}>
      {children}
    </Box>
  );
};
