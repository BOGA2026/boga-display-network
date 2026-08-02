import { MessageCircle } from "lucide-react";
import { getAttribution, trackConversion } from "@/lib/attribution";
import { SUPPORT_WHATSAPP_NUMBER } from "@/config/support";

interface Props {
  campaignSlug: string;
  message: string;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Botón de WhatsApp con verde de marca. Registra el evento de conversión antes
 * de abrir el enlace: sin eso, Meta y Google optimizan a ciegas.
 */
export default function WhatsappButton({
  campaignSlug,
  message,
  className = "",
  children = "Escríbenos por WhatsApp",
}: Props) {
  const attribution = typeof window !== "undefined" ? getAttribution() : {};
  const text = `${message} (campaña: ${campaignSlug}${
    attribution.utm_source ? `, ${attribution.utm_source}` : ""
  })`;
  const href = `https://wa.me/${SUPPORT_WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackConversion("whatsapp_click", { campaign: campaignSlug })}
      className={`inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 py-4 text-base font-semibold text-[#052e16] shadow-lg transition hover:bg-[#1fb855] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2 focus-visible:ring-offset-background ${className}`}
    >
      <MessageCircle className="h-5 w-5" aria-hidden="true" />
      {children}
    </a>
  );
}
