import { useEffect } from "react";

// Página ULTRA-LIVIANA optimizada para el navegador Silk del Amazon Fire TV.
// Sin videos, sin animaciones, sin gradientes complejos, sin React Router links.
// Solo HTML/CSS básico para máxima compatibilidad.

const APK_URL =
  "https://ovuhtroiuuqsiltqgqpp.supabase.co/storage/v1/object/public/downloads/visualia-firetv.apk";

export default function TvLanding() {
  useEffect(() => {
    document.title = "Visualia para Fire TV";
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#000",
        color: "#fff",
        fontFamily: "Arial, sans-serif",
        padding: "40px 60px",
        boxSizing: "border-box",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Logo / título */}
        <h1
          style={{
            fontSize: 56,
            fontWeight: 800,
            margin: 0,
            color: "#a855f7",
            letterSpacing: -1,
          }}
        >
          VISUALIA
        </h1>
        <p style={{ fontSize: 22, color: "#ccc", marginTop: 8 }}>
          Convierte tu Fire TV en una pantalla profesional para tu negocio
        </p>

        {/* Bloque grande con instrucciones */}
        <div
          style={{
            marginTop: 40,
            background: "#111",
            border: "2px solid #a855f7",
            borderRadius: 16,
            padding: 40,
          }}
        >
          <h2 style={{ fontSize: 36, marginTop: 0, color: "#fff" }}>
            Instala Visualia en 3 pasos
          </h2>

          <ol style={{ fontSize: 24, lineHeight: 1.8, paddingLeft: 28 }}>
            <li style={{ marginBottom: 16 }}>
              En tu Fire TV abre la app{" "}
              <strong style={{ color: "#a855f7" }}>Downloader</strong>
              <br />
              <span style={{ fontSize: 18, color: "#999" }}>
                (Si no la tienes, búscala en la tienda como "Downloader by AFTVnews")
              </span>
            </li>

            <li style={{ marginBottom: 16 }}>
              Escribe esta dirección en Downloader y presiona{" "}
              <strong>Go</strong>:
              <div
                style={{
                  marginTop: 12,
                  background: "#000",
                  border: "1px solid #444",
                  padding: "16px 20px",
                  borderRadius: 8,
                  fontFamily: "monospace",
                  fontSize: 22,
                  color: "#10b981",
                  wordBreak: "break-all",
                }}
              >
                {APK_URL}
              </div>
            </li>

            <li>
              Cuando termine la descarga, presiona{" "}
              <strong>Install</strong> y abre Visualia.
            </li>
          </ol>
        </div>

        {/* Bloque de ayuda */}
        <div
          style={{
            marginTop: 32,
            padding: 24,
            background: "#1a1a1a",
            borderRadius: 12,
            fontSize: 18,
            color: "#aaa",
          }}
        >
          <strong style={{ color: "#fff" }}>¿Necesitas ayuda?</strong>
          <br />
          Escribe a soporte@visualiamedia.com o llama al WhatsApp +57 300 000
          0000.
          <br />
          <br />
          Para ver toda la información del producto, abre{" "}
          <strong style={{ color: "#a855f7" }}>visualiamedia.com</strong> desde
          tu computador o celular.
        </div>
      </div>
    </div>
  );
}
