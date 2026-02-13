import { useState, useEffect } from "react";

interface PlayerSplashProps {
  /** Minimum time (ms) the splash stays visible */
  minDuration?: number;
  /** Set to true once background tasks (checkin, preload) are done */
  ready: boolean;
  onComplete: () => void;
}

const PlayerSplash = ({ minDuration = 2500, ready, onComplete }: PlayerSplashProps) => {
  const [minElapsed, setMinElapsed] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  // Minimum display timer
  useEffect(() => {
    const t = setTimeout(() => setMinElapsed(true), minDuration);
    return () => clearTimeout(t);
  }, [minDuration]);

  // Trigger fade-out when both conditions are met
  useEffect(() => {
    if (minElapsed && ready) {
      setFadeOut(true);
      const t = setTimeout(onComplete, 500); // match fade-out duration
      return () => clearTimeout(t);
    }
  }, [minElapsed, ready, onComplete]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center transition-opacity duration-500"
      style={{
        background: "#0E0B16",
        opacity: fadeOut ? 0 : 1,
        pointerEvents: fadeOut ? "none" : "auto",
      }}
    >
      {/* Ambient glow */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(138,0,255,0.25) 0%, rgba(192,0,255,0.08) 40%, transparent 70%)",
        }}
      />

      {/* Logo + tagline container */}
      <div
        className="relative flex flex-col items-center gap-6 transition-all duration-700"
        style={{
          opacity: fadeOut ? 0 : 1,
          transform: fadeOut ? "scale(1.05)" : "scale(1)",
        }}
      >
        {/* Text logo — lightweight, no image dependency */}
        <h1
          className="text-6xl font-bold tracking-tight sm:text-7xl"
          style={{
            color: "#ffffff",
            textShadow: "0 0 40px rgba(138,0,255,0.5), 0 0 80px rgba(192,0,255,0.2)",
          }}
        >
          Visualia
        </h1>

        {/* Tagline */}
        <p
          className="text-lg font-medium tracking-widest uppercase sm:text-xl"
          style={{
            color: "rgba(192,0,255,0.8)",
            textShadow: "0 0 20px rgba(192,0,255,0.3)",
          }}
        >
          Pantallas que venden
        </p>
      </div>

      {/* Subtle loading indicator */}
      <div className="absolute bottom-12">
        <div
          className="h-0.5 w-16 overflow-hidden rounded-full"
          style={{ background: "rgba(138,0,255,0.15)" }}
        >
          <div
            className="h-full w-full animate-pulse rounded-full"
            style={{
              background: "linear-gradient(90deg, #8A00FF, #C000FF)",
              animation: "pulse 1.5s ease-in-out infinite",
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default PlayerSplash;
