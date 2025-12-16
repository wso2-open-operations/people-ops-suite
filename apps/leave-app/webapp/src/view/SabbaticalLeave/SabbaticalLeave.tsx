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

import { CircleCheckBig, History, NotebookPen } from "lucide-react";

import { useEffect, useState } from "react";

import Title from "@root/src/component/common/Title";
import TabsPage from "@root/src/layout/pages/TabsPage";
import { getAppConfig } from "@root/src/services/leaveService";
import { AppConfigResponse } from "@root/src/types/types";
import ApplyTab from "@root/src/view/SabbaticalLeave/Panel/ApplyTab";

import ApprovalHistoryTab from "./Panel/ApprovalHistoryTab";
import ApproveLeaveTab from "./Panel/ApproveLeaveTab";

// Tabs for Sabbatical Leave (Apply, Approve Leave, Approval History, Functional Lead View)
export default function SabbaticalLeave() {
  const [sabbaticalFeatureEnabled, setSabbaticalFeatureEnabled] = useState<boolean>(false);
  // Fetch app config to check if sabbatical leave feature is enabled
  useEffect(() => {
    const fetchSabbaticalLeaveFeatureStatus = async () => {
      try {
        const appConfig: AppConfigResponse = await getAppConfig();
        setSabbaticalFeatureEnabled(appConfig.isSabbaticalLeaveEnabled);
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
      <TabsPage
        title="Sabbatical Leave"
        tabsPage={[
          {
            tabTitle: "Apply",
            tabPath: "apply",
            icon: <NotebookPen />,
            page: <ApplyTab />,
          },
          {
            tabTitle: "Approve Leave",
            tabPath: "approve-leave",
            icon: <CircleCheckBig />,
            page: <ApproveLeaveTab />,
          },
          {
            tabTitle: "Approval History",
            tabPath: "approval-history",
            icon: <History />,
            page: <ApprovalHistoryTab />,
          },
        ]}
      />
    </>
  );
}
