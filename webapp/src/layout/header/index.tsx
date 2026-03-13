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

import { Avatar, Box, Menu, MenuItem, Stack, Tooltip, useTheme } from "@mui/material";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import React from "react";
import Wso2Logo from "@assets/images/wso2-logo.png";
import Wso2LogoWhite from "@assets/images/wso2-logo-white.png";
import { APP_NAME } from "@config/config";
import { useAppAuthContext } from "@context/AuthContext";
import { useAppSelector } from "@slices/store";
import BasicBreadcrumbs from "../BreadCrumbs/BreadCrumbs";
import { selectUserInfoData } from "@slices/userSlice/user";

const Header = () => {
  const authContext = useAppAuthContext();
  const theme = useTheme();
  const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(null);
  const userInfo = useAppSelector(selectUserInfoData);
  const activeLogo = theme.palette.mode === "dark" ? Wso2LogoWhite : Wso2Logo
  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  return (
    <Box
      sx={{
        zIndex: 2110,
        backgroundColor: theme.palette.surface.territory.active,
        boxShadow: theme.shadows[4],
      }}
    >
      <Toolbar
        variant="dense"
        sx={{
          py: 1,
          px: { xs: 1, md: 4 },
          display: "flex",
          gap: 2,
        }}
      >
        <img
          alt="wso2"
          style={{
            height: "25px",
            maxWidth: "100px",
            cursor: "pointer",
          }}
          onClick={() => (window.location.href = "/")}
          src={activeLogo}
        />

        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            gap: 2,
            alignItems: "center",
            flexGrow: 1,
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: theme.palette.customText.primary.p1.active,
              fontSize: "1.5rem",
            }}
          >
            {APP_NAME}
          </Typography>
          <BasicBreadcrumbs />
        </Box>

        <Box sx={{ flexShrink: 0 }}>
          {userInfo && (
            <>
              <Stack flexDirection={"row"} alignItems={"center"} gap={2}>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end"
                  }}
                >
                  <Typography
                    noWrap
                    variant="body2"
                    sx={{
                      color: theme.palette.customText.primary.p2.active,
                    }}
                  >
                    {userInfo?.employeeName}
                  </Typography>
                  <Typography
                    noWrap
                    variant="caption"
                    sx={{
                      color: theme.palette.customText.primary.p3.active,
                    }}
                  >
                    {userInfo?.jobRole}
                  </Typography>
                </Box>
                <Tooltip title="Open settings">
                  <Avatar
                    onClick={handleOpenUserMenu}
                    sx={{
                      width: 44,
                      height: 44,
                      border: 1,
                      cursor: "pointer",
                      borderColor: theme.palette.customBorder.territory.active,
                    }}
                    src={userInfo.employeeThumbnail || ""}
                    alt={userInfo.employeeName || "Avatar"}
                  >
                    {userInfo.employeeName?.charAt(0)}
                  </Avatar>
                </Tooltip>
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
                    handleCloseUserMenu();
                  }}
                >
                  <Typography textAlign="center">Logout</Typography>
                </MenuItem>
              </Menu>
            </>
          )}
        </Box>
      </Toolbar>
    </Box>
  );
};

export default Header;
