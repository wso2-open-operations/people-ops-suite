import { useState } from "react";

export enum ThemeMode {
  Light = "light",
  Dark = "dark",
}

const useThemeMode = () => {
  const processLocalThemeMode = (): ThemeMode => {
    try {
      const savedTheme = localStorage.getItem("internal-app-theme");
      
      // 1. If user previously selected a theme, use that
      if (savedTheme === ThemeMode.Light || savedTheme === ThemeMode.Dark) {
        return savedTheme;
      }

      // 2. If no selection, check their System/OS settings (Best Practice!)
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const systemTheme = prefersDark ? ThemeMode.Dark : ThemeMode.Light;

      // 3. Save default for consistency
      localStorage.setItem("internal-app-theme", systemTheme);
      return systemTheme;
      
    } catch (err) {
      // 4. Fallback if localStorage is disabled (e.g. Incognito mode security settings)
      console.warn("Theme detection failed", err);
      return ThemeMode.Light;
    }
  };

  const [mode, setMode] = useState<ThemeMode>(processLocalThemeMode());

  const toggleColorMode = () => {
    const nextMode = mode === ThemeMode.Light ? ThemeMode.Dark : ThemeMode.Light;
    setMode(nextMode);
    localStorage.setItem("internal-app-theme", nextMode);
  };

  return { mode, toggleColorMode };
};

export default useThemeMode;