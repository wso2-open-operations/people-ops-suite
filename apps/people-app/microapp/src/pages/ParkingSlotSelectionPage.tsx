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
import { useNavigate } from "react-router-dom";

import {
  AccessTimeSharp,
  KeyboardBackspaceSharp,
  Search,
} from "@mui/icons-material";
import { CircularProgress, IconButton } from "@mui/material";

import { PageTransitionWrapper, BottomNav } from "@/components/shared";
import type {
  CarParkConfigResponse,
  ParkingFloor,
  ParkingSlot,
  VehicleResponse,
} from "@/types";
import useHttp, { executeWithTokenHandling, getEmailAsync } from "@/utils/http";
import { serviceUrls } from "@/config/config";
import {
  formatHour12WithMinutes,
  getTodayBookingDate,
  isWithinParkingReservationWindow,
} from "@/utils/helpers/date";
import { formatCoins } from "@/utils/helpers/coins";
import {
  clearParkingPaymentContextState,
  setParkingPaymentContextState,
} from "@/utils/parkingStorage";

function ParkingSlotSelectionPage() {
  const navigate = useNavigate();
  const todayBookingDate = getTodayBookingDate();

  const { handleRequest, handleRequestWithNewToken } = useHttp();

  const [floors, setFloors] = useState<ParkingFloor[]>([]);
  const [selectedFloorId, setSelectedFloorId] = useState<number | undefined>(
    undefined,
  );
  const [slots, setSlots] = useState<ParkingSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<ParkingSlot | undefined>(
    undefined,
  );

  const [search, setSearch] = useState("");
  const [loadingFloors, setLoadingFloors] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [busyPayment, setBusyPayment] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);
  const [vehiclesSetupRequired, setVehiclesSetupRequired] = useState(false);

  const [reservationWindowStartHour, setReservationWindowStartHour] =
    useState(5);
  const [reservationWindowEndHour, setReservationWindowEndHour] = useState(7);
  const [bookingWindowTick, setBookingWindowTick] = useState(0);

  const isBookingWindowActive = useMemo(() => {
    void bookingWindowTick;
    return isWithinParkingReservationWindow(
      reservationWindowStartHour,
      reservationWindowEndHour,
    );
  }, [
    bookingWindowTick,
    reservationWindowStartHour,
    reservationWindowEndHour,
  ]);

  const reservationWindowMessage = useMemo(
    () =>
      `Bookings must be made between ${formatHour12WithMinutes(reservationWindowStartHour)} and ${formatHour12WithMinutes(reservationWindowEndHour)} on the day of parking`,
    [reservationWindowStartHour, reservationWindowEndHour],
  );

  const fetchFloors = () => {
    setLoadingFloors(true);
    setError(undefined);
    executeWithTokenHandling(
      handleRequest,
      handleRequestWithNewToken,
      serviceUrls.fetchParkingFloors(),
      "GET",
      null,
      (data) => {
        const nextFloors = data as ParkingFloor[];
        setFloors(nextFloors);
        setSelectedFloorId(nextFloors[0]?.id);
      },
      (err) => {
        setError(String(err ?? "Failed to load floors"));
      },
      (loading) => setLoadingFloors(loading),
    );
  };

  const fetchSlots = (floorId: number) => {
    setLoadingSlots(true);
    setError(undefined);
    executeWithTokenHandling(
      handleRequest,
      handleRequestWithNewToken,
      serviceUrls.fetchParkingSlots(floorId, todayBookingDate),
      "GET",
      null,
      (data) => {
        setSlots(data as ParkingSlot[]);
        setSelectedSlot(undefined);
      },
      (err) => setError(String(err ?? "Failed to load slots")),
      (loading) => setLoadingSlots(loading),
    );
  };

  useEffect(() => {
    const bump = () => setBookingWindowTick((t) => t + 1);
    const id = window.setInterval(bump, 10_000);
    const onVisible = () => {
      if (document.visibilityState === "visible") bump();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  useEffect(() => {
    executeWithTokenHandling(
      handleRequest,
      handleRequestWithNewToken,
      serviceUrls.fetchCarParkConfigs(),
      "GET",
      null,
      (data) => {
        const c = data as CarParkConfigResponse;
        if (typeof c.reservationWindowStartHour === "number") {
          setReservationWindowStartHour(c.reservationWindowStartHour);
        }
        if (typeof c.reservationWindowEndHour === "number") {
          setReservationWindowEndHour(c.reservationWindowEndHour);
        }
      },
      () => {
        /* keep defaults */
      },
      () => {
        /* no loading UI for config */
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isBookingWindowActive) {
      setSelectedSlot(undefined);
    }
  }, [isBookingWindowActive]);

  useEffect(() => {
    clearParkingPaymentContextState();
    fetchFloors();
    let cancelled = false;

    const initVehicles = async () => {
      try {
        setVehiclesLoading(true);
        const email = await getEmailAsync();
        if (cancelled) return;

        executeWithTokenHandling(
          handleRequest,
          handleRequestWithNewToken,
          serviceUrls.fetchVehicles(email),
          "GET",
          null,
          (data) => {
            if (cancelled) return;
            const res = data as { vehicles?: VehicleResponse[] | null };
            const rawVehicles = res?.vehicles ?? null;
            const hasVehicles =
              Array.isArray(rawVehicles) && rawVehicles.length > 0;

            setVehiclesSetupRequired(!hasVehicles);
            setVehiclesLoading(false);
          },
          () => {
            if (cancelled) return;
            setVehiclesSetupRequired(true);
            setVehiclesLoading(false);
          },
          (loading) => {
            if (!cancelled) setVehiclesLoading(loading);
          },
        );
      } catch {
        if (cancelled) return;
        setVehiclesSetupRequired(true);
        setVehiclesLoading(false);
      }
    };

    void initVehicles();

    return () => {
      cancelled = true;
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedFloorId !== undefined) fetchSlots(selectedFloorId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFloorId]);

  const filteredSlots = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return slots;
    return slots.filter((s) => s.slotId.toLowerCase().includes(q));
  }, [search, slots]);

  const handleProceedToPayment = () => {
    if (
      !isBookingWindowActive ||
      !selectedSlot ||
      busyPayment ||
      vehiclesLoading ||
      vehiclesSetupRequired
    ) {
      if (!vehiclesLoading && vehiclesSetupRequired) {
        navigate("/services/vehicles");
      }
      return;
    }
    setBusyPayment(true);
    setError(undefined);

    // Stage 1 UI step: persist chosen slot and navigate to summary.
    setParkingPaymentContextState({
      slotId: selectedSlot.slotId,
      floorName: selectedSlot.floorName,
      coinsAmount: selectedSlot.coinsPerSlot,
      bookingDate: todayBookingDate,
    });

    // No wallet call here (stage 2 happens after reservation creation).
    navigate("/services/parking/summary");
  };

  return (
    <PageTransitionWrapper type="secondary">
      <div className="h-screen bg-white relative">
        <section className="px-4 pt-6">
          <IconButton onClick={() => navigate(-1)} aria-label="Back">
            <KeyboardBackspaceSharp className="text-black" />
          </IconButton>

          <h2 className="text-center text-lg font-semibold -mt-7">
            Select Parking Slot
          </h2>

          <div className="mt-6 relative">
            <div className="flex items-center gap-2 w-full bg-[#EFEFEF] px-3 py-2 rounded-lg">
              <Search style={{ color: "#787878", fontSize: 23 }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search slot ID..."
                className="flex-1 bg-transparent outline-none text-lg font-medium placeholder:text-[#8F8F8F]"
              />
            </div>
          </div>

          <div className="mt-4 border border-[#8FC4FF] bg-[#EAF3FF] rounded-lg px-3 py-2 flex items-start gap-2">
            <div className="mt-0.5">
              <div className="w-7 h-7 rounded-full bg-white grid place-items-center border border-[#8FC4FF]">
                <AccessTimeSharp style={{ color: "#0B64C0" }} />
              </div>
            </div>
            <div className="text-[14.5px] font-medium text-[#0B64C0]">
              {reservationWindowMessage}
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            {floors.map((f) => {
              const isActive = f.id === selectedFloorId;
              return (
                <button
                  key={f.id}
                  className={`px-4 py-2 rounded-full border text-[14.5px] font-semibold ${
                    isActive
                      ? "bg-black text-white border-black"
                      : "bg-white text-black border-[#E5E5E5]"
                  }`}
                  onClick={() => setSelectedFloorId(f.id)}
                  type="button"
                >
                  {f.name}
                </button>
              );
            })}
          </div>
        </section>

        <section className="px-4 mt-4 pb-28">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3 text-red-800 text-sm font-medium">
              {error}
            </div>
          )}

          {(loadingFloors || loadingSlots) && (
            <div className="grid place-items-center py-8">
              <CircularProgress size={30} sx={{ color: "#ff7300" }} />
            </div>
          )}

          {!loadingFloors && !loadingSlots && (
            <div className="grid grid-cols-3 gap-3">
              {filteredSlots.map((slot) => {
                const isSelected = slot.slotId === selectedSlot?.slotId;
                const isBooked = slot.isBooked;
                const selectionDisabled = isBooked || !isBookingWindowActive;
                const isViewOnly = !isBookingWindowActive && !isBooked;

                const borderColor = isSelected
                  ? "#ff7300"
                  : isBooked
                    ? "transparent"
                    : "#E5E5E5";
                const borderStyle: "solid" | "dashed" = isViewOnly ? "dashed" : "solid";
                const iconColor = isSelected
                  ? "#ff7300"
                  : isBooked
                    ? "#616161"
                    : "#BDBDBD";
                const bg = isBooked ? "#F2F2F2" : "white";

                return (
                  <button
                    key={slot.slotId}
                    type="button"
                    disabled={selectionDisabled}
                    onClick={() => {
                      if (!isBookingWindowActive || isBooked) return;
                      isSelected ? setSelectedSlot(undefined) : setSelectedSlot(slot);
                    }}
                    className={`rounded-[1.2rem] border p-3 min-h-[102px] transition-colors ${
                      isSelected ? "shadow-[0_0_0_2px_rgba(255,115,0,0.15)]" : ""
                    } ${isViewOnly ? "cursor-not-allowed" : ""}`}
                    style={{
                      borderColor,
                      borderStyle,
                      backgroundColor: bg,
                    }}
                  >
                    <div
                      className="w-[42px] h-[42px] rounded-full grid place-items-center mx-auto"
                      style={{
                        border: `3px solid ${
                          isSelected ? borderColor : isBooked ? "#9E9E9E" : borderColor
                        }`,
                        color: iconColor,
                        backgroundColor: isBooked ? "#EEEEEE" : "white",
                      }}
                    >
                      <span className="font-extrabold text-xl">P</span>
                    </div>

                    <div className="mt-3 text-center">
                      <div
                        className="font-semibold"
                        style={{
                          color: isBooked ? "#3D3D3D" : "#1F2A44",
                        }}
                      >
                        {slot.slotId}
                      </div>
                      <div
                        className="text-[11.5px] font-medium mt-0.5"
                        style={{
                          color: isBooked ? "#595959" : "#6B6B6B",
                        }}
                      >
                        {formatCoins(slot.coinsPerSlot)} O2C
                      </div>
                      {isBooked && (
                        <div className="text-[10.5px] font-bold mt-1 tracking-wide text-[#595959]">
                          Unavailable
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <div className="fixed left-4 right-4 bottom-[84px]">
          {selectedSlot && (
            <div className="bg-white rounded-[1rem] shadow-[0_10px_30px_rgba(0,0,0,0.08)] border border-[#E5E5E5] p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-[1rem] bg-[#FFE1C9] grid place-items-center">
                    <div
                      className="w-8 h-8 rounded-full border-2 border-[#ff7300] grid place-items-center"
                      style={{ borderColor: "#ff7300", color: "#ff7300" }}
                    >
                      <span className="font-extrabold text-lg">P</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-[14px] font-semibold">
                      {selectedSlot.slotId}
                    </div>
                    <div className="text-[12.5px] text-[#808080] font-medium">
                      {selectedSlot.floorName}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[12.5px] text-[#808080] font-medium">
                    TOTAL COST
                  </div>
                  <div className="text-[20px] font-extrabold text-[#1F2A44]">
                    {formatCoins(selectedSlot.coinsPerSlot)}{" "}
                    <span className="text-[#ff7300]">O2C</span>
                  </div>
                </div>
              </div>

              <div className="mt-3">
                <button
                  type="button"
                  className="w-full p-[0.85rem] text-lg font-semibold rounded-[0.7rem] bg-primary text-white disabled:bg-[#F4F4F4] disabled:text-[#A7A7A7]"
                  disabled={
                    busyPayment ||
                    selectedSlot.isBooked ||
                    vehiclesLoading ||
                    vehiclesSetupRequired
                  }
                  onClick={handleProceedToPayment}
                >
                  {busyPayment
                    ? "Redirecting..."
                    : vehiclesLoading
                      ? "Checking vehicles..."
                      : vehiclesSetupRequired
                        ? "Add a vehicle to continue"
                        : "Proceed to Payment"}
                </button>
                {vehiclesSetupRequired && !vehiclesLoading && (
                  <button
                    type="button"
                    className="mt-3 w-full p-[0.75rem] text-[14px] font-semibold rounded-[0.7rem] border border-[#E5E5E5] bg-white text-[#1F2A44]"
                    onClick={() => navigate("/services/vehicles")}
                  >
                    Manage Personal Vehicles
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <BottomNav active="home" />
      </div>
    </PageTransitionWrapper>
  );
}

export default ParkingSlotSelectionPage;

