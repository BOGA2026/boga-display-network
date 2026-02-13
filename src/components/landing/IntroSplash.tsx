import { useState, useEffect } from "react";
import introGif from "@/assets/intro-animation.gif";

const STORAGE_KEY = "visualia_intro_seen";

const IntroSplash = ({ onComplete }: { onComplete: () => void }) => {
  const [fadeOut, setFadeOut] = useState(false);
  const [scaleUp, setScaleUp] = useState(false);
  const [removed, setRemoved] = useState(false);

  useEffect(() => {
    // Play intro sound
    const audio = new Audio("/audio/intro-sound.wav");
    audio.volume = 0.6;
    audio.play().catch(() => {});

    // Start cinematic transition: scale up + fade out
    const timer = setTimeout(() => {
      setScaleUp(true);
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
      localStorage.setItem(STORAGE_KEY, "true");
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
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{
        background: "#0E0B16",
        opacity: fadeOut ? 0 : 1,
        transition: "opacity 1.4s cubic-bezier(0.4, 0, 0.2, 1)",
        pointerEvents: fadeOut ? "none" : "auto",
      }}
    >
      <img
        src={introGif}
        alt="Visualia intro"
        className="h-full w-full object-cover"
        style={{
          transform: scaleUp ? "scale(1.15)" : "scale(1)",
          filter: fadeOut ? "blur(6px)" : "blur(0px)",
          transition:
            "transform 1.4s cubic-bezier(0.4, 0, 0.2, 1), filter 1.2s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      />
    </div>
  );
};

export const hasSeenIntro = () => localStorage.getItem(STORAGE_KEY) === "true";

export default IntroSplash;
