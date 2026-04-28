import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import { Monitor } from "lucide-react";
import simboloVisualia from "@/assets/simbolo-visualia.png";
import PlayerSplash from "@/components/player/PlayerSplash";

const SUPABASE_URL = "https://ovuhtroiuuqsiltqgqpp.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92dWh0cm9pdXVxc2lsdHFncXBwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MzQ2NjIsImV4cCI6MjA4NjQxMDY2Mn0.qjpz83tFpdxDa8YwbSdQLit4T_IiFV5H6GtEmH1TBNw";
const HEARTBEAT_INTERVAL = 60_000;
const CHECKIN_URL = `${SUPABASE_URL}/functions/v1/pair-device/checkin`;
const DEVICE_CODE_STORAGE_KEY = "visualia_device_code";

const normalizeDeviceCode = (value?: string | null) =>
  (value ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 6);

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
  const [showSplash, setShowSplash] = useState(true);
  const [checkinDone, setCheckinDone] = useState(false);
  const [status, setStatus] = useState<"loading" | "needs-code" | "verifying" | "paired" | "error">("loading");
  const [config, setConfig] = useState<PlaylistConfig | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [resolvedDeviceCode, setResolvedDeviceCode] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [inputError, setInputError] = useState("");

  // On mount: try URL param, then localStorage. If neither, ask for code.
  useEffect(() => {
    const routeCode = normalizeDeviceCode(deviceId);
    if (routeCode.length === 6) {
      setResolvedDeviceCode(routeCode);
      window.localStorage.setItem(DEVICE_CODE_STORAGE_KEY, routeCode);
      return;
    }

    const storedCode = normalizeDeviceCode(window.localStorage.getItem(DEVICE_CODE_STORAGE_KEY));
    if (storedCode.length === 6) {
      setResolvedDeviceCode(storedCode);
      return;
    }

    // No code yet — ask the user to enter the one shown in the panel
    setStatus("needs-code");
    setCheckinDone(true);
  }, [deviceId]);

  const deviceCode = resolvedDeviceCode;

  const doCheckin = useCallback(async (codeOverride?: string) => {
    const code = codeOverride ?? deviceCode;
    if (!code) return null;

    try {
      const res = await fetch(CHECKIN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_KEY,
        },
        body: JSON.stringify({ device_code: code }),
      });

      if (!res.ok) {
        if (res.status === 404) {
          return { status: "not-found" as const };
        }
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();

      if (data.status === "paired" && data.config) {
        setStatus("paired");
        setConfig(data.config);
      }

      return data;
    } catch (err: any) {
      console.error("Checkin error:", err);
      return null;
    }
  }, [deviceCode]);

  // Initial checkin when we already have a code
  useEffect(() => {
    if (!deviceCode) return;

    doCheckin().then((data) => {
      setCheckinDone(true);
      // If the stored code is no longer valid, clear it and ask for a new one
      if (data?.status === "not-found") {
        window.localStorage.removeItem(DEVICE_CODE_STORAGE_KEY);
        setResolvedDeviceCode("");
        setStatus("needs-code");
      }
    });
  }, [deviceCode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Heartbeat
  useEffect(() => {
    if (showSplash || !deviceCode || status !== "paired") return;
    const interval = setInterval(() => doCheckin(), HEARTBEAT_INTERVAL);
    return () => clearInterval(interval);
  }, [showSplash, deviceCode, status, doCheckin]);

  const handleSubmitCode = async () => {
    const code = normalizeDeviceCode(codeInput);
    if (code.length !== 6) {
      setInputError("El código debe tener 6 caracteres");
      return;
    }
    setInputError("");
    setStatus("verifying");

    const data = await doCheckin(code);

    if (data?.status === "paired") {
      window.localStorage.setItem(DEVICE_CODE_STORAGE_KEY, code);
      setResolvedDeviceCode(code);
      // status already set to 'paired' inside doCheckin
    } else if (data?.status === "not-found") {
      setStatus("needs-code");
      setInputError("Código no encontrado. Verifícalo en el panel Visualia.");
    } else {
      setStatus("needs-code");
      setInputError("No pudimos verificar el código. Revisa tu conexión.");
    }
  };

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

  // Splash screen — shown on every load/restart
  if (showSplash) {
    return (
      <PlayerSplash
        ready={checkinDone}
        onComplete={() => setShowSplash(false)}
      />
    );
  }

  if (status === "error") {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: "#0a0812", color: "#fff" }}>
        <p className="text-lg">{errorMsg}</p>
      </div>
    );
  }

  if (status === "needs-code" || status === "verifying") {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center px-6" style={{ background: "linear-gradient(180deg, #0E0B16 0%, #12101A 100%)" }}>
        {/* Brand */}
        <div className="relative mb-8">
          <div className="absolute inset-0 scale-150 rounded-full opacity-30 blur-2xl" style={{ background: "radial-gradient(circle, #8A00FF 0%, transparent 70%)" }} />
          <img src={simboloVisualia} alt="Visualia" className="relative h-32 w-auto" />
        </div>

        <p className="mb-2 text-sm font-medium tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.5)" }}>
          Vincular pantalla
        </p>
        <h1 className="mb-6 text-2xl font-bold text-center" style={{ color: "#fff" }}>
          Ingresa el código del panel
        </h1>

        <input
          type="text"
          value={codeInput}
          autoFocus
          onChange={(e) => {
            setCodeInput(normalizeDeviceCode(e.target.value));
            if (inputError) setInputError("");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmitCode();
          }}
          maxLength={6}
          placeholder="ABC123"
          disabled={status === "verifying"}
          className="mb-4 w-full max-w-md rounded-2xl px-8 py-5 text-center font-mono text-4xl font-bold tracking-[0.4em] outline-none disabled:opacity-50"
          style={{
            background: "rgba(138,0,255,0.08)",
            border: `1px solid ${inputError ? "rgba(255,80,80,0.5)" : "rgba(138,0,255,0.35)"}`,
            color: "#C000FF",
            textShadow: "0 0 20px rgba(192,0,255,0.5)",
          }}
        />

        {inputError && (
          <p className="mb-4 text-sm" style={{ color: "rgba(255,120,120,0.9)" }}>
            {inputError}
          </p>
        )}

        <button
          onClick={handleSubmitCode}
          disabled={status === "verifying" || codeInput.length !== 6}
          className="mb-6 rounded-xl px-10 py-3 text-base font-semibold transition-all disabled:opacity-40"
          style={{
            background: "linear-gradient(135deg, #8A00FF 0%, #C000FF 100%)",
            color: "#fff",
            boxShadow: "0 0 30px rgba(138,0,255,0.4)",
          }}
        >
          {status === "verifying" ? "Verificando..." : "Vincular pantalla"}
        </button>

        <p className="max-w-md text-center text-sm" style={{ color: "rgba(255,255,255,0.45)", lineHeight: 1.6 }}>
          Genera tu código desde <strong style={{ color: "rgba(255,255,255,0.7)" }}>visualiamedia.com</strong> → Pantallas → Agregar pantalla.
        </p>

        {/* Bottom branding */}
        <div className="absolute bottom-8 flex items-center gap-2 opacity-30">
          <img src={simboloVisualia} alt="Visualia" className="h-5 w-auto" />
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
