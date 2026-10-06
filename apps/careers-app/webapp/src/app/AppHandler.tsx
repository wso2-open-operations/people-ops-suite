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

import { useMemo } from "react";

import AppShell from "@component/common/AppShell";
import NotFoundPage from "@component/common/NotFoundPage";
import { View } from "@view/index";

const AppHandler = () => {
  const router = useMemo(
    () =>
      createBrowserRouter([
        {
          element: <AppShell />,
          errorElement: <NotFoundPage />,
          children: [
            { path: "/", element: <Navigate to="/jobs" replace /> },
            { path: "/jobs", element: <View.jobs /> },
            { path: "/jobs/:id", element: <View.jobDetail /> },
          ],
        },
        { path: "*", element: <NotFoundPage /> },
      ]),
    [],
  );

  return <RouterProvider router={router} />;
};

export default AppHandler;
