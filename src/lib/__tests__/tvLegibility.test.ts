import { describe, it, expect } from "vitest";
import { tvTypography, enforceTvProposal, validateTvProposal, contrastRatio, TV_RULES } from "../tvLegibility";

const H = 540, W = 960;

describe("tvLegibility", () => {
  it("respeta los mínimos porcentuales", () => {
    const t = tvTypography(H, W);
    expect(t.plato).toBeGreaterThanOrEqual(H * 0.04);
    expect(t.precio).toBeGreaterThanOrEqual(H * 0.04);
    expect(t.descripcion).toBeGreaterThanOrEqual(H * 0.022);
    expect(t.restaurante).toBeGreaterThanOrEqual(H * 0.06);
    expect(t.safeMargin).toBe(Math.round(H * 0.05));
  });

  it("recorta a 7 platos y corrige contraste y overlay", () => {
    const p = enforceTvProposal({
      id: 1,
      color_texto: "#666666",
      color_acento: "#777777",
      background_color: "#555555",
      overlay_opacity: 0.2,
      image_url: "https://x/y.jpg",
      header: { nombre_restaurante: "Test", tagline: "t", size: 10 },
      secciones: [{ nombre: "Menú", items: Array.from({ length: 12 }, (_, i) => ({ plato: `Plato ${i}`, descripcion: "x".repeat(400), precio: "$12.900" })) }],
    }, H, W);

    const total = p.secciones!.reduce((n, s) => n + s.items!.length, 0);
    expect(total).toBe(TV_RULES.maxItems);
    expect(p.overlay_opacity!).toBeGreaterThanOrEqual(0.6);
    expect(p.header!.size!).toBeGreaterThanOrEqual(H * 0.06);
    expect(validateTvProposal(p, H, W)).toHaveLength(0);
  });

  it("detecta contraste insuficiente", () => {
    expect(contrastRatio("#777777", "#666666")).toBeLessThan(7);
  });
});
