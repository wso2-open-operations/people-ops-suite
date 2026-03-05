// Copyright (c) 2026 WSO2 LLC. (https://www.wso2.com).
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
import * as React from "react";
import { useContext } from "react";

import { ConfirmationType, InputObj } from "@/types/types";

export type ConfirmationDialogContextType = {
  showConfirmation: (
    title: string,
    message: string | React.ReactNode,
    type: ConfirmationType,
    action: (value?: string) => void,
    okText?: string,
    cancelText?: string,
    inputObj?: InputObj,
  ) => void;
};

export const ConfirmationModalContext =
  React.createContext<ConfirmationDialogContextType | null>(null);

export const useConfirmationModalContext = (): ConfirmationDialogContextType => {
  const context = useContext(ConfirmationModalContext);
  if (!context) {
    throw new Error(
      "useConfirmationModalContext must be used within a ConfirmationModalContextProvider",
    );
  }
  return context;
};