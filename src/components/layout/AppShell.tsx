/**
 * AppShell — the dashboard chrome.
 *
 * Rationale:
 * - Single component owns sidebar + topbar + page transition + ⌘K so route
 *   pages stay focused on content.
 * - `.dash-scope` on the root remaps design tokens for a distinct dashboard
 *   feel without leaking into the landing / studio / admin surfaces.
 * - Sidebar width is spring-animated with Framer Motion. Collapse state
 *   persists in localStorage so power users don't re-collapse it every visit.
 * - Command Palette listens for ⌘K / Ctrl+K globally.
 * - Un `<Suspense>` interno envuelve al `<Outlet />`: sólo el área de
 *   contenido cae en skeleton al cargar un chunk de página; sidebar y
 *   topbar permanecen montados → sin parpadeo de shell.
 */
import * as React from "react";
import { Suspense } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";

import {
  LayoutDashboard,
  Monitor,
  Image as ImageIcon,
  ListVideo,
  Calendar,
  BarChart3,
  CreditCard,
  LifeBuoy,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Command as CommandIcon,
  Plus,
  Upload,
  Map as MapIcon,
  QrCode,
} from "lucide-react";
import { cn } from "@/lib/utils";
import logoVisualia from "@/assets/logo-visualia.webp";
import { useAuth, signOut } from "@/hooks/useAuth";
import { useSessionTracker } from "@/hooks/useSessionTracker";
import { supabase } from "@/integrations/supabase/client";
import { VoiceAgentDock } from "@/components/voice-agent/VoiceAgentDock";
import { Breadcrumbs } from "./Breadcrumbs";
import { LocationSwitcher } from "./LocationSwitcher";
import { LocationProvider, useLocationContext } from "@/context/LocationContext";
import {
  CommandRegistryProvider,
  useCommandRegistry,
  useRegisterCommand,
  type CommandItem,
} from "@/hooks/useCommandRegistry";
import { CommandPalette } from "@/components/ui/command-palette";
import { PageTransition } from "@/components/ui/page-transition";
import { GlobalCommands } from "@/components/dashboard/GlobalCommands";
import { ContentSkeleton } from "./ContentSkeleton";
import { prefetch } from "@/lib/routePrefetch";
import { NAV, NAV_GROUPS, COPY } from "@/config/lexicon";


const NAV_ITEMS = NAV_GROUPS.flatMap((g) => g.items.map((key) => NAV[key]));

const SIDEBAR_KEY = "dash.sidebar";

/* Register the baseline commands (nav + quick actions + sedes). */
function BaselineCommands() {
  const navigate = useNavigate();
  const { locations, setActiveLocationId } = useLocationContext();

  const items = React.useMemo<CommandItem[]>(() => {
    const nav = NAV_ITEMS.map((n) => ({
      id: `nav:${n.path}`,
      label: n.label,
      group: "Navegación" as const,
      icon: <n.icon className="mr-2 h-4 w-4" />,
      onSelect: () => navigate(n.path),
    }));
    const actions: CommandItem[] = [
      {
        id: "action:new-screen",
        label: "Nueva pantalla",
        group: "Acciones",
        icon: <Plus className="mr-2 h-4 w-4" />,
        onSelect: () => navigate("/dashboard/pantallas"),
      },
      {
        id: "action:upload-content",
        label: "Subir contenido",
        group: "Acciones",
        icon: <Upload className="mr-2 h-4 w-4" />,
        onSelect: () => navigate("/dashboard/contenido"),
      },
      {
        id: "action:new-playlist",
        label: COPY.actions.newPlaylist,
        group: "Acciones",
        icon: <ListVideo className="mr-2 h-4 w-4" />,
        onSelect: () => navigate(NAV.listas.path),
      },
      {
        id: "action:subscription",
        label: "Ir a suscripción",
        group: "Acciones",
        icon: <CreditCard className="mr-2 h-4 w-4" />,
        onSelect: () => navigate("/dashboard/suscripcion"),
      },
    ];
    const sedes: CommandItem[] = [
      {
        id: "sede:all",
        label: "Ver todas las sedes",
        group: "Sedes",
        keywords: ["sede", "location"],
        onSelect: () => setActiveLocationId(null),
      },
      ...locations.map((loc) => ({
        id: `sede:${loc.id}`,
        label: `Cambiar a sede: ${loc.name}`,
        group: "Sedes" as const,
        keywords: ["sede", loc.name],
        onSelect: () => setActiveLocationId(loc.id),
      })),
    ];
    return [...nav, ...actions, ...sedes];
  }, [navigate, locations, setActiveLocationId]);

  useRegisterCommand(items);
  return null;
}

