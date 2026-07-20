import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import simboloVisualia from "@/assets/simbolo-visualia.webp";
import { ChevronDown, ChevronRight, Grid, Layers, Tag, Info, Monitor, Download } from "lucide-react";
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
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
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
        setMobileOpen(false);
        if (activeMenu) menuTriggersRef.current[activeMenu]?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [activeMenu]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

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

  const isActive = (href: string) => location.pathname === href;

  const pillLink =
    "relative inline-flex items-center rounded-full px-4 py-2 text-[14px] font-medium transition-all duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)]";

  return (
    <>
    <header
      ref={headerRef}
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? "rgba(6,0,16,0.92)" : "rgba(6,0,16,0.8)",
        backdropFilter: "saturate(180%) blur(16px)",
        WebkitBackdropFilter: "saturate(180%) blur(16px)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div className="mx-auto flex max-w-[1200px] items-center justify-between px-4 lg:px-6 h-[60px] lg:h-[68px]">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center transition-transform duration-[250ms] hover:scale-105"
        >
          <img src={simboloVisualia} alt="Visualia" className="h-8 lg:h-9 w-auto" />
        </Link>

        {/* Desktop Nav — Pill container */}
        <nav
          className="hidden lg:flex items-center gap-1 rounded-full"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.1)",
            padding: 6,
          }}
        >
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
                  pillLink,
                  "gap-1",
                  activeMenu === item.id
                    ? "text-white"
                    : "text-white/65 hover:text-white"
                )}
                style={
                  activeMenu === item.id
                    ? { background: "rgba(255,255,255,0.06)" }
                    : undefined
                }
                onMouseEnter={(e) => {
                  if (activeMenu !== item.id)
                    (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)";
                }}
                onMouseLeave={(e) => {
                  if (activeMenu !== item.id)
                    (e.currentTarget as HTMLElement).style.background = "";
                }}
                onClick={() => toggleMenu(item.id)}
                aria-expanded={activeMenu === item.id}
                aria-haspopup="true"
              >
                {item.label}
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 transition-transform duration-200",
                    activeMenu === item.id && "rotate-180"
                  )}
                />
              </button>

              <div
                className={cn(
                  "absolute left-1/2 top-full -translate-x-1/2 pt-3 transition-all duration-200",
                  activeMenu === item.id
                    ? "pointer-events-auto opacity-100 translate-y-0"
                    : "pointer-events-none opacity-0 -translate-y-1.5"
                )}
              >
                <div
                  className="min-w-[240px] p-2"
                  style={{
                    background: "#0B0518",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 16,
                    boxShadow: "0 8px 40px rgba(0,0,0,0.6)",
                  }}
                >
                  {item.children.map((child) =>
                    child.disabled ? (
                      <span
                        key={child.label}
                        className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm text-white/50 cursor-default"
                      >
                        {child.label}
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white/60"
                          style={{ border: "1px solid rgba(255,255,255,0.12)" }}
                        >
                          Próximamente
                        </span>
                      </span>
                    ) : (
                      <Link
                        key={child.label}
                        to={child.href}
                        onMouseEnter={(e) => {
                          prefetchRoute(child.href);
                          (e.currentTarget as HTMLElement).style.background = "rgba(82,39,255,0.12)";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.background = "";
                        }}
                        onFocus={() => prefetchRoute(child.href)}
                        className="block rounded-lg px-3 py-2 text-sm text-white/75 hover:text-white transition-colors"
                      >
                        {child.label}
                      </Link>
                    )
                  )}
                </div>
              </div>
            </div>
          ))}

          {directLinks.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.label}
                to={link.href}
                onMouseEnter={(e) => {
                  prefetchRoute(link.href);
                  if (!active)
                    (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)";
                }}
                onMouseLeave={(e) => {
                  if (!active) (e.currentTarget as HTMLElement).style.background = "";
                }}
                onFocus={() => prefetchRoute(link.href)}
                className={cn(pillLink, active ? "text-white" : "text-white/65 hover:text-white")}
                style={active ? { background: "rgba(255,255,255,0.06)" } : undefined}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right — Actions */}
        <div className="hidden items-center gap-4 lg:flex">
          <Link
            to="/descargar-apk"
            className="text-[14px] font-medium text-white/80 hover:text-white transition-colors"
          >
            Descargar app
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center rounded-full font-semibold text-white transition-all duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)] hover:scale-[1.03]"
            style={{
              background: "#5227FF",
              padding: "10px 22px",
              fontSize: 14,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow = "0 0 20px rgba(82,39,255,0.5)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow = "";
            }}
          >
            Entrar
          </Link>
        </div>

        {/* Mobile right cluster */}
        <div className="flex items-center gap-2 lg:hidden">
          <Link
            to="/login"
            className="inline-flex items-center rounded-full font-semibold text-white transition-all duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)] active:scale-[0.97]"
            style={{
              background: "#5227FF",
              padding: "8px 16px",
              fontSize: 13,
              boxShadow: "0 0 16px rgba(82,39,255,0.35)",
            }}
          >
            Entrar
          </Link>
          <button
            className="mobile-hamburger relative inline-flex h-10 w-10 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={mobileOpen}
          >
            <span className={cn("hamburger-line hamburger-line-top", mobileOpen && "is-open")} />
            <span className={cn("hamburger-line hamburger-line-bottom", mobileOpen && "is-open")} />
          </button>
        </div>
      </div>
    </header>

    {/* Mobile fullscreen panel — rendered outside the header so `fixed` positions against the viewport (header's backdrop-filter creates a containing block that would clip it) */}
    <div
      className={cn(
        "lg:hidden fixed inset-0 top-[60px] z-40",
        mobileOpen ? "mobile-panel-in pointer-events-auto" : "mobile-panel-out pointer-events-none"
      )}
      style={{ background: "#060010" }}
      aria-hidden={!mobileOpen}
    >
        {/* Radial violet glow at the top */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[280px]"
          style={{
            background:
              "radial-gradient(60% 100% at 50% 0%, rgba(82,39,255,0.12) 0%, rgba(82,39,255,0) 70%)",
            filter: "blur(60px)",
          }}
        />
        <div className="relative h-full overflow-y-auto px-6 pt-6 pb-10">
          <div className="mx-auto max-w-[600px] flex flex-col gap-2">
            {menuItems.map((item, idx) => (
              <div
                key={item.id}
                className={cn("mobile-stagger", mobileOpen && "mobile-stagger-in")}
                style={{ animationDelay: `${idx * 60}ms` }}
              >
                <button
                  className="flex w-full items-center justify-between rounded-xl px-4 py-4 text-[24px] font-medium text-white"
                  onClick={() =>
                    setMobileExpanded(mobileExpanded === item.id ? null : item.id)
                  }
                  aria-expanded={mobileExpanded === item.id}
                >
                  {item.label}
                  <ChevronDown
                    className={cn(
                      "h-5 w-5 text-white/60 transition-transform",
                      mobileExpanded === item.id && "rotate-180"
                    )}
                  />
                </button>
                <div
                  className={cn(
                    "overflow-hidden transition-all duration-200",
                    mobileExpanded === item.id ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                  )}
                >
                  <div className="space-y-1 pb-2 pl-4">
                    {item.children.map((child) =>
                      child.disabled ? (
                        <span
                          key={child.label}
                          className="flex items-center justify-between rounded-lg px-3 py-2 text-base text-white/50"
                        >
                          {child.label}
                          <span
                            className="rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white/60"
                            style={{ border: "1px solid rgba(255,255,255,0.12)" }}
                          >
                            Próximamente
                          </span>
                        </span>
                      ) : (
                        <Link
                          key={child.label}
                          to={child.href}
                          className="block rounded-lg px-3 py-2 text-lg text-white/75 hover:text-white"
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
            {directLinks.map((link, idx) => (
              <Link
                key={link.label}
                to={link.href}
                className={cn(
                  "block rounded-xl px-4 py-4 text-[24px] font-medium text-white mobile-stagger",
                  mobileOpen && "mobile-stagger-in"
                )}
                style={{ animationDelay: `${(menuItems.length + idx) * 60}ms` }}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              to="/descargar-apk"
              onClick={() => setMobileOpen(false)}
              className={cn(
                "block rounded-xl px-4 py-4 text-[24px] font-medium text-white/80 mobile-stagger",
                mobileOpen && "mobile-stagger-in"
              )}
              style={{ animationDelay: `${(menuItems.length + directLinks.length) * 60}ms` }}
            >
              Descargar app
            </Link>
          </div>
        </div>
    </div>
    </>
  );
};

export default LandingHeader;
