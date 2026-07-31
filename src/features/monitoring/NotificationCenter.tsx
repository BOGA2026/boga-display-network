import { useEffect, useRef, useState } from "react";
import { useMonitoringStore } from "./store";
import { Bell, CheckCheck, Wifi, WifiOff } from "lucide-react";
import { toast } from "sonner";

export default function NotificationCenter() {
  const notifications = useMonitoringStore((s) => s.notifications);
  const markAllRead = useMonitoringStore((s) => s.markAllRead);
  const select = useMonitoringStore((s) => s.select);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const seenRef = useRef<Set<string>>(new Set());

  const unread = notifications.filter((n) => !n.read).length;

  // Toast on new offline events (avoid re-toasting old ones)
  useEffect(() => {
    for (const n of notifications) {
      if (seenRef.current.has(n.id)) continue;
      seenRef.current.add(n.id);
      if (n.kind === "offline") {
        toast.error(`Pantalla "${n.device_name}" desconectada`, {
          description: "Revisa el detalle en el panel de monitoreo.",
          action: { label: "Ver", onClick: () => select(n.device_id) },
        });
      }
    }
  }, [notifications, select]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="v-card v-card-interactive relative inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground"
        aria-label="Notificaciones"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="v-card absolute right-0 z-50 mt-2 w-80 overflow-hidden bg-popover shadow-xl">
          <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
            <span className="text-sm font-medium">Notificaciones</span>
            {unread > 0 && (
              <button onClick={markAllRead} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                <CheckCheck className="h-3.5 w-3.5" /> Marcar leídas
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground">Sin alertas.</div>
            ) : (
              <ul className="divide-y divide-white/5">
                {notifications.map((n) => (
                  <li key={n.id}>
                    <button
                      onClick={() => {
                        select(n.device_id);
                        setOpen(false);
                      }}
                      className={`flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-white/5 ${
                        n.read ? "opacity-70" : ""
                      }`}
                    >
                      {n.kind === "offline" ? (
                        <WifiOff className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                      ) : (
                        <Wifi className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="truncate">
                          {n.kind === "offline" ? "Se desconectó" : "Volvió a conectarse"}: {n.device_name}
                        </div>
                        <div className="text-[11px] text-muted-foreground">{new Date(n.at).toLocaleTimeString("es-CO")}</div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
