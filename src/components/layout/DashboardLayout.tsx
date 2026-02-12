import { Outlet } from "react-router-dom";
import DashboardSidebar from "./DashboardSidebar";
import bogaLogo from "@/assets/logo-boga.png";

const DashboardLayout = () => {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <DashboardSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-12 shrink-0 items-center border-b border-border px-4">
        <img src={bogaLogo} alt="BOGA" className="h-6 w-6 object-contain" />
        </header>
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
