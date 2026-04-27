import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Monitor,
  Image,
  ListVideo,
  Calendar,
  BarChart3,
  CreditCard,
  PenTool,
  LogOut,
  ChevronLeft,
  Sparkles,
  Wifi,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Separator } from "@/components/ui/separator";
import logoVisualia from "@/assets/logo-visualia.png";
import { signOut } from "@/hooks/useAuth";

const navItems = [
  { icon: LayoutDashboard, label: "Inicio", path: "/dashboard" },
  { icon: Monitor, label: "Pantallas", path: "/dashboard/pantallas" },
  { icon: ListVideo, label: "Playlists", path: "/dashboard/playlists" },
  { icon: Calendar, label: "Programación", path: "/dashboard/programacion" },
  { icon: Image, label: "Contenido", path: "/dashboard/contenido" },
  { icon: Sparkles, label: "Generar con IA", path: "/dashboard/generar-ia" },
  { icon: PenTool, label: "Editor", path: "/dashboard/editor" },
  { icon: BarChart3, label: "Analíticas", path: "/dashboard/analiticas" },
  { icon: CreditCard, label: "Suscripción", path: "/dashboard/suscripcion" },
  { icon: Wifi, label: "Flota Fire TV", path: "/dashboard/flota" },
];

const DashboardSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  return (
    <aside
      className={cn(
        "flex h-screen flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo */}
      <div className="flex h-14 items-center px-4">
        {!collapsed ? (
          <img src={logoVisualia} alt="Visualia" className="h-8 w-auto" />
        ) : (
          <img src={logoVisualia} alt="Visualia" className="h-6 w-auto mx-auto" />
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
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Cerrar sesión</span>}
        </button>
      </div>
    </aside>
  );
};

export default DashboardSidebar;
