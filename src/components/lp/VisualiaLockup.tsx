import simboloVisualia from "@/assets/simbolo-visualia.webp";

interface Props {
  /** Alto del símbolo en px. El wordmark escala con él. */
  size?: number;
  /** Oculta la palabra: solo para espacios muy estrechos. */
  symbolOnly?: boolean;
  className?: string;
}

/**
 * Lockup de marca: símbolo + palabra VISUALIA.
 *
 * En la landing de campaña la persona llega desde un anuncio y no sabe quién
 * le habla: por eso el wordmark NUNCA se reduce ni se recorta en móvil.
 */
export default function VisualiaLockup({ size = 32, symbolOnly = false, className = "" }: Props) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <img
        src={simboloVisualia}
        alt={symbolOnly ? "Visualia" : ""}
        aria-hidden={symbolOnly ? undefined : true}
        width={size}
        height={size}
        style={{ height: size, width: "auto" }}
        className="shrink-0"
      />
      {!symbolOnly && (
        <span
          className="font-display font-semibold uppercase leading-none text-foreground"
          style={{ fontSize: Math.round(size * 0.56), letterSpacing: "0.02em" }}
        >
          Visualia
        </span>
      )}
    </span>
  );
}
