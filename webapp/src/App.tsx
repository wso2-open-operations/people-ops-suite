
import { useMemo } from "react";
import { Provider as ReduxProvider } from "react-redux";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { SnackbarProvider } from "notistack";
import { AuthProvider } from "@asgardeo/auth-react";
import { store } from "./slices/store";
import { asgardeoConfig } from "./config/config";
import { themeSettings } from "./theme";
import AppHandler from "@app/AppHandler";
import AppAuthProvider from "@context/AuthContext";
import { ColorModeContext } from "@context/ColorModeContext";
import useThemeMode from "@hooks/useThemeMode"; 
import "./App.scss";

const App = () => {
  // 1. One line to handle all theme logic
  const { mode, toggleColorMode } = useThemeMode();

  // 2. Memoize the toggle function
  const colorMode = useMemo(() => ({ toggleColorMode }), [toggleColorMode]);

  // 3. Memoize the theme object
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
};

export default App;