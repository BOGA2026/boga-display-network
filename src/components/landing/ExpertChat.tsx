import { useState, useRef, useEffect, useCallback } from "react";
import { X, Send, MessageCircle, Loader2, ArrowRight, Check, ShieldCheck } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import logoVisualia from "@/assets/simbolo-visualia.png";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;
const SUBMIT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/submit-lead`;

const LEAD_FORM_TAG = "[SHOW_LEAD_FORM]";

const leadSchema = z.object({
  name: z.string().trim().min(2, "Ingresa tu nombre").max(100),
  email: z.string().trim().email("Correo inválido").max(255),
  phone: z.string().trim().min(7, "Teléfono inválido").max(20),
  whatsapp: z.string().trim().max(20).optional(),
  company: z.string().trim().max(150).optional(),
  screens: z.number().int().min(1).max(999),
  inquiry: z.string().trim().max(1000).optional(),
  preferred_time: z.string().max(100).optional(),
  consent: z.literal(true, { errorMap: () => ({ message: "Debes aceptar el tratamiento de datos" }) }),
});

type LeadFormData = z.infer<typeof leadSchema>;

interface ExpertChatProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/* ─── Inline Lead Form ─── */
function InlineLeadForm({ onSubmitted }: { onSubmitted: () => void }) {
  const [form, setForm] = useState<Partial<LeadFormData>>({ screens: 1, consent: false as any });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const update = (patch: Partial<LeadFormData>) => {
    setForm((p) => ({ ...p, ...patch }));
    Object.keys(patch).forEach((k) => setErrors((p) => ({ ...p, [k]: "" })));
  };

  const submit = async () => {
    const parsed = leadSchema.safeParse({ ...form, screens: Number(form.screens || 1) });
    if (!parsed.success) {
      const fe: Record<string, string> = {};
      parsed.error.issues.forEach((i) => {
        const k = String(i.path[0]);
        if (!fe[k]) fe[k] = i.message;
      });
      setErrors(fe);
      return;
    }

    setLoading(true);
    try {
      const { consent, ...leadData } = parsed.data;
      const events = [
        { step: "pantallas", answer: String(leadData.screens) },
        { step: "consent", answer: "accepted" },
      ];
      const res = await fetch(SUBMIT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ ...leadData, preferred_contact: "asesor", events }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Error al enviar");
      setDone(true);
      onSubmitted();
    } catch (e: any) {
      toast.error(e.message || "Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl px-4 py-5 text-center"
        style={{ background: "hsl(270 15% 16%)", border: "1px solid hsl(150 80% 40% / 0.3)" }}>
        <Check className="h-6 w-6" style={{ color: "hsl(150 80% 55%)" }} />
        <p className="text-sm font-medium text-foreground">¡Datos enviados!</p>
        <p className="text-xs text-muted-foreground">Un asesor te contactará pronto.</p>
      </div>
    );
  }

  const inputCls = "w-full rounded-lg bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none";
  const inputSt = (err: boolean) => ({
    background: "hsl(260 25% 9%)",
    border: `1px solid ${err ? "hsl(0 80% 50% / 0.6)" : "hsl(270 25% 22%)"}`,
  });

  return (
    <div className="flex flex-col gap-2.5 rounded-2xl px-4 py-4"
      style={{ background: "hsl(270 15% 14%)", border: "1px solid hsl(270 100% 60% / 0.2)" }}>
      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "hsl(270 100% 80%)" }}>
        Tus datos de contacto
      </p>

      <div>
        <input placeholder="Nombre completo *" value={form.name ?? ""} onChange={(e) => update({ name: e.target.value })} className={inputCls} style={inputSt(!!errors.name)} />
        {errors.name && <p className="mt-0.5 text-[11px]" style={{ color: "hsl(0 80% 60%)" }}>{errors.name}</p>}
      </div>
      <div>
        <input placeholder="Correo electrónico *" type="email" value={form.email ?? ""} onChange={(e) => update({ email: e.target.value })} className={inputCls} style={inputSt(!!errors.email)} />
        {errors.email && <p className="mt-0.5 text-[11px]" style={{ color: "hsl(0 80% 60%)" }}>{errors.email}</p>}
      </div>
      <div>
        <input placeholder="Teléfono *" type="tel" value={form.phone ?? ""} onChange={(e) => update({ phone: e.target.value })} className={inputCls} style={inputSt(!!errors.phone)} />
        {errors.phone && <p className="mt-0.5 text-[11px]" style={{ color: "hsl(0 80% 60%)" }}>{errors.phone}</p>}
      </div>
      <input placeholder="Empresa (opcional)" value={form.company ?? ""} onChange={(e) => update({ company: e.target.value })} className={inputCls} style={inputSt(false)} />
      <input placeholder="WhatsApp (opcional)" type="tel" value={form.whatsapp ?? ""} onChange={(e) => update({ whatsapp: e.target.value })} className={inputCls} style={inputSt(false)} />

      <div className="flex items-center gap-2">
        <label className="text-xs text-muted-foreground flex-1">Nº de pantallas</label>
        <input type="number" min={1} max={999} value={form.screens ?? 1} onChange={(e) => update({ screens: Math.max(1, Number(e.target.value)) })} className="w-20 rounded-lg bg-transparent px-3 py-2 text-sm text-foreground text-center outline-none" style={inputSt(false)} />
      </div>

      <textarea
        placeholder="¿Tienes alguna inquietud o pregunta? (opcional)"
        value={form.inquiry ?? ""}
        onChange={(e) => update({ inquiry: e.target.value })}
        rows={2}
        className={`${inputCls} resize-none`}
        style={inputSt(false)}
      />

      <div>
        <label className="text-[11px] text-muted-foreground mb-0.5 block">¿A qué hora prefieres ser contactado?</label>
        <select
          value={form.preferred_time ?? ""}
          onChange={(e) => update({ preferred_time: e.target.value })}
          className="w-full rounded-lg px-3 py-2 text-sm text-foreground outline-none"
          style={{ background: "hsl(260 25% 9%)", border: "1px solid hsl(270 25% 22%)" }}
        >
          <option value="">Cualquier hora</option>
          <option value="8:00 - 10:00">8:00 - 10:00 AM</option>
          <option value="10:00 - 12:00">10:00 - 12:00 PM</option>
          <option value="12:00 - 14:00">12:00 - 2:00 PM</option>
          <option value="14:00 - 16:00">2:00 - 4:00 PM</option>
          <option value="16:00 - 18:00">4:00 - 6:00 PM</option>
        </select>
      </div>

      {/* Consent checkbox */}
      <label className="flex items-start gap-2 cursor-pointer group">
        <div className="relative mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors"
          style={{
            borderColor: errors.consent ? "hsl(0 80% 50% / 0.6)" : form.consent ? "hsl(270 100% 60%)" : "hsl(270 25% 30%)",
            background: form.consent ? "hsl(270 80% 50%)" : "transparent",
          }}
          onClick={() => update({ consent: !form.consent as any })}
        >
          {form.consent && <Check className="h-3 w-3 text-white" />}
        </div>
        <span className="text-[11px] leading-tight text-muted-foreground" onClick={() => update({ consent: !form.consent as any })}>
          Autorizo el tratamiento de mis datos personales conforme a la{" "}
          <span style={{ color: "hsl(270 100% 75%)" }}>Ley 1581 de 2012</span> de protección de datos de Colombia.
        </span>
      </label>
      {errors.consent && <p className="text-[11px] -mt-1" style={{ color: "hsl(0 80% 60%)" }}>{errors.consent}</p>}

      <button onClick={submit} disabled={loading}
        className="flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white transition-all hover:brightness-110 disabled:opacity-50"
        style={{ background: "linear-gradient(135deg, hsl(270 80% 55%), hsl(290 80% 50%))", boxShadow: "0 0 16px 2px hsl(270 100% 50% / 0.2)" }}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><ShieldCheck className="h-4 w-4" /> Enviar datos</>}
      </button>
    </div>
  );
}

/* ─── Main Chat ─── */
const ExpertChat = ({ open, onOpenChange }: ExpertChatProps) => {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "¡Hola! 👋 Soy tu asesor de Visualia. ¿En qué puedo ayudarte hoy?" },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, showForm]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 300);
  }, [open]);

  const handleFormSubmitted = () => {
    setFormSubmitted(true);
    // Add confirmation as assistant message
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: "✅ ¡Perfecto, recibimos tus datos! Un asesor de Visualia se pondrá en contacto contigo muy pronto. ¿Hay algo más en lo que pueda ayudarte?" },
    ]);
  };

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput("");

    const userMsg: Msg = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    let assistantSoFar = "";
    const allMessages = [...messages, userMsg];

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: allMessages }),
      });

      if (!resp.ok || !resp.body) {
        const errData = await resp.json().catch(() => null);
        throw new Error(errData?.error || "Error de conexión");
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantSoFar += content;
              const snapshot = assistantSoFar;
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant" && prev.length > 1 && prev[prev.length - 2]?.role === "user") {
                  return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: snapshot } : m));
                }
                return [...prev, { role: "assistant", content: snapshot }];
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // After streaming is done, check if the AI triggered the form
      if (assistantSoFar.includes(LEAD_FORM_TAG) && !formSubmitted) {
        setShowForm(true);
        // Remove the tag from the displayed message
        setMessages((prev) =>
          prev.map((m, i) =>
            i === prev.length - 1
              ? { ...m, content: m.content.replace(LEAD_FORM_TAG, "").trim() }
              : m
          )
        );
      }
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: e.message || "Lo siento, hubo un error. Intenta de nuevo." },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages, formSubmitted]);

  /* Helper: render message content (strip tag if present) */
  const cleanContent = (content: string) => content.replace(LEAD_FORM_TAG, "").trim();

  return (
    <>
      {/* Floating icon button */}
      {!open && (
        <button
          onClick={() => onOpenChange(true)}
          className="fixed bottom-5 right-5 z-[999] flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-transform duration-300 hover:scale-110 sm:bottom-6 sm:right-6"
          style={{
            background: "linear-gradient(135deg, hsl(270 80% 55%), hsl(290 80% 50%))",
            boxShadow: "0 0 24px 4px hsl(270 100% 50% / 0.35), 0 8px 24px -4px hsl(0 0% 0% / 0.4)",
          }}
          aria-label="Abrir chat con un experto"
        >
          <MessageCircle className="h-6 w-6 text-white" />
        </button>
      )}

      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[998] transition-opacity duration-300"
        style={{
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          background: "hsl(0 0% 0% / 0.4)",
          backdropFilter: "blur(2px)",
        }}
        onClick={() => onOpenChange(false)}
      />

      {/* Chat panel */}
      <div
        className="fixed bottom-4 right-4 z-[999] flex flex-col overflow-hidden rounded-2xl sm:bottom-6 sm:right-6"
        style={{
          width: "min(400px, calc(100vw - 32px))",
          height: "min(650px, calc(100vh - 100px))",
          background: "linear-gradient(180deg, hsl(260 25% 12%) 0%, hsl(260 30% 6%) 100%)",
          border: "1px solid hsl(270 100% 60% / 0.3)",
          boxShadow: "0 0 40px 8px hsl(270 100% 50% / 0.15), 0 25px 50px -12px hsl(0 0% 0% / 0.5)",
          transform: open ? "translateY(0) scale(1)" : "translateY(16px) scale(0.95)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease-out",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-3 px-5 py-4 flex-shrink-0"
          style={{ borderBottom: "1px solid hsl(270 20% 18%)" }}
        >
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full"
            style={{ background: "hsl(270 100% 50% / 0.15)", border: "1px solid hsl(270 100% 60% / 0.3)" }}
          >
            <img src={logoVisualia} alt="" className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">Experto Visualia</p>
            <p className="text-[11px]" style={{ color: "hsl(150 80% 55%)" }}>● En línea</p>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="flex h-8 w-8 items-center justify-center rounded-full transition-colors"
            style={{ background: "hsl(270 20% 15%)" }}
            aria-label="Cerrar chat"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className="max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed"
                style={
                  msg.role === "user"
                    ? { background: "hsl(270 80% 50%)", color: "white", borderBottomRightRadius: 6 }
                    : { background: "hsl(270 15% 16%)", color: "hsl(0 0% 88%)", borderBottomLeftRadius: 6 }
                }
              >
                {cleanContent(msg.content)}
              </div>
            </div>
          ))}

          {/* Inline lead form — shown after AI triggers it */}
          {showForm && !formSubmitted && (
            <div className="flex justify-start">
              <div className="max-w-[95%] w-full">
                <InlineLeadForm onSubmitted={handleFormSubmitted} />
              </div>
            </div>
          )}

          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <div className="flex justify-start">
              <div
                className="flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm"
                style={{ background: "hsl(270 15% 16%)", color: "hsl(0 0% 60%)" }}
              >
                <Loader2 className="h-3.5 w-3.5 animate-spin" style={{ color: "hsl(270 100% 70%)" }} />
                Escribiendo...
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="flex-shrink-0 px-4 pb-4 pt-2" style={{ borderTop: "1px solid hsl(270 20% 15%)" }}>
          <form
            onSubmit={(e) => { e.preventDefault(); send(); }}
            className="flex items-center gap-2 rounded-xl px-3 py-2"
            style={{ background: "hsl(260 20% 10%)", border: "1px solid hsl(270 30% 20%)" }}
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu mensaje..."
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 outline-none"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="flex h-8 w-8 items-center justify-center rounded-lg transition-all disabled:opacity-30"
              style={{ background: "hsl(270 80% 50%)" }}
              aria-label="Enviar"
            >
              <Send className="h-4 w-4 text-white" />
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default ExpertChat;
