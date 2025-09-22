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
import BadgeIcon from "@mui/icons-material/Badge";
import CommonPage from "@layout/pages/CommonPage";
import PendingVisits from "@view/admin/panel/pendingVisits";
import AcceptedVisits from "@view/admin/panel/acceptedVisits";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import VerifiedIcon from "@mui/icons-material/Verified";

export default function Admin() {
  return (
    <CommonPage
      title="Visit"
      icon={<BadgeIcon />}
      commonPageTabs={[
        {
          tabTitle: "Pending Visits",
          tabPath: "pending-visits",
          icon: <PendingActionsIcon />,
          page: <PendingVisits />,
        },
        {
          tabTitle: "Accepted Visits",
          tabPath: "accepted-visits",
          icon: <VerifiedIcon />,
          page: <AcceptedVisits />,
        },
      ]}
    />
  );
}
