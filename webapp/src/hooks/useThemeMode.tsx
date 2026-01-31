// Copyright (c) 2024, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import { useState } from "react";

const useThemeMode = () => {
  const processLocalThemeMode = (): "light" | "dark" => {
    const localMode: string | null = localStorage.getItem("internal-app-theme");

    if (localMode && ["light", "dark"].includes(localMode)) {
      return ["light", "dark"].indexOf(localMode) === 0 ? "light" : "dark";
    } else {
      localStorage.setItem("internal-app-theme", "light");
      return "light";
    }
  };

  const [mode, setMode] = useState<"light" | "dark">(processLocalThemeMode());

  const toggleColorMode = () => {
    localStorage.setItem(
      "internal-app-theme",
      mode === "light" ? "dark" : "light"
    );
    setMode((prevMode) => (prevMode === "light" ? "dark" : "light"));
  };

  return { mode, toggleColorMode };
};

export default useThemeMode;
