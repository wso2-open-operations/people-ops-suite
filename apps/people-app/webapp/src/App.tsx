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

import { AnimatePresence } from "motion/react";
import {
  Routes,
  Route,
  useLocation,
  Navigate,
  HashRouter,
} from "react-router-dom";

import { Home, VehicleManagement } from "@/pages";
import type { PageProps, User } from "@/types";
import { getDisplayNameFromJWT, getEmailFromJWT } from "./utils/utils";
import { useEffect, useState } from "react";
import { getToken } from "./components/microapp-bridge";

function AnimatedRoutes({ user }: PageProps) {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="" element={<Home user={user} />} />
        <Route path="/services/vehicles" element={<VehicleManagement />} />

        {/* Catch-all route: Redirect unknown routes to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  const [user, setUser] = useState<User | undefined>(undefined);
  useEffect(() => {
    const init = () => {
      getToken((token: string | undefined) => {
        if (token) {
          setUser({
            name: getDisplayNameFromJWT(token) ?? "",
            email: getEmailFromJWT(token) ?? "",
          });
        }
      });
    };

    init();
  }, []);

  return (
    <HashRouter>
      <AnimatedRoutes user={user} />
    </HashRouter>
  );
}

export default App;
