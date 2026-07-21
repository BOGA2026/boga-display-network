/**
 * CommandPalette — ⌘K global launcher.
 *
 * Rationale:
 * - Built on shadcn `command` (cmdk) so keyboard, filtering, and a11y are free.
 * - Global shortcut ⌘K / Ctrl+K wired at AppShell level.
 * - Groups keep the surface scannable: Navegación → Acciones → Sedes → extra.
 */
import * as React from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useCommandRegistry, type CommandItem as Cmd } from "@/hooks/useCommandRegistry";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: Props) {
  const { items } = useCommandRegistry();

  const grouped = React.useMemo(() => {
    const map = new Map<string, Cmd[]>();
    for (const item of items) {
      const arr = map.get(item.group) ?? [];
      arr.push(item);
      map.set(item.group, arr);
    }
    // Preferred order first
    const order = ["Navegación", "Acciones", "Sedes"];
    const sorted: [string, Cmd[]][] = [];
    for (const key of order) {
      if (map.has(key)) {
        sorted.push([key, map.get(key)!]);
        map.delete(key);
      }
    }
    for (const [k, v] of map) sorted.push([k, v]);
    return sorted;
  }, [items]);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Buscar o ejecutar…" />
      <CommandList>
        <CommandEmpty>Sin resultados.</CommandEmpty>
        {grouped.map(([group, groupItems], idx) => (
          <React.Fragment key={group}>
            {idx > 0 && <CommandSeparator />}
            <CommandGroup heading={group}>
              {groupItems.map((item) => (
                <CommandItem
                  key={item.id}
                  value={`${item.label} ${item.keywords?.join(" ") ?? ""}`}
                  onSelect={() => {
                    onOpenChange(false);
                    item.onSelect();
                  }}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </React.Fragment>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
