// Copyright (c) 2024, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import {
  appConfig,
  InitialUserInfoRequest,
  InitialUserPrivilegeRequest,
} from "@config/config";
import { ApiService } from "./apiService";
import { HttpStatusCode } from "axios";
import { EmployeeInfo } from "./types";

// TODO : Add the API call to get the user privileges
export const getUserPrivileges = async (): Promise<number[]> => {
  if (InitialUserPrivilegeRequest) {
    try {
      const response = await ApiService.getInstance().get(
        appConfig.serviceUrls.userPrivileges
      );

      if (response.status === HttpStatusCode.Ok) {
        const privileges: number[] = response.data.privileges;
        return privileges;
      }
      throw new Error("error");
    } catch (error) {
      throw new Error("error");
    }
  } else {
    return [];
  }
};

export const getEmployeeInfo = async (
  userEmail: string
): Promise<EmployeeInfo> => {
  try {
    if (InitialUserInfoRequest) {
      const response = await ApiService.getInstance().get<EmployeeInfo>(
        `${appConfig.serviceUrls.userData}/${userEmail}`
      );
      if (response.status === HttpStatusCode.Ok) {
        if (response.data) {
          return response.data;
        }
      }
    }
    throw new Error("Failed to fetch user info");
  } catch (error) {
    throw error;
  }
};
