import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, useLocation } from "react-router-dom";
import ParticlesBackground from "./components/landing/ParticlesBackground";
import AppRoutes from "./routes";
import { queryClient } from "@/lib/query-client";
import { AppErrorBoundary } from "@/components/system/ErrorBoundary";
import { AuthProvider } from "@/context/AuthContext";

// Rutas donde NO se renderizan las partículas (áreas privadas / full-screen).
const PARTICLES_EXCLUDE_PREFIXES = ["/dashboard", "/admin", "/player", "/digital-signage", "/templates", "/tv", "/lp"];

const GlobalParticles = () => {
  const { pathname } = useLocation();
  const excluded = PARTICLES_EXCLUDE_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
  if (excluded) return null;
  return <ParticlesBackground />;
};

const App = () => (
  <AppErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <GlobalParticles />
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </AppErrorBoundary>
);


export default App;
