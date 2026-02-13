import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import simboloVisualia from "@/assets/simbolo-visualia.png";
import { Button } from "@/components/ui/button";
import { Menu, X, Globe, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  {
    label: "Producto",
    children: [
      { label: "Cómo funciona", href: "#how" },
      { label: "Características", href: "#features" },
      { label: "Apps compatibles", href: "#" },
      { label: "Plantillas", href: "#" },
      { label: "Hardware recomendado", href: "#" },
    ],
  },
  {
    label: "Soluciones",
    children: [
      { label: "Restaurantes", href: "#" },
      { label: "Retail", href: "#" },
      { label: "Clínicas", href: "#" },
      { label: "Hoteles", href: "#" },
      { label: "Eventos", href: "#" },
      { label: "Corporativo", href: "#" },
    ],
  },
  {
    label: "Recursos",
    children: [
      { label: "Casos de uso", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Preguntas frecuentes", href: "#" },
      { label: "Descargas", href: "#" },
      { label: "Guías", href: "#" },
    ],
  },
  {
    label: "Empresa",
    children: [
      { label: "Sobre Visualia", href: "#" },
      { label: "Contacto", href: "#" },
      { label: "Socios", href: "#" },
      { label: "Marca blanca", href: "#" },
    ],
  },
  {
    label: "Visualia Studio",
    href: "/studio",
    children: null,
    premium: true,
  },
  {
    label: "Precios",
    href: "/precios",
    children: null,
  },
];

const LandingHeader = () => {
  const [scrolled, setScrolled] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const headerRef = useRef<HTMLElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  const handleEnter = (label: string) => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setActiveMenu(label), 80);
  };

  const handleLeave = () => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setActiveMenu(null), 120);
  };

  return (
    <header
      ref={headerRef}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-border/30 shadow-lg shadow-black/20 backdrop-blur-2xl"
          : "backdrop-blur-sm"
      )}
      style={{
        background: scrolled
          ? "rgba(14,11,22,0.92)"
          : "rgba(14,11,22,0.3)",
      }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        {/* Left — Logo */}
        <Link to="/" className="group flex items-center">
          <img src={simboloVisualia} alt="Visualia" className="h-[4.5rem] w-auto" />
        </Link>

        {/* Center — Nav */}
        <nav className="hidden items-center gap-2 lg:flex">
          {menuItems.map((item) => (
            <div
              key={item.label}
              className="relative"
              onMouseEnter={() => item.children && handleEnter(item.label)}
              onMouseLeave={handleLeave}
            >
              {item.children ? (
                <button
                  className={cn(
                    "relative flex items-center gap-2 rounded-lg px-6 py-3 text-lg font-semibold transition-colors",
                    activeMenu === item.label
                      ? "text-[hsl(275,100%,50%)] drop-shadow-[0_0_8px_hsl(275,100%,50%)]"
                      : "text-[hsl(275,100%,65%)] hover:text-[hsl(275,100%,50%)] hover:drop-shadow-[0_0_8px_hsl(275,100%,50%)]"
                  )}
                >
                  {item.label}
                  <ChevronDown
                    className={cn(
                      "h-3.5 w-3.5 transition-transform duration-200",
                      activeMenu === item.label && "rotate-180"
                    )}
                  />
                  {/* Hover underline */}
                  <span
                    className={cn(
                      "absolute bottom-0 left-4 right-4 h-px transition-all duration-200",
                      activeMenu === item.label
                        ? "opacity-100 scale-x-100"
                        : "opacity-0 scale-x-0"
                    )}
                    style={{ background: "linear-gradient(90deg, #8A00FF, #C000FF)" }}
                  />
                </button>
              ) : (
                <Link
                  to={item.href!}
                  className={cn(
                    "relative flex items-center rounded-lg px-6 py-3 text-lg font-semibold transition-colors",
                    (item as any).premium
                      ? "gap-2 text-[hsl(280,100%,70%)] hover:text-[hsl(275,100%,50%)] hover:drop-shadow-[0_0_8px_hsl(275,100%,50%)]"
                      : "text-[hsl(275,100%,65%)] hover:text-[hsl(275,100%,50%)] hover:drop-shadow-[0_0_8px_hsl(275,100%,50%)]"
                  )}
                >
                  {(item as any).premium && (
                    <span
                      className="mr-1 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                      style={{
                        borderColor: "hsl(270 100% 50% / 0.4)",
                        background: "hsl(270 100% 50% / 0.12)",
                        color: "hsl(280 100% 70%)",
                      }}
                    >
                      Pro
                    </span>
                  )}
                  {item.label}
                </Link>
              )}

              {/* Dropdown */}
              {item.children && (
                <div
                  className={cn(
                    "absolute left-1/2 top-full -translate-x-1/2 pt-2 transition-all duration-200",
                    activeMenu === item.label
                      ? "pointer-events-auto translate-y-0 opacity-100"
                      : "pointer-events-none -translate-y-1 opacity-0"
                  )}
                >
                  <div
                    className="min-w-[200px] rounded-xl border border-border/30 p-2 shadow-xl shadow-black/30 backdrop-blur-2xl"
                    style={{
                      background:
                        "linear-gradient(180deg, hsl(260 25% 13%) 0%, hsl(260 25% 10%) 100%)",
                    }}
                  >
                    {item.children.map((child) => (
                      <a
                        key={child.label}
                        href={child.href}
                        className="group/item flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-primary/10 hover:text-foreground"
                      >
                        <span
                          className="h-1 w-1 rounded-full opacity-0 transition-opacity group-hover/item:opacity-100"
                          style={{ background: "#C000FF" }}
                        />
                        {child.label}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Right — Actions */}
        <div className="hidden items-center gap-3 lg:flex">
          <Button
            size="sm"
            className="border border-[hsl(275,100%,50%)] bg-transparent text-[hsl(275,100%,65%)] shadow-[0_0_12px_hsl(275,100%,50%/0.4)] hover:bg-[hsl(275,100%,50%/0.15)] hover:text-[hsl(275,100%,50%)] hover:shadow-[0_0_20px_hsl(275,100%,50%/0.6)]"
            asChild
          >
            <Link to="/login">Entrar</Link>
          </Button>
          <Button
            size="sm"
            className="gradient-primary glow-primary-sm border-0 text-primary-foreground"
            asChild
          >
            <Link to="/registro">Solicitar demo</Link>
          </Button>
        </div>

        {/* Mobile toggle */}
        <button
          className="rounded-lg p-2 text-foreground lg:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      <div
        className={cn(
          "overflow-hidden border-t border-border/20 transition-all duration-300 lg:hidden",
          mobileOpen ? "max-h-[80vh] opacity-100" : "max-h-0 opacity-0 border-t-0"
        )}
        style={{ background: "rgba(14,11,22,0.97)" }}
      >
        <div className="mx-auto max-w-7xl space-y-1 px-6 py-4">
          {menuItems.map((item) => (
            <div key={item.label}>
              {item.children ? (
                <>
                  <button
                    className="flex w-full items-center justify-between rounded-lg px-3 py-3 text-sm font-medium text-foreground"
                    onClick={() =>
                      setMobileExpanded(
                        mobileExpanded === item.label ? null : item.label
                      )
                    }
                  >
                    {item.label}
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 text-muted-foreground transition-transform",
                        mobileExpanded === item.label && "rotate-180"
                      )}
                    />
                  </button>
                  <div
                    className={cn(
                      "overflow-hidden transition-all duration-200",
                      mobileExpanded === item.label
                        ? "max-h-96 opacity-100"
                        : "max-h-0 opacity-0"
                    )}
                  >
                    <div className="space-y-1 pb-2 pl-4">
                      {item.children.map((child) => (
                        <a
                          key={child.label}
                          href={child.href}
                          className="block rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                          onClick={() => setMobileOpen(false)}
                        >
                          {child.label}
                        </a>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <Link
                  to={item.href!}
                  className="block rounded-lg px-3 py-3 text-sm font-medium text-foreground"
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </Link>
              )}
            </div>
          ))}
          <div className="flex flex-col gap-3 pt-4">
            <Button
              variant="outline"
              className="w-full border-border/40"
              asChild
            >
              <Link to="/login" onClick={() => setMobileOpen(false)}>Entrar</Link>
            </Button>
            <Button
              className="w-full gradient-primary glow-primary-sm border-0 text-primary-foreground"
              asChild
            >
              <Link to="/registro" onClick={() => setMobileOpen(false)}>Solicitar demo</Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default LandingHeader;
