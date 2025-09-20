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
import Header from "@layout/header";
import Sidebar from "@layout/sidebar";
import { useSnackbar } from "notistack";
import { useSelector } from "react-redux";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

import { Suspense, useCallback, useEffect, useState } from "react";

import ConfirmationModalContextProvider from "@context/DialogContext";
import { selectRoles } from "@slices/authSlice/auth";
import { type RootState, useAppSelector } from "@slices/store";

import PreLoader from "../component/common/PreLoader";

export default function Layout() {
  const { enqueueSnackbar } = useSnackbar();
  const common = useAppSelector((state: RootState) => state.common);
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const roles = useSelector(selectRoles);

  const showSnackbar = useCallback(() => {
    if (common.timestamp != null) {
      enqueueSnackbar(common.message, {
        variant: common.type,
        preventDuplicate: true,
        anchorOrigin: { horizontal: "right", vertical: "bottom" },
      });
    }
  }, [common.message, common.type, common.timestamp, enqueueSnackbar]);

  useEffect(() => {
    showSnackbar();
  }, [showSnackbar]);

  useEffect(() => {
    const redirectUrl = localStorage.getItem("iapd-app-redirect-url");
    if (redirectUrl) {
      navigate(redirectUrl);
      localStorage.removeItem("iapd-app-redirect-url");
    }
  }, [navigate]);

  return (
    <ConfirmationModalContextProvider>
      {/* Full screen container */}
      <div className="flex flex-col h-screen w-screen bg-st-bg-main">
        <div className="h-12">
          <Header />
        </div>
        <div className="flex flex-1 overflow-hidden">
          <div className="w-fit h-full">
            <Sidebar
              roles={roles}
              currentPath={location.pathname}
              open={open}
              handleDrawer={() => setOpen(!open)}
            />
          </div>
          <div className="flex-1 h-full overflow-y-scroll text-st-100 p-m p-6">
            <Suspense fallback={<PreLoader isLoading message="Loading page data" />}>
              <Outlet />
            </Suspense>
          </div>
        </div>
      </div>
    </ConfirmationModalContextProvider>
  );
}
