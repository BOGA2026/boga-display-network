import { Link } from "react-router-dom";

/**
 * Minimal legal footer for public pages that don't render the full landing footer.
 * Provides the mandatory Ley 1581 links + company identification globally.
 */
const LegalFooter = () => (
  <footer className="border-t border-border/40 px-4 py-8 md:px-6">
    <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 text-xs text-muted-foreground md:flex-row">
      <p className="text-center md:text-left">
        © {new Date().getFullYear()} Boga Casa de Contenidos S.A.S. · NIT 900.325.011-10 · Bogotá, Colombia
      </p>
      <div className="flex gap-4">
        <Link to="/privacidad" className="rounded-sm transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          Política de tratamiento de datos
        </Link>
        <Link to="/terminos" className="rounded-sm transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          Términos y condiciones
        </Link>
      </div>
    </div>
  </footer>
);

export default LegalFooter;
