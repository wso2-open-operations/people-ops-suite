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
import { SecureApp, useAuthContext } from "@asgardeo/auth-react";
import { useIdleTimer } from "react-idle-timer";

import { useCallback, useEffect, useRef, useState } from "react";

import PreLoader from "@component/common/PreLoader";
import SessionWarningDialog from "@component/common/SessionWarningDialog";
import LoginScreen from "@component/ui/LoginScreen";
import {
  SESSION_IDLE_THROTTLE_MS,
  SESSION_PROMPT_BEFORE_IDLE_MS,
  SESSION_TIMEOUT_MS,
} from "@config/auth";
import { redirectUrl } from "@config/constant";
import { CommonMessage } from "@config/messages";
import { loadPrivileges, setAuthError, setUserAuthData } from "@slices/authSlice/auth";
import { useAppDispatch } from "@slices/store";
import { getUserInfo } from "@slices/userSlice/user";
import { initializeAPIService } from "@utils/apiService";

import { AuthContext, AuthContextType } from "./authState";

enum AppState {
  Loading = "loading",
  Unauthenticated = "unauthenticated",
  Authenticating = "authenticating",
  Authenticated = "authenticated",
}

const AppAuthProvider = (props: { children: React.ReactNode }) => {
  const [sessionWarningOpen, setSessionWarningOpen] = useState<boolean>(false);
  const [appState, setAppState] = useState<AppState>(AppState.Loading);

  const dispatch = useAppDispatch();

  const appStateRef = useRef(appState);

  useEffect(() => {
    appStateRef.current = appState;
  }, [appState]);

  const onPrompt = () => {
    if (appStateRef.current === AppState.Authenticated) {
      setSessionWarningOpen(true);
    }
  };

  const { activate } = useIdleTimer({
    onPrompt,
    timeout: SESSION_TIMEOUT_MS,
    promptBeforeIdle: SESSION_PROMPT_BEFORE_IDLE_MS,
    throttle: SESSION_IDLE_THROTTLE_MS,
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
    getIDToken,
    trySignInSilently,
    state,
  } = useAuthContext();
  const isAuthenticatedRef = useRef(state.isAuthenticated);

  useEffect(() => {
    isAuthenticatedRef.current = state.isAuthenticated;
  }, [state.isAuthenticated]);

  useEffect(() => {
    if (!localStorage.getItem(redirectUrl)) {
      localStorage.setItem(redirectUrl, window.location.href.replace(window.location.origin, ""));
    }
  }, []);

  const refreshToken = useCallback(async (): Promise<{ idToken: string }> => {
    try {
      await refreshAccessToken();
      const idToken = await getIDToken();
      return { idToken };
    } catch (error) {
      setAppState(AppState.Loading);
      await signOut();
      setAppState(AppState.Unauthenticated);
      throw error;
    }
  }, [getIDToken, refreshAccessToken, signOut]);

  const setupAuthenticatedUser = useCallback(async () => {
    const [userInfo, idToken, decodedIdToken] = await Promise.all([
      getBasicUserInfo(),
      getIDToken(),
      getDecodedIDToken(),
    ]);

    dispatch(
      setUserAuthData({
        userInfo,
        decodedIdToken,
      }),
    );

    initializeAPIService({ idToken, callback: refreshToken });

    try {
      await dispatch(getUserInfo()).unwrap();
      await dispatch(loadPrivileges()).unwrap();
    } catch (error) {
      console.error("Failed to load user info or privileges:", error);
    }
  }, [dispatch, getBasicUserInfo, getDecodedIDToken, getIDToken, refreshToken]);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        setAppState(AppState.Loading);

        if (state.isLoading) return;

        if (state.isAuthenticated) {
          setAppState(AppState.Authenticating);
          await setupAuthenticatedUser();

          if (mounted) setAppState(AppState.Authenticated);
        } else {
          const silentSignInSuccess = await trySignInSilently();

          if (mounted) {
            if (silentSignInSuccess) {
              setAppState(AppState.Authenticating);
              await setupAuthenticatedUser();
              if (mounted) setAppState(AppState.Authenticated);
            } else {
              setAppState(AppState.Unauthenticated);
            }
          }
        }
      } catch (err) {
        if (mounted) {
          console.error("Auth initialization failed", err);
          dispatch(setAuthError());
          setAppState(AppState.Unauthenticated);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
    };
  }, [dispatch, setupAuthenticatedUser, state.isAuthenticated, state.isLoading, trySignInSilently]);

  const appSignOut = async () => {
    setAppState(AppState.Loading);
    await signOut();
    setAppState(AppState.Unauthenticated);
  };

  const appSignIn = async () => {
    setAppState(AppState.Loading);
    await signIn();
  };

  const authContext: AuthContextType = {
    appSignIn: appSignIn,
    appSignOut: appSignOut,
  };

  const renderContent = () => {
    switch (appState) {
      case AppState.Loading:
        return <PreLoader isLoading message={CommonMessage.loading.appInit} />;

      case AppState.Authenticating:
        return <PreLoader isLoading message={CommonMessage.loading.userInfo} />;

      case AppState.Authenticated:
        return <AuthContext.Provider value={authContext}>{props.children}</AuthContext.Provider>;

      case AppState.Unauthenticated:
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

      <SecureApp fallback={<PreLoader isLoading message={CommonMessage.loading.appReady} />}>
        {renderContent()}
      </SecureApp>
    </>
  );
};

export default AppAuthProvider;
