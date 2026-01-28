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

export enum State {
  failed = "failed",
  success = "success",
  loading = "loading",
  idle = "idle",
}

export enum ConfirmationType {
  update = "update",
  send = "send",
  upload = "upload",
  accept = "accept",
  discard = "discard",
}

export interface CommonCardProps {
  actions: React.ReactElement<any, string | React.JSXElementConstructor<any>>;
  dataCardIndex: number;
}

export interface EmergencyContact {
  name: string | null;
  relationship: string | null;
  telephone: string | null;
  mobile: string | null;
}

export interface CreateEmployeeFormValues {
  personalInfo: {
    nicOrPassport: string;
    fullName: string;
    nameWithInitials: string;
    firstName: string;
    lastName: string;
    title: string;
    dob: string | null;
    age: number | null;
    personalEmail: string | null;
    personalPhone: string | null;
    residentNumber: string | null;
    addressLine1: string | null;
    addressLine2: string | null;
    city: string | null;
    stateOrProvince: string | null;
    postalCode: string | null;
    country: string | null;
    nationality: string;
    emergencyContacts: EmergencyContact[];
  };
  workEmail: string;
  epf: string;
  businessUnitId: number;
  teamId: number;
  subTeamId: number;
  unitId: number;
  officeId: number;
  employmentLocation: string;
  workLocation: string;
  employmentTypeId: number;
  startDate: string;
  probationEndDate: string | null;
  agreementEndDate: string | null;
  continuousServiceRecord?: string | null;
  managerEmail: string;
  additionalManagerEmail: string[];
  workPhoneNumber: string;
  careerFunctionId: number;
  designationId: number;
  secondaryJobTitle: string;
}

export const emptyCreateEmployeeValues: CreateEmployeeFormValues = {
  personalInfo: {
    nicOrPassport: "",
    fullName: "",
    nameWithInitials: "",
    firstName: "",
    lastName: "",
    title: "",
    dob: null,
    age: null,
    personalEmail: null,
    personalPhone: null,
    residentNumber: null,
    addressLine1: null,
    addressLine2: null,
    city: null,
    stateOrProvince: null,
    postalCode: null,
    country: null,
    nationality: "",
    emergencyContacts: [],
  },
  workEmail: "",
  epf: "",
  businessUnitId: 0,
  teamId: 0,
  subTeamId: 0,
  unitId: 0,
  officeId: 0,
  employmentLocation: "",
  workLocation: "",
  employmentTypeId: 0,
  startDate: "",
  probationEndDate: null,
  agreementEndDate: null,
  continuousServiceRecord: null,
  managerEmail: "",
  additionalManagerEmail: [],
  workPhoneNumber: "",
  careerFunctionId: 0,
  designationId: 0,
  secondaryJobTitle: "",
};
