import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import PremiumBackground from "@/components/layout/PremiumBackground";
import Seo from "@/components/Seo";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    if (import.meta.env.DEV) console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <PremiumBackground className="flex items-center justify-center">
      <Seo
        title="Página no encontrada | Visualia"
        description="La página que buscas no existe o fue movida. Volvé al inicio o mirá los precios de Visualia."
        path={location.pathname}
        noindex
      />
      <main className="text-center px-6">
        <p className="mb-2 font-display text-6xl font-bold stat-glow" aria-hidden="true">404</p>
        <h1 className="mb-4 text-2xl md:text-3xl font-semibold">Página no encontrada</h1>
        <p className="mb-6 text-muted-foreground max-w-md mx-auto">
          La página que buscás no existe o fue movida. Podés volver al inicio o revisar nuestros planes.
        </p>
        <nav className="flex items-center justify-center gap-4 text-primary">
          <a href="/" className="hover:underline">Ir al inicio</a>
          <span aria-hidden="true">·</span>
          <a href="/precios" className="hover:underline">Ver precios</a>
        </nav>
      </main>
    </PremiumBackground>
  );
};

export default NotFound;
