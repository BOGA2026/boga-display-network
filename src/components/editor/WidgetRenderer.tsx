import React from "react";
import type { ProductCardData, MenuBoardData, PromoData, WidgetTypography } from "./widgetPresets";
import { EditableWidgetText } from "./EditableWidgetText";

type WidgetLayer = {
  widgetType: "product_card" | "menu_board" | "promo";
  content: ProductCardData | MenuBoardData | PromoData;
  w: number;
  h: number;
};

type Props = {
  layer: WidgetLayer;
  onUpdateContent?: (next: ProductCardData | MenuBoardData | PromoData) => void;
};

function typo(t?: WidgetTypography): React.CSSProperties {
  if (!t) return {};
  return {
    ...(t.fontFamily ? { fontFamily: t.fontFamily } : {}),
    ...(t.fontWeight ? { fontWeight: t.fontWeight } : {}),
  };
}

export function WidgetRenderer({ layer, onUpdateContent }: Props) {
  const editable = !!onUpdateContent;
  const update = (patch: Record<string, unknown>) => {
    if (onUpdateContent) {
      onUpdateContent({ ...layer.content, ...patch } as any);
    }
  };

  const t = (layer.content as any).typography as WidgetTypography | undefined;
  const baseFont = typo(t);
  const scaleFactor = t?.fontSize ? t.fontSize / 24 : 1;

  if (layer.widgetType === "product_card") {
    const d = layer.content as ProductCardData;
    const isVertical = layer.h > layer.w;
    const titleSize = Math.round((isVertical ? 30 : 34) * scaleFactor);
    const subtitleSize = Math.round((isVertical ? 18 : 20) * scaleFactor);
    const priceSize = Math.round((isVertical ? 28 : 32) * scaleFactor);

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
          ...baseFont,
        }}
      >
        <img
          src={d.image}
          alt={d.title}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          draggable={false}
        />
        <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 8 }}>
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
          {editable ? (
            <EditableWidgetText
              value={d.title}
              onChange={(v) => update({ title: v })}
              style={{ margin: 0, fontSize: titleSize, lineHeight: 1.05, fontWeight: t?.fontWeight || 700 }}
            />
          ) : (
            <h3 style={{ margin: 0, fontSize: titleSize, lineHeight: 1.05 }}>{d.title}</h3>
          )}
          {editable ? (
            <EditableWidgetText
              value={d.subtitle}
              onChange={(v) => update({ subtitle: v })}
              style={{ margin: 0, opacity: 0.85, fontSize: subtitleSize }}
            />
          ) : (
            <p style={{ margin: 0, opacity: 0.85, fontSize: subtitleSize }}>{d.subtitle}</p>
          )}
          <div style={{ marginTop: "auto" }}>
            {editable ? (
              <EditableWidgetText
                value={d.price}
                onChange={(v) => update({ price: v })}
                style={{
                  display: "inline-block",
                  background: d.accent,
                  color: "#fff",
                  padding: "10px 16px",
                  borderRadius: 12,
                  fontSize: priceSize,
                  fontWeight: 800,
                }}
              />
            ) : (
              <span
                style={{
                  display: "inline-block",
                  background: d.accent,
                  color: "#fff",
                  padding: "10px 16px",
                  borderRadius: 12,
                  fontSize: priceSize,
                  fontWeight: 800,
                }}
              >
                {d.price}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (layer.widgetType === "promo") {
    const d = layer.content as PromoData;
    const isVertical = layer.h > layer.w;
    const titleSize = Math.round((isVertical ? 44 : 48) * scaleFactor);
    const msgSize = Math.round((isVertical ? 26 : 28) * scaleFactor);
    const ctaSize = Math.round((isVertical ? 24 : 26) * scaleFactor);

    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 18,
          overflow: "hidden",
          background: d.bg,
          color: "#fff",
          border: `2px solid ${d.accent}`,
          padding: isVertical ? 24 : 28,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 12,
          ...baseFont,
        }}
      >
        {editable ? (
          <EditableWidgetText
            value={d.title}
            onChange={(v) => update({ title: v })}
            style={{ margin: 0, fontSize: titleSize, fontWeight: t?.fontWeight || 900, lineHeight: 1.1 }}
          />
        ) : (
          <h2 style={{ margin: 0, fontSize: titleSize, fontWeight: 900, lineHeight: 1.1 }}>{d.title}</h2>
        )}
        {editable ? (
          <EditableWidgetText
            value={d.message}
            onChange={(v) => update({ message: v })}
            style={{ margin: 0, fontSize: msgSize, opacity: 0.85 }}
          />
        ) : (
          <p style={{ margin: 0, fontSize: msgSize, opacity: 0.85 }}>{d.message}</p>
        )}
        <div>
          {editable ? (
            <EditableWidgetText
              value={d.cta}
              onChange={(v) => update({ cta: v })}
              style={{
                display: "inline-block",
                background: d.accent,
                color: "#111",
                fontWeight: 800,
                padding: "10px 18px",
                borderRadius: 12,
                fontSize: ctaSize,
              }}
            />
          ) : (
            <span
              style={{
                display: "inline-block",
                background: d.accent,
                color: "#111",
                fontWeight: 800,
                padding: "10px 18px",
                borderRadius: 12,
                fontSize: ctaSize,
              }}
            >
              {d.cta}
            </span>
          )}
        </div>
      </div>
    );
  }

  const d = layer.content as MenuBoardData;
  const isVertical = layer.h > layer.w;
  const headerSize = Math.round((isVertical ? 34 : 38) * scaleFactor);
  const itemSize = Math.round((isVertical ? 24 : 22) * scaleFactor);

  const updateItem = (idx: number, patch: Partial<{ name: string; price: string }>) => {
    const next = d.items.map((it, i) => (i === idx ? { ...it, ...patch } : it));
    update({ items: next });
  };

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
        ...baseFont,
      }}
    >
      <div
        style={{
          background: d.accent,
          color: "#111827",
          fontWeight: 900,
          fontSize: headerSize,
          padding: "14px 18px",
          letterSpacing: 0.5,
        }}
      >
        {editable ? (
          <EditableWidgetText
            value={d.header}
            onChange={(v) => update({ header: v })}
            style={{ fontWeight: 900, fontSize: "inherit" }}
          />
        ) : (
          d.header
        )}
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
              fontSize: itemSize,
              fontWeight: 600,
            }}
          >
            {editable ? (
              <>
                <EditableWidgetText
                  value={it.name}
                  onChange={(v) => updateItem(idx, { name: v })}
                  style={{ flex: 1, fontSize: "inherit" }}
                />
                <EditableWidgetText
                  value={it.price}
                  onChange={(v) => updateItem(idx, { price: v })}
                  align="right"
                  style={{ width: 120, fontWeight: 900, color: d.accent, fontSize: "inherit" }}
                />
              </>
            ) : (
              <>
                <span>{it.name}</span>
                <span style={{ fontWeight: 900, color: d.accent }}>{it.price}</span>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
