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

import { useAuthContext } from "@asgardeo/auth-react";
import { useIdleTimer } from "react-idle-timer";

import React, { useCallback, useContext, useEffect, useState } from "react";

import PreLoader from "@component/common/PreLoader";
import SessionWarningDialog from "@component/common/SessionWarningDialog";
import { setUserAuthData } from "@slices/authSlice/auth";
import { useAppDispatch } from "@slices/store";

type AuthContextType = {
  appSignIn: () => void;
  appSignOut: () => void;
  // False for visitors browsing without an account.
  isSignedIn: boolean;
  // The access token for a signed-in user, or an empty string for a guest.
  getToken: () => Promise<string>;
};

const AuthContext = React.createContext<AuthContextType>({} as AuthContextType);

const timeout = 15 * 60 * 1000;
// How long the "Are you still there?" warning stays open before the user is signed out.
const promptBeforeIdle = 60_000;

// The longest a sign-in lasts, however active the user is; choosing to continue does not extend it.
const MAX_SESSION_MS = 60 * 60 * 1000;

const AppAuthProvider = (props: { children: React.ReactNode }) => {
  const { signIn, signOut, state, getBasicUserInfo, getDecodedIDToken, getAccessToken } = useAuthContext();
  const isAuthenticated = state.isAuthenticated;
  const isLoading = state.isLoading;

  const [sessionWarningOpen, setSessionWarningOpen] = useState<boolean>(false);
  const [userLoaded, setUserLoaded] = useState<boolean>(false);
  const [sessionEndsAt, setSessionEndsAt] = useState<number | null>(null);

  const dispatch = useAppDispatch();

  const onPrompt = () => {
    if (isAuthenticated) setSessionWarningOpen(true);
  };

  // Signs the user out when the timeout elapses, so an unattended browser does not stay signed in.
  const onIdle = () => {
    if (!isAuthenticated) return;
    setSessionWarningOpen(false);
    setUserLoaded(false);
    signOut();
  };

  const { activate } = useIdleTimer({
    onPrompt,
    onIdle,
    timeout,
    promptBeforeIdle,
    throttle: 500,
    // Activity in any open tab counts, so a tab left in the background does not sign the user out of the others.
    crossTab: true,
  });

  // Signs the user out when the access token's lifetime ends, even if they kept the session alive.
  useEffect(() => {
    if (!isAuthenticated || sessionEndsAt === null) return;
    const timer = setTimeout(onIdle, Math.max(sessionEndsAt - Date.now(), 0));
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, sessionEndsAt]);

  const handleContinue = () => {
    setSessionWarningOpen(false);
    activate();
  };

  useEffect(() => {
    if (userLoaded) return;
    if (!isAuthenticated) return;

    const loadUser = async () => {
      try {
        const [userInfo, idToken] = await Promise.all([getBasicUserInfo(), getDecodedIDToken()]);
        dispatch(setUserAuthData({ userInfo, decodedIdToken: idToken }));
        const tokenExpiry = typeof idToken?.exp === "number" ? idToken.exp * 1000 : Infinity;
        setSessionEndsAt(Math.min(tokenExpiry, Date.now() + MAX_SESSION_MS));
        setUserLoaded(true);
      } catch (err) {
        console.error("Auth loadUser() failed — signing out:", err);
        signOut();
      }
    };

    loadUser();
  }, [isAuthenticated, userLoaded, getBasicUserInfo, getDecodedIDToken, dispatch, signOut]);

  const appSignIn = useCallback(() => {
    signIn();
  }, [signIn]);

  const appSignOut = useCallback(() => {
    setUserLoaded(false);
    signOut();
  }, [signOut]);

  // Guests browse and apply without a token; calls made on their behalf send no credentials.
  const getToken = useCallback(async () => {
    if (!isAuthenticated) return "";
    try {
      return await getAccessToken();
    } catch {
      return "";
    }
  }, [isAuthenticated, getAccessToken]);

  const authContext: AuthContextType = { appSignIn, appSignOut, isSignedIn: isAuthenticated, getToken };

  if (isLoading) {
    return <PreLoader isLoading message="Setting up your Candidate Passport ..." />;
  }

  return (
    <AuthContext.Provider value={authContext}>
      <SessionWarningDialog
        open={sessionWarningOpen}
        handleContinue={handleContinue}
        appSignOut={appSignOut}
      />
      {isAuthenticated && !userLoaded ? (
        <PreLoader isLoading message="Setting up your Candidate Passport ..." />
      ) : (
        props.children
      )}
    </AuthContext.Provider>
  );
};

const useAppAuthContext = (): AuthContextType => useContext(AuthContext);

export { useAppAuthContext };
export default AppAuthProvider;
