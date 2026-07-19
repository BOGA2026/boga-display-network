import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import simboloVisualia from "@/assets/simbolo-visualia.webp";
import { Button } from "@/components/ui/button";
import { Menu, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { prefetchRoute } from "@/lib/prefetch";

const menuItems = [
  {
    id: "productos" as const,
    label: "Productos",
    children: [
      { label: "Panel de control", href: "/precios", disabled: false },
      { label: "Crea tu contenido", href: "/studio", disabled: false },
    ],
  },
  {
    id: "soluciones" as const,
    label: "Soluciones",
    children: [
      { label: "Restaurantes", href: "/soluciones/restaurantes", disabled: false },
      { label: "Clínicas", href: "#", disabled: true },
      { label: "Hoteles", href: "#", disabled: true },
    ],
  },
];

const directLinks = [
  { label: "Precios", href: "/precios" },
  { label: "Acerca de Visualia", href: "/acerca" },
  { label: "Vincula tu pantalla", href: "/descargar-apk" },
];

const linkClass =
  "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

type MenuId = (typeof menuItems)[number]["id"];

const LandingHeader = () => {
  const [scrolled, setScrolled] = useState(false);
  const [activeMenu, setActiveMenu] = useState<MenuId | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<MenuId | null>(null);
  const headerRef = useRef<HTMLElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const menuTriggersRef = useRef<Record<MenuId, HTMLButtonElement | null>>({
    productos: null,
    soluciones: null,
  });

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
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveMenu(null);
        setMobileExpanded(null);
        if (activeMenu) {
          menuTriggersRef.current[activeMenu]?.focus();
        }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [activeMenu]);

  const openMenu = useCallback((id: MenuId) => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setActiveMenu(id), 80);
  }, []);

  const closeMenu = useCallback(() => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setActiveMenu(null), 120);
  }, []);

  const toggleMenu = useCallback((id: MenuId) => {
    setActiveMenu((prev) => (prev === id ? null : id));
  }, []);

  return (
    <header
      ref={headerRef}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-200",
        scrolled ? "border-b border-border" : "border-b border-transparent"
      )}
      style={{
        background: scrolled ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.6)",
        backdropFilter: "saturate(180%) blur(12px)",
        WebkitBackdropFilter: "saturate(180%) blur(12px)",
      }}
    >
      <div className="mx-auto flex max-w-[1200px] items-center justify-between px-6 h-16">
        {/* Logo */}
        <Link to="/" className="flex items-center">
          <img src={simboloVisualia} alt="Visualia" className="h-9 w-auto" />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-1 lg:flex">
          {menuItems.map((item) => (
            <div
              key={item.id}
              className="relative"
              onMouseEnter={() => openMenu(item.id)}
              onMouseLeave={closeMenu}
            >
              <button
                ref={(el) => { menuTriggersRef.current[item.id] = el; }}
                className={cn(
                  "flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  activeMenu === item.id
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => toggleMenu(item.id)}
                aria-expanded={activeMenu === item.id}
                aria-haspopup="true"
              >
                {item.label}
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 transition-transform",
                    activeMenu === item.id && "rotate-180"
                  )}
                />
              </button>

              <div
                className={cn(
                  "absolute left-1/2 top-full -translate-x-1/2 pt-2 transition-opacity duration-200",
                  activeMenu === item.id
                    ? "pointer-events-auto opacity-100"
                    : "pointer-events-none opacity-0"
                )}
              >
                <div
                  className="min-w-[220px] rounded-[10px] border border-border bg-background p-2 shadow-[0_8px_24px_rgba(0,0,0,0.06)]"
                >
                  {item.children.map((child) =>
                    child.disabled ? (
                      <span
                        key={child.label}
                        className="flex items-center justify-between gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground cursor-default"
                      >
                        {child.label}
                        <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                          Próximamente
                        </span>
                      </span>
                    ) : (
                      <Link
                        key={child.label}
                        to={child.href}
                        onMouseEnter={() => prefetchRoute(child.href)}
                        onFocus={() => prefetchRoute(child.href)}
                        className="block rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        {child.label}
                      </Link>
                    )
                  )}
                </div>
              </div>
            </div>
          ))}

          {directLinks.map((link) => (
            <Link
              key={link.label}
              to={link.href}
              onMouseEnter={() => prefetchRoute(link.href)}
              onFocus={() => prefetchRoute(link.href)}
              className={linkClass}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right — Actions */}
        <div className="hidden items-center gap-2 lg:flex">
          <Button size="sm" variant="ghost" asChild>
            <Link to="/descargar-apk">Descargar app</Link>
          </Button>
          <Button size="sm" asChild>
            <Link to="/login">Entrar</Link>
          </Button>
        </div>

        {/* Mobile toggle */}
        <button
          className="rounded-md p-2 text-foreground lg:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
        </button>

      </div>

      {/* Mobile menu */}
      <div
        className={cn(
          "overflow-hidden border-t border-border bg-background transition-all duration-200 lg:hidden",
          mobileOpen ? "max-h-[80vh] opacity-100" : "max-h-0 opacity-0 border-t-0"
        )}
      >
        <div className="mx-auto max-w-[1200px] space-y-1 px-6 py-4">
          {menuItems.map((item) => (
            <div key={item.label}>
              <button
                className="flex w-full items-center justify-between rounded-md px-3 py-2.5 text-sm font-medium text-foreground"
                onClick={() =>
                  setMobileExpanded(mobileExpanded === item.label ? null : item.label)
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
                  {item.children.map((child) =>
                    child.disabled ? (
                      <span
                        key={child.label}
                        className="flex items-center justify-between rounded-md px-3 py-2 text-sm text-muted-foreground"
                      >
                        {child.label}
                        <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider">
                          Próximamente
                        </span>
                      </span>
                    ) : (
                      <Link
                        key={child.label}
                        to={child.href}
                        className="block rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
                        onClick={() => setMobileOpen(false)}
                      >
                        {child.label}
                      </Link>
                    )
                  )}
                </div>
              </div>
            </div>
          ))}
          {directLinks.map((link) => (
            <Link
              key={link.label}
              to={link.href}
              className="block rounded-md px-3 py-2.5 text-sm font-medium text-foreground"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="flex flex-col gap-2 pt-3">
            <Button variant="outline" asChild>
              <Link to="/descargar-apk" onClick={() => setMobileOpen(false)}>
                Descargar app
              </Link>
            </Button>
            <Button asChild>
              <Link to="/login" onClick={() => setMobileOpen(false)}>
                Entrar
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default LandingHeader;
