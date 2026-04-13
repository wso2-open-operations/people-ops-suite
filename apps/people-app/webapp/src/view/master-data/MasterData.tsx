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
// KIND, either express or implied. See the License for the
// specific language governing permissions and limitations
// under the License.
import AccountTreeOutlinedIcon from "@mui/icons-material/AccountTreeOutlined";
import { Button, ThemeProvider, createTheme, useTheme as useMuiTheme } from "@mui/material";

import { useMemo } from "react";

import TabsPage from "@layout/pages/TabsPage";
import { themeSettings as featureThemeSettings } from "@src/theme/index";
import SplitView from "@view/master-data/panel/split-view/SplitView";

export default function MasterData() {
  const legacyTheme = useMuiTheme();

  const featureTheme = useMemo(
    () => createTheme(featureThemeSettings(legacyTheme.palette.mode)),
    [legacyTheme.palette.mode],
  );

  return (
    <ThemeProvider theme={featureTheme}>
      <TabsPage
        title="Master Data"
        tabsPage={[
          {
            tabTitle: "Org Structure Split View",
            tabPath: "org-structure-split-view",
            icon: <AccountTreeOutlinedIcon />,
            page: <SplitView />,
          },
          {
            tabTitle: "Org Structure Split View",
            tabPath: "org-structure-split-view",
            icon: <AccountTreeOutlinedIcon />,
            page: (
              <>
                <Button variant="contained" disabled={true}>
                  Dineth
                </Button>
              </>
            ),
          },
        ]}
      />
    </ThemeProvider>
  );
}
