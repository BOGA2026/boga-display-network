import { Outlet } from "react-router-dom";
import DashboardSidebar from "./DashboardSidebar";
import { Separator } from "@/components/ui/separator";
import logoVisualia from "@/assets/logo-visualia.png";
import { useAuth } from "@/hooks/useAuth";

const DashboardLayout = () => {
  const { loading } = useAuth("/login");

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="relative flex h-screen overflow-hidden grain-overlay" style={{ background: "linear-gradient(180deg, hsl(260 30% 5%) 0%, hsl(260 25% 7%) 50%, hsl(260 30% 5%) 100%)" }}>
      {/* Subtle dashboard orbs */}
      <div className="ambient-orb" style={{ width: 400, height: 400, top: '-10%', left: '-12%', background: 'hsl(270 100% 30%)', opacity: 0.06, animationDuration: '22s' } as React.CSSProperties} />
      <div className="ambient-orb" style={{ width: 300, height: 300, top: '50%', right: '-8%', background: 'hsl(280 100% 25%)', opacity: 0.06, animationName: 'orb-drift-alt', animationDelay: '6s', animationDuration: '26s' } as React.CSSProperties} />

      <div className="relative z-10 flex h-full w-full">
        <DashboardSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <header className="flex h-11 shrink-0 items-center justify-between border-b border-border/50 px-5">
            <img src={logoVisualia} alt="Visualia" className="h-5 w-auto" />
            <span className="text-[10px] text-muted-foreground">Control Center</span>
          </header>
          <main className="flex-1 overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
