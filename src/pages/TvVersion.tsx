import { useEffect } from "react";
import { APK_FILE, APK_INFO } from "@/config/apk";

// Texto plano para confirmar desde el televisor qué versión se está sirviendo.
export default function TvVersion() {
  useEffect(() => {
    document.title = "Visualia TV · versión";
  }, []);

  const text = [
    "Visualia TV",
    `version: ${APK_INFO.version}`,
    `archivo: ${APK_FILE}`,
    `compilado: ${APK_INFO.buildDate}`,
    `tamano: ${APK_INFO.sizeMB} MB`,
  ].join("\n");

  return (
    <pre
      style={{
        margin: 0,
        minHeight: "100vh",
        background: "#000",
        color: "#fff",
        fontFamily: "monospace",
        fontSize: 24,
        padding: 40,
        whiteSpace: "pre-wrap",
      }}
    >
      {text}
    </pre>
  );
}
