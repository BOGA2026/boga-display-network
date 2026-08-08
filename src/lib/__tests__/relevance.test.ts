import { describe, it, expect } from "vitest";
import { matchScore } from "@/lib/commands";
describe("relevancia", () => {
  it("menu no trae Monitoreo", () => {
    expect(matchScore({ label: "Monitoreo", keywords: ["Monitoring","Estado","Uptime","Salud"] }, "menu")).toBe(0);
    expect(matchScore({ label: "Contenido", keywords: ["Menú","Carta"] }, "menu")).toBeGreaterThan(0);
    expect(matchScore({ label: "Códigos QR", keywords: ["Menú","Carta"] }, "menu")).toBeGreaterThan(0);
  });
});
