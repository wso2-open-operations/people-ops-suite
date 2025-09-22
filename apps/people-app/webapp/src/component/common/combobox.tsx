import { AnyFieldApi } from "@tanstack/react-form";
import { Check, ChevronsUpDown } from "lucide-react";

import * as React from "react";

import { cn } from "@utils/utils";

import { Button } from "../common/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../common/command";
import { Popover, PopoverContent, PopoverTrigger } from "../common/popover";

export type ComboOption = { label: string; value: number };

type ComboboxProps = {
  field: AnyFieldApi;
  options: ComboOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
};

export function Combobox({
  field,
  options,
  placeholder = "Select…",
  className,
  disabled,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const selected = options.find((o) => o.value === field.state.value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={`flex-end items-end ${className}`}
          disabled={disabled}
        >
          <span
            className={`w-full flex flex-row justify-between items-center ${disabled && "justify-end"}`}
          >
            <span className={`p-r ${disabled ? "text-st-200" : "text-st-300 "}`}>
              {selected ? selected.label : placeholder}
            </span>

            <ChevronsUpDown className={cn("ml-2 size-4 opacity-50", disabled && "hidden")} />
          </span>
        </Button>
      </PopoverTrigger>

      <PopoverContent className={cn("p-0", className)}>
        <Command>
          <CommandInput placeholder="Search..." className="h-9" />
          <CommandList>
            <CommandEmpty>No results.</CommandEmpty>
            <CommandGroup>
              {options.map((opt) => (
                <CommandItem
                  key={opt.value}
                  value={opt.label}
                  onSelect={() => {
                    field.handleChange(opt.value);
                    setOpen(false);
                  }}
                  className="flex items-center"
                >
                  {opt.label}
                  <Check
                    className={cn(
                      "ml-auto size-4",
                      opt.value === field.state.value ? "opacity-100" : "opacity-0",
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
