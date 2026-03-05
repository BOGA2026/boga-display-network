import React from "react";

export type BannerStyle = "none" | "solid" | "gradient";

export type TextStyle = {
  content: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: 400 | 500 | 600 | 700 | 800;
  color: string;
  lineHeight: number;
  letterSpacing: number;
  textAlign: "left" | "center" | "right" | "justify";
  textIndent: number;
  paddingX: number;
  paddingY: number;
  bannerStyle: BannerStyle;
  bannerColor: string;
  bannerFrom: string;
  bannerTo: string;
  borderRadius: number;
};

export const FONT_OPTIONS = [
  "Inter",
  "Montserrat",
  "Poppins",
  "Roboto Slab",
  "Lato",
  "Open Sans",
  "Merriweather",
];

export const defaultTextStyle: TextStyle = {
  content: "Título principal",
  fontFamily: "Inter",
  fontSize: 56,
  fontWeight: 700,
  color: "#FFFFFF",
  lineHeight: 1.2,
  letterSpacing: 0.2,
  textAlign: "left",
  textIndent: 0,
  paddingX: 24,
  paddingY: 16,
  bannerStyle: "solid",
  bannerColor: "#7C3AED",
  bannerFrom: "#7C3AED",
  bannerTo: "#EC4899",
  borderRadius: 14,
};

type Props = {
  value: TextStyle;
  onChange: (next: TextStyle) => void;
};

