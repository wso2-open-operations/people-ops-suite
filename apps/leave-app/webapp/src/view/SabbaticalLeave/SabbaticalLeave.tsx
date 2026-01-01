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

import EditDocumentIcon from "@mui/icons-material/EditDocument";
import HistoryIcon from "@mui/icons-material/History";
import HowToRegIcon from "@mui/icons-material/HowToReg";
import { useSelector } from "react-redux";

import { useEffect, useState } from "react";

import Title from "@root/src/component/common/Title";
import TabsPage, { TabProps } from "@root/src/layout/pages/TabsPage";
import { getAppConfig } from "@root/src/services/leaveService";
import { selectUser } from "@root/src/slices/userSlice/user";
import { AppConfigResponse } from "@root/src/types/types";
import ApplyTab from "@root/src/view/SabbaticalLeave/Panel/ApplyTab";

import ApprovalHistoryTab from "./Panel/ApprovalHistoryTab";
import ApproveLeaveTab from "./Panel/ApproveLeaveTab";

// Tabs for Sabbatical Leave (Apply, Approve Leave, Approval History, Functional Lead View)
export default function SabbaticalLeave() {
  const [sabbaticalFeatureEnabled, setSabbaticalFeatureEnabled] = useState<boolean>(false);
  const [sabbaticalPolicyUrl, setSabbaticalPolicyUrl] = useState<string>("");
  const [tabs, setTabs] = useState<TabProps[]>([
    {
      tabTitle: "Apply",
      tabPath: "apply",
      icon: <EditDocumentIcon />,
      page: <ApplyTab sabbaticalPolicyUrl={sabbaticalPolicyUrl} />,
    },
  ]);
  const userInfo = useSelector(selectUser);
  // Fetch app configs for sabbatical leave feature.
  useEffect(() => {
    const fetchSabbaticalLeaveFeatureStatus = async () => {
      try {
        const appConfig: AppConfigResponse = await getAppConfig();
        setSabbaticalFeatureEnabled(appConfig.isSabbaticalLeaveEnabled);
        setSabbaticalPolicyUrl(appConfig.sabbaticalLeavePolicyUrl);

        // Set approval tabs for leads only
        if (userInfo?.isLead) {
          const leadTabs: TabProps[] = [
            {
              tabTitle: "Approve Leave",
              tabPath: "approve-leave",
              icon: <HowToRegIcon />,
              page: <ApproveLeaveTab />,
            },
            {
              tabTitle: "Approval History",
              tabPath: "approval-history",
              icon: <HistoryIcon />,
              page: <ApprovalHistoryTab />,
            },
          ];
          setTabs((prevTabs) => [...prevTabs, ...leadTabs]);
        }
      } catch (error) {
        console.error("Error fetching app config:", error);
      }
    };

    fetchSabbaticalLeaveFeatureStatus();
  }, []);

  if (!sabbaticalFeatureEnabled) {
    return (
      <Title
        firstWord="Sabbatical "
        secondWord="Leave Feature is currently not available. Please check again later."
      />
    );
  }
  return (
    <>
      <TabsPage title="Sabbatical Leave" tabsPage={tabs} />
    </>
  );
}
