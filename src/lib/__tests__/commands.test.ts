import { describe, expect, it, beforeEach } from "vitest";
import { buildCommands, getCommandScore, recordUsage, resetUsage, sortByScore } from "@/lib/commands";

const build = () => buildCommands({ navigate: () => {} });

describe("command palette", () => {
  beforeEach(() => resetUsage());

  it("no duplica navegación con acciones", () => {
    const ids = build().map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.filter((id) => id.startsWith("nav:")).length).toBeGreaterThan(5);
  });

  it("pone Inicio antes que Mapa y Códigos QR", () => {
    const nav = sortByScore(build().filter((c) => c.group === "Navegación"));
    const labels = nav.map((c) => c.label);
    expect(labels[0]).toBe("Inicio");
    expect(labels.indexOf("Inicio")).toBeLessThan(labels.indexOf("Mapa"));
    expect(labels.indexOf("Inicio")).toBeLessThan(labels.indexOf("Códigos QR"));
  });

  it("el uso real sube el comando en el ranking", () => {
    const qr = build().find((c) => c.id === "nav:qr")!;
    const before = getCommandScore(qr);
    for (let i = 0; i < 10; i++) recordUsage("nav:qr");
    expect(getCommandScore(qr)).toBeGreaterThan(before);
    const nav = sortByScore(build().filter((c) => c.group === "Navegación"));
    expect(nav[0].label).toBe("Códigos QR");
  });

  it("encuentra secciones renombradas por su nombre viejo", () => {
    const match = (q: string) =>
      build().filter((c) =>
        `${c.label} ${c.keywords?.join(" ") ?? ""}`.toLowerCase().includes(q.toLowerCase()),
      );
    expect(match("Playlists").some((c) => c.id === "nav:listas")).toBe(true);
    expect(match("Horarios").some((c) => c.id === "nav:horarios")).toBe(true);
    expect(match("Analytics").some((c) => c.id === "nav:analiticas")).toBe(true);
    expect(match("Screens").some((c) => c.id === "nav:pantallas")).toBe(true);
  });
});
