// Copyright (c) 2024, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import { useMemo } from "react";

import { store } from "./slices/store";

import { asgardeoConfig } from "./config/config";
import AppHandler from "@app/AppHandler";
import { themeSettings } from "./theme";
import "./App.scss";

import { Provider as ReduxProvider } from "react-redux";
import AppAuthProvider from "@context/AuthContext";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { AuthProvider } from "@asgardeo/auth-react";
import { SnackbarProvider } from "notistack";
import { ColorModeContext } from "@context/ColorModeContext";
import useThemeMode from "@hooks/useThemeMode";

const App = () => {
  const { mode, toggleColorMode } = useThemeMode();
  const colorMode = useMemo(
    () => ({
      toggleColorMode,
    }),
    [toggleColorMode]
  );

  const theme = useMemo(() => createTheme(themeSettings(mode)), [mode]);

  return (
    <ColorModeContext.Provider value={colorMode}>
      <SnackbarProvider maxSnack={3} preventDuplicate>
        <ThemeProvider theme={theme}>
          <ReduxProvider store={store}>
            <AuthProvider config={asgardeoConfig}>
              <AppAuthProvider>
                <AppHandler />
              </AppAuthProvider>
            </AuthProvider>
          </ReduxProvider>
        </ThemeProvider>
      </SnackbarProvider>
    </ColorModeContext.Provider>
  );
}

export default App;
