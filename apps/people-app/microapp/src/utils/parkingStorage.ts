import type { DecimalLike, ParkingReservationDetails } from "@/types/parking";

export type ParkingPaymentStage2State = {
  slotId: string;
  floorName: string;
  coinsAmount: DecimalLike;
  bookingDate: string; // YYYY-MM-DD
  // Created on stage 1 (reservation creation)
  reservationId?: number;
  // Set on stage 2 (wallet payment result)
  paymentStatus?: "SUCCESS" | "FAILED";
  transactionHash?: string;
  error?: string;
};

const STAGE2_KEY = "people_parking_stage2";
const CONFIRMATION_KEY = "people_parking_confirmation";

export function setPaymentStage2State(state: ParkingPaymentStage2State) {
  sessionStorage.setItem(STAGE2_KEY, JSON.stringify(state));
}

export function getPaymentStage2State():
  | ParkingPaymentStage2State
  | undefined {
  const raw = sessionStorage.getItem(STAGE2_KEY);
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as ParkingPaymentStage2State;
  } catch {
    return undefined;
  }
}

export function clearPaymentStage2State() {
  sessionStorage.removeItem(STAGE2_KEY);
}

export function setConfirmationState(reservation: ParkingReservationDetails) {
  sessionStorage.setItem(CONFIRMATION_KEY, JSON.stringify(reservation));
}

export function getConfirmationState():
  | ParkingReservationDetails
  | undefined {
  const raw = sessionStorage.getItem(CONFIRMATION_KEY);
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as ParkingReservationDetails;
  } catch {
    return undefined;
  }
}

export function clearConfirmationState() {
  sessionStorage.removeItem(CONFIRMATION_KEY);
}

