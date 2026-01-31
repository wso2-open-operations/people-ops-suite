// Copyright (c) 2024, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import { ApiService } from "./apiService";
import { EmployeeInfo } from "./types";

export const asyncForEach = async (
  array: any[],
  callback: {
    (batch: any): Promise<void>;
    (arg0: any, arg1: number, arg2: any[]): any;
  }
) => {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
};

export const split = (arr: any[], n: any) => {
  var res: any[] = [];
  while (arr.length) {
    res.push(arr.splice(0, n));
  }
  return res;
};

export const delayMS = (t = 200) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(t);
    }, t);
  });
};

export const throttledFetchUserData = (
  items: string[],
  batchSize = 1,
  delay = 0,
  setStateMessage?: (message: string) => void
) => {
  setStateMessage && setStateMessage(`Fetching applicant details`);
  return new Promise<any[]>(async (resolve, reject) => {
    const output: any = [];
    const batches = split(items, batchSize);
    await asyncForEach(batches, async (batch: any) => {
      const promises = batch
        .map(
          ApiService.getInstance().get<{
            employeeInfo: EmployeeInfo;
          }>
        )
        .map((p: Promise<any>) =>
          p.catch((res) => {
            return res;
          })
        );
      const results = await Promise.all(promises);

      output.push(...results);

      await delayMS(delay);
    });
    resolve(output);
  });
};
