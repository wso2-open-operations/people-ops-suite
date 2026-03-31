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

import type { NavigateFunction } from "react-router-dom";

import { saveLocalDataAsync } from "@/components/microapp-bridge";
import { serviceUrls } from "@/config/config";
import type { ParkingReservationDetails } from "@/types";
import {
  clearParkingPaymentContextState,
  setConfirmationState,
} from "@/utils/parkingStorage";
import { executeWithTokenHandling, type RequestOptions } from "@/utils/http";

/** Bridge local keys written by the wallet / read by People parking flow. */
export const PARKING_WALLET_PAYMENT_STATUS_KEY = "people_parking_payment_status";
export const PARKING_WALLET_PAYMENT_TX_HASH_KEY =
  "people_parking_payment_tx_hash";
export const PARKING_WALLET_PAYMENT_ERROR_KEY = "people_parking_payment_error";

type HttpHandleRequest = (options: RequestOptions) => Promise<void>;
type HttpHandleRequestWithNewToken = (callback: () => void) => void;

export async function clearWalletParkingPaymentBridgeKeys(): Promise<void> {
  await saveLocalDataAsync(PARKING_WALLET_PAYMENT_STATUS_KEY, "");
  await saveLocalDataAsync(PARKING_WALLET_PAYMENT_TX_HASH_KEY, "");
  await saveLocalDataAsync(PARKING_WALLET_PAYMENT_ERROR_KEY, "");
}

export function confirmParkingReservation(
  handleRequest: HttpHandleRequest,
  handleRequestWithNewToken: HttpHandleRequestWithNewToken,
  reservationId: number,
  transactionHash: string,
): Promise<ParkingReservationDetails> {
  const body = { reservationId, transactionHash };
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
}

/**
 * After a successful confirm API: clear wallet bridge keys, persist receipt,
 * drop payment context, navigate to confirmation.
 */
export async function finalizeParkingConfirmationAfterSuccess(
  confirmed: ParkingReservationDetails,
  navigate: NavigateFunction,
  options?: { replace?: boolean },
): Promise<void> {
  await clearWalletParkingPaymentBridgeKeys();
  setConfirmationState(confirmed);
  clearParkingPaymentContextState();
  navigate("/services/parking/confirmation", {
    replace: options?.replace ?? false,
    state: { reservationId: confirmed.id },
  });
}
