import { useEffect, useMemo, useState } from "react";
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

interface Props {
  /** Sección de precios que se vigila para el disparador móvil. */
  sectionId?: string;
}

function alreadySeen() {
  try {
    return localStorage.getItem(EXIT_OFFER.storageKey) === "1";
  } catch {
    return true;
  }
}

function markSeen() {
  try {
    localStorage.setItem(EXIT_OFFER.storageKey, "1");
  } catch {
    /* incógnito: se muestra una vez por sesión y ya */
  }
}

/**
 * Oferta de salida. Una sola vez por visitante, nunca a quien ya tiene
 * cuenta. Sin cronómetro: el descuento es un código real que viaja al
 * checkout, no un precio distinto pintado en pantalla.
 */
export function ExitOfferModal({ sectionId = "precios" }: Props) {
  const { session } = useAuthContext();
  const [open, setOpen] = useState(false);

  const needsDevice = getAttribution().needs_device ?? true;
  const annual = useMemo(
    () => annualVariantFor(MAX_PRICE_PER_SCREEN, needsDevice),
    [needsDevice],
  );
  const discounted = exitOfferPrice(annual.price);

  useEffect(() => {
    if (session) return; // ya tiene cuenta o está pagando
    if (alreadySeen()) return;

    let done = false;
    const fire = (trigger: string) => {
      if (done) return;
      done = true;
      markSeen();
      setOpen(true);
      trackConversion("exit_offer_view", { trigger, code: EXIT_OFFER.code });
      cleanup();
    };

    // Escritorio: el cursor sale por el borde superior de la ventana.
    const onLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !e.relatedTarget) fire("mouseout_top");
    };

    // Móvil: 40 s en la sección de precios sin interacción, o un
    // desplazamiento rápido hacia arriba.
    let idle: ReturnType<typeof setTimeout> | null = null;
    const resetIdle = () => {
      if (idle) clearTimeout(idle);
      idle = setTimeout(() => fire("idle"), EXIT_OFFER.mobileIdleSeconds * 1000);
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
    io?.observe(section!);

    let lastY = window.scrollY;
    let lastT = performance.now();
    const onScroll = () => {
      const y = window.scrollY;
      const t = performance.now();
      const v = (lastY - y) / Math.max(t - lastT, 1); // px por ms hacia arriba
      lastY = y;
      lastT = t;
      if (v > 1.8 && y > 400) fire("fast_scroll_up");
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
  }, [session, sectionId]);

  if (!open) return null;

  const close = (how: string) => {
    trackConversion("exit_offer_dismiss", { how, code: EXIT_OFFER.code });
    setOpen(false);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="exit-offer-title"
      onClick={() => close("backdrop")}
    >
      <div
        className="relative w-full max-w-md rounded-2xl border border-primary/60 bg-card p-7 shadow-[0_0_60px_hsl(var(--accent-glow)/0.35)]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => close("close_button")}
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
            code: EXIT_OFFER.code,
          })}
          onClick={() => {
            trackConversion("exit_offer_accept", { code: EXIT_OFFER.code });
            setOpen(false);
          }}
          className="v-focus-ring mt-6 flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-semibold text-primary-foreground transition hover:shadow-[0_0_40px_hsl(var(--accent-glow)/0.55)]"
        >
          {EXIT_OFFER.cta}
          <ArrowRight className="h-4 w-4" />
        </Link>

        <button
          type="button"
          onClick={() => close("secondary_link")}
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
