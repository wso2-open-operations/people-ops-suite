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
import { EmployeeBasicInfo } from "@services/employee";
import { UnitType } from "@utils/utils";

export interface OrgItemOption {
  id: string;
  name: string;
  /** True when the user typed a name that doesn't exist yet — triggers create flow. */
  isNew: boolean;
}

export interface AddOrgFormValues {
  /** The selected (or newly-named) child entity. */
  orgItem: OrgItemOption | null;
  /** Head of the new entity — only collected when creating a brand-new item. */
  head: EmployeeBasicInfo | null;
  /** Functional lead — always collected. */
  functionalLead: EmployeeBasicInfo | null;
}

/**
 * Describes which parent the new child will belong to and what type of child
 * is being created.  Supplied by the column that owns the add button.
 */
export interface AddPageContext {
  childType: UnitType;
  parentId: string;
  parentName: string;
  parentType: UnitType;
}

export const UNIT_TYPE_LABEL: Partial<Record<UnitType, string>> = {
  [UnitType.BusinessUnit]: "Business Unit",
  [UnitType.Team]: "Team",
  [UnitType.SubTeam]: "Sub Team",
  [UnitType.Unit]: "Unit",
};

/** Prefix used to mark a synthetic "create new" option id. */
export const NEW_ITEM_ID_PREFIX = "__NEW__";
