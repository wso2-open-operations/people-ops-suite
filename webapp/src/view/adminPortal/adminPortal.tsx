// Copyright (c) 2026 WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import DataUsageIcon from "@mui/icons-material/DataUsage";
import HistoryIcon from "@mui/icons-material/History";
import StarsIcon from "@mui/icons-material/Stars";

import TabsPage from "@layout/pages/TabsPage";
// Make sure this import path is correct based on your previous messages
import OngoingPanel from "./panels/OngoingPanel"; 

export default function AdminPortal() {
  return (
    <TabsPage
      title="Admin Portal"
      tabsPage={[
        {
          tabTitle: "Ongoing",
          tabPath: "ongoing",
          icon: <DataUsageIcon />,
          page: <OngoingPanel />,
        },
        {
          tabTitle: "History",
          tabPath: "history",
          icon: <HistoryIcon />,
          page: <div>History Panel Content</div>, // Placeholder
        },
        {
          tabTitle: "Special",
          tabPath: "special",
          icon: <StarsIcon />,
          page: <div>Special Panel Content</div>, // Placeholder
        },
      ]}
    />
  );
}