// Copyright (c) 2026 WSO2 LLC. (https://www.wso2.com).
//
// WSO2 LLC. licenses this file to you under the Apache License,
// Version 2.0 (the "License"); you may not use this file except
// in compliance with the License.
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing,
// software distributed under the License is distributed on an
// "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
// KIND, either express or implied.  See the License for the
// specific language governing permissions and limitations
// under the License.

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import useHttp from "@/utils/http";
import { getLocalDataAsync } from "@/components/microapp-bridge";
import {
  getParkingPaymentContextState,
} from "@/utils/parkingStorage";
import {
  PARKING_WALLET_PAYMENT_STATUS_KEY,
  PARKING_WALLET_PAYMENT_TX_HASH_KEY,
  PARKING_WALLET_PAYMENT_ERROR_KEY,
  confirmParkingReservation,
  fetchParkingReservationById,
  finalizeParkingConfirmationAfterSuccess,
} from "@/utils/parkingConfirm";
import { Logger } from "@/utils/logger";

const RESUME_LOCK_PREFIX = "people_parking_wallet_resume_lock_";
const BOOT_RETRY_COUNT = 8;
const BOOT_RETRY_DELAY_MS = 250;
/** Wait if another resume pass holds the lock (e.g. React Strict Mode remount). */
const LOCK_WAIT_ATTEMPTS = 40;
const LOCK_WAIT_MS = 100;

type ParkingWalletReturnResumeProps = {
  onInitialResumeComplete?: () => void;
};

export function ParkingWalletReturnResume({
  onInitialResumeComplete,
}: ParkingWalletReturnResumeProps) {
  const navigate = useNavigate();
  const { handleRequest, handleRequestWithNewToken } = useHttp();

  useEffect(() => {
    let cancelled = false;
    let initialSettled = false;
    const markInitialSettled = () => {
      if (initialSettled) return;
      initialSettled = true;
      onInitialResumeComplete?.();
    };

    const wait = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms));

    const tryResume = async (options?: { forInitialGate?: boolean }) => {
      const ctx = getParkingPaymentContextState();
      const reservationId = ctx?.reservationId;
      if (!reservationId) {
        if (options?.forInitialGate) markInitialSettled();
        return;
      }

      let lockKey: string | null = null;

      try {
        for (let attempt = 0; attempt < BOOT_RETRY_COUNT; attempt += 1) {
          const status = await getLocalDataAsync(PARKING_WALLET_PAYMENT_STATUS_KEY);
          if (!status) {
            if (!options?.forInitialGate) return;
            await wait(BOOT_RETRY_DELAY_MS);
            continue;
          }

          if (status === "FAILED") {
            const error = await getLocalDataAsync(PARKING_WALLET_PAYMENT_ERROR_KEY);
            if (!cancelled) {
              navigate("/services/parking/summary", {
                replace: true,
                state: {
                  resumeError:
                    (error ? String(error) : "") ||
                    "Payment was not completed. Please try again.",
                },
              });
            }
            return;
          }

          if (status !== "SUCCESS") {
            if (!options?.forInitialGate) return;
            await wait(BOOT_RETRY_DELAY_MS);
            continue;
          }

          const txHashRaw = await getLocalDataAsync(
            PARKING_WALLET_PAYMENT_TX_HASH_KEY,
          );
          const txHash = txHashRaw ? String(txHashRaw).trim() : "";
          if (!txHash) {
            if (!options?.forInitialGate) return;
            await wait(BOOT_RETRY_DELAY_MS);
            continue;
          }

          lockKey = `${RESUME_LOCK_PREFIX}${reservationId}`;
          let lockHeld = false;
          for (let w = 0; w < LOCK_WAIT_ATTEMPTS; w += 1) {
            if (!sessionStorage.getItem(lockKey)) break;
            lockHeld = true;
            await wait(LOCK_WAIT_MS);
            if (cancelled) return;
          }
          if (sessionStorage.getItem(lockKey)) {
            Logger.error(
              "ParkingWalletReturnResume",
              new Error("Resume lock still held after wait; skipping duplicate confirm"),
            );
            if (!cancelled) {
              navigate("/services/parking/summary", {
                replace: true,
                state: {
                  resumeError:
                    "Could not confirm your reservation. Please open My Bookings or try again.",
                },
              });
            }
            return;
          }
          if (lockHeld) {
            // Another pass released the lock; re-read wallet keys before confirming.
            continue;
          }
          sessionStorage.setItem(lockKey, "1");

          const confirmed = await confirmParkingReservation(
            handleRequest,
            handleRequestWithNewToken,
            reservationId,
            txHash,
          );

          if (cancelled) return;

          await finalizeParkingConfirmationAfterSuccess(confirmed, navigate, {
            replace: true,
          });
          return;
        }

        if (options?.forInitialGate && !cancelled) {
          navigate("/services/parking/summary", { replace: true });
        }
      } catch (e) {
        const message = String(e ?? "").toLowerCase();
        if (message.includes("already confirmed")) {
          try {
            const confirmed = await fetchParkingReservationById(
              handleRequest,
              handleRequestWithNewToken,
              reservationId,
            );
            if (!cancelled) {
              await finalizeParkingConfirmationAfterSuccess(confirmed, navigate, {
                replace: true,
              });
              return;
            }
          } catch (fetchErr) {
            Logger.error("ParkingWalletReturnResume.fetchConfirmed", fetchErr);
          }
        } else {
          Logger.error("ParkingWalletReturnResume", e);
          if (!cancelled) {
            navigate("/services/parking/summary", {
              replace: true,
              state: {
                resumeError:
                  "Reservation confirmation failed due to a server issue. Please retry.",
              },
            });
          }
        }
      } finally {
        if (lockKey) sessionStorage.removeItem(lockKey);
        // Avoid showing routes on "/" while a cancelled pass is still mid-flight
        // (e.g. React Strict Mode effect cleanup).
        if (options?.forInitialGate && !cancelled) markInitialSettled();
      }
    };

    void tryResume({ forInitialGate: true });

    const onVisibility = () => {
      if (document.visibilityState === "visible") void tryResume();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibility);
      // Release resume lock so a remount (e.g. React Strict Mode) can confirm.
      // Do NOT call onInitialResumeComplete here — that would mount routes on "/"
      // while confirm is still in flight.
      const rid = getParkingPaymentContextState()?.reservationId;
      if (rid) {
        sessionStorage.removeItem(`${RESUME_LOCK_PREFIX}${rid}`);
      }
    };
  }, [handleRequest, handleRequestWithNewToken, navigate, onInitialResumeComplete]);

  return null;
}
