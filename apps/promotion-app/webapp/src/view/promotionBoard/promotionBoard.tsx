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
import HistoryIcon from "@mui/icons-material/History";
import Requests from "./panel/promotionBoardPromotions";
import History from "./panel/promotionBoardHistory";
import GroupsIcon from '@mui/icons-material/Groups';
import DriveFileMoveIcon from '@mui/icons-material/DriveFileMove';

export default function Individual() {
  return (
    <CommonPage
      title="Pormotion Board Portal"
      icon={<GroupsIcon />}
      commonPageTabs={[
        {
          tabTitle: "Requests",
          tabPath: "Promotion Requests",
          icon: <DriveFileMoveIcon />,
          page: <Requests />,
        },
        {
          tabTitle: "History",
          tabPath: "Promotion History",
          icon: <HistoryIcon />,
          page: <History />,
        },
      ]}
    />
  );
}