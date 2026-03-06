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
import { useForm } from "react-hook-form";

import { useCallback, useMemo } from "react";

import { useGetEmployeesBasicInfoQuery } from "@services/employee";
import { TeamState } from "@slices/organizationSlice/organizationStructure";
import { useAppSelector } from "@slices/store";
import { UnitType } from "@utils/utils";

import {
  AddOrgFormValues,
  AddPageContext,
  NEW_ITEM_ID_PREFIX,
  OrgItemOption,
  UNIT_TYPE_LABEL,
} from "./types";

interface UseAddOrgEntityParams {
  context: AddPageContext;
}

/**
 * Encapsulates all business logic for the Add-entity modal:
 *  - derives autocomplete options from the Redux org-structure state
 *  - loads employees for head/lead pickers
 *  - owns the react-hook-form instance
 *  - builds the submit handler (console.log + callback)
 */
export function useAddOrgEntity({ context }: UseAddOrgEntityParams) {
  const childLabel = UNIT_TYPE_LABEL[context.childType] ?? "Item";
  const parentLabel = UNIT_TYPE_LABEL[context.parentType] ?? "Parent";

  const allTeams = useAppSelector(
    (state) => state.organizationStructure.organizationInfo?.teams ?? [],
  );

  /**
   * Scope team options to teams that already belong to the selected parent BU
   * when adding a new Team.  For all other child types fall back to all teams.
   */
  const scopedOrgItems = useMemo<TeamState[]>(() => {
    if (context.childType === UnitType.Team) {
      return allTeams.filter((t) => t.businessUnitId === context.parentId);
    }
    return allTeams;
  }, [allTeams, context.childType, context.parentId]);

  const orgItemOptions: OrgItemOption[] = useMemo(
    () =>
      scopedOrgItems.map((t: TeamState) => ({
        id: t.id,
        name: t.name,
        isNew: false,
      })),
    [scopedOrgItems],
  );

  /**
   * Custom filter that appends a synthetic "Add <name>" option when the
   * typed string doesn't match any existing item exactly.
   */
  const filterOrgItemOptions = useCallback(
    (options: OrgItemOption[], { inputValue }: { inputValue: string }): OrgItemOption[] => {
      const trimmed = inputValue.trim();
      const filtered = options.filter((o) => o.name.toLowerCase().includes(trimmed.toLowerCase()));

      const exactMatch = options.some((o) => o.name.toLowerCase() === trimmed.toLowerCase());

      if (trimmed && !exactMatch) {
        filtered.push({
          id: `${NEW_ITEM_ID_PREFIX}${trimmed}`,
          name: trimmed,
          isNew: true,
        });
      }

      return filtered;
    },
    [],
  );

  const { data: employees = [], isLoading: isEmployeesLoading } = useGetEmployeesBasicInfoQuery();

  const form = useForm<AddOrgFormValues>({
    defaultValues: {
      orgItem: null,
      head: null,
      functionalLead: null,
    },
  });

  const { watch, setValue, handleSubmit } = form;
  const selectedOrgItem = watch("orgItem");

  /**
   * Whether the user chose to create a brand-new entity (not an existing one).
   * Controls visibility of the Head picker section.
   */
  const isNewItem = selectedOrgItem?.isNew === true;

  const buildSubmitHandler =
    (onSubmit: (context: AddPageContext, values: AddOrgFormValues) => void) =>
    (values: AddOrgFormValues) => {
      console.log("[AddPage] Submit", {
        parentContext: {
          parentType: context.parentType,
          parentId: context.parentId,
          parentName: context.parentName,
          childType: context.childType,
        },
        formValues: {
          orgItem: values.orgItem
            ? { id: values.orgItem.id, name: values.orgItem.name, isNew: values.orgItem.isNew }
            : null,
          head: values.head
            ? {
                employeeId: values.head.employeeId,
                name: `${values.head.firstName} ${values.head.lastName}`,
                workEmail: values.head.workEmail,
              }
            : null,
          functionalLead: values.functionalLead
            ? {
                employeeId: values.functionalLead.employeeId,
                name: `${values.functionalLead.firstName} ${values.functionalLead.lastName}`,
                workEmail: values.functionalLead.workEmail,
              }
            : null,
        },
      });
      onSubmit(context, values);
    };

  const handleOrgItemChange = (value: OrgItemOption | null) => {
    setValue("orgItem", value);
    setValue("head", null);
  };

  return {
    // labels
    childLabel,
    parentLabel,

    // org-item autocomplete
    orgItemOptions,
    filterOrgItemOptions,

    // employee autocomplete
    employees,
    isEmployeesLoading,

    // form
    form,
    isNewItem,
    handleOrgItemChange,
    buildSubmitHandler,
    handleSubmit,
  };
}
