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

import { AnimatePresence } from "motion/react";
import {
  Routes,
  Route,
  useLocation,
  Navigate,
  HashRouter,
} from "react-router-dom";

import {
  Home,
  VehicleManagement,
  ParkingSlotSelection,
  ParkingBookingSummary,
  ParkingBookingConfirmation,
  MyParkingBookings,
} from "@/pages";
import type { PageProps, User } from "@/types";
import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { CircularProgress } from "@mui/material";
import { getToken, requestDeviceSafeAreaInsets } from "./components/microapp-bridge";
import { ParkingWalletReturnResume } from "@/components/ParkingWalletReturnResume";
import { getDisplayNameFromJwt, getEmailFromJwt } from "@/utils/http";

function AnimatedRoutes({ user }: PageProps) {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="" element={<Home user={user} />} />
        <Route path="/services/vehicles" element={<VehicleManagement />} />
        <Route path="/services/parking" element={<ParkingSlotSelection />} />
        <Route
          path="/services/parking/summary"
          element={<ParkingBookingSummary />}
        />
        <Route
          path="/services/parking/confirmation"
          element={<ParkingBookingConfirmation />}
        />
        <Route
          path="/services/parking/bookings"
          element={<MyParkingBookings />}
        />

        {/* Catch-all route: Redirect unknown routes to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  const [user, setUser] = useState<User | undefined>(undefined);
  const [resumeReady, setResumeReady] = useState(false);
  const [parkingResumeGateActive, setParkingResumeGateActive] = useState(false);

  const handleInitialResumeComplete = useCallback(() => {
    setResumeReady(true);
  }, []);

  useLayoutEffect(() => {
    requestDeviceSafeAreaInsets((data) => {
      if (data?.insets) {
        const { top, right, bottom, left } = data.insets;
        const root = document.documentElement;
        root.style.setProperty("--safe-top", `${top}px`);
        root.style.setProperty("--safe-right", `${right}px`);
        root.style.setProperty("--safe-bottom", `${bottom}px`);
        root.style.setProperty("--safe-left", `${left}px`);
      }
    });
  }, []);

  useEffect(() => {
    const init = () => {
      getToken((token: string | undefined) => {
        if (token) {
          setUser({
            name: getDisplayNameFromJwt(token) ?? "",
            email: getEmailFromJwt(token) ?? "",
          });
        }
      });
    };

    init();
  }, []);

  return (
    <HashRouter>
      <ParkingWalletReturnResume
        onInitialResumeComplete={handleInitialResumeComplete}
        onParkingResumeGateActive={setParkingResumeGateActive}
      />
      {resumeReady ? (
        <AnimatedRoutes user={user} />
      ) : (
        <div className="h-screen bg-white grid place-items-center px-6 pt-[calc(var(--safe-top)+12px)] pb-[var(--safe-bottom)]">
          <div className="text-center max-w-[320px]">
            <div className="grid place-items-center mb-6">
              <CircularProgress size={40} sx={{ color: "#ff7300" }} />
            </div>
            {parkingResumeGateActive ? (
              <>
                <div className="text-[#1F2A44] font-semibold text-lg mb-2">
                  Confirming your booking
                </div>
                <div className="text-[#808080] font-medium text-[15px] leading-snug">
                  Please wait while we confirm your reservation.
                </div>
                <div className="text-[#808080] font-medium text-[13px] leading-snug mt-4">
                  Do not close or leave the app until this finishes.
                </div>
              </>
            ) : (
              <>
                <div className="text-[#1F2A44] font-semibold text-lg mb-2">
                  Loading
                </div>
                <div className="text-[#808080] font-medium text-[15px] leading-snug">
                  Please wait.
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </HashRouter>
  );
}

export default App;
