import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { EmptyState } from "@/components/feedback/states";
import { Send, MessageSquare, Clock, FileText, Plus } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { NAV, COPY } from "@/config/lexicon";

type Msg = { id: string; author_role: "admin" | "user"; body: string; created_at: string };
type Pqrs = { id: string; type: string; subject: string; message: string; status: string; created_at: string };
type PqrsResp = { id: string; author_role: "admin" | "user"; message: string; created_at: string };

const TYPES = [
  { value: "peticion", label: "Petición" },
  { value: "queja", label: "Queja" },
  { value: "reclamo", label: "Reclamo" },
  { value: "sugerencia", label: "Sugerencia" },
];

function statusVariant(status: string): "default" | "secondary" | "outline" {
  const s = (status ?? "").toLowerCase();
  if (s === "resuelto" || s === "cerrado") return "secondary";
  if (s === "en_proceso" || s === "en proceso") return "default";
  return "outline";
}

function statusLabel(status: string) {
  const key = (status ?? "").toLowerCase().replace(/\s+/g, "_");
  return COPY.soporte.statusLabels[key] ?? status;
}

export default function Soporte() {
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [pqrsList, setPqrsList] = useState<Pqrs[]>([]);
  const [selectedPqrs, setSelectedPqrs] = useState<Pqrs | null>(null);
  const [pqrsResponses, setPqrsResponses] = useState<PqrsResp[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState({ type: "peticion", subject: "", message: "" });
  const scrollRef = useRef<HTMLDivElement>(null);

  // bootstrap
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const { data: prof } = await supabase.from("profiles").select("business_id").eq("id", user.id).maybeSingle();
      if (!prof?.business_id) return;
      setBusinessId(prof.business_id);

      // ensure thread
      let { data: t } = await supabase.from("support_threads").select("id").eq("business_id", prof.business_id).maybeSingle();
      if (!t) {
        const ins = await supabase.from("support_threads").insert({ business_id: prof.business_id }).select("id").single();
        t = ins.data as any;
      }
      setThreadId(t!.id);

      const { data: msgs } = await supabase.from("support_messages").select("id, author_role, body, created_at").eq("thread_id", t!.id).order("created_at");
      setMessages((msgs as any) ?? []);
      await supabase.from("support_threads").update({ unread_by_user: 0 }).eq("id", t!.id);

      const { data: pq } = await supabase.from("pqrs").select("id, type, subject, message, status, created_at").eq("business_id", prof.business_id).order("created_at", { ascending: false });
      setPqrsList((pq as any) ?? []);
    })();
  }, []);

  // realtime
  useEffect(() => {
    if (!threadId) return;
    const ch = supabase.channel(`user-support-${threadId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "support_messages", filter: `thread_id=eq.${threadId}` },
        (p) => setMessages(prev => [...prev, p.new as any]))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [threadId]);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }); }, [messages]);

  const sendChat = async () => {
    if (!threadId || !userId || !chatInput.trim()) return;
    const { error } = await supabase.from("support_messages").insert({
      thread_id: threadId, author_id: userId, author_role: "user", body: chatInput.trim(),
    });
    if (error) toast.error(error.message);
    else setChatInput("");
  };

  const loadPqrsResponses = useCallback(async (id: string) => {
    const { data } = await supabase.from("pqrs_responses").select("id, author_role, message, created_at").eq("pqrs_id", id).order("created_at");
    setPqrsResponses((data as any) ?? []);
  }, []);

  const submitPqrs = async () => {
    if (!businessId || !userId || !newForm.subject.trim() || !newForm.message.trim()) return;
    const { data, error } = await supabase.from("pqrs").insert({
      business_id: businessId, created_by: userId,
      type: newForm.type, subject: newForm.subject.trim(), message: newForm.message.trim(),
    }).select().single();
    if (error) { toast.error(error.message); return; }
    toast.success(COPY.soporte.pqrsSent);
    setPqrsList(prev => [data as any, ...prev]);
    setNewForm({ type: "peticion", subject: "", message: "" });
    setShowNew(false);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{NAV.soporte.pageTitle}</h1>
        <p className="text-sm text-muted-foreground">{NAV.soporte.pageSubtitle}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* ── Chat (60%) ── */}
        <section className="lg:col-span-3">
          <Card className="v-card flex flex-col overflow-hidden" style={{ minHeight: 500, height: "70vh" }}>
            <div className="flex items-center gap-2 border-b border-border/50 px-4 py-3">
              <MessageSquare className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold">{COPY.soporte.chatTitle}</h2>
            </div>
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-muted-foreground text-center px-6">
                  {COPY.soporte.chatEmpty}
                </div>
              ) : messages.map(m => (
                <div key={m.id} className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${m.author_role === "user" ? "ml-auto bg-primary/20 border border-primary/30" : "bg-background/70 border border-border/50"}`}>
                  <div className="text-xs uppercase text-muted-foreground mb-0.5">{m.author_role === "user" ? "Tú" : "Visualia"} • {new Date(m.created_at).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}</div>
                  <div className="whitespace-pre-wrap">{m.body}</div>
                </div>
              ))}
            </div>
            <div className="p-3 border-t border-border/50 flex gap-2">
              <Input value={chatInput} onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendChat())}
                placeholder={COPY.soporte.chatPlaceholder} className="bg-background/60" />
              <Button onClick={sendChat} disabled={!chatInput.trim()} aria-label="Enviar mensaje">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        </section>

        {/* ── Columna lateral (40%) ── */}
        <aside className="space-y-4 lg:col-span-2">
          {/* SLA */}
          <Card className="v-card p-5">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <span className="v-kpi-label">{COPY.soporte.slaTitle}</span>
            </div>
            <div className="v-kpi-value v-numeric mt-2">{COPY.soporte.slaValue}</div>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{COPY.soporte.slaNote}</p>
          </Card>

          {/* PQRS */}
          <Card className="v-card p-5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold">{COPY.soporte.pqrsTitle}</h2>
              </div>
              {!selectedPqrs && (
                <Button size="sm" variant="outline" onClick={() => setShowNew(v => !v)}>
                  <Plus className="h-4 w-4 mr-1" /> {COPY.soporte.pqrsNew}
                </Button>
              )}
            </div>

            <div className="mt-4 space-y-3">
              {showNew && !selectedPqrs && (
                <div className="space-y-3 rounded-xl border border-border/50 p-3">
                  <select value={newForm.type} onChange={(e) => setNewForm(f => ({ ...f, type: e.target.value }))}
                    className="w-full rounded-md border border-border/50 bg-background/60 px-3 py-2 text-sm">
                    {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                  <Input placeholder={COPY.soporte.pqrsSubject} value={newForm.subject} onChange={(e) => setNewForm(f => ({ ...f, subject: e.target.value }))} className="bg-background/60" />
                  <Textarea placeholder={COPY.soporte.pqrsMessage} value={newForm.message} onChange={(e) => setNewForm(f => ({ ...f, message: e.target.value }))} className="bg-background/60 min-h-[100px]" />
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" size="sm" onClick={() => setShowNew(false)}>{COPY.actions.cancel}</Button>
                    <Button size="sm" onClick={submitPqrs}>Enviar</Button>
                  </div>
                </div>
              )}

              {selectedPqrs ? (
                <div>
                  <button onClick={() => { setSelectedPqrs(null); setPqrsResponses([]); }} className="text-xs text-primary mb-2 hover:underline">{COPY.soporte.pqrsBack}</button>
                  <div className="flex items-center gap-2">
                    <Badge variant={statusVariant(selectedPqrs.status)}>{statusLabel(selectedPqrs.status)}</Badge>
                    <span className="text-xs uppercase text-muted-foreground">{selectedPqrs.type}</span>
                  </div>
                  <h3 className="mt-2 font-semibold text-sm">{selectedPqrs.subject}</h3>
                  <div className="text-sm mt-1 whitespace-pre-wrap text-muted-foreground">{selectedPqrs.message}</div>
                  <div className="mt-3 space-y-2">
                    {pqrsResponses.map(r => (
                      <div key={r.id} className={`rounded-lg p-3 border text-sm ${r.author_role === "admin" ? "bg-primary/10 border-primary/30" : "bg-background/60 border-border/50 ml-6"}`}>
                        <div className="text-xs uppercase text-muted-foreground mb-1">{r.author_role === "admin" ? "Visualia" : "Tú"} • {new Date(r.created_at).toLocaleString("es-CO")}</div>
                        <div className="whitespace-pre-wrap">{r.message}</div>
                      </div>
                    ))}
                    {pqrsResponses.length === 0 && <div className="text-xs text-muted-foreground">{COPY.soporte.pqrsNoAnswers}</div>}
                  </div>
                </div>
              ) : pqrsList.length === 0 ? (
                <EmptyState
                  className="py-8"
                  icon={<FileText className="h-8 w-8" />}
                  title={COPY.soporte.pqrsEmptyTitle}
                  description={COPY.soporte.pqrsEmpty}
                />
              ) : (
                <div className="space-y-2">
                  {pqrsList.map(p => (
                    <button key={p.id} onClick={() => { setSelectedPqrs(p); loadPqrsResponses(p.id); }}
                      className="v-card v-card-interactive w-full p-3 text-left">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium truncate">{p.subject}</span>
                        <Badge variant={statusVariant(p.status)}>{statusLabel(p.status)}</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">{p.type} • {formatDistanceToNow(new Date(p.created_at), { addSuffix: true, locale: es })}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* FAQ */}
          <Card className="v-card p-5">
            <h2 className="text-sm font-semibold">{COPY.soporte.faqTitle}</h2>
            <Accordion type="single" collapsible className="mt-2">
              {COPY.soporte.faq.map((item, i) => (
                <AccordionItem key={i} value={`faq-${i}`}>
                  <AccordionTrigger className="text-left text-sm">{item.q}</AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Card>
        </aside>
      </div>
    </div>
  );
}
