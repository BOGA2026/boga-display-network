import { useState } from "react";
import { Loader2, ArrowRight, Check } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";

const SUBMIT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/submit-lead`;

const leadSchema = z.object({
  name: z.string().trim().min(2, "Ingresa tu nombre").max(100),
  email: z.string().trim().email("Correo inválido").max(255),
  phone: z.string().trim().min(7, "Teléfono inválido").max(20),
  company: z.string().trim().max(150).optional(),
  screens: z.number().int().min(1).max(999),
  goal: z.string().max(500).optional(),
  budget: z.string().max(100).optional(),
  preferred_contact: z.enum(["chatbot", "asesor"]),
});

type LeadForm = z.infer<typeof leadSchema>;

const UNIT_PRICE = 50_000;

export function VisualiaChatbot() {
  const [form, setForm] = useState<Partial<LeadForm>>({
    screens: 1,
    preferred_contact: "chatbot",
  });
  const [sim, setSim] = useState<{ suggested: string; total: number } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const update = (patch: Partial<LeadForm>) => {
    setForm((prev) => ({ ...prev, ...patch }));
    // clear field error on change
    Object.keys(patch).forEach((k) => setErrors((prev) => ({ ...prev, [k]: "" })));
  };

  const simulate = () => {
    const screens = Number(form.screens || 1);
    const suggested =
      screens <= 5 ? "Plan Starter" : screens <= 20 ? "Plan Pro" : "Plan Enterprise";
    setSim({ suggested, total: screens * UNIT_PRICE });
  };

  const submit = async () => {
    const parsed = leadSchema.safeParse({
      ...form,
      screens: Number(form.screens || 1),
    });

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        const key = issue.path[0] as string;
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      const events = [
        { step: "pantallas", answer: String(parsed.data.screens) },
        { step: "contacto", answer: parsed.data.preferred_contact },
      ];

      const res = await fetch(SUBMIT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ ...parsed.data, events }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Error al enviar");

      setSubmitted(true);
      toast.success("¡Listo! Te contactamos pronto.");
    } catch (e: any) {
      toast.error(e.message || "Error de conexión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl p-8 text-center"
        style={{
          background: "linear-gradient(180deg, hsl(260 25% 12%) 0%, hsl(260 30% 6%) 100%)",
          border: "1px solid hsl(270 100% 60% / 0.3)",
        }}
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-full"
          style={{ background: "hsl(150 80% 40% / 0.15)", border: "1px solid hsl(150 80% 40% / 0.3)" }}>
          <Check className="h-7 w-7" style={{ color: "hsl(150 80% 55%)" }} />
        </div>
        <p className="text-lg font-semibold text-foreground">¡Recibimos tu solicitud!</p>
        <p className="text-sm text-muted-foreground">
          Un asesor de Visualia se pondrá en contacto contigo muy pronto.
        </p>
      </div>
    );
  }

  const inputClass =
    "w-full rounded-xl bg-transparent px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors";
  const inputStyle = (hasError: boolean) => ({
    background: "hsl(260 20% 10%)",
    border: `1px solid ${hasError ? "hsl(0 80% 50% / 0.6)" : "hsl(270 30% 20%)"}`,
  });

  return (
    <div className="flex flex-col gap-4 rounded-2xl p-6"
      style={{
        background: "linear-gradient(180deg, hsl(260 25% 12%) 0%, hsl(260 30% 6%) 100%)",
        border: "1px solid hsl(270 100% 60% / 0.3)",
        boxShadow: "0 0 40px 8px hsl(270 100% 50% / 0.1)",
      }}
    >
      <p className="text-sm font-semibold text-foreground">Cotiza tu plan en segundos</p>

      {/* Name */}
      <div>
        <input
          placeholder="Tu nombre"
          value={form.name ?? ""}
          onChange={(e) => update({ name: e.target.value })}
          className={inputClass}
          style={inputStyle(!!errors.name)}
        />
        {errors.name && <p className="mt-1 text-xs" style={{ color: "hsl(0 80% 60%)" }}>{errors.name}</p>}
      </div>

      {/* Email */}
      <div>
        <input
          placeholder="Correo electrónico"
          type="email"
          value={form.email ?? ""}
          onChange={(e) => update({ email: e.target.value })}
          className={inputClass}
          style={inputStyle(!!errors.email)}
        />
        {errors.email && <p className="mt-1 text-xs" style={{ color: "hsl(0 80% 60%)" }}>{errors.email}</p>}
      </div>

      {/* Phone */}
      <div>
        <input
          placeholder="Teléfono"
          type="tel"
          value={form.phone ?? ""}
          onChange={(e) => update({ phone: e.target.value })}
          className={inputClass}
          style={inputStyle(!!errors.phone)}
        />
        {errors.phone && <p className="mt-1 text-xs" style={{ color: "hsl(0 80% 60%)" }}>{errors.phone}</p>}
      </div>

      {/* Company (optional) */}
      <input
        placeholder="Empresa (opcional)"
        value={form.company ?? ""}
        onChange={(e) => update({ company: e.target.value })}
        className={inputClass}
        style={inputStyle(false)}
      />

      {/* Screens + simulate */}
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <label className="mb-1 block text-xs text-muted-foreground">Pantallas</label>
          <input
            type="number"
            min={1}
            max={999}
            value={form.screens ?? 1}
            onChange={(e) => update({ screens: Math.max(1, Number(e.target.value)) })}
            className={inputClass}
            style={inputStyle(false)}
          />
        </div>
        <button
          onClick={simulate}
          className="rounded-xl px-4 py-3 text-sm font-medium transition-all hover:brightness-110"
          style={{
            background: "hsl(270 30% 18%)",
            color: "hsl(270 100% 80%)",
            border: "1px solid hsl(270 100% 60% / 0.3)",
          }}
        >
          Simular
        </button>
      </div>

      {/* Simulation result */}
      {sim && (
        <div className="flex items-center justify-between rounded-xl px-4 py-3"
          style={{ background: "hsl(270 100% 50% / 0.08)", border: "1px solid hsl(270 100% 60% / 0.2)" }}>
          <span className="text-sm font-medium" style={{ color: "hsl(270 100% 80%)" }}>{sim.suggested}</span>
          <span className="text-sm font-bold text-foreground">
            ${sim.total.toLocaleString("es-CO")} COP/mes
          </span>
        </div>
      )}

      {/* Preferred contact */}
      <select
        value={form.preferred_contact ?? "chatbot"}
        onChange={(e) => update({ preferred_contact: e.target.value as "chatbot" | "asesor" })}
        className="w-full rounded-xl px-4 py-3 text-sm text-foreground outline-none"
        style={{ background: "hsl(260 20% 10%)", border: "1px solid hsl(270 30% 20%)" }}
      >
        <option value="chatbot">Comprar plan ahora</option>
        <option value="asesor">Hablar con asesor real</option>
      </select>

      {/* Submit */}
      <button
        onClick={submit}
        disabled={loading}
        className="flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold text-white transition-all hover:brightness-110 disabled:opacity-50"
        style={{
          background: "linear-gradient(135deg, hsl(270 80% 55%), hsl(290 80% 50%))",
          boxShadow: "0 0 20px 2px hsl(270 100% 50% / 0.25)",
        }}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            Continuar <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>
    </div>
  );
}
