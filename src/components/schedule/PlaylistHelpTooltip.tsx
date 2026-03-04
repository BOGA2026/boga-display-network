import { useState, useEffect, useRef, useCallback } from "react";
import { X, HelpCircle, GripHorizontal, ArrowDown } from "lucide-react";

const STORAGE_KEY = "visualia_resize_help_never";

const STEPS = [
  { icon: "grip", text: "Coloca el cursor en el borde inferior del bloque" },
  { icon: "drag", text: "Haz click y arrastra hacia abajo para extender" },
  { icon: "done", text: "Suelta para guardar automáticamente" },
];

interface Props {
  anchorRect: DOMRect | null;
  visible: boolean;
  onClose: () => void;
}

function getNeverShow(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function setNeverShow(val: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, String(val));
  } catch {}
}

const PlaylistHelpTooltip = ({ anchorRect, visible, onClose }: Props) => {
  const [stepIdx, setStepIdx] = useState(0);
  const [neverShow] = useState(getNeverShow);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  // Cycle steps every 2.5s
  useEffect(() => {
    if (!visible) return;
    setStepIdx(0);
    intervalRef.current = setInterval(() => {
      setStepIdx((prev) => (prev + 1) % STEPS.length);
    }, 2500);
    return () => clearInterval(intervalRef.current);
  }, [visible]);

  const handleNeverShow = useCallback(() => {
    setNeverShow(true);
    onClose();
  }, [onClose]);

  if (neverShow || !visible || !anchorRect) return null;

  // Position: prefer right side, fallback left
  const gap = 12;
  const tooltipW = 260;
  const tooltipH = 260;
  let left = anchorRect.right + gap;
  let top = anchorRect.top + anchorRect.height / 2 - tooltipH / 2;

  if (left + tooltipW > window.innerWidth - 16) {
    left = anchorRect.left - tooltipW - gap;
  }
  if (left < 16) left = 16;
  if (top < 16) top = 16;
  if (top + tooltipH > window.innerHeight - 16) {
    top = window.innerHeight - tooltipH - 16;
  }

  return (
    <div
      className="fixed z-[100] animate-in fade-in slide-in-from-left-2 duration-200"
      style={{ left, top, width: tooltipW }}
      role="tooltip"
      aria-label="Ayuda para redimensionar bloques"
    >
      <div className="rounded-2xl border border-border/60 bg-card/95 backdrop-blur-xl shadow-2xl overflow-hidden">
        {/* Encabezado */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-border/30">
          <div className="flex items-center gap-1.5">
            <HelpCircle className="h-4 w-4 text-primary" />
            <span className="text-xs font-bold text-foreground">¿Cómo extender un bloque?</span>
          </div>
          <button
            onClick={onClose}
            className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-muted transition-colors"
            aria-label="Cerrar ayuda"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Animación visual instructiva */}
        <div className="relative bg-background/60 px-4 py-4 flex flex-col items-center gap-3">
          {/* Mini bloque animado */}
          <div className="w-36 relative">
            <div
              className="rounded-lg border-2 border-primary/60 overflow-hidden transition-all duration-700 ease-in-out"
              style={{
                height: stepIdx >= 1 ? 80 : 48,
                background: "linear-gradient(145deg, hsl(var(--primary) / 0.7), hsl(var(--primary) / 0.4))",
              }}
            >
              <div className="px-2 py-1">
                <div className="text-[10px] font-bold text-primary-foreground truncate">
                  Mi playlist
                </div>
                <div className="text-[9px] text-primary-foreground/80 font-mono">
                  09:00 – {stepIdx >= 1 ? "11:30" : "10:00"}
                </div>
              </div>
            </div>

            {/* Manija inferior animada */}
            <div
              className="absolute left-0 right-0 flex justify-center transition-all duration-700 ease-in-out"
              style={{ bottom: stepIdx >= 1 ? -4 : 16 - 4 }}
            >
              <div className={`
                flex items-center justify-center rounded-full w-6 h-6 border-2
                ${stepIdx === 0
                  ? "border-primary bg-primary/20 animate-pulse"
                  : stepIdx === 1
                    ? "border-primary bg-primary shadow-lg shadow-primary/30"
                    : "border-green-500 bg-green-500/30"
                }
                transition-colors duration-300
              `}>
                {stepIdx < 2
                  ? <GripHorizontal className="h-3 w-3 text-primary-foreground" />
                  : <span className="text-[10px] text-green-400">✓</span>
                }
              </div>
            </div>

            {/* Flecha de arrastre */}
            {stepIdx === 1 && (
              <div className="absolute -right-6 top-8 animate-bounce">
                <ArrowDown className="h-4 w-4 text-primary" />
              </div>
            )}
          </div>
        </div>

        {/* Pasos con indicador */}
        <div className="px-3 py-2.5 border-t border-border/30 space-y-1.5">
          {STEPS.map((step, i) => (
            <div
              key={i}
              className={`flex items-start gap-2 transition-opacity duration-300 ${
                i === stepIdx ? "opacity-100" : "opacity-40"
              }`}
            >
              <span className={`
                flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5
                ${i === stepIdx ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}
              `}>
                {i + 1}
              </span>
              <span className="text-[11px] text-foreground leading-tight">{step.text}</span>
            </div>
          ))}
        </div>

        {/* Acciones */}
        <div className="px-3 py-2 border-t border-border/30 flex justify-end">
          <button
            onClick={handleNeverShow}
            className="text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            No mostrar otra vez
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlaylistHelpTooltip;
export { STORAGE_KEY, getNeverShow as getPreference };
