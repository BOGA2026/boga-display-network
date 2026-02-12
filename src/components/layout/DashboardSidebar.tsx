import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Monitor,
  Image,
  ListVideo,
  Calendar,
  BarChart3,
  LogOut,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Separator } from "@/components/ui/separator";
import logoBoga from "@/assets/logo-boga.png";

const navItems = [
  { icon: LayoutDashboard, label: "Inicio", path: "/dashboard" },
  { icon: Monitor, label: "Pantallas", path: "/dashboard/pantallas" },
  { icon: Image, label: "Contenido", path: "/dashboard/contenido" },
  { icon: ListVideo, label: "Playlists", path: "/dashboard/playlists" },
  { icon: Calendar, label: "Programación", path: "/dashboard/programacion" },
  { icon: BarChart3, label: "Analíticas", path: "/dashboard/analiticas" },
];

const DashboardSidebar = () => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "flex h-screen flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo */}
      <div className="flex h-14 items-center gap-3 px-4">
        {!collapsed ? (
          <div className="overflow-hidden">
            <p className="font-display text-sm font-bold leading-tight text-gradient-primary">Visualia</p>
            <p className="text-[10px] text-muted-foreground">Pantallas que venden</p>
          </div>
        ) : (
          <p className="font-display text-lg font-bold text-gradient-primary mx-auto">V</p>
        )}
      </div>

      <Separator className="bg-sidebar-border/60" />

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 p-2 pt-3">
        {navItems.map((item) => {
          const isActive =
            location.pathname === item.path ||
            (item.path !== "/dashboard" && location.pathname.startsWith(item.path));

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "gradient-primary text-primary-foreground glow-primary-sm"
                  : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
            >
              {isActive && (
                <div className="absolute -left-2 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full gradient-primary" />
              )}
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <Separator className="bg-sidebar-border/60 mx-2" />

      {/* Footer */}
      <div className="p-2 space-y-0.5">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
        >
          <ChevronLeft
            className={cn("h-4 w-4 shrink-0 transition-transform duration-300", collapsed && "rotate-180")}
          />
          {!collapsed && <span>Colapsar</span>}
        </button>
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors">
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Cerrar sesión</span>}
        </button>
      </div>
    </aside>
  );
};

export default DashboardSidebar;
