import type { ReactNode } from "react";

/**
 * Display comercial montado en pared. Es el MISMO marco del simulador de
 * vista previa del panel (bisel negro mate asimétrico, más grueso abajo, y
 * LED de estado), para que lo que se ve en la landing sea lo mismo que el
 * cliente encuentra adentro del producto.
 */
export default function WallDisplay({
  children,
  orientation = "horizontal",
  live = true,
  className = "",
}: {
  children: ReactNode;
  orientation?: "horizontal" | "vertical";
  /** Enciende el LED verde de "en vivo". */
  live?: boolean;
  className?: string;
}) {
  const ratio = orientation === "horizontal" ? "16 / 9" : "9 / 16";

  return (
    <div className={`relative ${className}`}>
      {/* Cuerpo del display */}
      <div className="relative rounded-[14px] bg-[#0b0b0d] p-[6px] pb-[16px] shadow-[0_24px_60px_-24px_rgba(0,0,0,0.9),0_0_0_1px_rgba(255,255,255,0.06)]">
        <div className="overflow-hidden rounded-[7px] bg-black" style={{ aspectRatio: ratio }}>
          {children}
        </div>
        {/* LED de estado del bisel inferior */}
        <span
          aria-hidden="true"
          className={`absolute bottom-[6px] left-1/2 h-[5px] w-[5px] -translate-x-1/2 rounded-full ${
            live ? "bg-emerald-400 shadow-[0_0_8px_2px_rgba(52,211,153,0.7)]" : "bg-muted-foreground/40"
          }`}
        />
      </div>
      {/* Soporte de pared */}
      <span
        aria-hidden="true"
        className="mx-auto block h-3 w-16 rounded-b-md bg-[#0b0b0d]/80"
      />
    </div>
  );
}
