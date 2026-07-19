import { useEffect, lazy, Suspense } from "react";
import { X } from "lucide-react";

const VisualiaWorkflowDemo = lazy(() => import("./VisualiaWorkflowDemo.jsx"));

interface Props {
  open: boolean;
  onClose: () => void;
}

const WorkflowDemoModal = ({ open, onClose }: Props) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Demo de Visualia"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "rgba(6,0,16,0.85)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        animation: "wdm-fade 0.3s cubic-bezier(0.4,0,0.2,1)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "clamp(0px, 4vw, 32px)",
      }}
    >
      <style>{`
        @keyframes wdm-fade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes wdm-scale { from { opacity: 0; transform: scale(0.95) } to { opacity: 1; transform: scale(1) } }
        .wdm-content {
          position: relative;
          width: 100%;
          max-width: 1100px;
          max-height: 100vh;
          overflow-y: auto;
          border-radius: 24px;
          border: 1px solid rgba(255,255,255,0.1);
          background: #060010;
          animation: wdm-scale 0.3s cubic-bezier(0.4,0,0.2,1);
        }
        @media (max-width: 640px) {
          .wdm-content {
            border-radius: 0;
            border: none;
            max-height: 100vh;
            height: 100vh;
          }
        }
        .wdm-close {
          position: absolute;
          top: 16px;
          right: 16px;
          width: 40px;
          height: 40px;
          border-radius: 9999px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.15);
          color: #fff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 2;
          transition: background 0.2s ease;
        }
        .wdm-close:hover { background: rgba(255,255,255,0.12); }
      `}</style>
      <div className="wdm-content" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          aria-label="Cerrar"
          onClick={onClose}
          className="wdm-close"
        >
          <X className="h-5 w-5" />
        </button>
        <Suspense fallback={<div style={{ padding: 48, color: "#fff" }}>Cargando…</div>}>
          <VisualiaWorkflowDemo />
        </Suspense>
      </div>
    </div>
  );
};

export default WorkflowDemoModal;
