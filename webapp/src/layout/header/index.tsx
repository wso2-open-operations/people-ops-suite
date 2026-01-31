// Copyright (c) 2024, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import React from "react";
import { styled, Theme } from "@mui/material/styles";
import MuiAppBar, { AppBarProps as MuiAppBarProps } from "@mui/material/AppBar";

import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";

import Toolbar from "@mui/material/Toolbar";

import { selectUserInfo } from "@slices/authSlice";
import { useSelector } from "react-redux";

import { deployedEnvironment } from "@config/config";

import { SIDEBAR_WIDTH } from "./../../config/ui";
import { Box, Chip, Menu, MenuItem, Tooltip } from "@mui/material";

import { useAppAuthContext } from "@context/AuthContext";
import UserImage from "@components/ui/UserImage";
import { tokens } from "../../theme";
import { useNavigate } from "react-router-dom";

interface HeaderProps {
  open: boolean;
  theme: Theme;
  title: string;
  email?: string;
}

const Header = (props: HeaderProps) => {
  const authContext = useAppAuthContext();
  const navigate = useNavigate();

  const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(
    null
  );

  const userInfo = useSelector(selectUserInfo);

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  return (
    <AppBar position="fixed" open={props.open}>
      <Toolbar>
        <Typography
          variant="h6"
          noWrap
          component="div"
          sx={{
            flexGrow: 1,
            display: { xs: "none", sm: "block" },
            fontWeight: 300,
            fontSize: "1.0rem",
            // fontFamily: `"Paytone One", sans-serif`,
          }}
        >
          {!props.open ? "PAR App" : ""}
        </Typography>

        {deployedEnvironment !== "Production" && (
          <Chip
            sx={{
              background: tokens(props.theme.palette.mode).customColors.green,
              color: "white",
            }}
            label={
              <>
                env: <b> {deployedEnvironment}</b>{" "}
              </>
            }
            style={{ borderRadius: "5px" }}
            size="small"
          />
        )}

        <IconButton size="large"></IconButton>
        <Box sx={{ flexGrow: 0 }}>
          {userInfo && userInfo.email && (
            <>
              <Tooltip arrow title="Open settings">
                <IconButton
                  onClick={handleOpenUserMenu}
                  size="small"
                  sx={{ p: 0 }}
                >
                  <UserImage
                    isRound={true}
                    email={userInfo.email}
                    size={45}
                    name={userInfo.email}
                  ></UserImage>
                </IconButton>
              </Tooltip>

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
                  key={"profile"}
                  onClick={() => {
                    handleCloseUserMenu();
                    navigate("/profile");
                  }}
                >
                  <Typography textAlign="center">Profile</Typography>
                </MenuItem>
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
    </AppBar>
  );
};

export default Header;

interface AppBarProps extends MuiAppBarProps {
  open?: boolean;
}

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== "open",
})<AppBarProps>(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  marginLeft: SIDEBAR_WIDTH,
  color: "white",
  background:
    theme.palette.mode === "light"
      ? tokens(theme.palette.mode).customColors.darkBlue
      : tokens(theme.palette.mode).customColors.darkGray,
  boxShadow: "none",
  borderBottom: "1px solid rgba(0, 0, 0, 0.12)",
  width: `calc(100% - calc(${theme.spacing(9)} + 1px))`,
  transition: theme.transitions.create(["width", "margin"], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    marginLeft: SIDEBAR_WIDTH,
    width: `calc(100% - ${SIDEBAR_WIDTH}px)`,
    transition: theme.transitions.create(["width", "margin"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));
