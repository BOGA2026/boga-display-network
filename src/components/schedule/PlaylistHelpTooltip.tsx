import { useState, useEffect, useRef, useCallback } from "react";
import { X, RotateCcw, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import helpResizeGif from "@/assets/help-resize-tutorial.gif";

const STORAGE_KEY = "visualia_resize_help_dismissed";
const SHOW_DELAY = 300;

const SUBTITLES = [
  "Coloca el cursor en el borde inferior",
  "Haz click y arrastra hacia abajo para extender",
  "Suelta para guardar",
];

interface Props {
  anchorRect: DOMRect | null;
  visible: boolean;
  onClose: () => void;
}

function getPreference(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function setPreference(dismissed: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, String(dismissed));
  } catch {}
}

const PlaylistHelpTooltip = ({ anchorRect, visible, onClose }: Props) => {
  const [subtitleIdx, setSubtitleIdx] = useState(0);
  const [dismissed, setDismissed] = useState(getPreference);
  const [neverShow, setNeverShow] = useState(getPreference);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Cycle subtitles every 2.5s
  useEffect(() => {
    if (!visible) return;
    setSubtitleIdx(0);
    intervalRef.current = setInterval(() => {
      setSubtitleIdx((prev) => (prev + 1) % SUBTITLES.length);
    }, 2500);
    return () => clearInterval(intervalRef.current);
  }, [visible]);

  const handleReplay = useCallback(() => {
    setSubtitleIdx(0);
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setSubtitleIdx((prev) => (prev + 1) % SUBTITLES.length);
    }, 2500);
  }, []);

  const handleNeverShow = useCallback(() => {
    setPreference(true);
    setNeverShow(true);
    setDismissed(true);
    onClose();
  }, [onClose]);

  const handleClose = useCallback(() => {
    setDismissed(true);
    onClose();
  }, [onClose]);

  // Keyboard: H to toggle
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "h" || e.key === "H") {
        if (!e.ctrlKey && !e.metaKey && !e.altKey) {
          // Only if not typing in input
          if ((e.target as HTMLElement)?.tagName !== "INPUT" && (e.target as HTMLElement)?.tagName !== "TEXTAREA") {
            if (visible) handleClose();
          }
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [visible, handleClose]);

  if (neverShow || !visible || !anchorRect) return null;

  // Position: prefer right side, fallback left, then above
  const gap = 12;
  let left = anchorRect.right + gap;
  let top = anchorRect.top;
  const tooltipW = 280;
  const tooltipH = 340;

  if (left + tooltipW > window.innerWidth - 16) {
    left = anchorRect.left - tooltipW - gap;
  }
  if (left < 16) {
    left = anchorRect.left + anchorRect.width / 2 - tooltipW / 2;
    top = anchorRect.top - tooltipH - gap;
  }
  if (top < 16) top = 16;
  if (top + tooltipH > window.innerHeight - 16) {
    top = window.innerHeight - tooltipH - 16;
  }

  return (
    <div
      ref={tooltipRef}
      className="fixed z-[100] animate-in fade-in slide-in-from-left-2 duration-200"
      style={{ left, top, width: tooltipW }}
      role="tooltip"
      aria-label="Ayuda para redimensionar bloques"
    >
      <div className="rounded-2xl border border-border/60 bg-card/95 backdrop-blur-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-border/30">
          <div className="flex items-center gap-1.5">
            <HelpCircle className="h-4 w-4 text-primary" />
            <span className="text-xs font-bold text-foreground">Cómo extender</span>
          </div>
          <button
            onClick={handleClose}
            className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-muted transition-colors"
            aria-label="Cerrar ayuda"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* GIF / Video area */}
        <div className="relative bg-background/60">
          <img
            src={helpResizeGif}
            alt="Tutorial: arrastra el borde inferior para extender la duración"
            className="w-full h-auto"
            loading="lazy"
          />
          {/* Subtitle overlay */}
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent px-3 py-2">
            <p className="text-xs font-semibold text-white text-center leading-tight transition-opacity duration-300">
              {SUBTITLES[subtitleIdx]}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="px-3 py-2.5 flex items-center justify-between gap-2">
          <button
            onClick={handleReplay}
            className="flex items-center gap-1 text-[11px] font-medium text-primary hover:text-primary/80 transition-colors"
          >
            <RotateCcw className="h-3 w-3" />
            Ver de nuevo
          </button>
          <button
            onClick={handleNeverShow}
            className="text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            No mostrar otra vez
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlaylistHelpTooltip;
export { STORAGE_KEY, getPreference };
