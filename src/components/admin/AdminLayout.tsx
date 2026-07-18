import { useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import logoVisualia from "@/assets/logo-visualia.webp";
import {
  ShieldCheck,
  LayoutDashboard,
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
} from "lucide-react";
import { signOut } from "@/hooks/useAuth";
import { useSessionTracker } from "@/hooks/useSessionTracker";

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
      { to: "/admin", label: "Resumen", icon: LayoutDashboard, end: true },
      { to: "/admin/trafico", label: "Tráfico", icon: Activity },
    ],
  },
  {
    label: "Comercial",
    items: [
      { to: "/admin/suscripciones", label: "Suscripciones", icon: CreditCard },
      { to: "/admin/pagos", label: "Vencimientos", icon: CalendarClock },
      { to: "/admin/leads", label: "Leads", icon: Inbox },
    ],
  },
  {
    label: "Operaciones",
    items: [
      { to: "/admin/pantallas", label: "Pantallas", icon: Monitor },
      { to: "/admin/mapa", label: "Mapa", icon: MapIcon },
      { to: "/admin/negocios", label: "Negocios", icon: Building2 },
    ],
  },
  {
    label: "Atención",
    items: [
      { to: "/admin/pqrs", label: "PQRS", icon: FileText, badgeKey: "pqrs" },
      { to: "/admin/soporte", label: "Soporte", icon: MessageSquare, badgeKey: "chat" },
    ],
  },
  {
    label: "Sistema",
    items: [{ to: "/admin/admins", label: "Administradores", icon: Users }],
  },
];

export default function AdminLayout() {
  const { session, loading } = useAuth("/login");
  useSessionTracker(session?.user?.id);
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    if (loading || !session) return;
    (async () => {
      const { data: hasAdminAccess, error } = await supabase.rpc("is_platform_admin");
      if (error || !hasAdminAccess) {
        if (error) console.error("No se pudo verificar el acceso de administrador", error);
        navigate("/dashboard", { replace: true });
        return;
      }
      setIsAdmin(true);
      setChecking(false);
    })();
  }, [session, loading, navigate]);

  const [badges, setBadges] = useState<{ pqrs: number; chat: number }>({ pqrs: 0, chat: 0 });

  useEffect(() => {
    if (!isAdmin) return;
    const load = async () => {
      const [{ count: pqrs }, { data: threads }] = await Promise.all([
        supabase.from("pqrs").select("id", { count: "exact", head: true }).eq("read_by_admin", false),
        supabase.from("support_threads").select("unread_by_admin"),
      ]);
      const chat = (threads ?? []).reduce((a: number, t: any) => a + (t.unread_by_admin || 0), 0);
      setBadges({ pqrs: pqrs ?? 0, chat });
    };
    load();
    const ch = supabase
      .channel("admin-badges")
      .on("postgres_changes", { event: "*", schema: "public", table: "pqrs" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "support_threads" }, load)
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [isAdmin]);

  if (loading || checking || !isAdmin) {
    return (
      <div className="admin-shell flex h-dvh items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: "hsl(var(--admin-accent))" }} />
      </div>
    );
  }

  return (
    <div className="admin-shell flex h-dvh overflow-hidden font-sans antialiased">
      <aside
        className="w-64 shrink-0 flex flex-col"
        style={{
          background: "hsl(var(--admin-surface))",
          borderRight: "1px solid hsl(var(--admin-border))",
        }}
      >
        <div
          className="flex items-center gap-2 px-5 h-14"
          style={{ borderBottom: "1px solid hsl(var(--admin-border))" }}
        >
          <img src={logoVisualia} alt="Visualia" className="h-5 w-auto" />
          <span
            className="text-[10px] uppercase tracking-[0.18em] font-semibold"
            style={{ color: "hsl(var(--admin-accent))" }}
          >
            Admin
          </span>
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
                    <Link key={to} to={to} className="admin-nav-item" data-active={active}>
                      <Icon className="h-[16px] w-[16px] shrink-0" strokeWidth={1.75} />
                      <span className="flex-1 truncate">{label}</span>
                      {badge > 0 && (
                        <span
                          className="text-[10px] rounded-full px-1.5 py-0.5 min-w-[18px] text-center font-medium"
                          style={{ background: "hsl(var(--admin-danger))", color: "white" }}
                        >
                          {badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div
          className="p-2 space-y-0.5"
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

      <main className="flex-1 overflow-y-auto" style={{ background: "hsl(var(--admin-bg))" }}>
        <Outlet />
      </main>
    </div>
  );
}
