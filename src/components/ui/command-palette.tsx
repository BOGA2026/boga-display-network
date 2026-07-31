/**
 * CommandPalette — ⌘K global launcher.
 *
 * - Construido sobre shadcn `command` (cmdk): teclado, filtrado y a11y gratis.
 * - Los comandos vienen del registry, que se alimenta de `buildCommands()`.
 * - El orden dentro de cada grupo lo decide `getCommandScore()` (mayor → menor),
 *   así que aprende del uso real vía `recordUsage()`.
 * - Grupos en orden fijo: Navegación → Acciones → Ayuda → Sedes.
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
import { GROUP_ORDER, recordUsage, sortByScore } from "@/lib/commands";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: Props) {
  const { items } = useCommandRegistry();
  // Recalcula el ranking cada vez que se abre (el uso puede haber cambiado).
  const [rankKey, setRankKey] = React.useState(0);
  React.useEffect(() => {
    if (open) setRankKey((k) => k + 1);
  }, [open]);

  const grouped = React.useMemo(() => {
    const map = new Map<string, Cmd[]>();
    for (const item of items) {
      const arr = map.get(item.group) ?? [];
      arr.push(item);
      map.set(item.group, arr);
    }

    const sorted: [string, Cmd[]][] = [];
    for (const key of GROUP_ORDER) {
      const group = map.get(key);
      if (group?.length) {
        sorted.push([key, sortByScore(group)]);
        map.delete(key);
      }
    }
    // Grupos contextuales registrados por páginas: al final.
    for (const [k, v] of map) sorted.push([k, sortByScore(v)]);
    return sorted;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, rankKey]);

  const handleSelect = (item: Cmd) => {
    recordUsage(item.id);
    onOpenChange(false);
    item.onSelect();
  };

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
                  // cmdk filtra por `value`: incluimos alias del vocabulario viejo
                  // ("Playlists", "Horarios", "Analytics"…).
                  value={`${item.label} ${item.keywords?.join(" ") ?? ""}`}
                  onSelect={() => handleSelect(item)}
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
