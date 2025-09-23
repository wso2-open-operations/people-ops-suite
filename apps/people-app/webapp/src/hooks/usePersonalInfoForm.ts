import { RootState, useAppSelector } from "@root/src/slices/store";
import { PersonalInfoSchema, PersonalInfoValidated } from "@root/src/utils/EmployeeInfoSchema";
import { diff } from "@root/src/utils/utils";
import { useForm } from "@tanstack/react-form";

export function usePersonalInfoForm() {
  const auth = useAppSelector((state: RootState) => state.auth);
  const employeePersonalInfo = useAppSelector((state: RootState) => state.employee.personalInfo);

  const initialValues: PersonalInfoValidated = {
    ...employeePersonalInfo,
  };

  const form = useForm({
    defaultValues: initialValues,

    validators: { onChange: PersonalInfoSchema },

    onSubmit: async ({ value }) => {
      const changed = diff(initialValues, value);
      if (Object.keys(changed).length === 0) return;
    },
  });

  const handleFormCancelation = () => {
    form.reset();
  };

  return {
    form,
    auth,
    handleFormCancelation,
  };
}
