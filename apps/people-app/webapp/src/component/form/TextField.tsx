import { AnyFieldApi } from "@tanstack/react-form";

import { Input } from "@component/common/input";
import { Label } from "@component/common/label";
import { fieldClass } from "@utils/utils";

interface ComboboxFieldProps {
  field: AnyFieldApi;
  disabled: boolean;
  id: string;
  name: string;
  placeholder?: string;
  className?: string;
}

export function TextField(props: ComboboxFieldProps) {
  const { field, id, name, disabled, placeholder } = props;

  const fieldStyle = fieldClass(disabled);

  return (
    <div className={`flex flex-row justify-between items-center`}>
      <Label htmlFor={id}>{name}</Label>
      <div className="flex flex-col gap-1 justify-end">
        <Input
          disabled={disabled}
          className={fieldStyle}
          value={field.state.value ?? ""}
          onChange={(e) => field.handleChange(e.target.value)}
          placeholder={placeholder}
        ></Input>
        {field.state.meta.errors[0] && (
          <p className="text-red-500 text-right">{field.state.meta.errors[0].message}</p>
        )}
      </div>
    </div>
  );
}
