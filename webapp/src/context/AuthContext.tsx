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
} from "@slices/authSlice";

import { useAppDispatch } from "../slices/store";
import LoginView from "@components/ui/LoginView";
import PreLoader from "@components/common/PreLoader";
import { getUserInfo } from "@slices/userSlice";

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

  const {
    signOut,
    getDecodedIDToken,
    getAccessToken,
    getBasicUserInfo,
    revokeAccessToken,
    refreshAccessToken,
    getIDToken,
    isAuthenticated,
    state,
  } = useAuthContext();

  // --- FIX 1: Ensure Refresh Token returns 'idToken' ---
  const refreshToken = async (): Promise<{ idToken: string }> => { 
    if (state.isAuthenticated) {
      const token = await getIDToken();
      return { idToken: token }; 
    }

    try {
      await refreshAccessToken();
      const token = await getIDToken();
      return { idToken: token }; 
    } catch (error) {
      console.error("Token refresh failed: ", error);
      await appSignOut();
      throw error;
    }
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
          getIDToken(),
          getDecodedIDToken(),
        ]).then(async ([userInfo, idToken, decodedIdToken]) => {
          
          dispatch(
            setUserAuthData({
              userInfo: userInfo,
              accessToken: idToken, 
              decodedIdToken: decodedIdToken,
            })
          );
          
          new ApiService(idToken, refreshToken, dispatch);

          await dispatch(getUserInfo()).then(() => {
             dispatch(loadPrivileges());
          });
        });
      }
    }
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
