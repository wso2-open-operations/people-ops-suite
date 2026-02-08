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
import { useNavigate } from "react-router-dom";
import Wso2Logo from "../../assets/images/wso2-logo.svg";
import { APP_NAME } from "@config/config";
import { useAppAuthContext } from "@context/AuthContext";
import { useAppSelector } from "@slices/store";
import BasicBreadcrumbs from "../BreadCrumbs/BreadCrumbs";
import { selectUserInfoData } from "@slices/userSlice";
import { NewThemeWrapper } from "@src/theme/NewThemeWrapper";

const Headercontent = () => {
  const authContext = useAppAuthContext();
  const theme = useTheme();
  const navigate = useNavigate();
  const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(null);

  const userInfo = useAppSelector(selectUserInfoData);

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };
  const getThemeColor = (path: string, fallback: string): string => {
    try {
      const color = path.split('.').reduce((o: any, i: string) => o?.[i], theme.palette as any);
      return typeof color === 'string' ? color : fallback;
    } catch (e) {
      return fallback;
    }
  };

  return (
    <Box
      sx={{
        zIndex: 2110,
        backgroundColor: getThemeColor("surface.territory.active", "#ffffff"),
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
        <img
          alt="wso2"
          style={{
            height: "40px",
            maxWidth: "100px",
          }}
          onClick={() => navigate("/")}
          src={Wso2Logo}
        />

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
              color: getThemeColor("customText.primary.p1.active", "#000000"),
            }}
          >
            {APP_NAME}
          </Typography>
          <BasicBreadcrumbs />
        </Box>

        <Box sx={{ flexGrow: 0 }}>
          {userInfo && (
            <>
              <Stack flexDirection={"row"} alignItems={"center"} gap={1}>
                <Box sx={{ width: "fit-content" }}>
                  <Typography
                    noWrap
                    variant="body1"
                    sx={{
                      color: getThemeColor("customText.primary.p2.active", "#333333"),
                    }}
                  >
                    {userInfo?.employeeName}
                  </Typography>
                  <Typography
                    noWrap
                    variant="body2"
                    sx={{
                      color: getThemeColor("customText.primary.p3.active", "#666666"),
                    }}
                  >
                    {userInfo?.jobRole}
                  </Typography>
                </Box>
                <Tooltip title="Open settings">
                  <Avatar
                    onClick={handleOpenUserMenu}
                    sx={{
                      width: 48,
                      height: 48,
                      border: 1,
                      borderColor: getThemeColor("customBorder.territory.active", "#cccccc"),
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

export default function Header(){
  return(
        <NewThemeWrapper>
          <Headercontent />
        </NewThemeWrapper>
  );
};
