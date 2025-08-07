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

import { api } from "@/services/api";
import { serviceUrls } from "@/config/config";
import type { VehicleType, Vehicle } from "@/types";

export interface CreateVehiclePayload {
  type: VehicleType;
  number: string;
}

interface Response {
  vehicles: VehicleResponse[];
  totalCount: number;
}

interface VehicleResponse {
  vehicleId: number;
  createdOn: string;
  updatedOn: string;
  updatedBy: string;
  owner: string;
  vehicleRegistrationNumber: string;
  vehicleType: VehicleType;
  vehicleStatus: string;
  createdBy: string;
}

export const fetchVehicles = async (): Promise<Vehicle[]> => {
  const response = await api.get(serviceUrls.fetchVehicles);

  const vehicles = (response as Response).vehicles.map(
    (v): Vehicle => ({
      id: v.vehicleId,
      type: v.vehicleType,
      number: v.vehicleRegistrationNumber,
    })
  );

  return vehicles;
};

export const registerVehicle = async (
  data: CreateVehiclePayload
): Promise<void> => {
  await api.post(serviceUrls.registerVehicle, {
    vehicleRegistrationNumber: data.number,
    vehicleType: data.type,
  });
};

export const deleteVehicle = async (id: number): Promise<void> => {
  await api.delete(
    serviceUrls.deleteVehicle.replace("[id]", encodeURIComponent(String(id)))
  );
};
