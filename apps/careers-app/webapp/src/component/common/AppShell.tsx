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

import { Box, Button, Stack, Tooltip, useColorScheme } from "@wso2/oxygen-ui";
import { Briefcase, ClipboardList, LogOut, Moon, Sun, User } from "@wso2/oxygen-ui-icons-react";
import { Outlet, useLocation, useMatches, useNavigate } from "react-router-dom";

import { useEffect, useRef } from "react";

import SnackbarListener from "@component/common/SnackbarListener";
import { useAppAuthContext } from "@context/AuthContext";

import wso2LogoBlack from "@assets/images/wso2-logo_black.svg";
import wso2LogoWhite from "@assets/images/wso2-logo_white.svg";
import { State } from "@/types/types";
import { useIsDark } from "@config/brand";
import { CareersSiteUrl } from "@config/config";
import {
  applicationsFailed,
  clearUserData,
  loadApplications,
  loadProfile,
  profileFailed,
} from "@slices/careersSlice/careers";
import { RootState, useAppDispatch, useAppSelector } from "@slices/store";
import { dataNeededBy } from "@utils/routeData";

// The Jobs link leaves for the wso2.com careers page; the other links are pages of this app.
const NAV_ITEMS: { label: string; icon: typeof Briefcase; path?: string; href?: string }[] = [
  { href: CareersSiteUrl, label: "Jobs", icon: Briefcase },
  { path: "/applications", label: "Applications", icon: ClipboardList },
  { path: "/profile", label: "Profile", icon: User },
];

const AppShell = () => {
  const { setMode } = useColorScheme();
  const isDark = useIsDark();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { getToken: getAccessToken, isSignedIn, appSignIn, appSignOut } = useAppAuthContext();
  const applicationsState = useAppSelector((state: RootState) => state.careers.applicationsState);
  const profileState = useAppSelector((state: RootState) => state.careers.profileState);
  const sessionExpired = useAppSelector((state: RootState) => state.careers.sessionExpired);

  // The data the open route needs.
  const { applications: needsApplications, profile: needsProfile } = dataNeededBy(useMatches());

  // Loads the candidate's applications and profile for the open route.
  useEffect(() => {
    const loadApps = needsApplications && applicationsState === State.idle;
    const loadOwnProfile = needsProfile && profileState === State.idle;
    if (!isSignedIn || (!loadApps && !loadOwnProfile)) return;
    // Set when the effect is replaced before the token arrives.
    let cancelled = false;
    getAccessToken()
      .then((token) => {
        if (cancelled) return;
        if (loadApps) dispatch(loadApplications(token));
        if (loadOwnProfile) dispatch(loadProfile(token));
      })
      .catch(() => {
        if (cancelled) return;
        if (loadApps) dispatch(applicationsFailed());
        if (loadOwnProfile) dispatch(profileFailed());
      });
    return () => {
      cancelled = true;
    };
  }, [isSignedIn, applicationsState, profileState, needsApplications, needsProfile, dispatch, getAccessToken]);

  // Clears the candidate's data when nobody is signed in.
  useEffect(() => {
    if (!isSignedIn) dispatch(clearUserData());
  }, [isSignedIn, dispatch]);

  // Signs the candidate out when the backend refuses the access token.
  useEffect(() => {
    if (!sessionExpired) return;
    dispatch(clearUserData());
    appSignOut();
  }, [sessionExpired, dispatch, appSignOut]);

  // Guests only see the Jobs link.
  const navItems = isSignedIn ? NAV_ITEMS : NAV_ITEMS.filter((item) => item.href);

  const isActive = (path?: string) => !!path && location.pathname.startsWith(path);

  // Resets the scroll of the page container on a route change.
  const contentRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0 });
  }, [location.pathname]);

  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <SnackbarListener />

      {/* Top bar */}
      <Box
        sx={{
          height: "60px",
          flexShrink: 0,
          zIndex: 20,
          backgroundColor: isDark ? "transparent" : "#FFFFFF",
          borderBottom: "1px solid",
          borderColor: "divider",
          boxShadow: isDark ? "none" : "0 4px 18px -10px rgba(7,20,46,0.18)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: { xs: 2, md: 3 },
        }}
      >
        <Box component="a" href="https://wso2.com" aria-label="Go to the WSO2 home page" sx={{ display: "flex" }}>
          <Box
            component="img"
            src={isDark ? wso2LogoWhite : wso2LogoBlack}
            alt=""
            sx={{ height: 40, width: "auto" }}
          />
        </Box>

        <Stack direction="row" alignItems="center" gap={0.5}>
          {/* Icon-only links; the name shows as a tooltip on hover or keyboard focus */}
          <Stack component="nav" direction="row" alignItems="center" gap={0.5}>
            {navItems.map((item) => {
              const active = isActive(item.path);
              return (
                <Tooltip key={item.label} title={item.label} arrow disableInteractive>
                  <Box
                    component="button"
                    onClick={() => (item.href ? window.open(item.href, "_blank", "noopener,noreferrer") : navigate(item.path ?? "/"))}
                    aria-label={item.label}
                    aria-current={active ? "page" : undefined}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      px: 1.25,
                      py: 0.9,
                      border: "none",
                      borderRadius: "10px",
                      cursor: "pointer",
                      backgroundColor: active ? "#ff670018" : "transparent",
                      color: active ? "#ff6700" : "text.secondary",
                      transition: "background-color 0.15s, color 0.15s",
                      "&:hover, &:focus-visible": {
                        backgroundColor: active ? "#ff670018" : "action.hover",
                        color: active ? "#ff6700" : "text.primary",
                      },
                    }}
                  >
                    <item.icon size={19} />
                  </Box>
                </Tooltip>
              );
            })}
          </Stack>

          <Box sx={{ width: "1px", height: 24, backgroundColor: "divider", mx: 1 }} />

          <Tooltip title={isDark ? "Switch to light mode" : "Switch to dark mode"} arrow disableInteractive>
            <Box
              component="button"
              onClick={() => setMode(isDark ? "light" : "dark")}
              aria-label="Toggle light and dark mode"
              sx={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                border: "1px solid",
                borderColor: "divider",
                background: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "text.secondary",
                transition: "color 0.15s, border-color 0.15s",
                "&:hover": { color: "primary.main", borderColor: "primary.main" },
              }}
            >
              {isDark ? <Sun size={17} /> : <Moon size={17} />}
            </Box>
          </Tooltip>

          {isSignedIn ? (
            <Tooltip title="Sign out" arrow disableInteractive>
              <Box
                component="button"
                onClick={appSignOut}
                aria-label="Sign out"
                sx={{
                  width: 34,
                  height: 34,
                  ml: 0.5,
                  borderRadius: "50%",
                  border: "1px solid",
                  borderColor: "divider",
                  background: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "text.secondary",
                  transition: "color 0.15s, border-color 0.15s",
                  "&:hover": { color: "primary.main", borderColor: "primary.main" },
                }}
              >
                <LogOut size={16} />
              </Box>
            </Tooltip>
          ) : (
            <Button
              size="small"
              variant="contained"
              onClick={() => appSignIn()}
              sx={{ ml: 1, fontWeight: 700, borderRadius: "999px", px: 2.5 }}
            >
              Sign in
            </Button>
          )}
        </Stack>
      </Box>

      {/* Page content */}
      <Box ref={contentRef} sx={{ flex: 1, overflowY: "auto" }}>
        <Outlet />
      </Box>
    </Box>
  );
};

export default AppShell;
