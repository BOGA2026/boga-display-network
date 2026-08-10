import { Sparkles, ArrowRight } from "lucide-react";
import WallDisplay from "@/components/lp/WallDisplay";
import DemoMenu, { DEMO_MENUS } from "@/components/lp/DemoMenu";

/**
 * Diferenciador: los menús se generan con inteligencia artificial a partir de
 * la lista de platos. Se muestra el antes (lo que el dueño escribe) y el
 * después (la pieza en la pantalla), que es la única forma de que se entienda.
 */
const RAW_LIST = [
  "bandeja paisa 26000",
  "sudado de pollo 21000",
  "mojarra frita 32000",
];

export default function AiMenusBlock() {
  return (
    <div className="grid items-center gap-6 md:grid-cols-2">
      <div className="rounded-2xl border border-border/60 bg-card/40 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          Lo que escribes tú
        </p>
        <ul className="mt-3 space-y-2 p-0">
          {RAW_LIST.map((l) => (
            <li
              key={l}
              className="list-none rounded-lg border border-dashed border-border/60 bg-background/40 px-3 py-2 font-mono text-xs text-muted-foreground"
            >
              {l}
            </li>
          ))}
        </ul>
        <p className="mt-4 flex items-center gap-2 text-sm font-medium text-primary">
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          La inteligencia artificial arma la pieza
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </p>
      </div>

      <WallDisplay>
        <DemoMenu menu={DEMO_MENUS[1]} />
      </WallDisplay>
    </div>
  );
}