export function TextStylePanel({ value, onChange }: Props) {
  const set = <K extends keyof TextStyle>(k: K, v: TextStyle[K]) =>
    onChange({ ...value, [k]: v });

  return (
    <div className="space-y-3 text-sm">
      <label className="block">
        <span className="text-muted-foreground">Contenido</span>
        <textarea
          className="mt-1 w-full rounded border border-border bg-background p-2"
          rows={3}
          value={value.content}
          onChange={(e) => set("content", e.target.value)}
        />
      </label>

      <div className="grid grid-cols-2 gap-2">
        <label>
          <span className="text-muted-foreground">Fuente</span>
          <select
            className="mt-1 w-full rounded border border-border bg-background p-2"
            value={value.fontFamily}
            onChange={(e) => set("fontFamily", e.target.value)}
          >
            {FONT_OPTIONS.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </label>
        <label>
          <span className="text-muted-foreground">Tamaño</span>
          <input
            type="number"
            min={10}
            max={200}
            className="mt-1 w-full rounded border border-border bg-background p-2"
            value={value.fontSize}
            onChange={(e) => set("fontSize", Number(e.target.value))}
          />
        </label>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <label>
          <span className="text-muted-foreground">Peso</span>
          <select
            className="mt-1 w-full rounded border border-border bg-background p-2"
            value={value.fontWeight}
            onChange={(e) => set("fontWeight", Number(e.target.value) as TextStyle["fontWeight"])}
          >
            {[400, 500, 600, 700, 800].map((w) => (
              <option key={w} value={w}>{w}</option>
            ))}
          </select>
        </label>
        <label>
          <span className="text-muted-foreground">Color texto</span>
          <input
            type="color"
            className="mt-1 h-10 w-full rounded border border-border p-1"
            value={value.color}
            onChange={(e) => set("color", e.target.value)}
          />
        </label>
        <label>
          <span className="text-muted-foreground">Alineación</span>
          <select
            className="mt-1 w-full rounded border border-border bg-background p-2"
            value={value.textAlign}
            onChange={(e) => set("textAlign", e.target.value as TextStyle["textAlign"])}
          >
            <option value="left">Izquierda</option>
            <option value="center">Centro</option>
            <option value="right">Derecha</option>
            <option value="justify">Justificado</option>
          </select>
        </label>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label>
          <span className="text-muted-foreground">Interlineado</span>
          <input
            type="number"
            step={0.05}
            min={0.8}
            max={2.5}
            className="mt-1 w-full rounded border border-border bg-background p-2"
            value={value.lineHeight}
            onChange={(e) => set("lineHeight", Number(e.target.value))}
          />
        </label>
        <label>
          <span className="text-muted-foreground">Espaciado letras</span>
          <input
            type="number"
            step={0.1}
            min={-2}
            max={10}
            className="mt-1 w-full rounded border border-border bg-background p-2"
            value={value.letterSpacing}
            onChange={(e) => set("letterSpacing", Number(e.target.value))}
          />
        </label>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <label>
          <span className="text-muted-foreground">Sangría 1ª línea</span>
          <input
            type="number"
            min={0}
            max={120}
            className="mt-1 w-full rounded border border-border bg-background p-2"
            value={value.textIndent}
            onChange={(e) => set("textIndent", Number(e.target.value))}
          />
        </label>
        <label>
          <span className="text-muted-foreground">Sangría lateral</span>
          <input
            type="number"
            min={0}
            max={120}
            className="mt-1 w-full rounded border border-border bg-background p-2"
            value={value.paddingX}
            onChange={(e) => set("paddingX", Number(e.target.value))}
          />
        </label>
        <label>
          <span className="text-muted-foreground">Sangría vertical</span>
          <input
            type="number"
            min={0}
            max={120}
            className="mt-1 w-full rounded border border-border bg-background p-2"
            value={value.paddingY}
            onChange={(e) => set("paddingY", Number(e.target.value))}
          />
        </label>
      </div>

      <div className="rounded border border-border p-2">
        <p className="mb-2 font-semibold text-foreground">Banner</p>
        <div className="grid grid-cols-2 gap-2">
          <select
            className="rounded border border-border bg-background p-2"
            value={value.bannerStyle}
            onChange={(e) => set("bannerStyle", e.target.value as BannerStyle)}
          >
            <option value="none">Sin banner</option>
            <option value="solid">Sólido</option>
            <option value="gradient">Degradado</option>
          </select>
          <label>
            <span className="text-muted-foreground">Radio</span>
            <input
              type="number"
              min={0}
              max={64}
              className="w-full rounded border border-border bg-background p-2"
              value={value.borderRadius}
              onChange={(e) => set("borderRadius", Number(e.target.value))}
            />
          </label>
        </div>
        {value.bannerStyle === "solid" && (
          <label className="mt-2 block">
            <span className="text-muted-foreground">Color banner</span>
            <input
              type="color"
              className="mt-1 h-10 w-full rounded border border-border p-1"
              value={value.bannerColor}
              onChange={(e) => set("bannerColor", e.target.value)}
            />
          </label>
        )}
        {value.bannerStyle === "gradient" && (
          <div className="mt-2 grid grid-cols-2 gap-2">
            <label>
              <span className="text-muted-foreground">Color inicial</span>
              <input
                type="color"
                className="mt-1 h-10 w-full rounded border border-border p-1"
                value={value.bannerFrom}
                onChange={(e) => set("bannerFrom", e.target.value)}
              />
            </label>
            <label>
              <span className="text-muted-foreground">Color final</span>
              <input
                type="color"
                className="mt-1 h-10 w-full rounded border border-border p-1"
                value={value.bannerTo}
                onChange={(e) => set("bannerTo", e.target.value)}
              />
            </label>
          </div>
        )}
      </div>
    </div>
  );
}

export function TextLayerPreview({ style }: { style: TextStyle }) {
  const background =
    style.bannerStyle === "none"
      ? "transparent"
      : style.bannerStyle === "solid"
      ? style.bannerColor
      : `linear-gradient(90deg, ${style.bannerFrom}, ${style.bannerTo})`;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        padding: `${style.paddingY}px ${style.paddingX}px`,
        background,
        borderRadius: style.borderRadius,
        display: "flex",
        alignItems: "center",
      }}
    >
      <p
        style={{
          margin: 0,
          width: "100%",
          color: style.color,
          fontFamily: style.fontFamily,
          fontSize: `${style.fontSize}px`,
          fontWeight: style.fontWeight,
          lineHeight: style.lineHeight,
          letterSpacing: `${style.letterSpacing}px`,
          textAlign: style.textAlign,
          textIndent: `${style.textIndent}px`,
          whiteSpace: "pre-wrap",
        }}
      >
        {style.content}
      </p>
    </div>
  );
}
