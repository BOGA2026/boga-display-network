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
import { GROUP_ORDER, getCommandScore, matchScore, recordUsage, sortByScore } from "@/lib/commands";

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

  const [query, setQuery] = React.useState("");
  React.useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const grouped = React.useMemo(() => {
    // Filtrado y orden propios: cmdk queda con `shouldFilter={false}` porque su
    // coincidencia difusa devolvía "Monitoreo" al escribir "menu".
    const scored = items
      .map((item) => ({ item, relevance: matchScore(item, query) }))
      .filter((entry) => entry.relevance > 0);

    const map = new Map<string, typeof scored>();
    for (const entry of scored) {
      const arr = map.get(entry.item.group) ?? [];
      arr.push(entry);
      map.set(entry.item.group, arr);
    }

    const rank = (arr: typeof scored) =>
      query.trim()
        ? [...arr]
            .sort(
              (a, b) =>
                b.relevance - a.relevance ||
                getCommandScore(b.item) - getCommandScore(a.item) ||
                a.item.label.localeCompare(b.item.label, "es"),
            )
            .map((e) => e.item)
        : sortByScore(arr.map((e) => e.item));

    const sorted: [string, Cmd[]][] = [];
    for (const key of GROUP_ORDER) {
      const group = map.get(key);
      if (group?.length) {
        sorted.push([key, rank(group)]);
        map.delete(key);
      }
    }
    // Grupos contextuales registrados por páginas: al final.
    for (const [k, v] of map) sorted.push([k, rank(v)]);
    return sorted;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, rankKey, query]);

  const handleSelect = (item: Cmd) => {
    recordUsage(item.id);
    onOpenChange(false);
    item.onSelect();
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} commandProps={{ shouldFilter: false }}>
      <CommandInput placeholder="Buscar o ejecutar…" value={query} onValueChange={setQuery} />
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
