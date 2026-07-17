import { useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import logoVisualia from "@/assets/logo-visualia.png";
import { ShieldCheck, LayoutDashboard, Building2, Users, Inbox, LogOut, Activity, CreditCard, Monitor, CalendarClock, Map as MapIcon, MessageSquare, FileText } from "lucide-react";
import { signOut } from "@/hooks/useAuth";
import { useSessionTracker } from "@/hooks/useSessionTracker";

const nav = [
  { to: "/admin", label: "Resumen", icon: LayoutDashboard, end: true },
  { to: "/admin/trafico", label: "Tráfico", icon: Activity },
  { to: "/admin/suscripciones", label: "Suscripciones", icon: CreditCard },
  { to: "/admin/pantallas", label: "Pantallas", icon: Monitor },
  { to: "/admin/pagos", label: "Vencimientos", icon: CalendarClock },
  { to: "/admin/mapa", label: "Mapa", icon: MapIcon },
  { to: "/admin/pqrs", label: "PQRS", icon: FileText, badgeKey: "pqrs" as const },
  { to: "/admin/soporte", label: "Soporte", icon: MessageSquare, badgeKey: "chat" as const },
  { to: "/admin/negocios", label: "Negocios", icon: Building2 },
  { to: "/admin/leads", label: "Leads", icon: Inbox },
  { to: "/admin/admins", label: "Administradores", icon: Users },
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
      const { data } = await supabase
        .from("platform_admins")
        .select("user_id")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (!data) {
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
    const ch = supabase.channel("admin-badges")
      .on("postgres_changes", { event: "*", schema: "public", table: "pqrs" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "support_threads" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [isAdmin]);

  if (loading || checking || !isAdmin) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="relative flex h-screen overflow-hidden" style={{ background: "linear-gradient(180deg, hsl(260 30% 5%) 0%, hsl(260 25% 7%) 50%, hsl(260 30% 5%) 100%)" }}>
      <aside className="w-60 shrink-0 border-r border-border/50 bg-background/40 backdrop-blur-sm flex flex-col">
        <div className="flex items-center gap-2 px-4 h-14 border-b border-border/50">
          <img src={logoVisualia} alt="Visualia" className="h-5 w-auto" />
          <span className="text-[10px] uppercase tracking-widest text-primary font-semibold">Admin</span>
        </div>
        <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto">
          {nav.map((item) => {
            const { to, label, icon: Icon, end } = item as any;
            const badgeKey = (item as any).badgeKey as "pqrs" | "chat" | undefined;
            const badge = badgeKey ? badges[badgeKey] : 0;
            const active = end ? pathname === to : pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition ${
                  active
                    ? "bg-primary/15 text-primary shadow-[0_0_20px_-8px_hsl(var(--primary))]"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="flex-1">{label}</span>
                {badge > 0 && (
                  <span className="text-[10px] bg-red-500 text-white rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                    {badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="p-2 border-t border-border/50 space-y-1">
          <Link
            to="/dashboard"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-white/5"
          >
            <ShieldCheck className="h-4 w-4" />
            Ir al panel de negocio
          </Link>
          <button
            onClick={() => signOut().then(() => navigate("/login"))}
            className="w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-white/5"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
