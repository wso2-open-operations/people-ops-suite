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
  confirmParkingReservation,
  finalizeParkingConfirmationAfterSuccess,
} from "@/utils/parkingConfirm";
import { Logger } from "@/utils/logger";

const RESUME_LOCK_PREFIX = "people_parking_wallet_resume_lock_";

export function ParkingWalletReturnResume() {
  const navigate = useNavigate();
  const { handleRequest, handleRequestWithNewToken } = useHttp();

  useEffect(() => {
    let cancelled = false;

    const tryResume = async () => {
      const ctx = getParkingPaymentContextState();
      const reservationId = ctx?.reservationId;
      if (!reservationId) return;

      let lockKey: string | null = null;

      try {
        const status = await getLocalDataAsync(PARKING_WALLET_PAYMENT_STATUS_KEY);
        if (!status || status !== "SUCCESS") return;

        const txHashRaw = await getLocalDataAsync(
          PARKING_WALLET_PAYMENT_TX_HASH_KEY,
        );
        const txHash = txHashRaw ? String(txHashRaw).trim() : "";
        if (!txHash) return;

        lockKey = `${RESUME_LOCK_PREFIX}${reservationId}`;
        if (sessionStorage.getItem(lockKey)) return;
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
      } catch (e) {
        Logger.error("ParkingWalletReturnResume", e);
      } finally {
        if (lockKey) sessionStorage.removeItem(lockKey);
      }
    };

    void tryResume();

    const onVisibility = () => {
      if (document.visibilityState === "visible") void tryResume();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [handleRequest, handleRequestWithNewToken, navigate]);

  return null;
}
