// Copyright (c) 2024, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import React, { useContext, useEffect, useState } from "react";
import { useIdleTimer } from "react-idle-timer";
import { Button } from "@mui/material";
import { ApiService } from "@utils/apiService";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";

import { useAuthContext, BasicUserInfo, SecureApp } from "@asgardeo/auth-react";

import {
  setUserAuthData,
  loadPrivileges,
  loadEmployeeInfo,
} from "@slices/authSlice";

import { useAppDispatch } from "../slices/store";
import LoginView from "@components/ui/LoginView";
import PreLoader from "@components/common/PreLoader";
import { fetchEmployees } from "@slices/metaSlice";

type AuthContextType = {
  revokeToken: () => void;
  appSignIn: () => void;
  appSignOut: () => void;
  user: BasicUserInfo | null;
};

type AppAuthProviderProps = {
  children: React.ReactNode;
};

const timeout = 1800_000;
const promptBeforeIdle = 4_000;

const AuthContext = React.createContext<AuthContextType>({} as AuthContextType);

const AppAuthProvider = (props: AppAuthProviderProps) => {
  const [user, setUser] = useState<BasicUserInfo | null>(null);
  const [open, setOpen] = useState<boolean>(false);
  const [appState, setAppState] = useState<"logout" | "active" | "loading">(
    "loading"
  );

  const dispatch = useAppDispatch();

  const onPrompt = () => {
    appState === "active" && setOpen(true);
  };

  const { getRemainingTime, activate } = useIdleTimer({
    onPrompt,
    timeout,
    promptBeforeIdle,
    throttle: 500,
  });

  const {
    signOut,
    getDecodedIDToken,
    getAccessToken,
    getBasicUserInfo,
    revokeAccessToken,
    refreshAccessToken,
    isAuthenticated,
    state,
  } = useAuthContext();

  const refreshToken = () => {
    return new Promise<{ idToken: string }>(async (resolve) => {
      const userIsAuthenticated = await isAuthenticated();
      if (userIsAuthenticated) {
        resolve({ idToken: await getAccessToken() });
      } else {
        refreshAccessToken()
          .then(async (res) => {
            const accessToken = await getAccessToken();
            resolve({ idToken: accessToken });
          })
          .catch((error) => {
            appSignOut();
          });
      }
    });
  };

  useEffect(() => {
    var appStatus = localStorage.getItem("internal-app-state");

    if (!localStorage.getItem("internal-app-redirect-url")) {
      localStorage.setItem(
        "internal-app-redirect-url",
        window.location.href.replace(window.location.origin, "")
      );
    }

    if (appStatus && appStatus === "logout") {
      setAppState("logout");
    } else {
      setAppState("active");
    }
  }, []);

  useEffect(() => {
    if (appState === "active") {
      if (state.isAuthenticated) {
        Promise.all([
          getBasicUserInfo(),
          getAccessToken(),
          getDecodedIDToken(),
        ]).then(async ([userInfo, accessToken, decodedIdToken]) => {
          dispatch(
            setUserAuthData({
              userInfo: userInfo,
              accessToken: accessToken,
              decodedIdToken: decodedIdToken,
            })
          );

          setUser(userInfo);
          new ApiService(accessToken, refreshToken, dispatch);
          dispatch(loadPrivileges());
          if (userInfo?.email) {
            dispatch(loadEmployeeInfo(userInfo.email));
          }
          dispatch(fetchEmployees());
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appState, state.isAuthenticated]);

  const revokeToken = () => {
    revokeAccessToken();
  };

  const appSignOut = async () => {
    setAppState("loading");
    localStorage.setItem("internal-app-state", "logout");
    revokeToken();
    await signOut();
    setAppState("logout");
  };

  const appSignIn = async () => {
    setAppState("active");
    localStorage.setItem("internal-app-state", "active");
  };

  const authContext: AuthContextType = {
    revokeToken: revokeToken,
    appSignIn: appSignIn,
    appSignOut: appSignOut,
    user: user,
  };

  return (
    <>
      {appState === "loading" ? (
        <PreLoader isLoading={true} message="" />
      ) : (
        <>
          <Dialog
            open={open}
            onClose={() => setOpen(false)}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
          >
            <DialogTitle id="alert-dialog-title">
              {"Are you still there?"}
            </DialogTitle>
            <DialogContent>
              <DialogContentText id="alert-dialog-description">
                It looks like you've been inactive for a while. Would you like
                to continue?
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpen(false)}>Continue</Button>
              <Button onClick={() => appSignOut()}>Logout</Button>
            </DialogActions>
          </Dialog>
          {appState === "active" ? (
            <AuthContext.Provider value={authContext}>
              <SecureApp>{props.children}</SecureApp>
            </AuthContext.Provider>
          ) : (
            <LoginView action={() => appSignIn()} />
          )}
        </>
      )}
    </>
  );
};

const useAppAuthContext = (): AuthContextType => useContext(AuthContext);

export { useAppAuthContext };

export default AppAuthProvider;
