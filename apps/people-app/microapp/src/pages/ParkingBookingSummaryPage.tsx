import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  CalendarMonthSharp,
  DirectionsCarSharp,
  KeyboardBackspaceSharp,
  WarningAmberSharp,
} from "@mui/icons-material";
import { CircularProgress, IconButton, MenuItem, Select } from "@mui/material";

import { PageTransitionWrapper } from "@/components/shared";
import useHttp, { executeWithTokenHandling, getEmailAsync } from "@/utils/http";
import { serviceUrls } from "@/config/config";
import type {
  CreateParkingReservationResponse,
  ParkingReservationDetails,
  VehicleResponse,
} from "@/types";
import { getTodayBookingDate, formatBookingDate } from "@/utils/helpers/date";
import { formatCoins } from "@/utils/helpers/coins";
import {
  clearPaymentStage2State,
  getPaymentStage2State,
  setPaymentStage2State,
  setConfirmationState,
} from "@/utils/parkingStorage";
import { Logger } from "@/utils/logger";
import {
  getLocalDataAsync,
  requestOpenMicroApp,
  saveLocalDataAsync,
} from "@/components/microapp-bridge";

type VehicleOption = {
  vehicleId: number;
  vehicleRegistrationNumber: string;
};

function ParkingBookingSummaryPage() {
  const navigate = useNavigate();
  const { handleRequest, handleRequestWithNewToken } = useHttp();

  const stage2 = getPaymentStage2State();
  const todayBookingDate = getTodayBookingDate();

  const bookingDate = stage2?.bookingDate ?? todayBookingDate;
  const expectedCoins = stage2?.coinsAmount ?? 0;

  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [vehicleId, setVehicleId] = useState<number | undefined>(undefined);

  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [busyConfirm, setBusyConfirm] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [showPaymentFailureModal, setShowPaymentFailureModal] = useState(false);

  useEffect(() => {
    if (!stage2) return;

    let cancelled = false;

    setLoadingVehicles(true);
    setError(undefined);

    const init = async () => {
      try {
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
            const res = data as { vehicles?: VehicleResponse[] };
            const options: VehicleOption[] = (res.vehicles ?? [])
              .filter((v) => String(v.vehicleType) === "CAR")
              .map((v) => ({
                vehicleId: v.vehicleId as number,
                vehicleRegistrationNumber: String(v.vehicleRegistrationNumber),
              }));

            setVehicles(options);
            setVehicleId(options[0]?.vehicleId);
            setLoadingVehicles(false);
          },
          (err) => {
            if (cancelled) return;
            setError(String(err ?? "Failed to load vehicles"));
            setShowPaymentFailureModal(false);
            setVehicles([]);
            setVehicleId(undefined);
            setLoadingVehicles(false);
          },
          (loading) => {
            if (!cancelled) setLoadingVehicles(loading);
          },
        );
      } catch (e) {
        if (cancelled) return;
        setError(String(e ?? "Failed to load vehicles"));
        setVehicles([]);
        setVehicleId(undefined);
        setLoadingVehicles(false);
      }
    };

    init();

    return () => {
      cancelled = true;
    };
  }, [stage2, handleRequest, handleRequestWithNewToken]);

  const createReservation = () => {
    if (!stage2 || !vehicleId) return Promise.reject("Vehicle not selected");

    const body = {
      slotId: stage2.slotId,
      bookingDate,
      vehicleId,
    };

    return new Promise<CreateParkingReservationResponse>((resolve, reject) => {
      executeWithTokenHandling(
        handleRequest,
        handleRequestWithNewToken,
        serviceUrls.createParkingReservation(),
        "POST",
        body,
        (data) => resolve(data as CreateParkingReservationResponse),
        (err) => reject(err ?? "Failed to create reservation"),
        () => {},
      );
    });
  };

  const confirmReservation = (reservationId: number, txHash: string) => {
    const body = { reservationId, transactionHash: txHash };
    return new Promise<ParkingReservationDetails>((resolve, reject) => {
      executeWithTokenHandling(
        handleRequest,
        handleRequestWithNewToken,
        serviceUrls.confirmParkingReservation(),
        "POST",
        body,
        (data) => resolve(data as ParkingReservationDetails),
        (err) => reject(err ?? "Failed to confirm reservation"),
        () => {},
      );
    });
  };

  const PEOPLE_WALLET_PAYMENT_STATUS_KEY = "people_parking_payment_status";
  const PEOPLE_WALLET_PAYMENT_TX_HASH_KEY = "people_parking_payment_tx_hash";

  const waitForWalletPaymentResult = async (): Promise<{
    status: "SUCCESS" | "FAILED";
    txHash?: string;
    error?: string;
  }> => {
    const TIMEOUT_MS = 45_000;
    const INTERVAL_MS = 700;
    const startedAt = Date.now();

    while (Date.now() - startedAt < TIMEOUT_MS) {
      try {
        const status = await getLocalDataAsync(
          PEOPLE_WALLET_PAYMENT_STATUS_KEY,
        );
        if (status) {
          const parsedStatus =
            status === "SUCCESS" || status === "FAILED"
              ? status
              : ("FAILED" as const);

          if (parsedStatus === "SUCCESS") {
            const txHash = await getLocalDataAsync(
              PEOPLE_WALLET_PAYMENT_TX_HASH_KEY,
            );
            if (txHash) {
              return { status: "SUCCESS", txHash: String(txHash) };
            }
            // Status may be written slightly before txHash; keep polling.
            continue;
          }

          const error = await getLocalDataAsync("people_parking_payment_error");
          return {
            status: "FAILED",
            error: error ? String(error) : undefined,
          };
        }
      } catch (e) {
        // Ignore polling errors; keep waiting.
      }

      await new Promise((r) => setTimeout(r, INTERVAL_MS));
    }

    throw new Error("Payment timed out");
  };

  const handleConfirmAndPay = async () => {
    if (!stage2 || !vehicleId) return;
    if (busyConfirm) return;

    setBusyConfirm(true);
    setError(undefined);
    setShowPaymentFailureModal(false);

    try {
      // Stage 1: create a pending reservation in backend.
      const reservation = await createReservation();

      setPaymentStage2State({
        ...stage2,
        reservationId: reservation.reservationId,
        coinsAmount: reservation.coinsAmount,
      });

      // Stage 2: ask Wallet to transfer coins, then confirm reservation with txHash.
      const carParkConfig = await new Promise<{ publicWalletAddress: string }>(
        (resolve, reject) => {
          executeWithTokenHandling(
            handleRequest,
            handleRequestWithNewToken,
            serviceUrls.fetchCarParkConfigs(),
            "GET",
            null,
            (data) => resolve(data as { publicWalletAddress: string }),
            (err) => reject(err),
            () => {},
          );
        },
      );

      // Reset previous payment result
      await saveLocalDataAsync(PEOPLE_WALLET_PAYMENT_STATUS_KEY, "");
      await saveLocalDataAsync(PEOPLE_WALLET_PAYMENT_TX_HASH_KEY, "");
      await saveLocalDataAsync("people_parking_payment_error", "");

      // Stage 2 (PR #17-style): open wallet micro-app and pass launch context.
      // Wallet will use launchData to set the "send" form and navigate to confirm.
      requestOpenMicroApp("com.wso2.superapp.microapp.wallet", {
        initialRoute: "#/send",
        wallet_address: carParkConfig.publicWalletAddress,
        coin_amount: reservation.coinsAmount,
      });

      const paymentResult = await waitForWalletPaymentResult();

      if (paymentResult.status !== "SUCCESS" || !paymentResult.txHash) {
        throw new Error(
          paymentResult.error ??
            "Payment unsuccessful. Please try again.",
        );
      }

      const confirmed = await confirmReservation(
        reservation.reservationId,
        paymentResult.txHash,
      );

      setConfirmationState(confirmed);
      clearPaymentStage2State();
      navigate("/services/parking/confirmation", {
        state: { reservationId: confirmed.id },
      });
    } catch (e) {
      const msg = String(e ?? "Payment failed");
      setError(msg);
      setShowPaymentFailureModal(true);
      Logger.error("Parking confirm error:", e);
    } finally {
      setBusyConfirm(false);
    }
  };

  if (!stage2) {
    return (
      <PageTransitionWrapper type="secondary">
        <div className="h-screen bg-white grid place-items-center px-6">
          <div className="text-center">
            <div className="text-[#1F2A44] font-semibold text-lg mb-2">
              Payment details not found
            </div>
            <div className="text-[#808080] font-medium mb-6">
              Please go back and start again.
            </div>
            <button
              type="button"
              className="px-6 py-3 bg-primary text-white rounded-lg font-semibold"
              onClick={() => navigate("/services/parking")}
            >
              Back to slot selection
            </button>
          </div>
        </div>
      </PageTransitionWrapper>
    );
  }

  const topContent = (
    <section className="px-4 mt-2 pb-6">
      <div className="bg-white border border-[#E5E5E5] rounded-[1.2rem] px-4 pt-5 pb-3 shadow-sm">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 rounded-[1rem] bg-[#FFE1C9] grid place-items-center">
            <div
              className="w-10 h-10 rounded-full border-2 border-[#ff7300] grid place-items-center"
              style={{ borderColor: "#ff7300", color: "#ff7300" }}
            >
              <span className="font-extrabold text-2xl">P</span>
            </div>
          </div>

          <div className="text-[12.5px] mt-3 font-semibold text-[#808080] tracking-widest">
            PARKING SLOT
          </div>
          <div className="text-[34px] font-extrabold text-[#1F2A44] leading-none mt-1">
            {stage2.slotId}
          </div>
          <div className="mt-2 px-3 py-1 rounded-full bg-[#F4F4F4] text-[13px] font-semibold text-[#1F2A44]">
            {stage2.floorName}
          </div>
        </div>

        <div className="mt-6 border-t border-dashed border-[#E5E5E5] pt-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#EAF3FF] grid place-items-center">
              <DirectionsCarSharp style={{ color: "#0B64C0" }} />
            </div>
            <div className="text-[13px] font-bold text-[#808080]">SELECT VEHICLE</div>
          </div>

          <div className="mt-3">
            {loadingVehicles ? (
              <div className="grid place-items-center py-6">
                <CircularProgress size={26} sx={{ color: "#ff7300" }} />
              </div>
            ) : vehicles.length === 0 ? (
              <div className="text-sm font-medium text-[#808080] py-3">
                No active vehicles found.
              </div>
            ) : (
              <Select
                value={vehicleId ?? ""}
                onChange={(e) => setVehicleId(Number(e.target.value))}
                displayEmpty
                fullWidth
                sx={{
                  fontWeight: 700,
                  backgroundColor: "#F4F4F4",
                  borderRadius: "12px",
                  height: 48,
                }}
              >
                {vehicles.map((v) => (
                  <MenuItem key={v.vehicleId} value={v.vehicleId}>
                    {v.vehicleRegistrationNumber}
                  </MenuItem>
                ))}
              </Select>
            )}
          </div>
        </div>

            <div className="mt-6 border-t border-[#E5E5E5] pt-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#EAF3FF] grid place-items-center">
                  <CalendarMonthSharp style={{ color: "#0B64C0" }} />
                </div>
                <div className="text-[13px] font-bold text-[#808080]">DATE</div>
              </div>

              <div className="mt-3 text-[16px] font-bold text-[#1F2A44]">
                {formatBookingDate(bookingDate)}
              </div>
            </div>

        <div className="mt-5 border-t border-dashed border-[#E5E5E5] pt-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-[#808080]">Amount to Pay</div>
            <div className="text-[26px] font-extrabold text-[#ff7300]">
              {formatCoins(expectedCoins)}{" "}
              <span className="text-[#1F2A44] text-[18px]">O2C</span>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-start gap-2 bg-[#FFF2F2] border border-[#FFD9D9] rounded-lg px-3 py-2">
            <WarningAmberSharp style={{ color: "#FF4D4D", marginTop: 2 }} />
            <div className="text-[12.8px] font-medium text-[#7A1F1F]">
              This booking is non-refundable once payment is confirmed.
            </div>
          </div>
        </div>

        {showPaymentFailureModal && (
          <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px] z-20 grid place-items-center px-5">
            <div className="w-full max-w-[360px] bg-white border border-red-200 rounded-[1.2rem] p-4">
              <div className="text-[#1F2A44] font-extrabold text-[16px]">
                Payment unsuccessful
              </div>
              <div className="text-[#808080] text-sm mt-2">
                {error ?? "Please try again."}
              </div>
              <button
                type="button"
                className="mt-4 w-full p-[0.9rem] text-lg font-semibold rounded-[0.7rem] bg-primary text-white"
                onClick={() => {
                  setShowPaymentFailureModal(false);
                  setError(undefined);
                }}
              >
                Close
              </button>
            </div>
          </div>
        )}

        <div className="mt-5">
          <button
            type="button"
            className="w-full p-[0.9rem] text-lg font-semibold rounded-[0.7rem] bg-primary text-white disabled:bg-[#F4F4F4] disabled:text-[#A7A7A7]"
            disabled={busyConfirm || !vehicleId}
            onClick={handleConfirmAndPay}
          >
            {busyConfirm ? "Confirming..." : "Confirm and Pay ->"}
          </button>
        </div>
      </div>
    </section>
  );

  return (
    <PageTransitionWrapper type="secondary">
      <div className="h-screen bg-white relative overflow-hidden">
        <section className="px-4 pt-6">
          <IconButton onClick={() => navigate(-1)} aria-label="Back">
            <KeyboardBackspaceSharp className="text-black" />
          </IconButton>
        </section>

        {topContent}

        {busyConfirm && (
          <div className="absolute inset-0 bg-white/70 grid place-items-center">
            <CircularProgress size={34} sx={{ color: "#ff7300" }} />
          </div>
        )}

        <div className="px-4 text-[12.5px] font-medium text-[#808080] mt-2 text-center">
          Payment will be deducted from your Wallet
        </div>

      </div>
    </PageTransitionWrapper>
  );
}

export default ParkingBookingSummaryPage;

