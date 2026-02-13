import { Outlet } from "react-router-dom";
import DashboardSidebar from "./DashboardSidebar";
import { Separator } from "@/components/ui/separator";
import logoVisualia from "@/assets/logo-visualia.png";

const DashboardLayout = () => {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
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
  );
};

export default DashboardLayout;
