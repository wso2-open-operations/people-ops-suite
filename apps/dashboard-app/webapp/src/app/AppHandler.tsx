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
import { Navigate, RouterProvider, createBrowserRouter } from "react-router-dom";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";

import ErrorHandler from "@component/common/ErrorHandler";
import PreLoader from "@component/common/PreLoader";
import { CommonMessage } from "@config/messages";
import Layout from "@layout/Layout";
import NotFoundPage from "@layout/pages/404";
import MaintenancePage from "@layout/pages/Maintenance";
import { RootState, useAppSelector } from "@slices/store";
import { isIncludedRole } from "@utils/utils";

import { ROUTE_PATHS, routes } from "../route";

const AuthorizedRoute = ({
  allowRoles,
  element,
}: {
  allowRoles: string[];
  element: ReactNode;
}) => {
  const auth = useAppSelector((state: RootState) => state.auth);

  if (!isIncludedRole(auth.roles, allowRoles)) {
    return <Navigate to={ROUTE_PATHS.home} replace />;
  }

  return <>{element}</>;
};

const router = createBrowserRouter([
  {
    path: ROUTE_PATHS.home,
    element: <Layout />,
    errorElement: <NotFoundPage />,
    children: routes.map((route) => ({
      ...route,
      element: route.element ? (
        <AuthorizedRoute allowRoles={route.allowRoles} element={route.element} />
      ) : undefined,
    })),
  },
]);

const AppHandler = () => {
  const [appState, setAppState] = useState<"loading" | "success" | "failed" | "maintenance">(
    "loading",
  );

  const auth = useAppSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (auth.mode === "maintenance") {
      setAppState("maintenance");
    } else if (auth.status === "loading") {
      setAppState("loading");
    } else if (auth.status === "success") {
      setAppState("success");
    } else if (auth.status === "failed") {
      setAppState("failed");
    }
  }, [auth.status, auth.mode]);

  const renderApp = () => {
    switch (appState) {
      case "loading":
        return <PreLoader isLoading={true} message={CommonMessage.loading.appReady} />;

      case "failed":
        return <ErrorHandler message={auth.statusMessage} />;

      case "success":
        return <RouterProvider router={router} />;

      case "maintenance":
        return <MaintenancePage />;
    }
  };

  return <>{renderApp()}</>;
};

export default AppHandler;
