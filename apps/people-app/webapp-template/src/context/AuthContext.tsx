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
import { SecureApp, useAuthContext } from "@asgardeo/auth-react";
import { useIdleTimer } from "react-idle-timer";

import React, { useContext, useEffect, useState } from "react";

import PreLoader from "@component/common/PreLoader";
import { loadPrivileges, setUserAuthData } from "@slices/authSlice/auth";
import { RootState, useAppDispatch, useAppSelector } from "@slices/store";
import { getUserInfo } from "@slices/userSlice/user";
import { APIService } from "@utils/apiService";

import SessionWarningDialog from "../component/common/SessionWarningDialog";
import LoginScreen from "../component/ui/LoginScreen";
import { fetchAppConfig } from "../slices/configSlice/config";
import { State } from "../types/types";

type AuthContextType = {
  appSignIn: () => void;
  appSignOut: () => void;
};

const AuthContext = React.createContext<AuthContextType>({} as AuthContextType);

const timeout = 15 * 60 * 1000;
const promptBeforeIdle = 4_000;

const AppAuthProvider = (props: { children: React.ReactNode }) => {
  const [sessionWarningOpen, setSessionWarningOpen] = useState<boolean>(false);
  const [appState, setAppState] = useState<
    "loading" | "unauthenticated" | "authenticating" | "authenticated"
  >("loading");

  const dispatch = useAppDispatch();
  const auth = useAppSelector((state: RootState) => state.auth);

  const onPrompt = () => {
    appState === "authenticated" && setSessionWarningOpen(true);
  };

  const { activate } = useIdleTimer({
    onPrompt,
    timeout,
    promptBeforeIdle,
    throttle: 500,
  });

  const handleContinue = () => {
    setSessionWarningOpen(false);
    activate();
  };

  const {
    signIn,
    signOut,
    getDecodedIDToken,
    getBasicUserInfo,
    refreshAccessToken,
    isAuthenticated,
    getIDToken,
    trySignInSilently,
    state,
  } = useAuthContext();

  useEffect(() => {
    if (!localStorage.getItem("people_app-redirect-url")) {
      localStorage.setItem(
        "people_app-redirect-url",
        window.location.href.replace(window.location.origin, ""),
      );
    }
  }, []);

  const setupAuthenticatedUser = async () => {
    const [userInfo, idToken, decodedIdToken] = await Promise.all([
      getBasicUserInfo(),
      getIDToken(),
      getDecodedIDToken(),
    ]);

    dispatch(
      setUserAuthData({
        userInfo: userInfo,
        decodedIdToken: decodedIdToken,
      }),
    );

    new APIService(idToken, refreshToken);

    await dispatch(getUserInfo());
    await dispatch(loadPrivileges());
    await dispatch(fetchAppConfig());
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        setAppState("loading");

        if (state.isLoading) return;

        if (state.isAuthenticated) {
          setAppState("authenticating");
          await setupAuthenticatedUser();

          if (mounted) {
            setAppState("authenticated");
          }
        } else {
          const silentSignInSuccess = await trySignInSilently();

          if (mounted) {
            if (silentSignInSuccess) {
              setAppState("authenticating");
            } else {
              setAppState("unauthenticated");
            }
          }
        }
      } catch (err) {
        if (mounted) {
          auth.status = State.failed;
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
    };
  }, [state.isAuthenticated, state.isLoading]);

  const refreshToken = () => {
    return new Promise<{ idToken: string }>(async (resolve) => {
      const userIsAuthenticated = await isAuthenticated();
      if (userIsAuthenticated) {
        resolve({ idToken: await getIDToken() });
      } else {
        refreshAccessToken()
          .then(async () => {
            const idToken = await getIDToken();
            resolve({ idToken: idToken });
          })
          .catch(() => {
            appSignOut();
          });
      }
    });
  };

  const appSignOut = async () => {
    setAppState("loading");
    localStorage.setItem("people_app-state", "logout");
    await signOut();
    setAppState("unauthenticated");
  };

  const appSignIn = async () => {
    signIn();
    setAppState("loading");
    localStorage.setItem("people_app-state", "active");
  };

  const authContext: AuthContextType = {
    appSignIn: appSignIn,
    appSignOut: appSignOut,
  };

  const renderContent = () => {
    switch (appState) {
      case "loading":
        return <PreLoader isLoading message="Loading..." />;

      case "authenticating":
        return <PreLoader isLoading message="Authenticating..." />;

      case "authenticated":
        return <AuthContext.Provider value={authContext}>{props.children}</AuthContext.Provider>;

      case "unauthenticated":
        return (
          <AuthContext.Provider value={authContext}>
            <LoginScreen />
          </AuthContext.Provider>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <SessionWarningDialog
        open={sessionWarningOpen}
        handleContinue={handleContinue}
        appSignOut={appSignOut}
      />

      <SecureApp fallback={<PreLoader isLoading message="loading..." />}>
        {renderContent()}
      </SecureApp>
    </>
  );
};

const useAppAuthContext = (): AuthContextType => useContext(AuthContext);

export { useAppAuthContext };

export default AppAuthProvider;
