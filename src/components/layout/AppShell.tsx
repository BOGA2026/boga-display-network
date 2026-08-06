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
  LogOut,
  Command as CommandIcon,
  Menu,
  Search,
} from "lucide-react";

import { cn } from "@/lib/utils";
import logoVisualia from "@/assets/logo-visualia.webp";
import { useAuth, signOut } from "@/hooks/useAuth";
import { useTenant } from "@/features/auth/useTenant";
import { reportError } from "@/lib/errorLogger";

import { useSessionTracker } from "@/hooks/useSessionTracker";
import { supabase } from "@/integrations/supabase/client";
import { VoiceAgentDock } from "@/components/voice-agent/VoiceAgentDock";
import { Breadcrumbs } from "./Breadcrumbs";
import { LocationSwitcher } from "./LocationSwitcher";
import { LocationProvider } from "@/context/LocationContext";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { BaselineCommands } from "@/components/dashboard/BaselineCommands";
import {
  CommandRegistryProvider,
  useCommandRegistry,
} from "@/hooks/useCommandRegistry";
import { CommandPalette } from "@/components/ui/command-palette";
import { PageTransition } from "@/components/ui/page-transition";
import { ContentSkeleton } from "./ContentSkeleton";
import { prefetch } from "@/lib/routePrefetch";
import { NAV, NAV_GROUPS, COPY } from "@/config/lexicon";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  useSidebar,
} from "@/components/ui/sidebar";

const SIDEBAR_KEY = "dash.sidebar";

