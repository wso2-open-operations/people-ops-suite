import { useGetCompanyDataQuery, useGetOrgDataQuery } from "@root/src/slices/api/apiSlice";
import { RootState, useAppSelector } from "@root/src/slices/store";
import {
  EmployeeCreationSchema,
  EmployeeCreationValidated,
} from "@root/src/utils/EmployeeInfoSchema";
import {
  divideOrgStructure,
  findOfficesInCompany,
  findSubTeamsInTeams,
  findTeamsInBu,
  stringnizeOrgData,
} from "@root/src/utils/utils";
import { useForm } from "@tanstack/react-form";
import { useStore } from "@tanstack/react-store";

import { useMemo } from "react";

export function useEmployeeInfoCreationForm() {
  const auth = useAppSelector((state: RootState) => state.auth);
  const { data: orgData } = useGetOrgDataQuery();
  const { data: companyData } = useGetCompanyDataQuery();

  const { businessUnits: bus, teams } = divideOrgStructure(orgData) ?? {};

  const blankEmployee = (): EmployeeCreationValidated => ({
    lastName: "",
    firstName: "",
    epf: null,
    employeeLocation: null,
    workLocation: null,
    wso2Email: "",
    workPhoneNumber: null,
    startDate: null,
    jobRole: null,
    managerEmail: null,
    reportToEmail: null,
    additionalManagerEmail: null,
    additionalReportToEmail: null,
    employeeStatus: null,
    lengthOfService: null,
    subordinateCount: null,
    probationEndDate: null,
    agreementEndDate: null,
    employmentTypeId: 0,
    designationId: 0,
    officeId: 0,
    companyId: 0,
    teamId: 0,
    subTeamId: 0,
    businessUnitId: 0,
    unitId: 0,
    personalInfoId: 0,
  });

  const form = useForm({
    defaultValues: blankEmployee(),

    validators: { onChange: EmployeeCreationSchema },

    onSubmit: async ({ value }) => {},
  });

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

  return { form, companiesOptions, buOptions, teamOptions, subTeamOptions, officeOptions, auth };
}
