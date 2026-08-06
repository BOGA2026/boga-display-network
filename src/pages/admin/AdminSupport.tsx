import { useAdminBusinessStats } from "@/hooks/useAdminBusinessStats";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MessageSquare, Send, WifiOff, RefreshCw, Power, Activity } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { getBusinessId, getUserId } from "@/features/auth/tenant";

type Thread = {
  id: string;
  business_id: string;
  last_message_at: string | null;
  unread_by_admin: number;
  businesses?: { name: string } | null;
};
type Msg = { id: string; thread_id: string; author_id: string; author_role: "admin" | "user"; body: string; created_at: string };
type Screen = { id: string; name: string; status: string; last_seen_at: string | null; locations?: { name: string; businesses?: { name: string } | null } | null };

const ONLINE_WINDOW_MS = 3 * 60 * 1000;
const isOnline = (s: Screen) => Date.now() - new Date(s.last_seen_at ?? 0).getTime() <= ONLINE_WINDOW_MS;

export default function AdminSupport() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [screens, setScreens] = useState<Screen[]>([]);
  const [search, setSearch] = useState("");
  const [confirm, setConfirm] = useState<
    | { screen: Screen; command: "restart_playback" | "force_sync" }
    | null
  >(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadThreads = useCallback(async () => {
    const { data } = await supabase.from("support_threads").select("id, business_id, last_message_at, unread_by_admin, unread_by_user, businesses(name)").order("last_message_at", { ascending: false, nullsFirst: false });
    setThreads((data as any) ?? []);
    setLoading(false);
  }, []);

  const loadScreens = useCallback(async () => {
    const { data } = await supabase.from("screens").select("id,name,status,last_seen_at,locations(name,businesses(name))").order("last_seen_at", { ascending: false, nullsFirst: false });
    setScreens((data as any) ?? []);
  }, []);

  useEffect(() => { loadThreads(); loadScreens(); }, [loadThreads, loadScreens]);

  // realtime for threads and messages
  useEffect(() => {
    const ch = supabase.channel("admin-support")
      .on("postgres_changes", { event: "*", schema: "public", table: "support_threads" }, () => loadThreads())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "support_messages" }, (payload) => {
        const m = payload.new as Msg;
        if (m.thread_id === selectedId) setMessages(prev => [...prev, m]);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "screens" }, (payload) => {
        setScreens(prev => prev.map(s => s.id === (payload.new as any).id ? { ...s, ...(payload.new as any) } : s));
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [loadThreads, selectedId]);

  // load messages when a thread is picked
  useEffect(() => {
    if (!selectedId) return;
    (async () => {
      const { data } = await supabase.from("support_messages").select("id, author_role, body, created_at").eq("thread_id", selectedId).order("created_at");
      setMessages((data as any) ?? []);
      // clear unread
      await supabase.from("support_threads").update({ unread_by_admin: 0 }).eq("id", selectedId);
      setThreads(prev => prev.map(t => t.id === selectedId ? { ...t, unread_by_admin: 0 } : t));
    })();
  }, [selectedId]);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages]);

  const filteredThreads = threads.filter(t => !search || t.businesses?.name?.toLowerCase().includes(search.toLowerCase()));
  const totalUnread = threads.reduce((a, t) => a + (t.unread_by_admin || 0), 0);
  const selected = threads.find(t => t.id === selectedId);

  const { totals: statTotals } = useAdminBusinessStats();
  const offlineScreens = useMemo(() => screens.filter(s => !isOnline(s)), [screens]);
  const totalScreens = statTotals.screens || screens.length;
  const totalOnline = statTotals.screens > 0 ? statTotals.screensOnline : screens.length - offlineScreens.length;
  const totalOffline = totalScreens - totalOnline;


  const send = async () => {
    if (!selected || !input.trim()) return;
    setSending(true);
    const uid = await getUserId();
    if (!uid) { setSending(false); return; }
    const { error } = await supabase.from("support_messages").insert({
      thread_id: selected.id, author_id: uid, author_role: "admin", body: input.trim(),
    });
    if (error) toast.error(error.message);
    else setInput("");
    setSending(false);
  };

  const sendCommand = async (screenId: string, command: "restart_playback" | "force_sync") => {
    const { error } = await supabase.from("screen_commands").insert({
      screen_id: screenId, command, payload: {}, status: "pending",
      expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    });
    if (error) toast.error(error.message);
    else toast.success(command === "restart_playback" ? "Reinicio de reproducción enviado" : "Sincronización forzada enviada");
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MessageSquare className="h-6 w-6 text-primary" /> Soporte y control técnico
          {totalUnread > 0 && <span className="text-xs bg-red-500 text-white rounded-full px-2 py-0.5">{totalUnread}</span>}
        </h1>
        <p className="text-sm text-muted-foreground">Chat en tiempo real con negocios y acciones remotas sobre pantallas</p>
      </div>

      {/* Technical panel */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4 bg-background/40 border-border/50">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground">Pantallas online</span>
            <Activity className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">{totalOnline}</div>
        </Card>
        <Card className="p-4 bg-background/40 border-border/50">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground">Offline</span>
            <WifiOff className="h-4 w-4 text-red-400" />
          </div>
          <div className="text-2xl font-bold text-red-400">{totalOffline}</div>
        </Card>
        <Card className="p-4 bg-background/40 border-border/50">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground">Total pantallas</span>
            <Power className="h-4 w-4 text-primary" />
          </div>
          <div className="text-2xl font-bold">{totalScreens}</div>
        </Card>
        <Card className="p-4 bg-background/40 border-border/50">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground">Conversaciones</span>
            <MessageSquare className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold">{threads.length}</div>
        </Card>
      </div>

      {/* Chat + offline screens */}
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr_320px] gap-4">
        {/* Threads */}
        <Card className="bg-background/40 border-border/50 flex flex-col overflow-hidden" style={{ height: "70vh" }}>
          <div className="p-3 border-b border-border/50">
            <Input placeholder="Buscar negocio..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-background/60 h-8 text-sm" />
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-3 space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
            ) : filteredThreads.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">Sin conversaciones</div>
            ) : filteredThreads.map(t => (
              <button key={t.id} onClick={() => setSelectedId(t.id)}
                className={`w-full text-left p-3 border-b border-border/30 hover:bg-white/5 ${selectedId === t.id ? "bg-primary/10" : ""}`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium truncate">{t.businesses?.name ?? "—"}</span>
                  {t.unread_by_admin > 0 && <span className="text-xs bg-red-500 text-white rounded-full px-1.5">{t.unread_by_admin}</span>}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {t.last_message_at ? formatDistanceToNow(new Date(t.last_message_at), { addSuffix: true, locale: es }) : "Sin mensajes"}
                </div>
              </button>
            ))}
          </div>
        </Card>

        {/* Conversation */}
        <Card className="bg-background/40 border-border/50 flex flex-col overflow-hidden" style={{ height: "70vh" }}>
          {!selected ? (
            <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
              Seleccioná una conversación
            </div>
          ) : (
            <>
              <div className="p-3 border-b border-border/50 font-semibold text-sm">{selected.businesses?.name}</div>
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2">
                {messages.length === 0 ? (
                  <div className="text-center text-sm text-muted-foreground">Aún no hay mensajes</div>
                ) : messages.map(m => (
                  <div key={m.id} className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${m.author_role === "admin" ? "ml-auto bg-primary/20 border border-primary/30" : "bg-background/70 border border-border/50"}`}>
                    <div className="text-xs uppercase text-muted-foreground mb-0.5">{m.author_role === "admin" ? "Admin" : "Usuario"} • {new Date(m.created_at).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}</div>
                    <div className="whitespace-pre-wrap">{m.body}</div>
                  </div>
                ))}
              </div>
              <div className="p-3 border-t border-border/50 flex gap-2">
                <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())} placeholder="Escribe tu mensaje..." className="bg-background/60" />
                <Button onClick={send} disabled={sending || !input.trim()}><Send className="h-4 w-4" /></Button>
              </div>
            </>
          )}
        </Card>

        {/* Screens control */}
        <Card className="bg-background/40 border-border/50 flex flex-col overflow-hidden" style={{ height: "70vh" }}>
          <div className="p-3 border-b border-border/50 font-semibold text-sm flex items-center justify-between">
            <span>Pantallas offline</span>
            <span className="text-xs text-muted-foreground">{offlineScreens.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {offlineScreens.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">Todas las pantallas están online ✨</div>
            ) : offlineScreens.map(s => (
              <div key={s.id} className="p-3 border-b border-border/30">
                <div className="text-sm font-medium">{s.name}</div>
                <div className="text-xs text-muted-foreground truncate">{s.locations?.businesses?.name} · {s.locations?.name}</div>
                <div className="text-xs text-muted-foreground">
                  {s.last_seen_at ? `Última: ${formatDistanceToNow(new Date(s.last_seen_at), { addSuffix: true, locale: es })}` : "Nunca conectada"}
                </div>
                <div className="flex gap-1 mt-2">
                  <Button size="sm" variant="outline" className="h-6 text-xs flex-1" onClick={() => setConfirm({ screen: s, command: "force_sync" })}>
                    <RefreshCw className="h-3 w-3 mr-1" /> Sync
                  </Button>
                  <Button size="sm" variant="outline" className="h-6 text-xs flex-1" onClick={() => setConfirm({ screen: s, command: "restart_playback" })}>
                    <Power className="h-3 w-3 mr-1" /> Reiniciar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm?.command === "restart_playback"
                ? `¿Reiniciar "${confirm?.screen.name}"?`
                : `¿Forzar sincronización en "${confirm?.screen.name}"?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm?.command === "restart_playback"
                ? "La pantalla dejará de reproducir contenido por unos segundos mientras se reinicia. Si está en uso frente a clientes, esto se notará."
                : "La pantalla volverá a descargar la programación actual. Puede haber una interrupción breve del contenido."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirm) sendCommand(confirm.screen.id, confirm.command);
                setConfirm(null);
              }}
            >
              {confirm?.command === "restart_playback" ? "Sí, reiniciar" : "Sí, sincronizar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
