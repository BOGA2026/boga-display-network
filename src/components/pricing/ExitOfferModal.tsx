import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { ArrowRight, X } from "lucide-react";
import {
  EXIT_OFFER,
  IVA_LEGEND,
  MAX_PRICE_PER_SCREEN,
  annualVariantFor,
  exitOfferPrice,
} from "@/config/pricing";
import { formatCop } from "@/config/devices";
import { getAttribution, trackConversion } from "@/lib/attribution";
import { checkoutHref } from "@/lib/checkout";
import { useAuthContext } from "@/context/AuthContext";
import {
  claimExitOffer,
  formatCountdown,
  getExitOffer,
  markExitOffer,
  markSeenLocally,
  msLeft,
  seenLocally,
  type ExitOffer,
} from "@/lib/exitOffer";

interface Props {
  /** Sección de precios que se vigila para el disparador móvil. */
  sectionId?: string;
}

/**
 * Oferta de salida con cronómetro real. El vencimiento lo fija el servidor
 * al crear el registro: si la persona recarga, el reloj sigue donde iba, y
 * cuando llega a cero la oferta deja de existir también en el checkout.
 *
 * Una sola oportunidad: marca local para responder sin viaje de red y
 * registro único por visitante en la base, que es el que manda.
 */
export function ExitOfferModal({ sectionId = "precios" }: Props) {
  const { session } = useAuthContext();
  const [offer, setOffer] = useState<ExitOffer | null>(null);
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [left, setLeft] = useState(0);
  const claiming = useRef(false);

  const needsDevice = getAttribution().needs_device ?? true;
  const annual = useMemo(
    () => annualVariantFor(MAX_PRICE_PER_SCREEN, needsDevice),
    [needsDevice],
  );
  const discounted = exitOfferPrice(annual.price);

  const dismiss = useCallback(
    (how: string, mark = true) => {
      setClosing(true);
      if (mark) void markExitOffer("dismissed");
      trackConversion(how === "expired" ? "exit_offer_expire" : "exit_offer_dismiss", {
        how,
        code: EXIT_OFFER.code,
      });
      window.setTimeout(() => {
        setOpen(false);
        setClosing(false);
      }, 260);
    },
    [],
  );

  /* Al arrancar: ¿el visitante ya tiene una oferta corriendo en el servidor? */
  useEffect(() => {
    if (session) return;
    let alive = true;
    void getExitOffer().then((found) => {
      if (!alive || !found) return;
      setOffer(found);
      if (found.active) {
        setOpen(true);
        setLeft(msLeft(found));
        trackConversion("exit_offer_view", { trigger: "resume", code: found.code });
      }
    });
    return () => {
      alive = false;
    };
  }, [session]);

  /* Disparadores de intención de salida, sólo si nunca se le mostró. */
  useEffect(() => {
    if (session || offer || seenLocally()) return;

    let done = false;
    const fire = async (trigger: string) => {
      if (done || claiming.current) return;
      done = true;
      claiming.current = true;
      cleanup();
      markSeenLocally();
      const created = await claimExitOffer();
      if (!created || !created.active) return;
      setOffer(created);
      setLeft(msLeft(created));
      setOpen(true);
      trackConversion("exit_offer_view", { trigger, code: created.code });
    };

    // Escritorio: el cursor sale por el borde superior de la ventana.
    const onLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !e.relatedTarget) void fire("mouseout_top");
    };

    // Móvil: inactividad en la sección de precios o scroll rápido hacia arriba.
    let idle: ReturnType<typeof setTimeout> | null = null;
    const resetIdle = () => {
      if (idle) clearTimeout(idle);
      idle = setTimeout(() => void fire("idle"), EXIT_OFFER.mobileIdleSeconds * 1000);
    };
    const section = document.getElementById(sectionId);
    const io = section
      ? new IntersectionObserver(
          ([entry]) => {
            if (entry.isIntersecting) resetIdle();
            else if (idle) clearTimeout(idle);
          },
          { threshold: 0.3 },
        )
      : null;
    if (section) io?.observe(section);

    let lastY = window.scrollY;
    let lastT = performance.now();
    const onScroll = () => {
      const y = window.scrollY;
      const t = performance.now();
      const v = (lastY - y) / Math.max(t - lastT, 1); // px por ms hacia arriba
      lastY = y;
      lastT = t;
      if (v > 1.8 && y > 400) void fire("fast_scroll_up");
    };

    const isCoarse = window.matchMedia("(pointer: coarse)").matches;
    if (!isCoarse) document.addEventListener("mouseout", onLeave);
    else {
      window.addEventListener("scroll", onScroll, { passive: true });
      ["touchstart", "click", "keydown"].forEach((ev) =>
        window.addEventListener(ev, resetIdle, { passive: true }),
      );
    }

    function cleanup() {
      document.removeEventListener("mouseout", onLeave);
      window.removeEventListener("scroll", onScroll);
      ["touchstart", "click", "keydown"].forEach((ev) =>
        window.removeEventListener(ev, resetIdle),
      );
      if (idle) clearTimeout(idle);
      io?.disconnect();
    }
    return cleanup;
  }, [session, offer, sectionId]);

  /* Cronómetro: siempre contra el vencimiento del servidor. */
  useEffect(() => {
    if (!open || !offer) return;
    const tick = () => {
      const ms = msLeft(offer);
      setLeft(ms);
      if (ms <= 0) dismiss("expired", false);
    };
    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [open, offer, dismiss]);

  if (!open || !offer) return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm transition-opacity duration-[260ms] ease-out ${
        closing ? "opacity-0" : "opacity-100"
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="exit-offer-title"
      onClick={() => dismiss("backdrop")}
    >
      <div
        className={`relative w-full max-w-md rounded-2xl border border-primary/60 bg-card p-7 shadow-[0_0_60px_hsl(var(--accent-glow)/0.35)] transition-all duration-[260ms] ease-out ${
          closing ? "translate-y-2 scale-95 opacity-0" : "translate-y-0 scale-100 opacity-100"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => dismiss("close_button")}
          aria-label="Cerrar"
          className="v-focus-ring absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <X className="h-6 w-6" />
        </button>

        <span className="inline-flex rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
          {EXIT_OFFER.percent}% adicional
        </span>
        <h2
          id="exit-offer-title"
          className="mt-4 font-display text-2xl font-bold text-foreground"
        >
          {EXIT_OFFER.title}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">{EXIT_OFFER.body}</p>

        {/* Cronómetro real: vence en el servidor, no en la pantalla. */}
        <div className="mt-5 rounded-xl border border-primary/40 bg-primary/10 px-4 py-3 text-center">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            La oferta vence en
          </p>
          <p
            className="v-numeric font-display text-5xl font-bold tabular-nums text-foreground"
            role="timer"
            aria-live="off"
          >
            {formatCountdown(left)}
          </p>
        </div>

        <div className="mt-5 flex items-baseline gap-3">
          <span className="v-numeric text-base text-muted-foreground line-through">
            {formatCop(annual.price)}
          </span>
          <span className="v-numeric font-display text-4xl font-bold text-foreground">
            {formatCop(discounted)}
          </span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          por pantalla / año · {IVA_LEGEND}
        </p>

        <Link
          to={checkoutHref({
            plan: "anual",
            monthly: MAX_PRICE_PER_SCREEN,
            code: offer.code,
          })}
          onClick={() => {
            void markExitOffer("accepted");
            trackConversion("exit_offer_accept", { code: offer.code });
            setOpen(false);
          }}
          className="v-focus-ring mt-6 flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-semibold text-primary-foreground transition hover:shadow-[0_0_40px_hsl(var(--accent-glow)/0.55)]"
        >
          {EXIT_OFFER.cta}
          <ArrowRight className="h-4 w-4" />
        </Link>

        <button
          type="button"
          onClick={() => dismiss("secondary_link")}
          className="mt-3 w-full text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          {EXIT_OFFER.dismiss}
        </button>
      </div>
    </div>,
    document.body,
  );
}

export default ExitOfferModal;
