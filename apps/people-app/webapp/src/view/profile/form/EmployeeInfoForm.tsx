import { Button } from "@component/common/button";
import { Input } from "@component/common/input";
import { Label } from "@component/common/label";
import { NullableYMDDateSchema, YMDDateSchema } from "@utils/EmployeeInfoSchema";

import { ComboboxField } from "../../../component/form/ComboBoxField";
import DatePickerField from "../../../component/form/DatePicker";
import { EmailField } from "../../../component/form/EmailField";
import { PhoneInput } from "../../../component/form/PhoneInput";
import { TextField } from "../../../component/form/TextField";
import { useEmployeeInfoForm } from "../../../hooks/useEmployeeInfoForm";

interface EmployeeInfoFormProps {
  editing: boolean;
  toggleEditing: () => void;
}

function EmployeeInfoForm(props: EmployeeInfoFormProps) {
  const { toggleEditing, editing } = props;
  const {
    form,
    companiesOptions,
    buOptions,
    teamOptions,
    subTeamOptions,
    officeOptions,
    auth,
    handleFormCancelation,
  } = useEmployeeInfoForm();

  const hasAdmin = auth.roles.includes("ADMIN");

  const FormSeperator = () => <div className="w-full h-[0.5px] bg-st-border-light"></div>;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className={`flex flex-col gap-4`}
    >
      <form.Field
        name="businessUnitId"
        listeners={{
          onChange: () => {
            form.setFieldValue("teamId", 0);
          },
        }}
        children={(field) => (
          <ComboboxField
            field={field}
            optionsArray={buOptions}
            disabled={!(editing && hasAdmin)}
            name="Bussiness Unit"
            id="businessUnitId"
          />
        )}
      />

      <FormSeperator />

      <form.Field
        name="teamId"
        listeners={{
          onChange: () => {
            form.setFieldValue("subTeamId", 0);
          },
        }}
      >
        {(field) => {
          return (
            <ComboboxField
              field={field}
              optionsArray={teamOptions}
              disabled={!(editing && hasAdmin)}
              name="Team"
              id="teamId"
              placeholder="Selecte a Team"
            />
          );
        }}
      </form.Field>

      <FormSeperator />

      <form.Field name="subTeamId">
        {(field) => {
          return (
            <ComboboxField
              field={field}
              optionsArray={subTeamOptions}
              disabled={!(editing && hasAdmin)}
              name="Sub Team"
              id="subTeamId"
              placeholder="Selecte a SubTeam"
            />
          );
        }}
      </form.Field>
      <FormSeperator />

      <form.Field
        name="companyId"
        listeners={{
          onChange: () => {
            form.setFieldValue("officeId", 0);
          },
        }}
      >
        {(field) => {
          return (
            <ComboboxField
              field={field}
              optionsArray={companiesOptions}
              disabled={true}
              name="Company"
              id="companyId"
              placeholder="Selecte a company"
            />
          );
        }}
      </form.Field>

      <FormSeperator />

      <form.Field name="officeId">
        {(field) => {
          return (
            <ComboboxField
              field={field}
              optionsArray={officeOptions}
              disabled={!(editing && hasAdmin)}
              name="Office"
              id="officeId"
              placeholder="Selecte a office"
            />
          );
        }}
      </form.Field>

      <FormSeperator />

      <form.Field
        name="id"
        children={(field) => (
          <TextField field={field} disabled={true} name="Employee Id" id="id" placeholder="id" />
        )}
      />

      <FormSeperator />

      <form.Field
        name="firstName"
        children={(field) => (
          <TextField
            field={field}
            disabled={!editing}
            name="First Name"
            id="firstName"
            placeholder="firstname"
          />
        )}
      />

      <FormSeperator />

      <form.Field
        name="lastName"
        children={(field) => (
          <TextField
            field={field}
            disabled={!editing}
            name="Last Name"
            id="lastName"
            placeholder="lastname"
          />
        )}
      />

      <FormSeperator />

      <form.Field
        name="wso2Email"
        children={(field) => (
          <EmailField
            field={field}
            disabled={true}
            name="Work Email"
            id="wso2Email"
            placeholder="sample@wso2.com"
          />
        )}
      />

      <FormSeperator />

      <form.Field
        name="epf"
        children={(field) => (
          <TextField field={field} disabled={!editing} name="Epf" id="epf" placeholder="EPF" />
        )}
      />

      <FormSeperator />

      <form.Field
        name="employeeLocation"
        children={(field) => (
          <TextField
            field={field}
            disabled={!editing}
            name="Employee Location"
            id="employeeLocation"
            placeholder="colombo"
          />
        )}
      />

      <FormSeperator />

      <form.Field name="workPhoneNumber">
        {(field) => (
          <div className={`flex flex-row justify-between items-center`}>
            <Label id="workPhoneNumber" htmlFor={"Work Phone Number"}>
              Work Phone Number
            </Label>
            <PhoneInput
              value={field.state.value ?? null}
              onChange={(v) => field.handleChange(v ?? null)}
              defaultCountry="LK"
              international
              disabled={!editing}
            />
          </div>
        )}
      </form.Field>

      <FormSeperator />

      <form.Field
        name="managerEmail"
        children={(field) => (
          <EmailField
            field={field}
            disabled={!(editing && hasAdmin)}
            name="Manager Email"
            id="managerEmail"
            placeholder="sample@wso2.com"
          />
        )}
      />

      <FormSeperator />

      <form.Field
        name="reportToEmail"
        children={(field) => (
          <EmailField
            field={field}
            disabled={!(editing && hasAdmin)}
            name="Report Email"
            id="reportToEmail"
            placeholder="sample@wso2.com"
          />
        )}
      />

      <FormSeperator />

      <form.Field
        name="additionalManagerEmail"
        children={(field) => (
          <EmailField
            field={field}
            disabled={!(editing && hasAdmin)}
            name="Additional Manager Email"
            id="additionalManagerEmail"
            placeholder="sample@wso2.com"
          />
        )}
      />

      <FormSeperator />

      <form.Field
        name="additionalReportToEmail"
        children={(field) => (
          <EmailField
            field={field}
            disabled={!(editing && hasAdmin)}
            name="Additional Report To Email"
            id="additionalReportToEmail"
            placeholder="sample@wso2.com"
          />
        )}
      />

      <FormSeperator />

      <form.Field
        name="lengthOfService"
        children={(field) => (
          <div className={`flex flex-row justify-between items-center`}>
            <Label htmlFor={"lastName"}>Length of Service</Label>
            <div className="flex flex-col gap-1 justify-end">
              <Input
                disabled={!(editing && hasAdmin)}
                className={`border-st-border-light text-right w-72 ${
                  !editing
                    ? [
                        "text-st-200",
                        "disabled:opacity-100", // cancel dimming
                        "disabled:border-0 disabled:shadow-none disabled:bg-transparent",
                        "focus-visible:ring-0 focus-visible:border-transparent",
                        "disabled:px-0 disabled:py-0 ",
                      ].join(" ")
                    : "text-st-300 p-m px-3 py-1"
                }`}
                type="number"
                value={field.state.value ?? 0}
                onChange={(e) => field.handleChange(Number(e.target.value))}
              ></Input>
              {field.state.meta.errors[0] && (
                <p className="text-red-500 text-right">{field.state.meta.errors[0].message}</p>
              )}
            </div>
          </div>
        )}
      />

      <FormSeperator />

      <form.Field
        name="subordinateCount"
        children={(field) => (
          <div className={`flex flex-row justify-between items-center`}>
            <Label htmlFor={"lastName"}>Subordinate Count</Label>
            <div className="flex flex-col gap-1 justify-end">
              <Input
                disabled={!(editing && hasAdmin)}
                className={`border-st-border-light text-right w-72 ${
                  !editing
                    ? [
                        "text-st-200",
                        "disabled:opacity-100", // cancel dimming
                        "disabled:border-0 disabled:shadow-none disabled:bg-transparent",
                        "focus-visible:ring-0 focus-visible:border-transparent",
                        "disabled:px-0 disabled:py-0 ",
                      ].join(" ")
                    : "text-st-300 p-m px-3 py-1"
                }`}
                type="number"
                value={field.state.value ?? 0}
                onChange={(e) => field.handleChange(Number(e.target.value))}
              ></Input>
              {field.state.meta.errors[0] && (
                <p className="text-red-500 text-right">{field.state.meta.errors[0].message}</p>
              )}
            </div>
          </div>
        )}
      />

      <FormSeperator />

      <form.Field name="startDate" validators={{ onChange: YMDDateSchema }}>
        {(field) => (
          <DatePickerField label="Start Date" field={field} disabled={!(editing && hasAdmin)} />
        )}
      </form.Field>

      <FormSeperator />

      <form.Field name="probationEndDate" validators={{ onChange: YMDDateSchema }}>
        {(field) => (
          <DatePickerField
            label="Probation End Date"
            field={field}
            disabled={!(editing && hasAdmin)}
          />
        )}
      </form.Field>

      <FormSeperator />

      <form.Field name="agreementEndDate" validators={{ onChange: NullableYMDDateSchema }}>
        {(field) => (
          <DatePickerField
            label="Agreement End Date"
            field={field}
            disabled={!(editing && hasAdmin)}
          />
        )}
      </form.Field>

      <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting] as const}>
        {([canSubmit, isSubmitting]) => (
          <>
            {editing && (
              <div className="flex w-full justify-between items-center">
                <Button
                  variant="outline"
                  type="reset"
                  className="border-st-border-medium"
                  onClick={(event) => {
                    toggleEditing();
                    event.preventDefault();
                    handleFormCancelation();
                  }}
                >
                  Reset
                </Button>

                <Button
                  type="submit"
                  disabled={!canSubmit || isSubmitting}
                  className="rounded px-4 py-2 border bg-st-bg-secondary"
                  onClick={() => toggleEditing()}
                >
                  {isSubmitting ? "Saving..." : "Submit changes"}
                </Button>
              </div>
            )}
          </>
        )}
      </form.Subscribe>
      {/* <pre className="text-xs">{JSON.stringify(form.state, null, 2)}</pre> */}
    </form>
  );
}

export default EmployeeInfoForm;
