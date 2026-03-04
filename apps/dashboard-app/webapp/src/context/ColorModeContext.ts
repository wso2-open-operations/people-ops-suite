import { createContext } from "react";

import { ThemeMode } from "@utils/types";

export const ColorModeContext = createContext({
  mode: ThemeMode.Light,
  toggleColorMode: () => {},
});