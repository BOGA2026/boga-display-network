import { describe, it, expect } from "vitest";
import {
  ARCHETYPES,
  DEFAULT_ARCHETYPE_ORDER,
  enforceArchetype,
  normalizeArchetypeOrder,
  orderArchetypes,
} from "../designArchetypes";

describe("designArchetypes", () => {
  it("los tres arquetipos usan familias tipográficas distintas", () => {
    const fonts = Object.values(ARCHETYPES).map((a) => a.fuenteTitulo);
    expect(new Set(fonts).size).toBe(3);
  });

  it("recorta los platos al presupuesto de cada arquetipo", () => {
    const secciones = [{ nombre: "Menú", items: Array.from({ length: 9 }, (_, i) => ({ plato: `P${i}` })) }];
    const foto = enforceArchetype({ secciones, image_url: "x" }, "foto_protagonista");
    const dividido = enforceArchetype({ secciones }, "dividido");
    const lista = enforceArchetype({ secciones, image_url: "x", background_image_query: "food" }, "lista_limpia");

    expect(foto.secciones[0].items).toHaveLength(4);
    expect(dividido.secciones[0].items).toHaveLength(5);
    expect(lista.secciones[0].items).toHaveLength(7);
  });

  it("lista limpia nunca lleva fotografía y foto protagonista siempre oscurece", () => {
    const lista = enforceArchetype({ image_url: "x", background_image_query: "q", overlay_opacity: 0.4 }, "lista_limpia");
    expect(lista.image_url).toBeNull();
    expect(lista.background_image_query).toBe("");

    const foto = enforceArchetype({ overlay_opacity: 0.2 }, "foto_protagonista");
    expect(foto.overlay_opacity).toBeGreaterThanOrEqual(0.6);
    expect(foto.arquetipo).toBe("foto_protagonista");
  });

  it("rota el orden según lo que el usuario elige más", () => {
    expect(orderArchetypes({})).toEqual(DEFAULT_ARCHETYPE_ORDER);
    expect(orderArchetypes({ dividido: 5, lista_limpia: 1 })[0]).toBe("dividido");
  });

  it("normaliza órdenes incompletas o inválidas", () => {
    expect(normalizeArchetypeOrder(["dividido", "basura"])).toHaveLength(3);
    expect(normalizeArchetypeOrder(["dividido"])[0]).toBe("dividido");
    expect(normalizeArchetypeOrder(null)).toEqual(DEFAULT_ARCHETYPE_ORDER);
  });
});
