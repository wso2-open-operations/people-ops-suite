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
import { Avatar, Box, Menu, MenuItem, Stack, Toolbar, Tooltip, useTheme } from "@mui/material";
import Typography from "@mui/material/Typography";
import { LogIn } from "lucide-react";
import { useNavigate } from "react-router-dom";

import React from "react";

import PulseOrange from "@assets/images/pulse-orange.png";
import { APP_NAME } from "@config/config";
import { CommonMessage } from "@config/messages";
import { useAppAuthContext } from "@context/authState";
import BasicBreadcrumbs from "@layout/BreadCrumbs/BreadCrumbs";
import { Role, selectRoles } from "@slices/authSlice/auth";
import { RootState, useAppSelector } from "@slices/store";

import { ROUTE_PATHS } from "../../route";

const Header = () => {
  const authContext = useAppAuthContext();
  const theme = useTheme();
  const navigate = useNavigate();
  const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(null);
  const user = useAppSelector((state: RootState) => state.user);
  const roles = useAppSelector(selectRoles);
  const isGuest = roles.length === 1 && roles.includes(Role.GUEST);

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const avatarAltText =
    [user.userInfo?.firstName, user.userInfo?.lastName].filter(Boolean).join(" ") || "User avatar";
  const avatarInitials = `${user.userInfo?.firstName?.charAt(0) ?? ""}${user.userInfo?.lastName?.charAt(0) ?? ""}`;

  return (
    <Box
      sx={{
        zIndex: 10,
        backgroundColor: theme.palette.surface.territory.active,
        boxShadow: theme.shadows[4],
      }}
    >
      <Toolbar
        variant="dense"
        sx={{
          paddingY: 0.3,
          display: "flex",
          gap: 0.5,
          "&.MuiToolbar-root": {
            pl: 0.3,
          },
        }}
      >
        <Box
          component="button"
          type="button"
          onClick={() => navigate(ROUTE_PATHS.home)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              navigate(ROUTE_PATHS.home);
            }
          }}
          aria-label="Home"
          sx={{
            border: "none",
            background: "transparent",
            padding: 0,
            margin: 0,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
          }}
        >
          <img
            alt="Dashboard logo"
            style={{
              height: "32px",
              maxWidth: "120px",
            }}
            src={PulseOrange}
          ></img>
        </Box>

        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            gap: theme.spacing(0.5),
            width: "100%",
            alignItems: "center",
            height: "100%",
          }}
        >
          <Typography
            variant="h5"
            sx={{
              color: theme.palette.customText.primary.p1.active,
            }}
          >
            {APP_NAME}
          </Typography>
          <BasicBreadcrumbs />
        </Box>

        <Box sx={{ flexGrow: 0 }}>
          {isGuest ? (
            <Stack flexDirection={"row"} alignItems={"center"} gap={1}>
              <Tooltip title="Sign in to manage data">
                <Box
                  component="button"
                  type="button"
                  onClick={() => authContext.appSignIn()}
                  aria-label="Sign in"
                  sx={{
                    border: "none",
                    background: "transparent",
                    padding: 0,
                    margin: 0,
                    cursor: "pointer",
                    display: "flex",
                    borderRadius: "50%",
                    transition: "all 0.2s ease-in-out",
                    "&:hover": {
                      transform: "scale(1.05)",
                    },
                  }}
                >
                  <Avatar
                    sx={{
                      width: 48,
                      height: 48,
                      border: 1,
                      borderColor: theme.palette.customBorder.territory.active,
                      bgcolor: theme.palette.customBorder.territory.active,
                    }}
                  >
                    <LogIn size={24} />
                  </Avatar>
                </Box>
              </Tooltip>
              <Box sx={{ width: "fit-content", cursor: "pointer" }} onClick={() => authContext.appSignIn()}>
                <Typography
                  noWrap
                  variant="body1"
                  sx={{
                    color: theme.palette.customText.primary.p2.active,
                    fontWeight: 600,
                  }}
                >
                  Sign In
                </Typography>
                <Typography
                  noWrap
                  variant="body2"
                  sx={{
                    color: theme.palette.customText.primary.p3.active,
                  }}
                >
                  Manage food waste data
                </Typography>
              </Box>
            </Stack>
          ) : user.userInfo ? (
            <>
              <Stack flexDirection={"row"} alignItems={"center"} gap={1}>
                <Tooltip title="Open user menu">
                  <Box
                    component="button"
                    type="button"
                    onClick={handleOpenUserMenu}
                    aria-label="Open user menu"
                    aria-controls={anchorElUser ? "menu-appbar" : undefined}
                    aria-haspopup="true"
                    aria-expanded={anchorElUser ? "true" : undefined}
                    sx={{
                      border: "none",
                      background: "transparent",
                      padding: 0,
                      margin: 0,
                      cursor: "pointer",
                      display: "flex",
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 48,
                        height: 48,
                        border: 1,
                        borderColor: theme.palette.customBorder.territory.active,
                      }}
                      src={user.userInfo?.employeeThumbnail || ""}
                      alt={avatarAltText}
                    >
                      {avatarInitials || "U"}
                    </Avatar>
                  </Box>
                </Tooltip>
                <Box sx={{ width: "fit-content" }}>
                  <Typography
                    noWrap
                    variant="body1"
                    sx={{
                      color: theme.palette.customText.primary.p2.active,
                    }}
                  >
                    {[user.userInfo?.firstName, user.userInfo?.lastName].filter(Boolean).join(" ")}
                  </Typography>
                  <Typography
                    noWrap
                    variant="body2"
                    sx={{
                      color: theme.palette.customText.primary.p3.active,
                    }}
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
                  <Typography textAlign="center">{CommonMessage.session.logoutButton}</Typography>
                </MenuItem>
              </Menu>
            </>
          ) : null}
        </Box>
      </Toolbar>
    </Box>
  );
};

export default Header;
