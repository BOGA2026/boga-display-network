import samsungMark from "@/assets/brands/samsung.svg";
import lgMark from "@/assets/brands/lg.svg";
import sonyMark from "@/assets/brands/sony.svg";
import xiaomiMark from "@/assets/brands/xiaomi.svg";

/**
 * Logos de las marcas de televisor del verificador.
 *
 * El logo se pinta como máscara: así el mismo archivo se ve gris en reposo y
 * en color de marca al pasar el mouse o al quedar seleccionado, sin duplicar
 * archivos. Las marcas sin logo disponible usan su nombre como wordmark, con
 * el mismo comportamiento de color.
 *
 * `color` es el color oficial de cada marca: es un activo de terceros, no un
 * token del sistema de diseño, por eso va literal.
 */
interface BrandMark {
  mark?: string;
  color: string;
}

const BRAND_MARKS: Record<string, BrandMark> = {
  samsung: { mark: samsungMark, color: "#1428A0" },
  lg: { mark: lgMark, color: "#A50034" },
  sony: { mark: sonyMark, color: "#FFFFFF" },
  xiaomi: { mark: xiaomiMark, color: "#FF6900" },
  tcl: { color: "#E60012" },
  hisense: { color: "#00A0E9" },
  philips: { color: "#0B5ED7" },
  kalley: { color: "#E4002B" },
  otra: { color: "#B19EEF" },
};

export function brandColor(id: string): string {
  return BRAND_MARKS[id]?.color ?? "#B19EEF";
}

interface Props {
  id: string;
  name: string;
  /** Pinta el logo en color de marca aunque no haya mouse encima. */
  active: boolean;
}

export default function BrandLogo({ id, name, active }: Props) {
  const entry = BRAND_MARKS[id];
  const tone = active ? "bg-[var(--brand)]" : "bg-muted-foreground group-hover:bg-[var(--brand)]";

  if (!entry?.mark) {
    return (
      <span
        aria-hidden="true"
        className={`font-display text-base font-bold uppercase leading-none tracking-tight transition-colors ${
          active ? "text-[var(--brand)]" : "text-muted-foreground group-hover:text-[var(--brand)]"
        }`}
      >
        {name === "Otra marca" ? "Otra" : name}
      </span>
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`block h-6 w-full transition-colors ${tone}`}
      style={{
        WebkitMaskImage: `url(${entry.mark})`,
        maskImage: `url(${entry.mark})`,
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
      }}
    />
  );
}
