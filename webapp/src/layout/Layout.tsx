// Copyright (c) 2024, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import { Suspense, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

import Header from "./header";
import Sidebar, { DrawerHeader } from "./sidebar";
import {
  Outlet,
  useLocation,
  useNavigate,
  matchRoutes,
} from "react-router-dom";
import { routes } from "../route";

import ConfirmationModalContextProvider from "@context/DialogContext";
import { selectUserInfo, selectRoles } from "@slices/authSlice";
import { useSnackbar } from "notistack";
import pJson from "../../package.json";
import { RootState, useAppSelector } from "@slices/store";
import { Typography } from "@mui/material";
import { LoadingEffect } from "@components/ui/Loading";
import { uiMessages } from "@config/constant";
import { tokens } from "../theme";

const Layout = () => {
  //snackbar configuration
  const { enqueueSnackbar } = useSnackbar();
  const common = useAppSelector((state: RootState) => state.common);
  const navigate = useNavigate();
  useEffect(() => {
    if (common.timestamp != null) {
      enqueueSnackbar(common.message, {
        variant: common.type,
        preventDuplicate: true,
        anchorOrigin: { horizontal: "right", vertical: "bottom" },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [common.timestamp]);

  useEffect(() => {
    if (localStorage.getItem("internal-app-redirect-url")) {
      navigate(localStorage.getItem("internal-app-redirect-url") as string);
      localStorage.removeItem("internal-app-redirect-url");
    }
  }, []);

  const location = useLocation();
  const matches = matchRoutes(routes, location.pathname);
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const [open, setOpen] = useState(false);
  const roles = useSelector(selectRoles);
  const userInfo = useSelector(selectUserInfo);

  const getAppBarTitle = (): string => {
    var title: string = "";
    matches?.forEach((obj) => {
      if (location.pathname === obj.pathname) {
        title = obj.route.text;
      }
    });

    return title;
  };

  return (
    <ConfirmationModalContextProvider>
      <Box sx={{ display: "flex" }}>
        <CssBaseline />

        <Sidebar
          roles={roles}
          currentPath={location.pathname}
          open={open}
          handleDrawer={() => setOpen(!open)}
          theme={theme}
        />
        <Header
          theme={theme}
          title={getAppBarTitle()}
          open={open}
          email={userInfo?.email}
        />

        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
          <DrawerHeader open={open} />
          <Suspense
            fallback={
              <LoadingEffect message={uiMessages.loading.pageLoading} />
            }
          >
            <Outlet />
          </Suspense>
          <Box
            className="layout-note"
            sx={{
              height: "38px",
              width: "100%",
              margin: "-24px",
              padding: "10px",
              lineHeight: "20px",
              position: "fixed",
              bottom: "22px",
              zIndex: 100,
              background:
                theme.palette.mode === "light"
                  ? colors.customColors.offWhite
                  : colors.customColors.darkGray,
            }}
          >
            <Typography variant="h6" sx={{ color: colors.customColors.gray }}>
              v {pJson.version} | © {new Date().getFullYear()} WSO2 LLC
            </Typography>
          </Box>
        </Box>
      </Box>
    </ConfirmationModalContextProvider>
  );
};

export default Layout;
