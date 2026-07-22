import { useEffect, useRef, useState } from "react";
import { Monitor } from "lucide-react";

interface ChatFloatingButtonProps {
  onClick: () => void;
  hasOpened: boolean;
}

const ChatFloatingButton = ({ onClick, hasOpened }: ChatFloatingButtonProps) => {
  const [mounted, setMounted] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [wiggling, setWiggling] = useState(false);
  const lastInteractionRef = useRef<number>(Date.now());
  const reducedMotion = useRef(false);

  useEffect(() => {
    reducedMotion.current =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (hasOpened || reducedMotion.current) return;
    const interval = setInterval(() => {
      if (Date.now() - lastInteractionRef.current >= 15000) {
        setWiggling(true);
        lastInteractionRef.current = Date.now();
        setTimeout(() => setWiggling(false), 700);
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [hasOpened]);

  const handleClick = () => {
    lastInteractionRef.current = Date.now();
    setWiggling(false);
    onClick();
  };

  const scale = !mounted ? 0.8 : pressed ? 0.95 : hovered ? 1.08 : 1;
  const opacity = mounted ? 1 : 0;

  return (
    <>
      <style>{`
        @keyframes visualia-wiggle {
          0%, 100% { transform: rotate(0deg); }
          20% { transform: rotate(-6deg); }
          40% { transform: rotate(6deg); }
          60% { transform: rotate(-4deg); }
          80% { transform: rotate(4deg); }
        }
        @keyframes visualia-live-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.35); opacity: 0.6; }
        }
        @media (prefers-reduced-motion: reduce) {
          .visualia-wiggle, .visualia-live-pulse-ring { animation: none !important; }
        }
      `}</style>

      <div
        className="fixed bottom-5 right-5 z-[999] sm:bottom-6 sm:right-6"
        style={{
          transition: "opacity 300ms ease-out",
          opacity,
        }}
      >
        {/* Tooltip */}
        <div
          className="pointer-events-none absolute right-[72px] top-1/2 -translate-y-1/2 whitespace-nowrap rounded-full px-3 py-1.5 text-sm text-white"
          style={{
            background: "hsl(260 30% 8% / 0.7)",
            backdropFilter: "blur(10px)",
            border: "1px solid hsl(0 0% 100% / 0.1)",
            opacity: hovered ? 1 : 0,
            transform: `translate(${hovered ? 0 : 4}px, -50%)`,
            transition: "opacity 200ms ease-out, transform 200ms ease-out",
          }}
        >
          ¿Hablamos?
        </div>

        <button
          onClick={handleClick}
          onMouseEnter={() => {
            setHovered(true);
            lastInteractionRef.current = Date.now();
          }}
          onMouseLeave={() => setHovered(false)}
          onMouseDown={() => setPressed(true)}
          onMouseUp={() => setPressed(false)}
          onTouchStart={() => setPressed(true)}
          onTouchEnd={() => setPressed(false)}
          aria-label="Abrir chat con un experto"
          className={`relative flex h-[58px] w-[58px] items-center justify-center rounded-full ${wiggling ? "visualia-wiggle" : ""}`}
          style={{
            background:
              "linear-gradient(135deg, hsl(270 85% 58%) 0%, hsl(300 90% 60%) 100%)",
            border: "1px solid hsl(0 0% 100% / 0.18)",
            boxShadow: hovered
              ? "0 0 40px 6px hsl(285 100% 60% / 0.55), 0 0 0 1px hsl(0 0% 100% / 0.08) inset, 0 12px 32px -6px hsl(280 80% 20% / 0.6), 0 4px 12px -2px hsl(0 0% 0% / 0.4)"
              : "0 0 28px 4px hsl(285 100% 55% / 0.4), 0 0 0 1px hsl(0 0% 100% / 0.06) inset, 0 8px 24px -4px hsl(280 80% 15% / 0.5), 0 4px 10px -2px hsl(0 0% 0% / 0.35)",
            transform: `scale(${scale})`,
            transition:
              "transform 200ms ease-out, box-shadow 250ms ease-out",
            animation: wiggling ? "visualia-wiggle 700ms ease-in-out" : undefined,
          }}
        >
          {/* Custom icon: monitor with tiny message bubble */}
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
          <Monitor className="hidden" />

          {/* Live green dot */}
          <span
            className="absolute right-1 top-1 flex h-3 w-3 items-center justify-center"
            aria-hidden="true"
          >
            <span
              className="visualia-live-pulse-ring absolute inline-flex h-full w-full rounded-full"
              style={{
                background: "hsl(158 80% 50%)",
                animation: "visualia-live-pulse 2s ease-in-out infinite",
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
        </button>
      </div>
    </>
  );
};

export default ChatFloatingButton;
