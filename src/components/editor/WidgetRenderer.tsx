import React from "react";
import type { ProductCardData, MenuBoardData } from "./widgetPresets";

type WidgetLayer = {
  widgetType: "product_card" | "menu_board";
  content: ProductCardData | MenuBoardData;
  w: number;
  h: number;
};

export function WidgetRenderer({ layer }: { layer: WidgetLayer }) {
  if (layer.widgetType === "product_card") {
    const d = layer.content as ProductCardData;
    const isVertical = layer.h > layer.w;

    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 18,
          overflow: "hidden",
          background: "#0f172a",
          color: "#fff",
          border: `2px solid ${d.accent}`,
          display: "grid",
          gridTemplateColumns: isVertical ? "1fr" : "42% 58%",
          gridTemplateRows: isVertical ? "52% 48%" : "1fr",
        }}
      >
        <img
          src={d.image}
          alt={d.title}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          draggable={false}
        />
        <div
          style={{
            padding: 18,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: 1,
              color: d.accent,
              textTransform: "uppercase",
            }}
          >
            destacado
          </span>
          <h3 style={{ margin: 0, fontSize: isVertical ? 30 : 34, lineHeight: 1.05 }}>
            {d.title}
          </h3>
          <p style={{ margin: 0, opacity: 0.85, fontSize: isVertical ? 18 : 20 }}>
            {d.subtitle}
          </p>
          <div style={{ marginTop: "auto" }}>
            <span
              style={{
                display: "inline-block",
                background: d.accent,
                color: "#fff",
                padding: "10px 16px",
                borderRadius: 12,
                fontSize: isVertical ? 28 : 32,
                fontWeight: 800,
              }}
            >
              {d.price}
            </span>
          </div>
        </div>
      </div>
    );
  }

  const d = layer.content as MenuBoardData;
  const isVertical = layer.h > layer.w;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        borderRadius: 18,
        overflow: "hidden",
        background: "#111827",
        color: "#f8fafc",
        border: "1px solid #1f2937",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          background: d.accent,
          color: "#111827",
          fontWeight: 900,
          fontSize: isVertical ? 34 : 38,
          padding: "14px 18px",
          letterSpacing: 0.5,
        }}
      >
        {d.header}
      </div>
      <div
        style={{
          padding: 16,
          display: "grid",
          gap: 10,
          gridTemplateColumns: isVertical ? "1fr" : "1fr 1fr",
          alignContent: "start",
          height: "100%",
        }}
      >
        {d.items.map((it, idx) => (
          <div
            key={idx}
            style={{
              background: "#0b1220",
              border: "1px solid #233047",
              borderRadius: 12,
              padding: "12px 14px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: isVertical ? 24 : 22,
              fontWeight: 600,
            }}
          >
            <span>{it.name}</span>
            <span style={{ fontWeight: 900, color: d.accent }}>{it.price}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