/** Navegación del dashboard. Se comparte entre escritorio y panel móvil. */
function DashboardSidebar({ onLogout }: { onLogout: () => void }) {
  const { state, isMobile, setOpenMobile } = useSidebar();
  const collapsed = state === "collapsed" && !isMobile;
  const location = useLocation();
  const { businessName } = useTenant();


  // El panel móvil se cierra solo al navegar.
  React.useEffect(() => {
    setOpenMobile(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarHeader className="h-16 justify-center border-b border-border/60 px-3 py-0">
        <Link
          to="/dashboard"
          aria-label="Visualia"
          className={cn(
            "flex h-11 items-center gap-2.5 rounded-xl transition-all duration-200 ease-ios",
            collapsed ? "justify-center px-0" : "px-1",
          )}
        >
          <img
            src={logoVisualia}
            alt=""
            width={32}
            height={32}
            decoding="async"
            className="h-8 w-8 shrink-0 object-contain"
          />
          <span
            aria-hidden={collapsed}
            className={cn(
              "flex min-w-0 flex-col overflow-hidden transition-all duration-200 ease-ios",
              collapsed ? "w-0 opacity-0" : "w-auto max-w-[9.5rem] opacity-100",
            )}
          >
            <span className="truncate text-sm font-semibold leading-tight tracking-[0.02em] text-foreground">
              VISUALIA
            </span>
            {businessName && (
              <span className="truncate text-[11px] leading-tight text-muted-foreground">
                {businessName}
              </span>
            )}
          </span>
        </Link>
      </SidebarHeader>


      <SidebarContent className="p-2">
        {NAV_GROUPS.map((group) => (
          <SidebarGroup key={group.id} className="p-0">
            {!collapsed && (
              <SidebarGroupLabel className="v-nav-group-label h-auto px-3 py-2">
                {group.label}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((key) => {
                  const item = NAV[key];
                  return (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton asChild tooltip={item.label}>
                        <NavLink
                          to={item.path}
                          end={item.end}
                          onMouseEnter={() => prefetch(item.path)}
                          onFocus={() => prefetch(item.path)}
                          onTouchStart={() => prefetch(item.path)}
                          className={({ isActive }) =>
                            cn(
                              "v-nav-item v-focus-ring group relative flex min-h-[44px] items-center gap-3 overflow-hidden rounded-xl px-3 text-sm font-medium shadow-none ring-0 transition-colors duration-200 ease-ios focus-visible:ring-0",
                              isActive && "v-nav-item-active",
                            )
                          }
                        >
                          <item.icon className="h-4 w-4 shrink-0" />
                          {!collapsed && <span className="truncate">{item.label}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-border p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={onLogout}
              className="min-h-[44px] gap-3 rounded-xl px-3 text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{COPY.actions.logout}</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

/** Botón hamburguesa (44×44 px) visible por debajo de lg. */
function MobileMenuButton() {
  const { toggleSidebar } = useSidebar();
  return (
    <button
      type="button"
      onClick={toggleSidebar}
      aria-label="Abrir menú"
      className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground lg:hidden"
    >
      <Menu className="h-5 w-5" />
    </button>
  );
}

/** Alterna el sidebar colapsado en escritorio. */
function DesktopCollapseSync() {
  const { open, setOpen } = useSidebar();
  React.useEffect(() => {
    window.localStorage.setItem(SIDEBAR_KEY, open ? "0" : "1");
  }, [open]);
  React.useEffect(() => {
    if (window.localStorage.getItem(SIDEBAR_KEY) === "1") setOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

function ShellInner() {
  const navigate = useNavigate();
  // Título de pestaña siempre desde NAV[key].pageTitle.
  useDocumentTitle();
  const [paletteOpen, setPaletteOpen] = React.useState(false);

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

  return (
    <SidebarProvider>
      <div className="dash-scope flex h-screen w-full overflow-hidden bg-background text-foreground">
        <BaselineCommands />
        <DesktopCollapseSync />
        <DashboardSidebar onLogout={handleLogout} />

        <SidebarInset className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-border bg-background/60 px-2 backdrop-blur sm:px-4">
            <div className="flex min-w-0 items-center gap-1">
              <MobileMenuButton />
              {/* Logo compacto (sólo la marca) en móvil; migas desde lg. */}
              <img
                src={logoVisualia}
                alt="Visualia"
                width={28}
                height={28}
                decoding="async"
                className="h-7 w-7 shrink-0 object-contain lg:hidden"
              />
              <div className="hidden min-w-0 lg:block">
                <Breadcrumbs />
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
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
        </SidebarInset>

        <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
        <VoiceAgentDock />
      </div>
    </SidebarProvider>
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
      className="inline-flex h-11 min-w-[44px] items-center justify-center gap-2 rounded-full border border-border bg-muted/30 px-3 text-sm text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
      aria-label="Buscar"
    >
      {/* En móvil una lupa; el atajo ⌘K sólo tiene sentido con teclado. */}
      <Search className="h-5 w-5 md:hidden" />
      <CommandIcon className="hidden h-3.5 w-3.5 md:inline" />
      <span className="hidden md:inline">{COPY.actions.search}</span>
      <kbd className="ml-1 hidden rounded border border-border bg-background px-1.5 py-0.5 text-xs font-medium md:inline">
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
  const { businessId, loading: tenantLoading } = useTenant();
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
        navigate("/master", { replace: true });
        return;
      }
      setCheckingRole(false);
    });
    return () => {
      active = false;
    };
  }, [loading, session, navigate]);

  // Usuario autenticado sin negocio: no puede usar el panel (todo filtra por
  // business_id). Se lo manda a /onboarding, que es reanudable, y se reporta
  // a Sentry porque es un estado que no debería existir.
  React.useEffect(() => {
    if (loading || checkingRole || tenantLoading) return;
    if (!session || businessId) return;
    reportError(new Error("Usuario autenticado sin business_id"), {
      label: "tenant.missing_business",
      scope: "tenant",
      section: "dashboard",
      userId: session.user?.id,
      route: window.location.pathname,
    });
    navigate("/onboarding", { replace: true });
  }, [loading, checkingRole, tenantLoading, session, businessId, navigate]);

  if (loading || checkingRole || tenantLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (session && !businessId) {
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
