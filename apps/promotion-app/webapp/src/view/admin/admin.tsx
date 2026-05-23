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

import CommonPage from "../../layout/pages/CommonPage";
import GroupsIcon from '@mui/icons-material/Groups';
import Dashboard from "./panel/dashboard";
import Timebase from "./panel/timabase";
import IndividualContributor from "./panel/individualContributor";
import UserManagement from "./panel/userManagement";
import DriveFileMoveIcon from '@mui/icons-material/DriveFileMove';

export default function Admin() {
  return (
    <CommonPage
      title="Admin Portal"
      icon={<GroupsIcon />}
      commonPageTabs={[
        {
          tabTitle: "Dashboard",
          tabPath: "Admin Dashboard",
          icon: <DriveFileMoveIcon />,
          page: <Dashboard />,
        },
        {
          tabTitle: "Timebase",
          tabPath: "Timebase Promotion",
          icon: <DriveFileMoveIcon />,
          page: <Timebase />,
        },
        {
          tabTitle: "Individual Contributor",
          tabPath: "Individual Contributor",
          icon: <DriveFileMoveIcon />,
          page: <IndividualContributor />,
        },
        {
          tabTitle: "User Management",
          tabPath: "User Management",
          icon: <DriveFileMoveIcon />,
          page: <UserManagement />,
        },
      ]}
    />
  );
}