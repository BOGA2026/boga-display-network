import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import PremiumBackground from "@/components/layout/PremiumBackground";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <PremiumBackground className="flex items-center justify-center">
      <div className="text-center">
        <h1 className="mb-4 font-display text-6xl font-bold stat-glow">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Página no encontrada</p>
        <a href="/" className="text-primary hover:underline">
          Volver al inicio
        </a>
      </div>
    </PremiumBackground>
  );
};

export default NotFound;
