import { useState, useEffect } from "react";
import introGif from "@/assets/intro-animation.gif";

const STORAGE_KEY = "visualia_intro_seen";

const IntroSplash = ({ onComplete }: { onComplete: () => void }) => {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Start fade out after GIF plays (adjust timing to match your GIF duration)
    const timer = setTimeout(() => {
      setFadeOut(true);
    }, 4000);

    const removeTimer = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, "true");
      onComplete();
    }, 4800);

    return () => {
      clearTimeout(timer);
      clearTimeout(removeTimer);
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center transition-opacity duration-700 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
      style={{ background: "#0E0B16" }}
    >
      <img
        src={introGif}
        alt="Visualia intro"
        className="h-full w-full object-cover"
      />
    </div>
  );
};

export const hasSeenIntro = () => localStorage.getItem(STORAGE_KEY) === "true";

export default IntroSplash;
