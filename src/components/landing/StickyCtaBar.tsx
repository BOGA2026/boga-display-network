import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

/**
 * Barra CTA fija en la parte inferior de la landing.
 * Aparece cuando el usuario baja del hero.
 */
export default function StickyCtaBar() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 transition-all duration-300 ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-full opacity-0"
      }`}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="border-t border-white/10 bg-[#0b0616]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 md:px-6">
          <p className="hidden text-sm text-white/70 sm:block">
            Conecta tu primera pantalla en 10 minutos.{" "}
            <span className="text-white/45">Cancela cuando quieras.</span>
          </p>
          <div className="flex w-full items-center gap-3 sm:w-auto">
            <Link
              to="/registro"
              data-analytics="cta_sticky_registro"
              className="group inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#5227FF] px-6 py-3 text-sm font-semibold text-white transition-all duration-300 hover:shadow-[0_0_32px_rgba(82,39,255,0.55)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B19EEF] sm:flex-none"
            >
              Prueba gratis 14 días
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <a
              href="#precios"
              className="hidden rounded-full border border-white/15 px-5 py-3 text-sm font-medium text-white transition-colors hover:border-white/30 hover:bg-white/5 md:inline-flex"
            >
              Ver precios
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
