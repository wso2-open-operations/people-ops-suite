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
import AppHandler from "@app/AppHandler";
import { AuthProvider } from "@asgardeo/auth-react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { SnackbarProvider } from "notistack";
import { Provider } from "react-redux";

import { useEffect, useMemo } from "react";

import { APP_NAME, AsgardeoConfig } from "@config/config";
import AppAuthProvider from "@context/AuthContext";
import { ColorModeContext } from "@context/ColorModeContext";
import { store } from "@slices/store";
import { themeSettings } from "@root/src/theme";

import { useColorMode } from "./hooks/useColorMode";

import "./index.css";

function App() {
  const { mode, toggleColorMode } = useColorMode();

  useEffect(() => {
    document.title = APP_NAME;
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", mode);
  }, [mode]);

  const theme = useMemo(() => createTheme(themeSettings(mode)), [mode]);

  return (
    <ColorModeContext.Provider value={{ mode, toggleColorMode }}>
      <SnackbarProvider maxSnack={3} preventDuplicate>
        <ThemeProvider theme={theme}>
          <Provider store={store}>
            <AuthProvider config={AsgardeoConfig}>
              <AppAuthProvider>
                <AppHandler />
              </AppAuthProvider>
            </AuthProvider>
          </Provider>
        </ThemeProvider>
      </SnackbarProvider>
    </ColorModeContext.Provider>
  );
}

export default App;