function ShellInner() {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = React.useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(SIDEBAR_KEY) === "1";
  });
  const [paletteOpen, setPaletteOpen] = React.useState(false);

  React.useEffect(() => {
    window.localStorage.setItem(SIDEBAR_KEY, collapsed ? "1" : "0");
  }, [collapsed]);

  // ⌘K / Ctrl+K
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleLogout = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  const sidebarWidth = collapsed ? 68 : 240;

  return (
    <div className="dash-scope flex h-screen w-full overflow-hidden bg-background text-foreground">
      <BaselineCommands />

      {/* Sidebar */}
      <aside
        style={{ width: sidebarWidth, transition: "width var(--duration-medium) var(--ease-ios)" }}
        className="relative z-20 flex h-screen shrink-0 flex-col border-r border-border bg-sidebar"
      >
        <div className="flex h-14 items-center justify-center px-3">
          <Link to="/dashboard" className="inline-flex items-center">
            <img
              src={logoVisualia}
              alt="Visualia"
              className={cn("h-7 w-auto transition-all", collapsed && "h-6")}
            />
          </Link>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-2">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              onMouseEnter={() => prefetch(item.path)}
              onFocus={() => prefetch(item.path)}
              onTouchStart={() => prefetch(item.path)}
              className={({ isActive }) =>
                cn(
                  "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ease-ios",
                  isActive
                    ? "bg-primary/12 text-foreground shadow-soft-1"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                )
              }
            >

              {({ isActive }) => (
                <>
                  {isActive && (
                    <span
                      aria-hidden
                      className="motion-rise absolute inset-y-2 left-0 w-0.5 rounded-full bg-primary"
                    />
                  )}
                  <item.icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-border p-2 space-y-1">
          <button
            onClick={() => setCollapsed((v) => !v)}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
            aria-label={collapsed ? COPY.actions.expand : COPY.actions.collapse}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4 shrink-0" />
            ) : (
              <PanelLeftClose className="h-4 w-4 shrink-0" />
            )}
            {!collapsed && <span>{COPY.actions.collapse}</span>}
          </button>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span>{COPY.actions.logout}</span>}
          </button>
        </div>
      </aside>

      {/* Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border bg-background/60 px-4 backdrop-blur">
          <Breadcrumbs />
          <div className="flex items-center gap-2">
            <LocationSwitcher />
            <PaletteTrigger onOpen={() => setPaletteOpen(true)} />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <PageTransition>
            <Suspense fallback={<ContentSkeleton />}>
              <Outlet />
            </Suspense>
          </PageTransition>
        </main>
      </div>


      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      <GlobalCommands />
      <VoiceAgentDock />
    </div>
  );
}

function PaletteTrigger({ onOpen }: { onOpen: () => void }) {
  // touch registry so it stays mounted; not strictly needed but keeps parity.
  useCommandRegistry();
  const isMac =
    typeof navigator !== "undefined" && /Mac|iPhone|iPod|iPad/i.test(navigator.platform);
  return (
    <button
      onClick={onOpen}
      className="inline-flex h-9 items-center gap-2 rounded-full border border-border bg-muted/30 px-3 text-sm text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
      aria-label="Abrir command palette"
    >
      <CommandIcon className="h-3.5 w-3.5" />
      <span className="hidden md:inline">{COPY.actions.search}</span>
      <kbd className="ml-1 hidden rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium md:inline">
        {isMac ? "⌘" : "Ctrl"} K
      </kbd>
    </button>
  );
}

/**
 * Public export. Handles auth + admin redirect, then hydrates the shell
 * inside its providers.
 */
export default function AppShell() {
  const { session, loading } = useAuth("/login");
  const [checkingRole, setCheckingRole] = React.useState(true);
  const navigate = useNavigate();
  useSessionTracker(session?.user?.id);

  React.useEffect(() => {
    if (loading) return;
    if (!session) {
      setCheckingRole(false);
      return;
    }
    let active = true;
    supabase.rpc("is_platform_admin").then(({ data: isAdmin, error }) => {
      if (!active) return;
      if (error) console.error("No se pudo verificar el acceso de administrador", error);
      if (isAdmin) {
        navigate("/admin", { replace: true });
        return;
      }
      setCheckingRole(false);
    });
    return () => {
      active = false;
    };
  }, [loading, session, navigate]);

  if (loading || checkingRole) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <LocationProvider>
      <CommandRegistryProvider>
        <ShellInner />
      </CommandRegistryProvider>
    </LocationProvider>
  );
}
