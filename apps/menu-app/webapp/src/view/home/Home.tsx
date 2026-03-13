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
import { Box, Divider } from "@mui/material";

import { MicroAppType } from "@/types/types";
import { isMicroApp } from "@config/config";

import DinnerOnDemand from "./components/dod/DinnerOnDemand";
import Menu from "./components/menu/Menu";

export default function Home() {
  if (isMicroApp === MicroAppType.Menu) return <Menu />;

  if (isMicroApp === MicroAppType.Dod) return <DinnerOnDemand />;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <Menu />

      <Divider />

      <DinnerOnDemand />
    </Box>
  );
}
