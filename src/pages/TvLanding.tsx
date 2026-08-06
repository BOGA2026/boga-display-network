import { useEffect, useState } from "react";
import { APK_URL, APK_FILE, SHORT_URL } from "@/config/apk";

// Página ULTRA-LIVIANA para el navegador del televisor (Silk / Downloader).
// Su única función: mandar la descarga del APK de inmediato.
export default function TvLanding() {
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    document.title = "Descargando Visualia para TV";
    // Redirección inmediata al archivo de instalación.
    const t = window.setTimeout(() => {
      window.location.replace(APK_URL);
    }, 100);
    const s = window.setTimeout(() => setSlow(true), 2500);
    return () => {
      window.clearTimeout(t);
      window.clearTimeout(s);
    };
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#000",
        color: "#fff",
        fontFamily: "Arial, sans-serif",
        padding: "48px 60px",
        boxSizing: "border-box",
      }}
    >
      <h1 style={{ fontSize: 48, fontWeight: 800, margin: 0, color: "#a855f7" }}>
        VISUALIA
      </h1>
      <p style={{ fontSize: 26, marginTop: 16 }}>
        Descargando la app para televisor…
      </p>
      <p style={{ fontSize: 18, color: "#bbb", marginTop: 8 }}>
        Archivo: {APK_FILE} · Dirección corta: {SHORT_URL}
      </p>

      {slow && (
        <p style={{ fontSize: 20, marginTop: 28 }}>
          ¿No empezó la descarga?{" "}
          <a href={APK_URL} style={{ color: "#a855f7" }}>
            Tocá acá para descargar
          </a>
          .
        </p>
      )}
    </div>
  );
}
