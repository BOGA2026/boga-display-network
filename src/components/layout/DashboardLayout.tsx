import { Outlet } from "react-router-dom";
import DashboardSidebar from "./DashboardSidebar";
import { Separator } from "@/components/ui/separator";

const DashboardLayout = () => {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <DashboardSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-11 shrink-0 items-center justify-between border-b border-border/50 px-5">
          <span className="font-display text-xs font-bold text-gradient-primary tracking-wide">VISUALIA</span>
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
