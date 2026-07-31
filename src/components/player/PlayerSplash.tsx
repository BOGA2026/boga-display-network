import { useState, useEffect, useRef } from "react";
import introVideo from "@/assets/intro-animation.mp4";
import introVideoWebm from "@/assets/intro-animation.webm";
import { attemptAutoplay } from "@/lib/autoplay";

interface PlayerSplashProps {
  minDuration?: number;
  ready: boolean;
  onComplete: () => void;
}

const PlayerSplash = ({ minDuration = 4000, ready, onComplete }: PlayerSplashProps) => {
  const [minElapsed, setMinElapsed] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [scaleUp, setScaleUp] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Autoplay escalation for the intro video (muted fallback + retry on gesture).
  useEffect(() => attemptAutoplay(videoRef.current), []);

  useEffect(() => {
    // Play intro sound (audio can't be muted-fallback: retry only on interaction)
    const audio = new Audio("/audio/intro-sound.wav");
    audio.volume = 0.6;
    const stopAudioRetry = attemptAutoplay(audio, { allowMutedFallback: false });


    const t = setTimeout(() => setMinElapsed(true), minDuration);

    return () => {
      clearTimeout(t);
      stopAudioRetry();
      audio.pause();
    };
  }, [minDuration]);

  // Trigger cinematic exit when both conditions met
  useEffect(() => {
    if (minElapsed && ready) {
      setScaleUp(true);
      setFadeOut(true);

      const t = setTimeout(onComplete, 1500);
      return () => clearTimeout(t);
    }
  }, [minElapsed, ready, onComplete]);

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
      <video
        autoPlay
        muted
        playsInline
        preload="metadata"
        className="h-full w-full object-cover"
        style={{
          transform: scaleUp ? "scale(1.15)" : "scale(1)",
          filter: fadeOut ? "blur(6px)" : "blur(0px)",
          transition:
            "transform 1.4s cubic-bezier(0.4, 0, 0.2, 1), filter 1.2s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <source src={introVideoWebm} type="video/webm" />
        <source src={introVideo} type="video/mp4" />
      </video>
    </div>
  );
};

export default PlayerSplash;
