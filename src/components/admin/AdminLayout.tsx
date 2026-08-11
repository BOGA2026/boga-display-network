import { Suspense, useEffect, useRef, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { ContentSkeleton } from "@/components/layout/ContentSkeleton";
import { prefetchHandlers } from "@/lib/routePrefetch";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import logoVisualia from "@/assets/logo-visualia.webp";
import {
  ShieldCheck,
  LayoutDashboard,
  LayoutTemplate,
  Building2,
  Users,
  Inbox,
  LogOut,
  Activity,
  CreditCard,
  Monitor,
  CalendarClock,
  Map as MapIcon,
  MessageSquare,
  FileText,
  Menu,
  X,
} from "lucide-react";
import { signOut } from "@/hooks/useAuth";
import { useSessionTracker } from "@/hooks/useSessionTracker";
import { fetchWithRetry } from "@/lib/adminFetch";
import { logError } from "@/lib/errorLogger";

type NavItem = {
  to: string;
  label: string;
  icon: any;
  end?: boolean;
  badgeKey?: "pqrs" | "chat";
};

type NavGroup = { label: string; items: NavItem[] };

const groups: NavGroup[] = [
  {
    label: "General",
    items: [
      { to: "/master", label: "Resumen", icon: LayoutDashboard, end: true },
      { to: "/master/trafico", label: "Tráfico", icon: Activity },
    ],
  },
  {
    label: "Comercial",
    items: [
      { to: "/master/suscripciones", label: "Suscripciones", icon: CreditCard },
      { to: "/master/pagos", label: "Vencimientos", icon: CalendarClock },
      { to: "/master/leads", label: "Leads", icon: Inbox },
    ],
  },
  {
    label: "Operaciones",
    items: [
      { to: "/master/pantallas", label: "Pantallas", icon: Monitor },
      { to: "/master/mapa", label: "Mapa", icon: MapIcon },
      { to: "/master/negocios", label: "Negocios", icon: Building2 },
      { to: "/master/plantillas", label: "Plantillas", icon: LayoutTemplate },
    ],
  },
  {
    label: "Atención",
    items: [
      { to: "/master/pqrs", label: "PQRS", icon: FileText, badgeKey: "pqrs" },
      { to: "/master/soporte", label: "Soporte", icon: MessageSquare, badgeKey: "chat" },
    ],
  },
  {
    label: "Sistema",
    items: [{ to: "/master/admins", label: "Administradores", icon: Users }],
  },
];

export default function AdminLayout() {
  const { session, loading } = useAuth("/login");
  useSessionTracker(session?.user?.id);
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (loading || !session) return;
    (async () => {
      // Un fallo de red no debe sacar al administrador al panel de cliente:
      // solo se expulsa cuando la respuesta llega y dice que no es admin.
      let res = await supabase.rpc("is_platform_admin");
      if (res.error) {
        logError(res.error, { label: "is_platform_admin" });
        await new Promise((r) => setTimeout(r, 700));
        res = await supabase.rpc("is_platform_admin");
      }
      if (res.error) {
        logError(res.error, { label: "is_platform_admin:retry" });
        return; // deja el spinner; no redirige por un error transitorio
      }
      if (!res.data) {
        navigate("/dashboard", { replace: true });
        return;
      }
      setIsAdmin(true);
      setChecking(false);
    })();
  }, [session, loading, navigate]);

  const [badges, setBadges] = useState<{ pqrs: number; chat: number }>({ pqrs: 0, chat: 0 });
  const [badgesError, setBadgesError] = useState(false);
  const reconnectRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isAdmin) return;

    const load = async () => {
      try {
        const result = await fetchWithRetry(
          async () => {
            const [pqrsRes, threadsRes] = await Promise.all([
              supabase.from("pqrs").select("id", { count: "exact", head: true }).eq("read_by_admin", false),
              supabase.from("support_threads").select("unread_by_admin"),
            ]);
            if (pqrsRes.error) throw Object.assign(new Error(pqrsRes.error.message), { status: (pqrsRes as any).status ?? 500 });
            if (threadsRes.error) throw Object.assign(new Error(threadsRes.error.message), { status: (threadsRes as any).status ?? 500 });
            const chat = (threadsRes.data ?? []).reduce((a: number, t: any) => a + (t.unread_by_admin || 0), 0);
            return { pqrs: pqrsRes.count ?? 0, chat };
          },
          { label: "admin-badges", timeoutMs: 8000, retries: 2 }
        );
        setBadges(result);
        setBadgesError(false);
      } catch (err) {
        setBadgesError(true);
        logError(err, { label: "admin-badges" });
      }
    };

    load();

    let channel = supabase
      .channel("admin-badges")
      .on("postgres_changes", { event: "*", schema: "public", table: "pqrs" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "support_threads" }, load)
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
          if (reconnectRef.current) window.clearTimeout(reconnectRef.current);
          reconnectRef.current = window.setTimeout(() => load(), 2000);
        }
      });

    const onVisibility = () => {
      if (document.visibilityState === "visible") load();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("online", load);

    return () => {
      supabase.removeChannel(channel);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("online", load);
      if (reconnectRef.current) window.clearTimeout(reconnectRef.current);
    };
  }, [isAdmin]);

  const showShell = !loading && !!session;
  if (!showShell) {
    return (
      <div className="admin-shell flex h-dvh items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: "hsl(var(--admin-accent))" }} />
      </div>
    );
  }

  const sidebar = (
    <aside
      className="w-64 shrink-0 flex flex-col h-full"
      style={{
        background: "hsl(var(--admin-surface))",
        borderRight: "1px solid hsl(var(--admin-border))",
      }}
    >
      <div
        className="flex items-center gap-2 px-5 h-14 shrink-0"
        style={{ borderBottom: "1px solid hsl(var(--admin-border))" }}
      >
        <img src={logoVisualia} alt="Visualia" className="h-5 w-auto" />
        <span
          className="text-[10px] uppercase tracking-[0.18em] font-semibold"
          style={{ color: "hsl(var(--admin-accent))" }}
        >
          Admin
        </span>
        <button
          onClick={() => setMobileOpen(false)}
          className="md:hidden ml-auto p-1.5 rounded"
          aria-label="Cerrar menú"
          style={{ color: "hsl(var(--admin-fg-muted))" }}
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 px-2 py-2 overflow-y-auto">
        {groups.map((group) => (
          <div key={group.label}>
            <div className="admin-nav-label">{group.label}</div>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const { to, label, icon: Icon, end, badgeKey } = item;
                const badge = badgeKey ? badges[badgeKey] : 0;
                const active = end ? pathname === to : pathname.startsWith(to);
                return (
                  <Link
                    key={to}
                    to={to}
                    className="admin-nav-item"
                    data-active={active}
                    {...prefetchHandlers(to)}
                  >


                    <Icon className="h-[16px] w-[16px] shrink-0" strokeWidth={1.75} />
                    <span className="flex-1 truncate">{label}</span>
                    {badgeKey && badgesError ? null : badge > 0 ? (
                      <span
                        className="text-[10px] rounded-full px-1.5 py-0.5 min-w-[18px] text-center font-medium"
                        style={{ background: "hsl(var(--admin-danger))", color: "white" }}
                      >
                        {badge}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div
        className="p-2 space-y-0.5 shrink-0"
        style={{ borderTop: "1px solid hsl(var(--admin-border))" }}
      >
        <Link to="/dashboard" className="admin-nav-item">
          <ShieldCheck className="h-[16px] w-[16px]" strokeWidth={1.75} />
          <span>Ir al panel de negocio</span>
        </Link>
        <button
          onClick={() => signOut().then(() => navigate("/login"))}
          className="admin-nav-item w-full text-left"
        >
          <LogOut className="h-[16px] w-[16px]" strokeWidth={1.75} />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );

  return (
    <div className="admin-shell flex h-dvh overflow-hidden font-sans antialiased">
      {/* Desktop sidebar */}
      <div className="hidden md:flex">{sidebar}</div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <div className="absolute inset-y-0 left-0 flex">{sidebar}</div>
        </div>
      )}

      <main className="flex-1 min-w-0 overflow-y-auto" style={{ background: "hsl(var(--admin-bg))" }}>
        {/* Mobile top bar */}
        <div
          className="md:hidden flex items-center gap-3 h-12 px-3 sticky top-0 z-30"
          style={{
            background: "hsl(var(--admin-surface))",
            borderBottom: "1px solid hsl(var(--admin-border))",
          }}
        >
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded"
            aria-label="Abrir menú"
            style={{ color: "hsl(var(--admin-fg))" }}
          >
            <Menu className="h-5 w-5" />
          </button>
          <img src={logoVisualia} alt="Visualia" className="h-4 w-auto" />
          <span
            className="text-[10px] uppercase tracking-[0.18em] font-semibold"
            style={{ color: "hsl(var(--admin-accent))" }}
          >
            Admin
          </span>
        </div>

        {checking || !isAdmin ? (
          <div className="p-8">
            <div className="admin-card p-6 flex items-center gap-3">
              <div
                className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"
                style={{ borderColor: "hsl(var(--admin-accent))" }}
              />
              <span className="text-[13px] admin-muted">Verificando permisos…</span>
            </div>
          </div>
        ) : (
          <Suspense fallback={<ContentSkeleton />}>
            <Outlet />
          </Suspense>
        )}

      </main>
    </div>
  );
}
