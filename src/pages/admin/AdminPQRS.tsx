import { useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Inbox, Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";

type Pqrs = {
  id: string;
  business_id: string;
  created_by: string;
  type: "peticion" | "queja" | "reclamo" | "sugerencia";
  subject: string;
  message: string;
  status: "nuevo" | "en_proceso" | "resuelto" | "cerrado";
  priority: "baja" | "media" | "alta" | "critica";
  read_by_admin: boolean;
  created_at: string;
  businesses?: { name: string } | null;
};

type Response = { id: string; author_role: "admin" | "user"; message: string; created_at: string };

const TYPE_LABEL = { peticion: "Petición", queja: "Queja", reclamo: "Reclamo", sugerencia: "Sugerencia" };
const STATUS_LABEL: Record<Pqrs["status"], { label: string; cls: string }> = {
  nuevo: { label: "Nuevo", cls: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30" },
  en_proceso: { label: "En proceso", cls: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  resuelto: { label: "Resuelto", cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  cerrado: { label: "Cerrado", cls: "bg-muted text-muted-foreground border-border/50" },
};
const PRIORITY_CLS: Record<Pqrs["priority"], string> = {
  baja: "text-muted-foreground",
  media: "text-cyan-400",
  alta: "text-amber-400",
  critica: "text-red-400",
};

export default function AdminPQRS() {
  const [items, setItems] = useState<Pqrs[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [responses, setResponses] = useState<Response[]>([]);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [filter, setFilter] = useState<"todos" | Pqrs["status"]>("todos");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("pqrs")
      .select("*,businesses(name)")
      .order("created_at", { ascending: false });
    setItems((data as any) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const ch = supabase.channel("admin-pqrs")
      .on("postgres_changes", { event: "*", schema: "public", table: "pqrs" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load]);

  const selected = items.find(i => i.id === selectedId);

  useEffect(() => {
    if (!selectedId) return;
    (async () => {
      const { data } = await supabase.from("pqrs_responses").select("*").eq("pqrs_id", selectedId).order("created_at");
      setResponses((data as any) ?? []);
    })();
    // mark as read
    supabase.from("pqrs").update({ read_by_admin: true }).eq("id", selectedId).then(() => {
      setItems(prev => prev.map(p => p.id === selectedId ? { ...p, read_by_admin: true } : p));
    });
  }, [selectedId]);

  const filtered = useMemo(() => items.filter(p => {
    if (filter !== "todos" && p.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!p.subject.toLowerCase().includes(q) && !p.businesses?.name?.toLowerCase().includes(q)) return false;
    }
    return true;
  }), [items, filter, search]);

  const unread = items.filter(p => !p.read_by_admin).length;

  const updateStatus = async (status: Pqrs["status"]) => {
    if (!selected) return;
    await supabase.from("pqrs").update({ status }).eq("id", selected.id);
    setItems(prev => prev.map(p => p.id === selected.id ? { ...p, status } : p));
    toast.success("Estado actualizado");
  };

  const sendReply = async () => {
    if (!selected || !reply.trim()) return;
    setSending(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSending(false); return; }
    const { data, error } = await supabase.from("pqrs_responses").insert({
      pqrs_id: selected.id, author_id: user.id, author_role: "admin", message: reply.trim(),
    }).select().single();
    if (error) toast.error(error.message);
    else {
      setResponses(prev => [...prev, data as any]);
      setReply("");
      if (selected.status === "nuevo") await updateStatus("en_proceso");
    }
    setSending(false);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Inbox className="h-6 w-6 text-primary" /> PQRS
          {unread > 0 && <span className="text-xs bg-red-500 text-white rounded-full px-2 py-0.5">{unread} sin leer</span>}
        </h1>
        <p className="text-sm text-muted-foreground">Peticiones, quejas, reclamos y sugerencias</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-4">
        <Card className="bg-background/40 border-border/50 overflow-hidden flex flex-col" style={{ height: "70vh" }}>
          <div className="p-3 border-b border-border/50 space-y-2">
            <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-background/60 h-8 text-sm" />
            <div className="flex gap-1 flex-wrap">
              {(["todos", "nuevo", "en_proceso", "resuelto", "cerrado"] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-2 py-0.5 text-[10px] rounded ${filter === f ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                  {f === "todos" ? "Todos" : STATUS_LABEL[f]?.label ?? f}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-3 space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">Sin resultados</div>
            ) : filtered.map(p => (
              <button key={p.id} onClick={() => setSelectedId(p.id)}
                className={`w-full text-left p-3 border-b border-border/30 hover:bg-white/5 transition ${selectedId === p.id ? "bg-primary/10" : ""}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] uppercase text-muted-foreground">{TYPE_LABEL[p.type]}</span>
                  <span className={`text-[10px] ${PRIORITY_CLS[p.priority]}`}>● {p.priority}</span>
                </div>
                <div className="text-sm font-medium truncate flex items-center gap-2">
                  {!p.read_by_admin && <span className="h-2 w-2 rounded-full bg-cyan-400 shrink-0" />}
                  {p.subject}
                </div>
                <div className="text-xs text-muted-foreground truncate">{p.businesses?.name ?? "—"}</div>
                <div className="text-[10px] text-muted-foreground mt-1">{formatDistanceToNow(new Date(p.created_at), { addSuffix: true, locale: es })}</div>
              </button>
            ))}
          </div>
        </Card>

        <Card className="bg-background/40 border-border/50 flex flex-col" style={{ height: "70vh" }}>
          {!selected ? (
            <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
              Seleccioná un caso para ver el detalle
            </div>
          ) : (
            <>
              <div className="p-4 border-b border-border/50">
                <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
                  <span className="text-[10px] uppercase text-muted-foreground">{TYPE_LABEL[selected.type]} • {selected.businesses?.name}</span>
                  <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] uppercase ${STATUS_LABEL[selected.status].cls}`}>
                    {STATUS_LABEL[selected.status].label}
                  </span>
                </div>
                <h2 className="text-lg font-semibold">{selected.subject}</h2>
                <div className="flex gap-1 mt-3 flex-wrap">
                  {(["nuevo", "en_proceso", "resuelto", "cerrado"] as const).map(s => (
                    <Button key={s} size="sm" variant={selected.status === s ? "default" : "outline"} onClick={() => updateStatus(s)} className="h-7 text-xs">
                      {STATUS_LABEL[s].label}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <div className="rounded-lg bg-background/60 border border-border/50 p-3">
                  <div className="text-[10px] uppercase text-muted-foreground mb-1">Usuario • {new Date(selected.created_at).toLocaleString("es-CO")}</div>
                  <div className="text-sm whitespace-pre-wrap">{selected.message}</div>
                </div>
                {responses.map(r => (
                  <div key={r.id} className={`rounded-lg p-3 border ${r.author_role === "admin" ? "bg-primary/10 border-primary/30 ml-8" : "bg-background/60 border-border/50 mr-8"}`}>
                    <div className="text-[10px] uppercase text-muted-foreground mb-1">
                      {r.author_role === "admin" ? "Admin" : "Usuario"} • {new Date(r.created_at).toLocaleString("es-CO")}
                    </div>
                    <div className="text-sm whitespace-pre-wrap">{r.message}</div>
                  </div>
                ))}
              </div>
              <div className="p-3 border-t border-border/50 flex gap-2">
                <Textarea value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Escribí una respuesta..." className="min-h-[60px] bg-background/60 resize-none" />
                <Button onClick={sendReply} disabled={sending || !reply.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
