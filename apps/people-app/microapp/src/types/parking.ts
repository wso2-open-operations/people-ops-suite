export type DecimalLike = number | string;

export interface ParkingFloor {
  id: number;
  name: string;
  displayOrder: number;
  coinsPerSlot: DecimalLike;
}

export interface ParkingSlot {
  slotId: string;
  floorId: number;
  floorName: string;
  coinsPerSlot: DecimalLike;
  isBooked: boolean;
}

export interface CreateParkingReservationResponse {
  reservationId: number;
  coinsAmount: DecimalLike;
}

export type ParkingReservationStatus = "PENDING" | "CONFIRMED";

export interface ParkingReservationDetails {
  id: number;
  slotId: string;
  bookingDate: string;
  employeeEmail: string;
  vehicleId: number;
  vehicleRegistrationNumber: string;
  vehicleType: string | null;
  status: ParkingReservationStatus | string;
  transactionHash: string | null;
  coinsAmount: DecimalLike;
  floorName: string;
  createdOn: string;
  createdBy: string;
  updatedOn: string;
  updatedBy: string;
}

export interface ConfirmParkingReservationRequest {
  reservationId: number;
  transactionHash: string;
}

export interface CreateParkingReservationRequest {
  slotId: string;
  bookingDate: string;
  vehicleId: number;
}

