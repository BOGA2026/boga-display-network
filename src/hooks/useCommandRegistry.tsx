/**
 * Command registry — global, extensible list of Command Palette actions.
 * Pages can register/unregister contextual commands via `useRegisterCommand`.
 */
import * as React from "react";

export type CommandItem = {
  id: string;
  label: string;
  group: "Navegación" | "Acciones" | "Ayuda" | "Sedes" | string;
  icon?: React.ReactNode;
  keywords?: string[];
  /** Peso base para `getCommandScore()`; el orden nunca es el de registro. */
  priority?: number;
  onSelect: () => void;
};

type State = {
  items: CommandItem[];
  register: (items: CommandItem[]) => () => void;
};

const CommandContext = React.createContext<State | null>(null);

export function CommandRegistryProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<CommandItem[]>([]);

  const register = React.useCallback((newItems: CommandItem[]) => {
    setItems((prev) => {
      const ids = new Set(newItems.map((i) => i.id));
      return [...prev.filter((i) => !ids.has(i.id)), ...newItems];
    });
    return () => {
      setItems((prev) => prev.filter((i) => !newItems.find((n) => n.id === i.id)));
    };
  }, []);

  const value = React.useMemo(() => ({ items, register }), [items, register]);
  return <CommandContext.Provider value={value}>{children}</CommandContext.Provider>;
}

export function useCommandRegistry() {
  const ctx = React.useContext(CommandContext);
  if (!ctx) throw new Error("useCommandRegistry must be used within CommandRegistryProvider");
  return ctx;
}

export function useRegisterCommand(items: CommandItem[]) {
  const { register } = useCommandRegistry();
  React.useEffect(() => register(items), [register, items]);
}
