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

import React from "react";
import { APP_NAME } from "@config/config";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { useAppAuthContext } from "@context/AuthContext";
import { RootState, useAppSelector } from "@slices/store";
import { Avatar, Box, Menu, MenuItem, Stack, Tooltip } from "@mui/material";
import Wso2Logo from "@assets/images/wso2-logo.svg";
import BasicBreadcrumbs from "@layout/BreadCrumbs/BreadCrumbs";

const Header = () => {
  const authContext = useAppAuthContext();
  const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(
    null
  );
  const user = useAppSelector((state: RootState) => state.user);

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  return (
    <div className="z-10 bg-st-header-bg border-b border-st-border-light shadow-md">
      <Toolbar
        variant="dense"
        sx={{
          paddingY: 0.3,
          "&.MuiToolbar-root": {
            pl: 0.3,
          },
        }}
      >
        <img
          alt="wso2"
          style={{
            height: "40px",
            maxWidth: "100px",
          }}
          onClick={() => (window.location.href = "/")}
          src={Wso2Logo}
        ></img>

        <div className="flex flex-row gap-1 w-full items-end h-full">
          <Typography
            variant="h5"
            sx={{
              ml: 1,
              fontWeight: 600,
              width: "fit-content",
            }}
          >
            <p className="text-st-text-100">{APP_NAME}</p>
          </Typography>
          <BasicBreadcrumbs />
        </div>

        <Box sx={{ flexGrow: 0 }}>
          {user.userInfo && (
            <>
              <Stack flexDirection={"row"} alignItems={"center"} gap={2}>
                <Tooltip title="Open settings">
                  <Avatar
                    onClick={handleOpenUserMenu}
                    sx={{ border: 1, borderColor: "primary.main" }}
                    src={user.userInfo?.employeeThumbnail || ""}
                    alt={user.userInfo?.firstName || "Avatar"}
                  >
                    {user.userInfo?.firstName?.charAt(0)}
                  </Avatar>
                </Tooltip>
                <Box className="w-fit ">
                  <Typography
                    noWrap
                    variant="body1"
                    sx={{ fontWeight: 600 }}
                    className="text-st-text-100"
                  >
                    {user.userInfo?.firstName + " " + user.userInfo.lastName}
                  </Typography>
                  <Typography
                    noWrap
                    variant="body2"
                    className="text-st-text-200"
                  >
                    {user.userInfo?.jobRole}
                  </Typography>
                </Box>
              </Stack>

              <Menu
                sx={{ mt: "45px" }}
                id="menu-appbar"
                anchorEl={anchorElUser}
                anchorOrigin={{
                  vertical: "top",
                  horizontal: "right",
                }}
                keepMounted
                transformOrigin={{
                  vertical: "top",
                  horizontal: "right",
                }}
                open={Boolean(anchorElUser)}
                onClose={handleCloseUserMenu}
              >
                <MenuItem
                  key={"logout"}
                  onClick={() => {
                    authContext.appSignOut();
                  }}
                >
                  <Typography textAlign="center">Logout</Typography>
                </MenuItem>
              </Menu>
            </>
          )}
        </Box>
      </Toolbar>
    </div>
  );
};

export default Header;
