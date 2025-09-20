import { Check, ChevronsUpDown } from "lucide-react";

import * as React from "react";

import { cn } from "../../lib/utils";
import { Button } from "./button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./command";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

type Item = { id: number; name: string; headEmail?: string };

interface ComboBoxProps {
  data: Item[];
  valueId: number | undefined | null;
  disabled?: boolean;
  placeholder?: string | number;
  onChange: (id: number | null, item?: Item) => void;
  onBlur?: () => void;
}

export default function Combobox(props: ComboBoxProps) {
  const { data, valueId, disabled, placeholder, onChange, onBlur } = props;
  const [open, setOpen] = React.useState(false);
  const selected = React.useMemo(() => data.find((x) => x.id === valueId) ?? null, [data, valueId]);

  return (
    <Popover
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[240px] justify-between"
          disabled={disabled}
        >
          {selected ? selected.name : placeholder}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[240px] p-0">
        <Command>
          <CommandInput placeholder="Search..." className="h-9" />
          <CommandList>
            <CommandEmpty>No results.</CommandEmpty>
            <CommandGroup>
              {data.map((item) => (
                <CommandItem
                  key={item.id}
                  value={item.name}
                  onSelect={() => {
                    setOpen(false);
                    onChange(item.id, item);
                  }}
                >
                  {item.name}
                  <Check
                    className={cn(
                      "ml-auto",
                      selected?.id === item.id ? "opacity-100" : "opacity-0",
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
