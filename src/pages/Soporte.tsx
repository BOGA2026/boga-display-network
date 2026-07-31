import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send, MessageSquare, FileText, Plus } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { NAV } from "@/config/lexicon";

type Msg = { id: string; author_role: "admin" | "user"; body: string; created_at: string };
type Pqrs = { id: string; type: string; subject: string; message: string; status: string; created_at: string };
type PqrsResp = { id: string; author_role: "admin" | "user"; message: string; created_at: string };

const TYPES = [
  { value: "peticion", label: "Petición" },
  { value: "queja", label: "Queja" },
  { value: "reclamo", label: "Reclamo" },
  { value: "sugerencia", label: "Sugerencia" },
];

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

      const { data: msgs } = await supabase.from("support_messages").select("*").eq("thread_id", t!.id).order("created_at");
      setMessages((msgs as any) ?? []);
      await supabase.from("support_threads").update({ unread_by_user: 0 }).eq("id", t!.id);

      const { data: pq } = await supabase.from("pqrs").select("*").eq("business_id", prof.business_id).order("created_at", { ascending: false });
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
    const { data } = await supabase.from("pqrs_responses").select("*").eq("pqrs_id", id).order("created_at");
    setPqrsResponses((data as any) ?? []);
  }, []);

  const submitPqrs = async () => {
    if (!businessId || !userId || !newForm.subject.trim() || !newForm.message.trim()) return;
    const { data, error } = await supabase.from("pqrs").insert({
      business_id: businessId, created_by: userId,
      type: newForm.type, subject: newForm.subject.trim(), message: newForm.message.trim(),
    }).select().single();
    if (error) { toast.error(error.message); return; }
    toast.success("Caso enviado. Te responderemos pronto.");
    setPqrsList(prev => [data as any, ...prev]);
    setNewForm({ type: "peticion", subject: "", message: "" });
    setShowNew(false);
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold">{NAV.soporte.pageTitle}</h1>
        <p className="text-sm text-muted-foreground">{NAV.soporte.pageSubtitle}</p>
      </div>

      <Tabs defaultValue="chat" className="space-y-4">
        <TabsList>
          <TabsTrigger value="chat"><MessageSquare className="h-4 w-4 mr-1" /> Chat</TabsTrigger>
          <TabsTrigger value="pqrs"><FileText className="h-4 w-4 mr-1" /> PQRS</TabsTrigger>
        </TabsList>

        <TabsContent value="chat">
          <Card className="bg-background/40 border-border/50 flex flex-col overflow-hidden" style={{ height: "65vh" }}>
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-muted-foreground text-center px-6">
                  Escribinos por acá. Un miembro del equipo te responderá lo antes posible.
                </div>
              ) : messages.map(m => (
                <div key={m.id} className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${m.author_role === "user" ? "ml-auto bg-primary/20 border border-primary/30" : "bg-background/70 border border-border/50"}`}>
                  <div className="text-[10px] uppercase text-muted-foreground mb-0.5">{m.author_role === "user" ? "Tú" : "Visualia"} • {new Date(m.created_at).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}</div>
                  <div className="whitespace-pre-wrap">{m.body}</div>
                </div>
              ))}
            </div>
            <div className="p-3 border-t border-border/50 flex gap-2">
              <Input value={chatInput} onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendChat())}
                placeholder="Escribe tu mensaje..." className="bg-background/60" />
              <Button onClick={sendChat} disabled={!chatInput.trim()}><Send className="h-4 w-4" /></Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="pqrs">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{pqrsList.length} casos</span>
              <Button size="sm" onClick={() => setShowNew(v => !v)}><Plus className="h-4 w-4 mr-1" /> Nuevo caso</Button>
            </div>

            {showNew && (
              <Card className="p-4 bg-background/40 border-border/50 space-y-3">
                <select value={newForm.type} onChange={(e) => setNewForm(f => ({ ...f, type: e.target.value }))}
                  className="w-full rounded-md border border-border/50 bg-background/60 px-3 py-2 text-sm">
                  {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                <Input placeholder="Asunto" value={newForm.subject} onChange={(e) => setNewForm(f => ({ ...f, subject: e.target.value }))} className="bg-background/60" />
                <Textarea placeholder="Contanos el detalle..." value={newForm.message} onChange={(e) => setNewForm(f => ({ ...f, message: e.target.value }))} className="bg-background/60 min-h-[120px]" />
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" size="sm" onClick={() => setShowNew(false)}>Cancelar</Button>
                  <Button size="sm" onClick={submitPqrs}>Enviar</Button>
                </div>
              </Card>
            )}

            {selectedPqrs ? (
              <Card className="p-4 bg-background/40 border-border/50">
                <button onClick={() => { setSelectedPqrs(null); setPqrsResponses([]); }} className="text-xs text-primary mb-2 hover:underline">← Volver</button>
                <div className="text-[10px] uppercase text-muted-foreground">{selectedPqrs.type} • {selectedPqrs.status}</div>
                <h3 className="font-semibold">{selectedPqrs.subject}</h3>
                <div className="text-sm mt-2 whitespace-pre-wrap">{selectedPqrs.message}</div>
                <div className="mt-4 space-y-2">
                  {pqrsResponses.map(r => (
                    <div key={r.id} className={`rounded-lg p-3 border text-sm ${r.author_role === "admin" ? "bg-primary/10 border-primary/30" : "bg-background/60 border-border/50 ml-8"}`}>
                      <div className="text-[10px] uppercase text-muted-foreground mb-1">{r.author_role === "admin" ? "Visualia" : "Tú"} • {new Date(r.created_at).toLocaleString("es-CO")}</div>
                      <div className="whitespace-pre-wrap">{r.message}</div>
                    </div>
                  ))}
                  {pqrsResponses.length === 0 && <div className="text-xs text-muted-foreground">Aún no hay respuestas</div>}
                </div>
              </Card>
            ) : pqrsList.length === 0 ? (
              <Card className="p-10 text-center bg-background/40 border-border/50 text-sm text-muted-foreground">
                No has enviado ningún caso todavía
              </Card>
            ) : (
              <div className="space-y-2">
                {pqrsList.map(p => (
                  <button key={p.id} onClick={() => { setSelectedPqrs(p); loadPqrsResponses(p.id); }}
                    className="v-card v-card-interactive w-full p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{p.subject}</span>
                      <span className="text-[10px] uppercase text-muted-foreground">{p.status}</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground">{p.type} • {formatDistanceToNow(new Date(p.created_at), { addSuffix: true, locale: es })}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
