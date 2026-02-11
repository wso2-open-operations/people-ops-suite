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
import { Collapse, Stack } from "@mui/material";
import type { RouteDetail } from "../../types/types";
import SubLink from "./SubLink";

interface SidebarSubMenuProps {
  parentRoute: RouteDetail;
  open: boolean;
}

function SidebarSubMenu({ parentRoute, open }: SidebarSubMenuProps) {
  const hasChildren = parentRoute.children && parentRoute.children.length > 0;

  if (!hasChildren) return null;

  return (
    // FIX: Use MUI Collapse instead of Framer Motion to fix crashes
    <Collapse in={true} timeout="auto" unmountOnExit sx={{ width: "100%" }}>
      <Stack direction="column" gap={1} sx={{ width: "100%", mt: 1 }}>
        {parentRoute.children!.map((child) => (
          <SubLink
            key={child.path || child.text}
            to={child.path || ""}
            parentPath={parentRoute.path}
            primary={child.text}
            icon={child.icon}
            open={open}
          />
        ))}
      </Stack>
    </Collapse>
  );
}

export default SidebarSubMenu;