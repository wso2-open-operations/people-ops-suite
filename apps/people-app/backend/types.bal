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
import people.database;

import ballerina/constraint;

// # Payload for adding a vehicle.
type NewVehicle record {|
    # Registration number of the vehicle
    @constraint:String {
        pattern: {
            value: re `^([A-Za-z]{1,3}|\d{1,3}) \d{4}$`,
            message: "Vehicle registration number should be a valid pattern in Sri Lanka."
        }
    }
    string vehicleRegistrationNumber;
    # Type of the vehicle
    database:VehicleTypes vehicleType;
|};

# Request body for creating a parking reservation (before payment).
type CreateParkingReservationRequest record {|
    # Slot identifier (e.g. B-01)
    string slotId;
    # Booking date (YYYY-MM-DD), same-day only
    @constraint:String {pattern: re `^\\d{4}-\\d{2}-\\d{2}$`}
    string bookingDate;
    # Registered vehicle ID (car only)
    int vehicleId;
|};

# Response after creating a PENDING reservation.
type CreateParkingReservationResponse record {|
    # Reservation identifier
    int reservationId;
    # Amount to be paid in coins
    decimal coinsAmount;
|};

# Request body for confirming reservation with transaction hash.
type ConfirmParkingReservationRequest record {|
    # Transaction hash
    string transactionHash;
    # Reservation identifier
    int? reservationId;
|};

# Parking slot with availability for a given date.
type ParkingSlotAvailability record {|
    # Slot identifier
    string slotId;
    # Floor identifier
    int floorId;
    # Floor name (e.g. "Ground Floor")
    string floorName;
    # Number of coins per slot
    decimal coinsPerSlot;
    # Availability status for the given date
    boolean isBooked;
|};
