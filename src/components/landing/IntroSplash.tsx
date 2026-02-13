import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import simboloVisualia from "@/assets/simbolo-visualia.png";

const STORAGE_KEY = "visualia_intro_seen";

const IntroSplash = ({ onComplete }: { onComplete: () => void }) => {
  const [searchParams] = useSearchParams();
  const shouldReset = searchParams.get("intro") === "reset";
  
  const [fadeOut, setFadeOut] = useState(false);
  const [removed, setRemoved] = useState(false);

  useEffect(() => {
    // Play intro sound
    const audio = new Audio("/audio/intro-sound.wav");
    audio.volume = 0.6;
    audio.play().catch(() => {});

    // Start cinematic transition: fade out
    const timer = setTimeout(() => {
      setFadeOut(true);
      // Fade out audio
      const fadeAudio = setInterval(() => {
        if (audio.volume > 0.05) {
          audio.volume = Math.max(0, audio.volume - 0.05);
        } else {
          audio.pause();
          clearInterval(fadeAudio);
        }
      }, 100);
    }, 4000);

    const removeTimer = setTimeout(() => {
      setRemoved(true);
      if (!shouldReset) {
        localStorage.setItem(STORAGE_KEY, "true");
      }
      onComplete();
    }, 5500);

    return () => {
      clearTimeout(timer);
      clearTimeout(removeTimer);
      audio.pause();
    };
  }, [onComplete]);

  if (removed) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #0E0B16 0%, #1a0f2e 50%, #0E0B16 100%)",
        opacity: fadeOut ? 0 : 1,
        transition: "opacity 1.4s cubic-bezier(0.4, 0, 0.2, 1)",
        pointerEvents: fadeOut ? "none" : "auto",
      }}
    >
      {/* Grid background */}
      <div className="absolute inset-0 opacity-20">
        <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="url(#gridGradient)" strokeWidth="0.5" />
            </pattern>
            <linearGradient id="gridGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8A00FF" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#C000FF" stopOpacity="0.2" />
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Radial glow background */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(138, 0, 255, 0.15) 0%, transparent 70%)",
          animation: "pulse-glow 3s ease-in-out infinite",
        }}
      />

      {/* Main content */}
      <div className="relative flex flex-col items-center justify-center">
        {/* Outer ring animation */}
        <div
          className="absolute"
          style={{
            width: "300px",
            height: "300px",
            border: "2px solid",
            borderColor: "rgba(138, 0, 255, 0.3)",
            borderRadius: "50%",
            animation: "ring-expand 4s ease-out forwards",
          }}
        />

        {/* Middle ring */}
        <div
          className="absolute"
          style={{
            width: "200px",
            height: "200px",
            border: "1px solid",
            borderColor: "rgba(192, 0, 255, 0.2)",
            borderRadius: "50%",
            animation: "ring-expand 4s ease-out forwards 0.3s",
          }}
        />

        {/* Symbol with glow */}
        <div
          style={{
            position: "relative",
            animation: "symbol-scale 4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: "-30px",
              background:
                "radial-gradient(circle, rgba(138, 0, 255, 0.4) 0%, transparent 70%)",
              borderRadius: "50%",
              filter: "blur(20px)",
              animation: "glow-pulse 2s ease-in-out infinite",
            }}
          />
          <img
            src={simboloVisualia}
            alt="Visualia"
            className="relative h-32 w-32"
            style={{
              filter: "drop-shadow(0 0 20px rgba(138, 0, 255, 0.6))",
              animation: "symbol-glow 2s ease-in-out infinite",
            }}
          />
        </div>

        {/* Text reveal */}
        <div
          className="mt-8 text-center"
          style={{
            animation: "text-reveal 2s ease-out 1.5s both",
          }}
        >
          <h1
            className="text-4xl font-bold"
            style={{
              background: "linear-gradient(135deg, #8A00FF 0%, #C000FF 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              letterSpacing: "2px",
            }}
          >
            VISUALIA
          </h1>
          <p
            className="mt-2 text-sm tracking-widest"
            style={{
              color: "rgba(255, 255, 255, 0.6)",
              animation: "text-reveal 2s ease-out 2s both",
            }}
          >
            Pantallas que venden
          </p>
        </div>
      </div>

      {/* Scan lines effect */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "repeating-linear-gradient(0deg, rgba(138, 0, 255, 0.05) 0px, rgba(138, 0, 255, 0.05) 1px, transparent 1px, transparent 2px)",
          pointerEvents: "none",
          animation: "scan-lines 8s linear infinite",
        }}
      />

      <style>{`
        @keyframes ring-expand {
          from {
            transform: scale(0);
            opacity: 1;
          }
          to {
            transform: scale(1);
            opacity: 0;
          }
        }

        @keyframes symbol-scale {
          0% {
            transform: scale(0) rotateZ(0deg);
            opacity: 0;
          }
          50% {
            transform: scale(1.1) rotateZ(5deg);
          }
          100% {
            transform: scale(1) rotateZ(0deg);
            opacity: 1;
          }
        }

        @keyframes glow-pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 0.4;
          }
          50% {
            transform: scale(1.2);
            opacity: 0.6;
          }
        }

        @keyframes symbol-glow {
          0%, 100% {
            filter: drop-shadow(0 0 20px rgba(138, 0, 255, 0.6));
          }
          50% {
            filter: drop-shadow(0 0 40px rgba(192, 0, 255, 0.8));
          }
        }

        @keyframes text-reveal {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse-glow {
          0%, 100% {
            transform: scale(1);
            opacity: 0.8;
          }
          50% {
            transform: scale(1.05);
            opacity: 1;
          }
        }

        @keyframes scan-lines {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(100vh);
          }
        }
      `}</style>
    </div>
  );
};

export const hasSeenIntro = () => localStorage.getItem(STORAGE_KEY) === "true";

export default IntroSplash;
