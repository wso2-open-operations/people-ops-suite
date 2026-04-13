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

declare global {
  interface Window {
    config: {
      APP_NAME: string;
      APP_DOMAIN: string;
      ASGARDEO_BASE_URL: string;
      ASGARDEO_CLIENT_ID: string;
      ASGARDEO_REVOKE_ENDPOINT: string;
      AUTH_SIGN_IN_REDIRECT_URL: string;
      AUTH_SIGN_OUT_REDIRECT_URL: string;
      REACT_APP_BACKEND_BASE_URL: string;
    };
  }
}

export const AsgardeoConfig = {
  scope: ["openid", "email", "groups"],
  baseUrl: window.config?.ASGARDEO_BASE_URL ?? "",
  clientId: window.config?.ASGARDEO_CLIENT_ID ?? "",
  afterSignInUrl: window.config?.AUTH_SIGN_IN_REDIRECT_URL ?? "",
  afterSignOutUrl: window.config?.AUTH_SIGN_OUT_REDIRECT_URL ?? "",
};

export const APP_NAME = window.config?.APP_NAME ?? "";
export const APP_DOMAIN = window.config?.APP_DOMAIN ?? "";
export const SERVICE_BASE_URL = window.config?.REACT_APP_BACKEND_BASE_URL ?? "";

export const AppConfig = {
  serviceUrls: {
    userInfo: SERVICE_BASE_URL + "/user-info",
    appConfig: SERVICE_BASE_URL + "/app-config",

    employees: SERVICE_BASE_URL + "/employees",
    employeesBasicInfo: SERVICE_BASE_URL + "/employees/basic-info",
    searchEmployees: SERVICE_BASE_URL + "/employees/search",
    managers: SERVICE_BASE_URL + "/employees/managers",
    continuousServiceRecord: SERVICE_BASE_URL + "/continuous-service-records",
    validateEpf: SERVICE_BASE_URL + "/employees/validate-epf",
    employee: (employeeId: string) => SERVICE_BASE_URL + `/employees/${employeeId}`,
    employeePersonalInfo: (employeeId: string) =>
      SERVICE_BASE_URL + `/employees/${employeeId}/personal-info`,
    jobInfo: (employeeId: string) => SERVICE_BASE_URL + `/employees/${employeeId}/job-info`,
    employeeQrCode: (employeeId: string) => `${SERVICE_BASE_URL}/employees/${employeeId}/qr-code`,
    qrCodesSearch: SERVICE_BASE_URL + "/reports/qr-codes/search",

    reportsEmployees: (status?: string, excludeFutureStartDate?: boolean) => {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      if (excludeFutureStartDate !== undefined)
        params.set("excludeFutureStartDate", String(excludeFutureStartDate));
      const qs = params.toString();
      return SERVICE_BASE_URL + `/reports/employees/generate` + (qs ? `?${qs}` : "");
    },

    businessUnits: SERVICE_BASE_URL + "/business-units",
    careerFunctions: SERVICE_BASE_URL + "/career-functions",
    designations: SERVICE_BASE_URL + "/designations",
    companies: SERVICE_BASE_URL + "/companies",
    employmentTypes: SERVICE_BASE_URL + "/employment-types",
    teams: SERVICE_BASE_URL + "/teams",
    subTeams: SERVICE_BASE_URL + "/sub-teams",
    units: SERVICE_BASE_URL + "/units",
    offices: SERVICE_BASE_URL + "/offices",
    houses: SERVICE_BASE_URL + "/houses",
    organization: SERVICE_BASE_URL + "/organization",
  },
};
