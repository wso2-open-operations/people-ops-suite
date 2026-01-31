// Copyright (c) 2024, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import Layout from "../layout/Layout";
import Error from "../layout/pages/404";
import PreLoader from "@components/common/PreLoader";
import { getActiveRoutesV2, routes } from "../route";
import ErrorHandler from "@components/common/ErrorHandler";
import { RootState, useAppSelector } from "../slices/store";
import { RouterProvider, createBrowserRouter } from "react-router-dom";

import { useEffect, useMemo, useState } from "react";

const AppHandler = () => {
  const [appState, setAppState] = useState<"loading" | "success" | "failed" | "maintenance">(
    "loading",
  );

  const auth = useAppSelector((state: RootState) => state.auth);

  const router = useMemo(
    () =>
      createBrowserRouter([
        {
          path: "/",
          element: <Layout />,
          errorElement: <Error />,
          children: getActiveRoutesV2(routes, auth.roles),
        },
      ]),
    [auth.roles],
  );

  useEffect(() => {
    if (auth.status === "loading") {
      setAppState("loading");
    } else if (auth.status === "succeeded") {
      setAppState("success");
    } else if (auth.status === "failed") {
      setAppState("failed");
    }
  }, [auth.status]);

  const renderApp = () => {
    switch (appState) {
      case "loading":
        return <PreLoader isLoading={true} message={"We are getting things ready ..."} />;

      case "failed":
        return <ErrorHandler message={auth.statusMessage} />;

      case "success":
        return <RouterProvider router={router} />;
    }
  };

  return <>{renderApp()}</>;
};

export default AppHandler;