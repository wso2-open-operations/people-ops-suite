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
import Pending from "./panel/timeBasedPromotions";
import TimebaseHistory from "./panel/timeBasedHistory";
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import AutoModeIcon from '@mui/icons-material/AutoMode';
import SafetyCheckIcon from '@mui/icons-material/SafetyCheck';

export default function TimeBase() {
  return (
    <CommonPage
      title="Timebase Promotion"
      icon={<SafetyCheckIcon />}
      commonPageTabs={[
        {
          tabTitle: "Pending",
          tabPath: "Pending",
          icon: <PendingActionsIcon />,
          page: <Pending />,
        },
        {
          tabTitle: "History",
          tabPath: "History",
          icon: <AutoModeIcon />,
          page: <TimebaseHistory />,
        },
      ]}
    />
  );
}