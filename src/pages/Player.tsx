import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import { Monitor } from "lucide-react";

const SUPABASE_URL = "https://ovuhtroiuuqsiltqgqpp.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92dWh0cm9pdXVxc2lsdHFncXBwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MzQ2NjIsImV4cCI6MjA4NjQxMDY2Mn0.qjpz83tFpdxDa8YwbSdQLit4T_IiFV5H6GtEmH1TBNw";
const HEARTBEAT_INTERVAL = 60_000;
const CHECKIN_URL = `${SUPABASE_URL}/functions/v1/pair-device/checkin`;

interface ContentItem {
  id: string;
  name: string;
  file_url: string | null;
  type: string;
  duration_seconds: number | null;
}

interface PlaylistConfig {
  playlist_id: string;
  playlists: {
    id: string;
    name: string;
    playlist_items: {
      id: string;
      sort_order: number;
      content: ContentItem;
    }[];
  };
}

const Player = () => {
  const { deviceId } = useParams<{ deviceId: string }>();
  const [status, setStatus] = useState<"loading" | "unpaired" | "paired" | "error">("loading");
  const [config, setConfig] = useState<PlaylistConfig | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const deviceCode = deviceId?.toUpperCase() ?? "";

  const doCheckin = useCallback(async () => {
    try {
      const res = await fetch(CHECKIN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_KEY,
        },
        body: JSON.stringify({ device_code: deviceCode }),
      });

      if (!res.ok) {
        if (res.status === 404) {
          setStatus("unpaired");
          return null;
        }
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();

      if (data.status === "paired" && data.config) {
        setStatus("paired");
        setConfig(data.config);
      } else {
        setStatus("unpaired");
      }

      return data;
    } catch (err: any) {
      console.error("Checkin error:", err);
      // Keep current status on transient errors if already paired
      if (status !== "paired") {
        setStatus("unpaired");
      }
      return null;
    }
  }, [deviceCode, status]);

  // Initial check + heartbeat
  useEffect(() => {
    if (!deviceCode) {
      setStatus("error");
      setErrorMsg("No device ID provided");
      return;
    }

    doCheckin();
    const interval = setInterval(doCheckin, HEARTBEAT_INTERVAL);
    return () => clearInterval(interval);
  }, [deviceCode, doCheckin]);

  // Playlist advancement
  const items = config?.playlists?.playlist_items
    ?.sort((a, b) => a.sort_order - b.sort_order) ?? [];

  useEffect(() => {
    if (status !== "paired" || items.length === 0) return;

    const currentItem = items[currentIndex];
    const duration = (currentItem?.content?.duration_seconds ?? 10) * 1000;

    timerRef.current = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, duration);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [status, currentIndex, items]);

  // Fullscreen body
  useEffect(() => {
    document.body.style.overflow = "hidden";
    document.body.style.margin = "0";
    document.body.style.background = "#0a0812";
    return () => {
      document.body.style.overflow = "";
      document.body.style.margin = "";
      document.body.style.background = "";
    };
  }, []);

  // --- LOADING ---
  if (status === "loading") {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: "#0a0812" }}>
        <div className="h-12 w-12 animate-spin rounded-full border-3 border-t-transparent" style={{ borderColor: "#8A00FF", borderTopColor: "transparent" }} />
      </div>
    );
  }

  // --- ERROR ---
  if (status === "error") {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: "#0a0812", color: "#fff" }}>
        <p className="text-lg">{errorMsg}</p>
      </div>
    );
  }

  // --- UNPAIRED: Pairing Screen ---
  if (status === "unpaired") {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center" style={{ background: "linear-gradient(180deg, #0a0812 0%, #12101A 100%)" }}>
        {/* Logo */}
        <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl" style={{ background: "linear-gradient(135deg, #8A00FF, #C000FF)", boxShadow: "0 0 40px rgba(138,0,255,0.4)" }}>
          <Monitor className="h-8 w-8" style={{ color: "#fff" }} />
        </div>

        {/* Code */}
        <p className="mb-2 text-sm font-medium tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.5)" }}>
          Código de vinculación
        </p>
        <div
          className="mb-6 rounded-2xl px-12 py-6 font-mono text-5xl font-bold tracking-[0.4em]"
          style={{
            background: "rgba(138,0,255,0.08)",
            border: "1px solid rgba(138,0,255,0.25)",
            color: "#C000FF",
            textShadow: "0 0 20px rgba(192,0,255,0.5)",
          }}
        >
          {deviceCode}
        </div>

        <p className="max-w-md text-center text-sm" style={{ color: "rgba(255,255,255,0.45)", lineHeight: 1.6 }}>
          Ingresa este código en el panel <strong style={{ color: "rgba(255,255,255,0.7)" }}>BOGA Signage</strong> para conectar esta pantalla.
        </p>

        {/* Branding */}
        <div className="absolute bottom-8 flex items-center gap-2 opacity-30">
          <div className="flex h-6 w-6 items-center justify-center rounded-md" style={{ background: "linear-gradient(135deg, #8A00FF, #C000FF)" }}>
            <Monitor className="h-3 w-3" style={{ color: "#fff" }} />
          </div>
          <span className="text-xs font-bold tracking-wider" style={{ color: "#fff" }}>BOGA SIGNAGE</span>
        </div>
      </div>
    );
  }

  // --- PAIRED: Content Playback ---
  if (items.length === 0) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center" style={{ background: "#0a0812", color: "rgba(255,255,255,0.5)" }}>
        <Monitor className="mb-4 h-12 w-12 opacity-30" />
        <p className="text-lg">Sin contenido asignado</p>
        <p className="text-sm opacity-50">Agrega contenido a la playlist desde el panel BOGA.</p>
      </div>
    );
  }

  const currentItem = items[currentIndex]?.content;

  if (!currentItem?.file_url) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: "#0a0812", color: "rgba(255,255,255,0.5)" }}>
        <p>Cargando contenido...</p>
      </div>
    );
  }

  const renderContent = () => {
    const url = currentItem.file_url!;
    const type = currentItem.type;

    if (type === "video") {
      return (
        <video
          key={url}
          src={url}
          autoPlay
          muted
          className="fixed inset-0 h-full w-full object-contain"
          style={{ background: "#000" }}
          onEnded={() => setCurrentIndex((prev) => (prev + 1) % items.length)}
        />
      );
    }

    if (type === "html") {
      return (
        <iframe
          key={url}
          src={url}
          className="fixed inset-0 h-full w-full border-0"
          sandbox="allow-scripts allow-same-origin"
          title={currentItem.name}
        />
      );
    }

    // Default: image
    return (
      <img
        key={url}
        src={url}
        alt={currentItem.name}
        className="fixed inset-0 h-full w-full object-contain"
        style={{ background: "#000" }}
      />
    );
  };

  return <>{renderContent()}</>;
};

export default Player;
