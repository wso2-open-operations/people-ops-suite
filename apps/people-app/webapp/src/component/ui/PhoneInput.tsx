"use client";

import { CheckIcon, ChevronsUpDown } from "lucide-react";
import PhoneNumberInput, {
  type Country,
  type FlagProps,
  type Value as PhoneValue,
  formatPhoneNumberIntl,
  getCountryCallingCode,
  isValidPhoneNumber,
} from "react-phone-number-input";
import flags from "react-phone-number-input/flags";

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
import { Input } from "../common/input";
import { Popover, PopoverContent, PopoverTrigger } from "../common/popover";
import { ScrollArea } from "../common/scroll-area";

type BaseInputProps = Omit<React.ComponentProps<"input">, "value" | "onChange" | "ref">;

type PhoneInputProps = BaseInputProps & {
  value: string | null;
  onChange: (val: string | null) => void;
  defaultCountry?: Country;
  international?: boolean;
  countries?: Country[];
  disabled?: boolean;
};

// helpers to bridge types safely
function toE164(value: string | null | undefined): PhoneValue | undefined {
  if (!value) return undefined;
  const test = isValidPhoneNumber(value) ? (value as PhoneValue) : undefined;
  return test;
}
function fromE164(value: PhoneValue | undefined): string | null {
  return value ? String(value) : null;
}
export const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ className, value, onChange, disabled, ...props }, ref) => {
    if (disabled) {
      const display = value ? formatPhoneNumberIntl(value) : "";
      return (
        <div
          className={cn(
            "flex w-72 items-center justify-end rounded-lg",
            "text-right py-1 p-r text-st-200",
            className,
          )}
          aria-disabled="true"
          role="textbox"
          tabIndex={-1}
        >
          <p>{display || "-"}</p>
        </div>
      );
    }
    return (
      <PhoneNumberInput
        ref={ref as any}
        className={cn("flex", className)}
        flagComponent={Flag}
        countrySelectComponent={CountrySelect}
        inputComponent={TextInput}
        smartCaret={false}
        value={toE164(value)}
        onChange={(v) => onChange(fromE164(v))}
        disabled={disabled}
        {...props}
      />
    );
  },
);
PhoneInput.displayName = "PhoneInput";

/** Right-hand text input (shadcn) */
const TextInput = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, disabled, ...props }, ref) => (
    <Input
      ref={ref}
      className={cn("rounded-e-lg rounded-s-none w-60 text-right", className)}
      {...props}
    />
  ),
);
TextInput.displayName = "TextInput";

/** Left country picker (shadcn Popover + Command) */
type CountryEntry = { label: string; value: Country | undefined };
type CountrySelectProps = {
  value: Country;
  onChange: (country: Country) => void;
  options: CountryEntry[];
  disabled?: boolean;
};

const CountrySelect = ({
  value: selectedCountry,
  onChange,
  options,
  disabled,
}: CountrySelectProps) => {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="flex gap-1 rounded-e-none rounded-s-lg border-r-0 px-3 focus:z-10 "
          disabled={disabled}
          aria-label="Select country"
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <Flag country={selectedCountry} countryName={selectedCountry} />
          <ChevronsUpDown className={cn("-mr-2 size-4", disabled ? "hidden" : "opacity-50")} />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-64 p-0" align="start">
        <Command>
          {/* Uncontrolled; Command filters items by text automatically */}
          <CommandInput placeholder="Search country..." />
          <CommandList>
            <ScrollArea className="h-72">
              <CommandEmpty>No country found.</CommandEmpty>
              <CommandGroup>
                {options.map(({ value, label }) =>
                  value ? (
                    <CountryRow
                      key={value}
                      country={value}
                      countryName={label}
                      selectedCountry={selectedCountry}
                      onPick={(c) => {
                        onChange(c);
                        setOpen(false);
                      }}
                    />
                  ) : null,
                )}
              </CommandGroup>
            </ScrollArea>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

const CountryRow = React.memo(function CountryRow({
  country,
  countryName,
  selectedCountry,
  onPick,
}: {
  country: Country;
  countryName: string;
  selectedCountry: Country;
  onPick: (c: Country) => void;
}) {
  return (
    <CommandItem className="gap-2" onSelect={() => onPick(country)}>
      <Flag country={country} countryName={countryName} />
      <span className="flex-1 text-sm">{countryName}</span>
      <span className="text-sm text-foreground/50">{`+${getCountryCallingCode(country)}`}</span>
      <CheckIcon
        className={cn("ml-auto size-4", country === selectedCountry ? "opacity-100" : "opacity-0")}
      />
    </CommandItem>
  );
});

/** Flag SVGs from the library (kept tiny and styled by us) */
const Flag = ({ country, countryName }: FlagProps) => {
  const Svg = flags[country];
  return (
    <span className="flex h-4 w-6 overflow-hidden rounded-sm bg-foreground/20 [&_svg:not([class*='size-'])]:size-full">
      {Svg && <Svg title={countryName} />}
    </span>
  );
};
