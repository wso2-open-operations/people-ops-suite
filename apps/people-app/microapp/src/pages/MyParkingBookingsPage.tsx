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

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { CircularProgress, IconButton } from "@mui/material";
import {
  CalendarMonthSharp,
  CancelSharp,
  CheckCircleSharp,
  HourglassTopSharp,
  LocationOnSharp,
  KeyboardBackspaceSharp,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { PageTransitionWrapper, BottomNav } from "@/components/shared";
import type { ParkingReservationDetails, ParkingReservationStatus } from "@/types";
import useHttp, { executeWithTokenHandling } from "@/utils/http";
import { serviceUrls } from "@/config/config";
import { getTodayBookingDate, formatBookingDate } from "@/utils/helpers/date";
import { formatCoins } from "@/utils/helpers/coins";

function MyParkingBookingsPage() {
  const navigate = useNavigate();
  const { handleRequest, handleRequestWithNewToken } = useHttp();
  const today = getTodayBookingDate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);
  const [reservations, setReservations] = useState<
    ParkingReservationDetails[]
  >([]);

  useEffect(() => {
    executeWithTokenHandling(
      handleRequest,
      handleRequestWithNewToken,
      serviceUrls.fetchParkingReservations(),
      "GET",
      null,
      (data) => {
        setReservations(data as ParkingReservationDetails[]);
        setLoading(false);
      },
      (err) => {
        setError(String(err ?? "Failed to load bookings"));
        setLoading(false);
      },
      (pending) => setLoading(pending),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeBookings = useMemo(() => {
    const confirmedToday = reservations.filter(
      (r) => r.bookingDate === today && r.status === ("CONFIRMED" as ParkingReservationStatus),
    );
    // If multiple exist, show the latest createdOn first.
    return confirmedToday.sort((a, b) =>
      String(b.createdOn).localeCompare(String(a.createdOn)),
    );
  }, [reservations, today]);

  const pendingBookings = useMemo(() => {
    return reservations
      .filter((r) => r.status === ("PENDING" as ParkingReservationStatus))
      .sort((a, b) =>
        String(b.createdOn).localeCompare(String(a.createdOn)),
      );
  }, [reservations]);

  const pastBookings = useMemo(() => {
    return reservations
      .filter(
        (r) =>
          r.bookingDate < today &&
          (r.status === ("CONFIRMED" as ParkingReservationStatus) ||
            r.status === ("EXPIRED" as ParkingReservationStatus)),
      )
      .sort((a, b) =>
        String(b.bookingDate).localeCompare(String(a.bookingDate)),
      );
  }, [reservations, today]);

  return (
    <PageTransitionWrapper type="secondary">
      <div className="h-screen bg-white relative flex flex-col">
        <header className="pt-6 px-5">
          <div className="flex items-center justify-between">
            <IconButton
              onClick={() => navigate("/")}
              aria-label="Back"
              size="small"
            >
              <KeyboardBackspaceSharp className="text-black" />
            </IconButton>
            <h2 className="flex-1 text-center text-[20px] font-bold text-[#1F2A44]">
              My Bookings
            </h2>
            <div className="w-[40px]" />
          </div>
        </header>

        <section className="px-4 mt-5 pb-28 overflow-y-auto flex-1 min-h-0">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3 text-red-800 text-sm font-medium">
              {error}
            </div>
          )}

          {loading ? (
            <div className="grid place-items-center py-10">
              <CircularProgress size={34} sx={{ color: "#ff7300" }} />
            </div>
          ) : (
            <>
              <div className="text-[13px] font-bold text-[#808080] mb-3">
                ACTIVE
              </div>

              {activeBookings.length === 0 ? (
                <div className="border border-[#E5E5E5] rounded-[1.2rem] px-4 py-6 text-center text-[#808080] font-medium">
                  No active bookings found.
                </div>
              ) : (
                <div className="grid gap-3">
                  {activeBookings.map((r) => (
                    <ActiveBookingCard key={r.id} reservation={r} />
                  ))}
                </div>
              )}

              {pendingBookings.length > 0 && (
                <>
                  <div className="text-[13px] font-bold text-[#808080] mt-3 mb-3">
                    PENDING
                  </div>
                  <div className="grid gap-3">
                    {pendingBookings.map((r) => (
                      <PendingBookingCard key={r.id} reservation={r} />
                    ))}
                  </div>
                </>
              )}

              <div className="text-[13px] font-bold text-[#808080] mt-6 mb-3">
                PAST
              </div>

              {pastBookings.length === 0 ? (
                <div className="border border-[#E5E5E5] rounded-[1.2rem] px-4 py-6 text-center text-[#808080] font-medium">
                  No past bookings yet.
                </div>
              ) : (
                <div className="grid gap-3">
                  {pastBookings.map((r) => (
                    <PastBookingCard key={r.id} reservation={r} />
                  ))}
                </div>
              )}
            </>
          )}
        </section>

        <BottomNav active="history" />
      </div>
    </PageTransitionWrapper>
  );
}

function ActiveBookingCard({
  reservation,
}: {
  reservation: ParkingReservationDetails;
}) {
  return (
    <div className="border border-[#ff7300] rounded-[1.2rem] px-4 py-4 bg-[#FFF2E8]">
      <div className="flex items-start justify-between">
        <div>
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#ff7300] text-white text-[12px] font-extrabold">
            CONFIRMED
          </div>
          <div className="mt-3 text-[34px] font-extrabold text-[#ff7300] leading-none">
            {reservation.slotId}
          </div>
          <div className="text-[#808080] font-medium mt-1 flex items-center gap-2">
            <LocationOnSharp style={{ fontSize: 18 }} />
            <span>{reservation.floorName}</span>
          </div>
        </div>

        <div className="text-right">
          <div className="text-[26px] font-extrabold text-[#ff7300]">
            {formatCoins(reservation.coinsAmount)}{" "}
            <span className="text-[#1F2A44] text-[16px]">O2C</span>
          </div>
          <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full bg-[#EAF9EF] text-[#2ECC71] font-extrabold text-[12px]">
            PAID
          </div>
        </div>
      </div>

      <div className="mt-4">
        <InfoBox
          label="DATE"
          value={formatBookingDate(reservation.bookingDate)}
          icon={<CalendarMonthSharp style={{ fontSize: 18, color: "#808080" }} />}
        />
      </div>
    </div>
  );
}

function PastBookingCard({
  reservation,
}: {
  reservation: ParkingReservationDetails;
}) {
  const isExpired = reservation.status === ("EXPIRED" as ParkingReservationStatus);
  return (
    <div className="border border-[#E5E5E5] rounded-[1rem] px-4 py-3 bg-white flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-full grid place-items-center ${
            isExpired ? "bg-[#FFF2F2] text-[#FF4D4D]" : "bg-[#EAF9EF] text-[#2ECC71]"
          }`}
        >
          {isExpired ? (
            <CancelSharp style={{ fontSize: 22 }} />
          ) : (
            <CheckCircleSharp style={{ fontSize: 22 }} />
          )}
        </div>
        <div>
          <div className="text-[16px] font-extrabold text-[#1F2A44]">
            {reservation.slotId}
          </div>
          <div className="text-[12.5px] text-[#808080] font-medium mt-0.5">
            {formatBookingDate(reservation.bookingDate)}
          </div>
        </div>
      </div>

      <div className="text-right">
        <div className="text-[16px] font-extrabold text-[#1F2A44]">
          {formatCoins(reservation.coinsAmount)}{" "}
          <span className="text-[12.5px] font-bold">O2C</span>
        </div>
      </div>
    </div>
  );
}

function PendingBookingCard({
  reservation,
}: {
  reservation: ParkingReservationDetails;
}) {
  return (
    <div className="border border-[#FFD18A] rounded-[1rem] px-4 py-3 bg-white flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full grid place-items-center bg-[#FFF6EA] text-[#F59E0B]">
          <HourglassTopSharp style={{ fontSize: 22 }} />
        </div>
        <div>
          <div className="text-[16px] font-extrabold text-[#1F2A44]">
            {reservation.slotId}
          </div>
          <div className="text-[12.5px] text-[#808080] font-medium mt-0.5">
            {formatBookingDate(reservation.bookingDate)}
          </div>
        </div>
      </div>

      <div className="text-right">
        <div className="text-[16px] font-extrabold text-[#1F2A44]">
          {formatCoins(reservation.coinsAmount)}{" "}
          <span className="text-[12.5px] font-bold">O2C</span>
        </div>
      </div>
    </div>
  );
}

function InfoBox({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: ReactNode;
}) {
  return (
    <div className="bg-white border border-[#E5E5E5] rounded-[0.8rem] py-3 px-3">
      <div className="flex items-center gap-2 text-[#808080] text-[12px] font-bold">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-[#1F2A44] font-extrabold text-[15px] mt-1">
        {value}
      </div>
    </div>
  );
}

export default MyParkingBookingsPage;

