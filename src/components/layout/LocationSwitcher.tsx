/**
 * LocationSwitcher — active sede selector in the dashboard topbar.
 *
 * Rationale:
 * - Popover with a searchable list scales past 3-4 sedes without cramping.
 * - "Todas las sedes" as first item makes the "no filter" state a first-class
 *   choice instead of a hidden default.
 */
import * as React from "react";
import { Check, ChevronsUpDown, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useLocationContext } from "@/context/LocationContext";

export function LocationSwitcher() {
  const { locations, activeLocation, setActiveLocationId, loading } = useLocationContext();
  const [open, setOpen] = React.useState(false);

  if (loading && !locations.length) {
    return (
      <div className="h-9 w-44 animate-pulse rounded-full bg-muted/40" aria-hidden />
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          role="combobox"
          aria-expanded={open}
          className="h-11 gap-1.5 rounded-full border-border bg-muted/30 px-3 text-sm font-medium hover:bg-muted/60 sm:h-9 sm:gap-2"
        >
          <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
          {/* Móvil: nombre truncado a 12 caracteres. Desktop: nombre completo. */}
          <span className="max-w-[92px] truncate sm:hidden">
            {label.length > 12 ? `${label.slice(0, 12)}…` : label}
          </span>
          <span className="hidden max-w-[160px] truncate sm:inline">{label}</span>
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-64 p-0" align="end">
        <Command>
          <CommandInput placeholder="Buscar sede…" />
          <CommandList>
            <CommandEmpty>Sin sedes.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="__all__"
                onSelect={() => {
                  setActiveLocationId(null);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    activeLocation === null ? "opacity-100" : "opacity-0"
                  )}
                />
                Todas las sedes
              </CommandItem>
              {locations.map((loc) => (
                <CommandItem
                  key={loc.id}
                  value={loc.name}
                  onSelect={() => {
                    setActiveLocationId(loc.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      activeLocation?.id === loc.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span>{loc.name}</span>
                    {loc.address && (
                      <span className="text-xs text-muted-foreground">{loc.address}</span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
