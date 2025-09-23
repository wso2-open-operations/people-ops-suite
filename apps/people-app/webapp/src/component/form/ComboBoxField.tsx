import { ComboOption } from "@root/src/types/types";
import { fieldClass } from "@root/src/utils/utils";
import { AnyFieldApi } from "@tanstack/react-form";

import { Combobox } from "../common/combobox";
import { Label } from "../common/label";

interface ComboboxFieldProps {
  field: AnyFieldApi;
  optionsArray: ComboOption[];
  disabled: boolean;
  id: string;
  name: string;
  placeholder?: string;
  className?: string;
}

export function ComboboxField(props: ComboboxFieldProps) {
  const { field, optionsArray, id, name, disabled, placeholder } = props;

  const fieldStyle = fieldClass(disabled);

  return (
    <div className={`flex flex-row justify-between items-center`}>
      <Label id={id} htmlFor={id}>
        {name}
      </Label>
      <div className="flex flex-col gap-1 justify-end">
        <Combobox
          className={fieldStyle}
          field={field}
          options={optionsArray}
          placeholder={placeholder}
          disabled={disabled}
        />
        {field.state.meta.errors[0] && (
          <p className="text-red-500 text-right">{field.state.meta.errors[0].message}</p>
        )}
      </div>
    </div>
  );
}
