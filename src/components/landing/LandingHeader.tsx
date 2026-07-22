import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import simboloVisualia from "@/assets/simbolo-visualia.webp";
import {
  ChevronDown,
  ChevronRight,
  Grid,
  Layers,
  Tag,
  Info,
  Monitor,
  Download,
  LayoutDashboard,
  Palette,
  UtensilsCrossed,
  Stethoscope,
  Building2,
  LogIn,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { prefetchRoute } from "@/lib/prefetch";

const menuItems = [
  {
    id: "productos" as const,
    label: "Productos",
    children: [
      { label: "Panel de control", href: "/precios", disabled: false, icon: LayoutDashboard },
      { label: "Crea tu contenido", href: "/studio", disabled: false, icon: Palette },
    ],
  },
  {
    id: "soluciones" as const,
    label: "Soluciones",
    children: [
      { label: "Restaurantes", href: "/soluciones/restaurantes", disabled: false, icon: UtensilsCrossed },
      { label: "Clínicas", href: "#", disabled: true, icon: Stethoscope },
      { label: "Hoteles", href: "#", disabled: true, icon: Building2 },
    ],
  },
];

const directLinks = [
  { label: "Precios", href: "/precios" },
  { label: "Acerca de Visualia", href: "/acerca" },
  { label: "Vincula tu pantalla", href: "/descargar-apk", featured: true },
];

type MenuId = (typeof menuItems)[number]["id"];

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const SPRING = "cubic-bezier(0.34, 1.36, 0.64, 1)";

const LandingHeader = () => {
  const [scrolled, setScrolled] = useState(false);
  const [activeMenu, setActiveMenu] = useState<MenuId | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<MenuId | null>(null);
  const [hoverPill, setHoverPill] = useState<{ left: number; width: number; visible: boolean }>({
    left: 0,
    width: 0,
    visible: false,
  });
  const headerRef = useRef<HTMLElement>(null);
  const navRef = useRef<HTMLDivElement>(null);
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
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
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

  const handleItemEnter = (el: HTMLElement) => {
    if (!navRef.current) return;
    const navRect = navRef.current.getBoundingClientRect();
    const rect = el.getBoundingClientRect();
    setHoverPill({
      left: rect.left - navRect.left,
      width: rect.width,
      visible: true,
    });
  };

  const handleNavLeave = () => setHoverPill((p) => ({ ...p, visible: false }));

  const pillLink =
    "relative z-[1] inline-flex items-center rounded-full px-4 py-2 text-[14px] font-medium transition-colors duration-200 ease-out";

  return (
    <>
      <style>{`
        @keyframes visualia-header-shine {
          0% { transform: translateX(-120%) skewX(-20deg); }
          100% { transform: translateX(220%) skewX(-20deg); }
        }
        .visualia-logo-shine { position: relative; overflow: hidden; }
        .visualia-logo-shine::after {
          content: "";
          position: absolute; inset: 0;
          background: linear-gradient(100deg, transparent 30%, rgba(255,255,255,0.55) 50%, transparent 70%);
          transform: translateX(-120%) skewX(-20deg);
          pointer-events: none;
        }
        .visualia-logo-shine:hover::after {
          animation: visualia-header-shine 700ms ease-out;
        }
        @keyframes visualia-live-pulse-nav {
          0%, 100% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.6); opacity: 0.35; }
        }
        @media (prefers-reduced-motion: reduce) {
          .visualia-logo-shine:hover::after { animation: none; }
          .visualia-live-ring { animation: none !important; }
          .visualia-hover-pill { transition: opacity 150ms ease-out !important; }
        }
      `}</style>

      <header
        ref={headerRef}
        className="fixed top-0 left-0 right-0 z-50"
        style={{
          background: scrolled ? "rgba(6,0,16,0.75)" : "rgba(6,0,16,0.55)",
          backdropFilter: "saturate(180%) blur(22px)",
          WebkitBackdropFilter: "saturate(180%) blur(22px)",
          borderBottom: scrolled ? "1px solid rgba(255,255,255,0.05)" : "1px solid transparent",
          boxShadow: scrolled ? "0 8px 32px -12px rgba(0,0,0,0.5)" : "none",
          transition: `background 250ms ${EASE}, border-color 250ms ${EASE}, box-shadow 250ms ${EASE}`,
        }}
      >
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-4 lg:px-6 h-[60px] lg:h-[68px]">
          {/* Logo */}
          <Link
            to="/"
            className="visualia-logo-shine flex items-center rounded-md"
            aria-label="Ir al inicio"
          >
            <img src={simboloVisualia} alt="Visualia" className="h-8 lg:h-9 w-auto" />
          </Link>

          {/* Desktop Nav — Pill container with sliding hover indicator */}
          <nav
            ref={navRef}
            onMouseLeave={handleNavLeave}
            className="hidden lg:flex relative items-center gap-0.5 rounded-full"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              padding: 5,
            }}
          >
            {/* Sliding hover pill */}
            <span
              aria-hidden="true"
              className="visualia-hover-pill absolute top-[5px] bottom-[5px] rounded-full pointer-events-none"
              style={{
                left: hoverPill.left,
                width: hoverPill.width,
                background: "rgba(255,255,255,0.08)",
                opacity: hoverPill.visible ? 1 : 0,
                transition: `left 320ms ${SPRING}, width 320ms ${SPRING}, opacity 200ms ease-out`,
              }}
            />

            {menuItems.map((item) => (
              <div
                key={item.id}
                className="relative"
                onMouseEnter={(e) => {
                  openMenu(item.id);
                  handleItemEnter(e.currentTarget);
                }}
                onMouseLeave={closeMenu}
              >
                <button
                  ref={(el) => { menuTriggersRef.current[item.id] = el; }}
                  className={cn(
                    pillLink,
                    "gap-1",
                    activeMenu === item.id ? "text-white" : "text-white/65 hover:text-white"
                  )}
                  onClick={() => toggleMenu(item.id)}
                  aria-expanded={activeMenu === item.id}
                  aria-haspopup="true"
                >
                  {item.label}
                  <ChevronDown
                    className="h-3.5 w-3.5"
                    style={{
                      transition: `transform 200ms ${EASE}`,
                      transform: activeMenu === item.id ? "rotate(180deg)" : "rotate(0)",
                    }}
                  />
                </button>

                <div
                  className="absolute left-1/2 top-full -translate-x-1/2 pt-3"
                  style={{
                    opacity: activeMenu === item.id ? 1 : 0,
                    transform: activeMenu === item.id
                      ? "translate(-50%, 0)"
                      : "translate(-50%, -6px)",
                    pointerEvents: activeMenu === item.id ? "auto" : "none",
                    transition: `opacity 200ms ${EASE}, transform 200ms ${EASE}`,
                  }}
                >
                  <div
                    className="min-w-[260px] p-2"
                    style={{
                      background: "rgba(11, 5, 24, 0.85)",
                      backdropFilter: "saturate(180%) blur(24px)",
                      WebkitBackdropFilter: "saturate(180%) blur(24px)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 16,
                      boxShadow: "0 20px 60px -10px rgba(0,0,0,0.7), 0 0 0 1px rgba(82,39,255,0.04)",
                    }}
                  >
                    {item.children.map((child) => {
                      const ChildIcon = child.icon;
                      return child.disabled ? (
                        <span
                          key={child.label}
                          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/45 cursor-default"
                        >
                          <ChildIcon className="h-4 w-4" />
                          <span className="flex-1">{child.label}</span>
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
                            (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)";
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLElement).style.background = "";
                          }}
                          onFocus={() => prefetchRoute(child.href)}
                          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/75 hover:text-white"
                          style={{ transition: `background 180ms ${EASE}, color 180ms ${EASE}` }}
                        >
                          <ChildIcon className="h-4 w-4" style={{ color: "#B19EEF" }} />
                          <span>{child.label}</span>
                        </Link>
                      );
                    })}
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
                    handleItemEnter(e.currentTarget);
                  }}
                  onFocus={() => prefetchRoute(link.href)}
                  className={cn(
                    pillLink,
                    "gap-1.5",
                    active ? "text-white" : "text-white/65 hover:text-white"
                  )}
                >
                  {link.featured && <Monitor className="h-3.5 w-3.5" style={{ color: "#B19EEF" }} />}
                  <span className="relative">
                    {link.label}
                    {active && (
                      <span
                        aria-hidden="true"
                        className="absolute left-1/2 -translate-x-1/2 rounded-full"
                        style={{
                          bottom: -6,
                          width: 3,
                          height: 3,
                          background: "linear-gradient(135deg, #7C3AED, #EC4899)",
                          boxShadow: "0 0 6px rgba(236,72,153,0.7)",
                        }}
                      />
                    )}
                  </span>
                  {link.featured && (
                    <span className="relative inline-flex h-2 w-2" aria-hidden="true">
                      <span
                        className="visualia-live-ring absolute inline-flex h-full w-full rounded-full"
                        style={{
                          background: "hsl(158 80% 50%)",
                          animation: "visualia-live-pulse-nav 2s ease-in-out infinite",
                        }}
                      />
                      <span
                        className="relative inline-flex h-2 w-2 rounded-full"
                        style={{
                          background: "hsl(158 85% 55%)",
                          boxShadow: "0 0 6px hsl(158 90% 55% / 0.9)",
                        }}
                      />
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right — Actions */}
          <div className="hidden items-center gap-2 lg:flex">
            <Link
              to="/descargar-apk"
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "";
              }}
              className="inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-[14px] font-medium text-white/80 hover:text-white"
              style={{ transition: `background 200ms ${EASE}, color 200ms ${EASE}` }}
            >
              <Download className="h-4 w-4" />
              Descargar app
            </Link>
            <GradientCTA to="/login">
              <LogIn className="h-4 w-4" />
              Entrar
            </GradientCTA>
          </div>

          {/* Mobile right cluster */}
          <div className="flex items-center gap-2 lg:hidden">
            <GradientCTA to="/login" compact>Entrar</GradientCTA>
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

      {/* Mobile fullscreen panel */}
      <div
        className={cn(
          "lg:hidden fixed inset-0 top-[60px] z-40",
          mobileOpen ? "mobile-panel-in pointer-events-auto" : "mobile-panel-out pointer-events-none"
        )}
        style={{
          background: "rgba(6,0,16,0.92)",
          backdropFilter: "saturate(180%) blur(24px)",
          WebkitBackdropFilter: "saturate(180%) blur(24px)",
        }}
        aria-hidden={!mobileOpen}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-[-80px] top-[-80px] h-[360px] w-[360px]"
          style={{
            background: "radial-gradient(circle, rgba(124,58,237,0.2) 0%, rgba(236,72,153,0.05) 60%, transparent 100%)",
            filter: "blur(120px)",
          }}
        />
        <div className="relative flex h-full flex-col overflow-y-auto pt-4 pb-8">
          {(() => {
            const menuIcons: Record<string, typeof Grid> = {
              productos: Grid,
              soluciones: Layers,
            };
            const directIcons: Record<string, typeof Grid> = {
              "Precios": Tag,
              "Acerca de Visualia": Info,
              "Vincula tu pantalla": Monitor,
            };
            const cardBase =
              "mobile-nav-card flex w-full items-center gap-3 rounded-2xl text-left text-white transition-colors";
            const cardStyle: React.CSSProperties = {
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              padding: "18px 20px",
              fontSize: 18,
              fontWeight: 600,
            };
            const iconWrap: React.CSSProperties = {
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "rgba(124,58,237,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            };
            let staggerIdx = 0;
            const nextDelay = () => `${staggerIdx++ * 40}ms`;

            return (
              <div className="flex flex-1 flex-col gap-[10px] px-5">
                {menuItems.map((item) => {
                  const Icon = menuIcons[item.id] ?? Grid;
                  const expanded = mobileExpanded === item.id;
                  return (
                    <div
                      key={item.id}
                      className={cn("mobile-stagger", mobileOpen && "mobile-stagger-in")}
                      style={{ animationDelay: nextDelay() }}
                    >
                      <button
                        className={cardBase}
                        style={cardStyle}
                        onClick={() => setMobileExpanded(expanded ? null : item.id)}
                        aria-expanded={expanded}
                      >
                        <span style={iconWrap}>
                          <Icon size={18} color="#B19EEF" />
                        </span>
                        <span className="flex-1">{item.label}</span>
                        <ChevronDown
                          className={cn("h-5 w-5 transition-transform", expanded && "rotate-180")}
                          style={{ color: "rgba(255,255,255,0.4)" }}
                        />
                      </button>
                      <div
                        className={cn(
                          "overflow-hidden transition-all duration-200",
                          expanded ? "max-h-96 opacity-100 mt-[6px]" : "max-h-0 opacity-0"
                        )}
                      >
                        <div className="flex flex-col gap-1 rounded-2xl p-2" style={{ background: "rgba(255,255,255,0.03)" }}>
                          {item.children.map((child) =>
                            child.disabled ? (
                              <span
                                key={child.label}
                                className="flex items-center justify-between rounded-lg px-3 py-2"
                                style={{ fontSize: 15, color: "rgba(255,255,255,0.65)" }}
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
                                className="block rounded-lg px-3 py-2 hover:text-white"
                                style={{ fontSize: 15, color: "rgba(255,255,255,0.65)" }}
                                onClick={() => setMobileOpen(false)}
                              >
                                {child.label}
                              </Link>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {directLinks.map((link) => {
                  const Icon = directIcons[link.label] ?? Info;
                  return (
                    <Link
                      key={link.label}
                      to={link.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(cardBase, "mobile-stagger", mobileOpen && "mobile-stagger-in")}
                      style={{ ...cardStyle, animationDelay: nextDelay() }}
                    >
                      <span style={iconWrap}>
                        <Icon size={18} color="#B19EEF" />
                      </span>
                      <span className="flex-1">{link.label}</span>
                      {link.featured && (
                        <span className="relative inline-flex h-2.5 w-2.5" aria-hidden="true">
                          <span
                            className="visualia-live-ring absolute inline-flex h-full w-full rounded-full"
                            style={{
                              background: "hsl(158 80% 50%)",
                              animation: "visualia-live-pulse-nav 2s ease-in-out infinite",
                            }}
                          />
                          <span
                            className="relative inline-flex h-2.5 w-2.5 rounded-full"
                            style={{ background: "hsl(158 85% 55%)" }}
                          />
                        </span>
                      )}
                      <ChevronRight className="h-5 w-5" style={{ color: "rgba(255,255,255,0.4)" }} />
                    </Link>
                  );
                })}

                {/* Bottom actions — full width */}
                <div className="mt-auto flex flex-col gap-3 pt-6">
                  <div
                    className={cn("mobile-stagger", mobileOpen && "mobile-stagger-in")}
                    style={{ animationDelay: nextDelay() }}
                  >
                    <Link
                      to="/descargar-apk"
                      onClick={() => setMobileOpen(false)}
                      className="flex w-full items-center justify-center gap-2 rounded-full font-semibold text-white"
                      style={{
                        height: 52,
                        fontSize: 16,
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.12)",
                      }}
                    >
                      <Download className="h-4 w-4" />
                      Descargar app
                    </Link>
                  </div>
                  <div
                    className={cn("mobile-stagger", mobileOpen && "mobile-stagger-in")}
                    style={{ animationDelay: nextDelay() }}
                  >
                    <Link
                      to="/login"
                      onClick={() => setMobileOpen(false)}
                      className="flex w-full items-center justify-center gap-2 rounded-full font-semibold text-white transition-transform active:scale-[0.97]"
                      style={{
                        height: 52,
                        fontSize: 16,
                        background: "linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)",
                        boxShadow: "0 0 28px rgba(168,85,247,0.45), 0 8px 24px -6px rgba(236,72,153,0.35)",
                      }}
                    >
                      <LogIn className="h-4 w-4" />
                      Entrar
                    </Link>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </>
  );
};

/* Gradient CTA button — Entrar */
const GradientCTA = ({
  to,
  children,
  compact = false,
}: {
  to: string;
  children: React.ReactNode;
  compact?: boolean;
}) => {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  return (
    <Link
      to={to}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setPressed(false); }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      className="inline-flex items-center gap-1.5 rounded-full font-semibold text-white"
      style={{
        background: "linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)",
        padding: compact ? "8px 16px" : "10px 22px",
        fontSize: compact ? 13 : 14,
        transform: `scale(${pressed ? 0.97 : hovered ? 1.04 : 1})`,
        boxShadow: hovered
          ? "0 0 34px rgba(168,85,247,0.65), 0 0 12px rgba(236,72,153,0.5), 0 6px 20px -4px rgba(124,58,237,0.5)"
          : "0 0 20px rgba(168,85,247,0.35), 0 4px 14px -4px rgba(124,58,237,0.4)",
        transition: `transform 200ms ${EASE}, box-shadow 250ms ${EASE}`,
      }}
    >
      {children}
    </Link>
  );
};

export default LandingHeader;
