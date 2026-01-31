// Copyright (c) 2024, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import { BaseURLAuthClientConfig } from "@asgardeo/auth-react";

// Set the application name
export const APP_NAME: string = "PAR App";

// Send the request to get the user privileges from the backend when loading app
export const InitialUserPrivilegeRequest = false;

// Send the request to get the user info from the backend when loading app
export const InitialUserInfoRequest = true;

declare global {
  interface Window {
    config: {
      BACKEND_BASE_URL: string;
      ASGARDEO_BASE_URL: string;
      ASGARDEO_CLIENT_ID: string;
      AUTH_SIGN_IN_REDIRECT_URL: string;
      AUTH_SIGN_OUT_REDIRECT_URL: string;
      DEPLOYED_ENVIRONMENT: string;
      ADMIN_USER_GROUP: string;
      EMPLOYEE_USER_GROUP: string;
      TOP5P20PENABLEDRATING: string;
      EVIDENCE_ENABLED_RATING: string;
    };
  }
}

// Need to dynamically load from .env reading references and will handle.
export const asgardeoConfig: BaseURLAuthClientConfig = {
  signInRedirectURL: window.config?.AUTH_SIGN_IN_REDIRECT_URL ?? "",
  signOutRedirectURL: window.config?.AUTH_SIGN_OUT_REDIRECT_URL ?? "",
  clientID: window.config?.ASGARDEO_CLIENT_ID ?? "",
  baseUrl: window.config?.ASGARDEO_BASE_URL ?? "",
  scope: [
    "add_360_reviewers",
    "add_par_cycles",
    "email",
    "get_360_review_requests",
    "get_360_reviewers",
    "get_360_reviews",
    "get_configurations",
    "get_employees",
    "get_par_cycles",
    "get_par_ratings_all",
    "get_par_ratings",
    "get_par_teams",
    "groups",
    "openid",
    "profile",
    "schedule_360_reminders",
    "schedule_auto_reminders",
    "schedule_employee_reminders",
    "schedule_lead_reminders",
    "schedule_special_reminders",
    "send_reminders",
    "update_360_reviews",
    "update_configurations",
    "update_par_cycles",
    "update_par_ratings",
  ],
};

export const serviceBaseUrl = window.config?.BACKEND_BASE_URL ?? "";

export const deployedEnvironment = window.config?.DEPLOYED_ENVIRONMENT ?? null;

export const adminGroup = window.config?.ADMIN_USER_GROUP ?? null;

export const employeeGroup = window.config?.EMPLOYEE_USER_GROUP ?? null;

export const top5p20pEnabledRating = window.config?.TOP5P20PENABLEDRATING ?? "Successful";

export const evidenceEnabledRating = window.config?.EVIDENCE_ENABLED_RATING ?? "Needs Improvement";

export const appConfig = {
  serviceUrls: {
    userPrivileges: serviceBaseUrl + "/user-privileges",
    userInfo: serviceBaseUrl + "/user-info",
    userData: serviceBaseUrl + "/employees",
    parCycles: serviceBaseUrl + "/par-cycles",
    configurations: serviceBaseUrl + "/meta/configurations",
    employees: serviceBaseUrl + "/meta/employees",
    emails: serviceBaseUrl + "/employee-emails",
    reminders: serviceBaseUrl + "/reminders",
    participants: serviceBaseUrl + "/participants",
    calendar: serviceBaseUrl + "/calendar",
  },
};
