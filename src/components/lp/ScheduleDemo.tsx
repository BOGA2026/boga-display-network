import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import WallDisplay from "@/components/lp/WallDisplay";
import DemoMenu, { DEMO_MENUS } from "@/components/lp/DemoMenu";

/**
 * Demostración del producto: la pantalla de pared con el menú y el celular
 * que la controla. La franja horaria cambia el contenido en vivo, que es el
 * diferenciador real frente a un televisor con una memoria USB.
 *
 * `auto` rota sola cada pocos segundos hasta que la persona toca el selector.
 */
export default function ScheduleDemo({
  auto = true,
  compact = false,
}: {
  auto?: boolean;
  compact?: boolean;
}) {
  const [index, setIndex] = useState(1); // arranca en almuerzo
  const [touched, setTouched] = useState(false);
  const menu = DEMO_MENUS[index];

  useEffect(() => {
    if (!auto || touched) return;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % DEMO_MENUS.length), 4000);
    return () => window.clearInterval(id);
  }, [auto, touched]);

  return (
    <div className={compact ? "" : "grid items-center gap-6 md:grid-cols-[1.6fr_1fr]"}>
      <WallDisplay>
        <DemoMenu menu={menu} />
      </WallDisplay>

      <div className={compact ? "mt-4" : ""}>
        {/* Celular: el panel que manda sobre la pantalla */}
        <div className="mx-auto w-full max-w-[220px] rounded-[22px] border border-border/70 bg-card/70 p-3 shadow-[0_20px_50px_-30px_hsl(var(--foreground)/0.5)]">
          <span className="mx-auto mb-3 block h-1 w-10 rounded-full bg-muted-foreground/40" />
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-primary">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            Horario
          </p>
          <div className="mt-2 space-y-1.5" role="group" aria-label="Franja horaria de la pantalla">
            {DEMO_MENUS.map((m, i) => {
              const active = i === index;
              return (
                <button
                  key={m.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    setIndex(i);
                    setTouched(true);
                  }}
                  className={`flex w-full items-center justify-between rounded-lg border px-2.5 py-2 text-left text-xs transition ${
                    active
                      ? "border-primary bg-primary/15 text-foreground"
                      : "border-border/50 text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  <span className="font-medium">{m.label}</span>
                  <span className="text-[10px] opacity-70">{m.range}</span>
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-[11px] leading-snug text-muted-foreground">
            Lo programas una vez y la pantalla cambia sola.
          </p>
        </div>
      </div>
    </div>
  );
}
