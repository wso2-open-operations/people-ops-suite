import { useGetCompanyDataQuery, useGetOrgDataQuery } from "@root/src/slices/api/apiSlice";
import { updateEmployeeInfo } from "@root/src/slices/employeeSlice/employee";
import { RootState, useAppDispatch, useAppSelector } from "@root/src/slices/store";
import { EmployeeSchema, EmployeeValidated } from "@root/src/utils/EmployeeInfoSchema";
import {
  diff,
  divideOrgStructure,
  findOfficesInCompany,
  findSubTeamsInTeams,
  findTeamsInBu,
  stringnizeOrgData,
} from "@root/src/utils/utils";
import { useForm, useStore } from "@tanstack/react-form";

import { useMemo } from "react";

export function useEmployeeInfoForm() {
  const dispatch = useAppDispatch();
  const auth = useAppSelector((state: RootState) => state.auth);
  const employee = useAppSelector((state: RootState) => state.employee.employeeInfo);
  const { data: orgData } = useGetOrgDataQuery();
  const { data: companyData } = useGetCompanyDataQuery();

  const { businessUnits: bus, teams } = divideOrgStructure(orgData) ?? {};

  const initialValues: EmployeeValidated = {
    ...employee,
  };

  const form = useForm({
    defaultValues: initialValues,

    validators: { onChange: EmployeeSchema },

    onSubmit: async ({ value }) => {
      const changed = diff(initialValues, value);
      if (Object.keys(changed).length === 0) return;

      changed.wso2Email = value.wso2Email;

      dispatch(updateEmployeeInfo(changed));
    },
  });

  const handleFormCancelation = () => {
    form.reset();
  };

  const buId = useStore(form.store, (s) => s.values.businessUnitId);
  const teamId = useStore(form.store, (s) => s.values.teamId);
  const companyId = useStore(form.store, (s) => s.values.companyId);

  const companiesOptions = useMemo(
    () => (companyData?.companies ?? []).map((c) => ({ label: c.name, value: c.id })),
    [companyData],
  );

  const buOptions = useMemo(() => stringnizeOrgData(bus) ?? [], [bus]);

  const teamOptions = useMemo(() => {
    return buId != null ? findTeamsInBu(buId, bus) : [];
  }, [buId, bus]);

  const subTeamOptions = useMemo(() => {
    return findSubTeamsInTeams(teamId, teams);
  }, [teamId, teams]);

  const officeOptions = useMemo(() => {
    return findOfficesInCompany(companyId, companyData?.offices);
  }, [companyId, companyData]);

  return {
    form,
    companiesOptions,
    buOptions,
    teamOptions,
    subTeamOptions,
    officeOptions,
    auth,
    handleFormCancelation,
  };
}
