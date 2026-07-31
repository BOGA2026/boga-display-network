import { useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Inbox, Loader2, RefreshCw, Send } from "lucide-react";
import { TableSkeleton } from "@/components/feedback/states";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { fetchWithRetry } from "@/lib/adminFetch";
import { logError } from "@/lib/errorLogger";

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
  cerrado: { label: "Cerrado", cls: "bg-muted admin-muted border-border/50" },
};
const PRIORITY_CLS: Record<Pqrs["priority"], string> = {
  baja: "admin-muted",
  media: "text-cyan-400",
  alta: "text-amber-400",
  critica: "text-red-400",
};

export default function AdminPQRS() {
  const [items, setItems] = useState<Pqrs[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [responses, setResponses] = useState<Response[]>([]);
  const [responsesLoading, setResponsesLoading] = useState(false);
  const [responsesError, setResponsesError] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [filter, setFilter] = useState<"todos" | Pqrs["status"]>("todos");
  const [search, setSearch] = useState("");

  const load = useCallback(async (background = false) => {
    if (background) setRefreshing(true);
    else setLoading(true);
    setLoadError(null);

    try {
      const data = await fetchWithRetry(async () => {
        const result = await supabase
          .from("pqrs")
          .select("*,businesses(name)")
          .order("created_at", { ascending: false });
        if (result.error) {
          throw Object.assign(new Error(result.error.message), { status: (result as any).status ?? 500 });
        }
        return result.data;
      }, { label: "admin-pqrs-list", timeoutMs: 8_000, retries: 2 });

      setItems((data as Pqrs[]) ?? []);
    } catch (error) {
      logError(error, { label: "admin-pqrs-list" });
      setLoadError("No pudimos cargar los casos. La información existente sigue disponible.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const ch = supabase.channel("admin-pqrs")
      .on("postgres_changes", { event: "*", schema: "public", table: "pqrs" }, () => load(true))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load]);

  const selected = items.find(i => i.id === selectedId);

  const loadResponses = useCallback(async (pqrsId: string) => {
    setResponsesLoading(true);
    setResponsesError(null);
    try {
      const data = await fetchWithRetry(async () => {
        const result = await supabase.from("pqrs_responses").select("*").eq("pqrs_id", pqrsId).order("created_at");
        if (result.error) {
          throw Object.assign(new Error(result.error.message), { status: (result as any).status ?? 500 });
        }
        return result.data;
      }, { label: "admin-pqrs-responses", timeoutMs: 8_000, retries: 2 });
      setResponses((data as Response[]) ?? []);
    } catch (error) {
      logError(error, { label: "admin-pqrs-responses", pqrsId });
      setResponses([]);
      setResponsesError("No fue posible cargar las respuestas.");
    } finally {
      setResponsesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    loadResponses(selectedId);
    // mark as read
    supabase.from("pqrs").update({ read_by_admin: true }).eq("id", selectedId).then(() => {
      setItems(prev => prev.map(p => p.id === selectedId ? { ...p, read_by_admin: true } : p));
    });
  }, [selectedId, loadResponses]);

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
    try {
      const { error } = await supabase.from("pqrs").update({ status }).eq("id", selected.id);
      if (error) throw error;
      setItems(prev => prev.map(p => p.id === selected.id ? { ...p, status } : p));
      toast.success("Estado actualizado");
    } catch (error) {
      logError(error, { label: "admin-pqrs-update-status", pqrsId: selected.id });
      toast.error("No fue posible actualizar el estado");
    }
  };

  const sendReply = async () => {
    if (!selected || !reply.trim()) return;
    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sesión no disponible");
      const { data, error } = await supabase.from("pqrs_responses").insert({
        pqrs_id: selected.id, author_id: user.id, author_role: "admin", message: reply.trim(),
      }).select().single();
      if (error) throw error;
      setResponses(prev => [...prev, data as Response]);
      setReply("");
      if (selected.status === "nuevo") await updateStatus("en_proceso");
    } catch (error) {
      logError(error, { label: "admin-pqrs-send-reply", pqrsId: selected.id });
      toast.error("No fue posible enviar la respuesta");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
        <h1 style={{ color: "hsl(var(--admin-fg))" }} className="text-2xl font-bold flex items-center gap-2">
          <Inbox className="h-6 w-6 text-primary" /> PQRS
          {unread > 0 && <span className="text-xs bg-red-500 text-primary-foreground rounded-full px-2 py-0.5">{unread} sin leer</span>}
        </h1>
        <p className="text-sm admin-muted">Peticiones, quejas, reclamos y sugerencias</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => load(false)} disabled={loading || refreshing} aria-label="Actualizar casos PQRS">
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} /> Actualizar
        </Button>
      </div>

      {loadError && (
        <div role="alert" className="admin-card flex items-center justify-between gap-4 p-3 border-amber-500/40">
          <div className="flex items-center gap-2 text-sm text-amber-400">
            <AlertTriangle className="h-4 w-4 shrink-0" /> {loadError}
          </div>
          <Button variant="outline" size="sm" onClick={() => load(false)}>Reintentar</Button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-4">
        <Card className="admin-card overflow-hidden flex flex-col" style={{ height: "70vh" }}>
          <div className="p-3 border-b border-border/50 space-y-2">
            <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-white/5 h-8 text-sm" />
            <div className="flex gap-1 flex-wrap">
              {(["todos", "nuevo", "en_proceso", "resuelto", "cerrado"] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-2 py-0.5 text-[10px] rounded ${filter === f ? "bg-primary/20 text-primary" : "admin-muted hover:text-foreground"}`}>
                  {f === "todos" ? "Todos" : STATUS_LABEL[f]?.label ?? f}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto" aria-busy={loading}>
            {loading ? (
              <div className="p-3 space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center text-sm admin-muted">Sin resultados</div>
            ) : filtered.map(p => (
              <button key={p.id} onClick={() => setSelectedId(p.id)}
                className={`w-full text-left p-3 border-b border-border/30 hover:bg-white/5 transition ${selectedId === p.id ? "bg-primary/10" : ""}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] uppercase admin-muted">{TYPE_LABEL[p.type]}</span>
                  <span className={`text-[10px] ${PRIORITY_CLS[p.priority]}`}>● {p.priority}</span>
                </div>
                <div className="text-sm font-medium truncate flex items-center gap-2">
                  {!p.read_by_admin && <span className="h-2 w-2 rounded-full bg-cyan-400 shrink-0" />}
                  {p.subject}
                </div>
                <div className="text-xs admin-muted truncate">{p.businesses?.name ?? "—"}</div>
                <div className="text-[10px] admin-muted mt-1">{formatDistanceToNow(new Date(p.created_at), { addSuffix: true, locale: es })}</div>
              </button>
            ))}
          </div>
        </Card>

        <Card className="admin-card flex flex-col" style={{ height: "70vh" }}>
          {!selected ? (
            <div className="flex-1 flex items-center justify-center text-sm admin-muted">
              Seleccioná un caso para ver el detalle
            </div>
          ) : (
            <>
              <div className="p-4 border-b border-border/50">
                <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
                  <span className="text-[10px] uppercase admin-muted">{TYPE_LABEL[selected.type]} • {selected.businesses?.name}</span>
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
                <div className="rounded-lg bg-white/5 border border-border/50 p-3">
                  <div className="text-[10px] uppercase admin-muted mb-1">Usuario • {new Date(selected.created_at).toLocaleString("es-CO")}</div>
                  <div className="text-sm whitespace-pre-wrap">{selected.message}</div>
                </div>
                {responsesLoading && (
                  <TableSkeleton rows={3} columns={1} showHeader={false} />
                )}
                {responsesError && (
                  <div role="alert" className="rounded-md border border-amber-500/40 p-3 flex items-center justify-between gap-3 text-sm text-amber-400">
                    <span className="flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> {responsesError}</span>
                    <Button variant="outline" size="sm" onClick={() => loadResponses(selected.id)}>Reintentar</Button>
                  </div>
                )}
                {responses.map(r => (
                  <div key={r.id} className={`rounded-lg p-3 border ${r.author_role === "admin" ? "bg-primary/10 border-primary/30 ml-8" : "bg-white/5 border-border/50 mr-8"}`}>
                    <div className="text-[10px] uppercase admin-muted mb-1">
                      {r.author_role === "admin" ? "Admin" : "Usuario"} • {new Date(r.created_at).toLocaleString("es-CO")}
                    </div>
                    <div className="text-sm whitespace-pre-wrap">{r.message}</div>
                  </div>
                ))}
              </div>
              <div className="p-3 border-t border-border/50 flex gap-2">
                <Textarea value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Escribe una respuesta..." className="min-h-[60px] bg-white/5 resize-none" />
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
