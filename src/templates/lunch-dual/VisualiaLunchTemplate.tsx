import { useState, useCallback } from "react";
import defaultConfig from "./template.defaults.json";

/* ── Types ── */
interface MenuItem {
  name: string;
  description: string;
  price: string;
}

interface TemplateConfig {
  mode: "horizontal" | "vertical";
  brandWord: string;
  titleMain: string;
  titleSecondary: string;
  recommendationText: string;
  recommendationPrice: string;
  heroImage: string;
  badgeImage?: string;
  theme: {
    bg: string;
    panel: string;
    primary: string;
    accent: string;
    text: string;
    muted: string;
  };
  typography: {
    fontFamily: string;
  };
  sections: {
    main: MenuItem[];
    drinks: MenuItem[];
  };
}

/* ── Helpers ── */
function hexToRgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/* ── Sub-components ── */

function ItemRow({ item, theme, isLast }: { item: MenuItem; theme: TemplateConfig["theme"]; isLast: boolean }) {
  return (
    <div
      style={{
        borderBottom: isLast ? "none" : `1px solid ${hexToRgba(theme.muted, 0.15)}`,
        padding: "10px 0",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
        <span style={{ fontWeight: 700, fontSize: 16, color: theme.text, letterSpacing: "0.01em" }}>
          {item.name}
        </span>
        <span
          style={{
            fontWeight: 800,
            fontSize: 17,
            color: theme.accent,
            whiteSpace: "nowrap",
            letterSpacing: "0.02em",
          }}
        >
          {item.price}
        </span>
      </div>
      {item.description && (
        <p style={{ fontSize: 12, color: theme.muted, marginTop: 3, lineHeight: 1.4, maxWidth: "85%" }}>
          {item.description}
        </p>
      )}
    </div>
  );
}

function SectionBlock({
  title,
  items,
  theme,
}: {
  title: string;
  items: MenuItem[];
  theme: TemplateConfig["theme"];
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <h3
        style={{
          fontSize: 13,
          fontWeight: 800,
          textTransform: "uppercase" as const,
          letterSpacing: "0.15em",
          color: theme.primary,
          marginBottom: 10,
          paddingBottom: 6,
          borderBottom: `2px solid ${theme.primary}`,
          display: "inline-block",
        }}
      >
        {title}
      </h3>
      <div>
        {items.map((item, i) => (
          <ItemRow key={i} item={item} theme={theme} isLast={i === items.length - 1} />
        ))}
      </div>
    </div>
  );
}

function ChefRecommendation({
  config,
  compact,
}: {
  config: TemplateConfig;
  compact?: boolean;
}) {
  const { theme, recommendationText, recommendationPrice, heroImage } = config;

  return (
    <div
      style={{
        position: "relative",
        borderRadius: 16,
        overflow: "hidden",
        height: compact ? 220 : "100%",
        minHeight: compact ? 220 : 300,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
      }}
    >
      <img
        src={heroImage}
        alt="Chef recommendation"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />
      {/* Gradient overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(0deg, ${theme.bg} 0%, ${hexToRgba(theme.bg, 0.7)} 40%, transparent 70%)`,
        }}
      />
      {/* Content */}
      <div style={{ position: "relative", padding: compact ? 16 : 24 }}>
        <div
          style={{
            display: "inline-block",
            background: theme.accent,
            color: theme.bg,
            fontWeight: 800,
            fontSize: compact ? 11 : 12,
            textTransform: "uppercase" as const,
            letterSpacing: "0.12em",
            padding: "4px 12px",
            borderRadius: 4,
            marginBottom: 8,
          }}
        >
          ★ {recommendationText}
        </div>
        <div
          style={{
            fontSize: compact ? 28 : 36,
            fontWeight: 900,
            color: theme.text,
            lineHeight: 1.1,
            textShadow: `0 2px 20px ${hexToRgba(theme.bg, 0.6)}`,
          }}
        >
          {recommendationPrice}
        </div>
      </div>
    </div>
  );
}

/* ── Horizontal Layout (1920×1080) ── */
function HorizontalLayout({ config }: { config: TemplateConfig }) {
  const { theme, brandWord, titleMain, titleSecondary, sections } = config;

  return (
    <div
      style={{
        width: 1920,
        height: 1080,
        background: theme.bg,
        display: "flex",
        fontFamily: config.typography.fontFamily,
        color: theme.text,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative accent line */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background: `linear-gradient(90deg, ${theme.primary}, ${theme.accent}, ${theme.primary})`,
        }}
      />

      {/* Left: Hero image + chef recommendation */}
      <div style={{ width: 560, flexShrink: 0, padding: 32, display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Brand */}
        <div>
          <span
            style={{
              fontSize: 14,
              fontWeight: 800,
              letterSpacing: "0.25em",
              textTransform: "uppercase" as const,
              color: theme.primary,
            }}
          >
            {brandWord}
          </span>
        </div>
        {/* Hero */}
        <div style={{ flex: 1 }}>
          <ChefRecommendation config={config} />
        </div>
      </div>

      {/* Right: Menu content */}
      <div
        style={{
          flex: 1,
          padding: "40px 48px 32px 24px",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 42, fontWeight: 900, lineHeight: 1, color: theme.text, letterSpacing: "-0.02em" }}>
            {titleMain}
          </h1>
          <p style={{ fontSize: 14, color: theme.muted, marginTop: 6, letterSpacing: "0.04em" }}>
            {titleSecondary}
          </p>
        </div>

        {/* Two-column menu */}
        <div style={{ display: "flex", gap: 40, flex: 1 }}>
          <div style={{ flex: 1.3 }}>
            <SectionBlock title="Platos principales" items={sections.main} theme={theme} />
          </div>
          <div style={{ width: 1, background: hexToRgba(theme.muted, 0.15) }} />
          <div style={{ flex: 1 }}>
            <SectionBlock title="Bebidas" items={sections.drinks} theme={theme} />
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: "auto",
            paddingTop: 14,
            borderTop: `1px solid ${hexToRgba(theme.muted, 0.12)}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: 10, color: theme.muted, letterSpacing: "0.08em", textTransform: "uppercase" as const }}>
            Precios incluyen IVA · Pregunta por nuestros alérgenos
          </span>
          <span style={{ fontSize: 10, color: hexToRgba(theme.primary, 0.6), fontWeight: 600 }}>
            Powered by Visualia
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── Vertical Layout (1080×1920) ── */
function VerticalLayout({ config }: { config: TemplateConfig }) {
  const { theme, brandWord, titleMain, titleSecondary, sections } = config;

  return (
    <div
      style={{
        width: 1080,
        height: 1920,
        background: theme.bg,
        fontFamily: config.typography.fontFamily,
        color: theme.text,
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Top accent */}
      <div
        style={{
          height: 4,
          background: `linear-gradient(90deg, ${theme.primary}, ${theme.accent}, ${theme.primary})`,
          flexShrink: 0,
        }}
      />

      {/* Brand + Title */}
      <div style={{ padding: "32px 40px 0", flexShrink: 0 }}>
        <span
          style={{
            fontSize: 14,
            fontWeight: 800,
            letterSpacing: "0.25em",
            textTransform: "uppercase" as const,
            color: theme.primary,
          }}
        >
          {brandWord}
        </span>
        <h1
          style={{
            fontSize: 48,
            fontWeight: 900,
            lineHeight: 1,
            color: theme.text,
            marginTop: 8,
            letterSpacing: "-0.02em",
          }}
        >
          {titleMain}
        </h1>
        <p style={{ fontSize: 15, color: theme.muted, marginTop: 6, letterSpacing: "0.04em" }}>
          {titleSecondary}
        </p>
      </div>

      {/* Hero / Chef recommendation */}
      <div style={{ padding: "20px 40px", flexShrink: 0 }}>
        <ChefRecommendation config={config} compact />
      </div>

      {/* Menu sections */}
      <div
        style={{
          flex: 1,
          padding: "0 40px",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <SectionBlock title="Platos principales" items={sections.main} theme={theme} />
        <SectionBlock title="Bebidas" items={sections.drinks} theme={theme} />
      </div>

      {/* Footer */}
      <div
        style={{
          padding: "14px 40px",
          borderTop: `1px solid ${hexToRgba(theme.muted, 0.12)}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 10, color: theme.muted, letterSpacing: "0.08em", textTransform: "uppercase" as const }}>
          Precios incluyen IVA · Pregunta por nuestros alérgenos
        </span>
        <span style={{ fontSize: 10, color: hexToRgba(theme.primary, 0.6), fontWeight: 600 }}>
          Powered by Visualia
        </span>
      </div>
    </div>
  );
}

/* ── Main Export ── */
export default function VisualiaLunchTemplate() {
  const [config, setConfig] = useState<TemplateConfig>(defaultConfig as TemplateConfig);
  const [jsonText, setJsonText] = useState(JSON.stringify(defaultConfig, null, 2));
  const [error, setError] = useState<string | null>(null);

  const applyJson = useCallback(() => {
    try {
      const parsed = JSON.parse(jsonText);
      if (!parsed.mode || !parsed.theme || !parsed.sections) {
        setError("JSON inválido: faltan campos obligatorios (mode, theme, sections).");
        return;
      }
      setConfig(parsed as TemplateConfig);
      setError(null);
    } catch (e: any) {
      setError(`Error de sintaxis JSON: ${e.message}`);
    }
  }, [jsonText]);

  const toggleMode = useCallback(() => {
    const newMode = config.mode === "horizontal" ? "vertical" : "horizontal";
    const updated = { ...config, mode: newMode as "horizontal" | "vertical" };
    setConfig(updated);
    setJsonText(JSON.stringify(updated, null, 2));
  }, [config]);

  const isHorizontal = config.mode === "horizontal";
  const canvasW = isHorizontal ? 1920 : 1080;
  const canvasH = isHorizontal ? 1080 : 1920;

  // Scale to fit preview container
  const maxPreviewW = 860;
  const scale = maxPreviewW / canvasW;

  return (
    <div className="flex gap-6 p-6 min-h-screen bg-background">
      {/* Preview */}
      <div className="flex-1 flex flex-col items-center gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-foreground">Vista previa</h2>
          <button
            onClick={toggleMode}
            className="px-3 py-1.5 text-xs font-semibold rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
          >
            {isHorizontal ? "Cambiar a Vertical" : "Cambiar a Horizontal"}
          </button>
          <span className="text-xs text-muted-foreground">
            {canvasW}×{canvasH}
          </span>
        </div>
        <div
          className="border border-border rounded-lg overflow-hidden shadow-lg"
          style={{
            width: canvasW * scale,
            height: canvasH * scale,
          }}
        >
          <div
            style={{
              transform: `scale(${scale})`,
              transformOrigin: "top left",
              width: canvasW,
              height: canvasH,
            }}
          >
            {isHorizontal ? (
              <HorizontalLayout config={config} />
            ) : (
              <VerticalLayout config={config} />
            )}
          </div>
        </div>
      </div>

      {/* JSON Editor Panel */}
      <div className="w-[420px] shrink-0 flex flex-col gap-3">
        <h2 className="text-lg font-bold text-foreground">Editor JSON</h2>
        {error && (
          <div className="rounded-md bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive">
            {error}
          </div>
        )}
        <textarea
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
          spellCheck={false}
          className="flex-1 min-h-[500px] rounded-lg border border-border bg-card p-3 font-mono text-xs text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          onClick={applyJson}
          className="w-full py-2.5 rounded-lg font-semibold text-sm bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
        >
          Aplicar JSON
        </button>
      </div>
    </div>
  );
}
