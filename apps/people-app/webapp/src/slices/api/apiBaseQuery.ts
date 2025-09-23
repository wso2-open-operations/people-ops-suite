import { BaseQueryFn } from "@reduxjs/toolkit/query";
import { APIService } from "@root/src/utils/apiService";
import { AxiosError, AxiosRequestConfig } from "axios";

interface RequestArgs {
  url: string;
  method?: AxiosRequestConfig["method"];
  data?: unknown;
  params?: Record<string, unknown>;
  headers?: Record<string, string>;
}

interface BaseError {
  status?: number;
  data?: unknown;
  message?: string;
}

export const apiServiceBaseQuery =
  (): BaseQueryFn<RequestArgs, unknown, BaseError> =>
  async ({ url, method = "GET", data, params, headers }, { signal }) => {
    try {
      const axios = APIService.getInstance();
      const res = await axios.request({
        url,
        method,
        data,
        params,
        headers,
        signal,
      });

      return {
        data: res.data,
      };
    } catch (err) {
      const e = err as AxiosError;
      return {
        error: {
          status: e.response?.status,
          data: e.response?.data,
          message: e.message,
        },
      };
    }
  };
