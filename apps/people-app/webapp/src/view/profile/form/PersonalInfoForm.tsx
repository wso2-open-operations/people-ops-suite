import { usePersonalInfoForm } from "@root/src/hooks/usePersonalInfoForm";

import { Button } from "@component/common/button";

import DatePickerField from "../../../component/form/DatePicker";
import { TextField } from "../../../component/form/TextField";

interface PersonalInfoFormProps {
  editing: boolean;
  toggleEditing: () => void;
}

function PersonalInfoForm(props: PersonalInfoFormProps) {
  const { toggleEditing, editing } = props;
  const { form, handleFormCancelation } = usePersonalInfoForm();

  const FormSeperator = () => <div className="w-full h-[0.5px] bg-st-border-light"></div>;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className={`flex flex-col gap-4`}
    >
      <form.Field name="nic">
        {(field) => {
          return (
            <TextField
              field={field}
              disabled={!editing}
              name="Employee Nic"
              id="nic"
              placeholder="v12421423342"
            />
          );
        }}
      </form.Field>

      <FormSeperator />

      <form.Field name="fullName">
        {(field) => {
          return (
            <TextField
              field={field}
              disabled={!editing}
              name="Full Name"
              id="fullName"
              placeholder="Full Name"
            />
          );
        }}
      </form.Field>

      <form.Field name="nameWithInitials">
        {(field) => (
          <TextField
            field={field}
            disabled={!editing}
            name="Name with Initials"
            id="nameWithInitials"
            placeholder="D. A. Silva"
          />
        )}
      </form.Field>

      <form.Field name="firstName">
        {(field) => (
          <TextField
            field={field}
            disabled={!editing}
            name="First Name"
            id="firstName"
            placeholder="Dineth"
          />
        )}
      </form.Field>

      <form.Field name="lastName">
        {(field) => (
          <TextField
            field={field}
            disabled={!editing}
            name="Last Name"
            id="lastName"
            placeholder="Silva"
          />
        )}
      </form.Field>

      <form.Field name="title">
        {(field) => (
          <TextField
            field={field}
            disabled={!editing}
            name="Title"
            id="title"
            placeholder="Mr. / Ms. / Dr."
          />
        )}
      </form.Field>

      <form.Field name="dob">
        {(field) => <DatePickerField field={field} disabled={!editing} label="Date of Birth" />}
      </form.Field>

      <form.Field name="address">
        {(field) => (
          <TextField
            field={field}
            disabled={!editing}
            name="Address"
            id="address"
            placeholder="Street, City"
          />
        )}
      </form.Field>

      <form.Field name="postalCode">
        {(field) => (
          <TextField
            field={field}
            disabled={!editing}
            name="Postal Code"
            id="postalCode"
            placeholder="10100"
          />
        )}
      </form.Field>

      <form.Field name="country">
        {(field) => (
          <TextField
            field={field}
            disabled={!editing}
            name="Country"
            id="country"
            placeholder="Sri Lanka"
          />
        )}
      </form.Field>

      <form.Field name="nationality">
        {(field) => (
          <TextField
            field={field}
            disabled={!editing}
            name="Nationality"
            id="nationality"
            placeholder="Sri Lankan"
          />
        )}
      </form.Field>

      {/* <form.Field name="languageSpoken">
        {(field) => (
          <TextField
            field={field}
            disabled={!editing}
            name="Languages Spoken"
            id="languageSpoken"
            placeholder='e.g., ["Sinhala","English"] or Sinhala,English'
          />
        )}
      </form.Field> */}

      <form.Field name="createdBy">
        {(field) => (
          <TextField
            field={field}
            disabled={!editing}
            name="Created By"
            id="createdBy"
            placeholder="creator@wso2.com"
          />
        )}
      </form.Field>

      {/* <form.Field name="createdOn">
        {(field) => (
          <TextField
            field={field}
            disabled={!editing}
            name="Created On"
            id="createdOn"
            type="datetime-local"
            placeholder="YYYY-MM-DDTHH:mm"
          />
        )}
      </form.Field> */}

      <form.Field name="updatedBy">
        {(field) => (
          <TextField
            field={field}
            disabled={!editing}
            name="Updated By"
            id="updatedBy"
            placeholder="editor@wso2.com"
          />
        )}
      </form.Field>

      {/* <form.Field name="updatedOn">
        {(field) => (
          <TextField
            field={field}
            disabled={!editing}
            name="Updated On"
            id="updatedOn"
            type="datetime-local"
            placeholder="YYYY-MM-DDTHH:mm"
          />
        )}
      </form.Field> */}

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

export default PersonalInfoForm;
