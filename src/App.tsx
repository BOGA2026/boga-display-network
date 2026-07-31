import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, useLocation } from "react-router-dom";
import ParticlesBackground from "./components/landing/ParticlesBackground";
import AppRoutes from "./routes";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data del dashboard: fresca 30s, cacheada 10min.
      staleTime: 30 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: 1,
    },
  },
});

// Rutas donde NO se renderizan las partículas (áreas privadas / full-screen).
const PARTICLES_EXCLUDE_PREFIXES = ["/dashboard", "/admin", "/player", "/digital-signage", "/templates", "/tv"];

const GlobalParticles = () => {
  const { pathname } = useLocation();
  const excluded = PARTICLES_EXCLUDE_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
  if (excluded) return null;
  return <ParticlesBackground />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <GlobalParticles />
        <AppRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
