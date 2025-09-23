// DatePickerField.tsx
import { fromYmdStringStrict, toYmdString } from "@root/src/utils/utils";
import type { AnyFieldApi } from "@tanstack/react-form";
import { CalendarIcon } from "lucide-react";

import * as React from "react";

import { Button } from "../common/button";
import { Calendar } from "../common/calendar";
import { Input } from "../common/input";
import { Label } from "../common/label";
import { Popover, PopoverContent, PopoverTrigger } from "../common/popover";

interface DatePickerFieldProps {
  label: string;
  field: AnyFieldApi;
  disabled: boolean;
  startMonth?: Date;
  endMonth?: Date;
  placeholder?: string;
  id?: string;
}

export default function DatePickerField({
  label,
  field,
  disabled,
  startMonth = new Date(2024, 0),
  endMonth = new Date(2028, 11),
  placeholder = "-",
  id = "date",
}: DatePickerFieldProps) {
  const [open, setOpen] = React.useState(false);

  const ymdToDate = (ymd: { year: number; month: number; day: number } | null) =>
    ymd ? new Date(ymd.year, ymd.month - 1, ymd.day) : null;

  const dateToYmd = (d: Date | null) =>
    d ? { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() } : null;

  const selectedDate = ymdToDate(field.state.value) ?? undefined;

  return (
    <div className={`flex flex-row justify-between items-center`}>
      <Label htmlFor="date" className="p-r">
        {label}
      </Label>

      <div className="flex flex-col gap-1">
        <div className="relative flex justify-start items-start gap-2">
          <Input
            id={id}
            value={toYmdString(field.state.value)}
            onChange={(e) => {
              const validDate = fromYmdStringStrict(e.target.value);
              if (validDate) {
                field.handleChange(validDate);
              } else {
                e.currentTarget.value = toYmdString(field.state.value);
              }
            }}
            placeholder={placeholder}
            disabled={disabled}
            className={`border-st-border-light w-72 ${
              disabled
                ? [
                    "text-right",
                    "text-st-200",
                    "disabled:opacity-100",
                    "disabled:border-0 disabled:shadow-none disabled:bg-transparent",
                    "focus-visible:ring-0 focus-visible:border-transparent",
                    "disabled:px-0 disabled:py-0 ",
                  ].join(" ")
                : "text-st-300 p-m px-3 py-1"
            }`}
            onKeyDown={(e) => {
              const allowed = [
                "Backspace",
                "Delete",
                "Tab",
                "ArrowLeft",
                "ArrowRight",
                "Home",
                "End",
              ];
              if (allowed.includes(e.key)) return;
              if (/^\d$/.test(e.key)) return;
              e.preventDefault();
            }}
            onPaste={(e) => {
              const text = e.clipboardData.getData("text");
              if (!/^\d+$/.test(text)) e.preventDefault();
            }}
            onKeyUp={(e) => {
              if (e.key === "ArrowDown" && disabled) setOpen(true);
            }}
          />

          {!disabled && (
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  id="date-picker"
                  variant="ghost"
                  className="absolute top-1/2 right-2 size-6 -translate-y-1/2"
                >
                  <CalendarIcon className="size-3.5" />
                  <span className="sr-only">Select date</span>
                </Button>
              </PopoverTrigger>

              <PopoverContent
                className="w-auto overflow-hidden p-0"
                align="end"
                alignOffset={-8}
                sideOffset={10}
              >
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  defaultMonth={selectedDate ?? new Date()}
                  captionLayout="dropdown"
                  startMonth={startMonth}
                  endMonth={endMonth}
                  onSelect={(d) => {
                    field.handleChange(dateToYmd(d ?? null));
                    setOpen(false);
                  }}
                />
              </PopoverContent>
            </Popover>
          )}
        </div>

        {field.state.meta.errors[0] && (
          <p className="text-red-500 text-right">{field.state.meta.errors[0].message}</p>
        )}
      </div>
    </div>
  );
}
