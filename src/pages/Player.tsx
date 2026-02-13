import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import { Monitor } from "lucide-react";
import logoVisualia from "@/assets/logo-visualia.png";

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
      if (status !== "paired") {
        setStatus("unpaired");
      }
      return null;
    }
  }, [deviceCode, status]);

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

  if (status === "loading") {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: "#0a0812" }}>
        <div className="h-12 w-12 animate-spin rounded-full border-3 border-t-transparent" style={{ borderColor: "#8A00FF", borderTopColor: "transparent" }} />
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: "#0a0812", color: "#fff" }}>
        <p className="text-lg">{errorMsg}</p>
      </div>
    );
  }

  if (status === "unpaired") {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center" style={{ background: "linear-gradient(180deg, #0E0B16 0%, #12101A 100%)" }}>
        {/* Brand */}
        <div className="relative mb-8">
          <div className="absolute inset-0 scale-150 rounded-full opacity-30 blur-2xl" style={{ background: "radial-gradient(circle, #8A00FF 0%, transparent 70%)" }} />
          <img src={logoVisualia} alt="Visualia" className="relative h-16 w-auto" />
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
          Ingresa este código en el panel <strong style={{ color: "rgba(255,255,255,0.7)" }}>Visualia</strong> para conectar esta pantalla.
        </p>

        {/* Bottom branding */}
        <div className="absolute bottom-8 flex items-center gap-2 opacity-30">
          <img src={logoVisualia} alt="Visualia" className="h-5 w-auto" />
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center" style={{ background: "#0a0812", color: "rgba(255,255,255,0.5)" }}>
        <Monitor className="mb-4 h-12 w-12 opacity-30" />
        <p className="text-lg">Sin contenido asignado</p>
        <p className="text-sm opacity-50">Agrega contenido a la playlist desde el panel Visualia.</p>
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
