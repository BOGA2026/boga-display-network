import { useState } from "react";
import { CheckCircle2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TV_BRANDS } from "@/config/devices";

type Answer = "compatible" | "necesita" | "preguntar" | null;

/**
 * Verificador de marcas para la landing de campañas. Misma lógica que la
 * página principal, pero sin ningún enlace de salida: la única acción es
 * bajar al formulario o escribir por WhatsApp.
 */
export default function BrandChecker() {
  const [brand, setBrand] = useState<string | null>(null);
  const [answer, setAnswer] = useState<Answer>(null);

  const pick = (id: string) => {
    const verdict = TV_BRANDS.find((t) => t.id === id)?.verdict ?? "desconocido";
    setBrand(id);
    setAnswer(
      verdict === "probable" ? "compatible" : verdict === "necesita_dispositivo" ? "necesita" : "preguntar",
    );
  };

  return (
    <div className="rounded-2xl border border-border/60 bg-card/40 p-4 md:p-6">
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {TV_BRANDS.filter((b) => b.id !== "no_se").map((b) => {
          const active = brand === b.id;
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => pick(b.id)}
              aria-pressed={active}
              className={`flex h-14 items-center justify-center rounded-xl border px-2 text-center text-sm font-semibold transition ${
                active
                  ? "border-primary bg-primary/15 text-foreground"
                  : "border-border/50 bg-card/40 text-muted-foreground hover:border-primary/50 hover:text-foreground"
              }`}
            >
              {b.name}
            </button>
          );
        })}
      </div>

      {answer && (
        <div className="mt-5 rounded-xl border border-border/50 bg-background/40 p-4">
          {answer === "compatible" && (
            <div className="flex gap-3">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" aria-hidden="true" />
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">Tu televisor probablemente ya funciona.</span>{" "}
                Solo confirma que en el menú de aplicaciones aparezca Google Play Store. Si está, no necesitas
                comprar nada más.
              </p>
            </div>
          )}
          {answer === "necesita" && (
            <div className="flex gap-3">
              <Info className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">Ese televisor necesita un aparato pequeño.</span>{" "}
                Te lo enviamos configurado y con tu pantalla ya vinculada. Con el pago anual va incluido.
              </p>
            </div>
          )}
          {answer === "preguntar" && (
            <div>
              <p className="text-sm text-foreground">
                Busca Google Play Store en el menú de aplicaciones de tu televisor.
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                <Button size="sm" onClick={() => setAnswer("compatible")}>
                  Sí, la veo
                </Button>
                <Button size="sm" variant="outline" onClick={() => setAnswer("necesita")}>
                  No la encuentro
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
