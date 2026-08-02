import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { CheckCircle2 } from "lucide-react";
import simboloVisualia from "@/assets/simbolo-visualia.webp";
import { SUPPORT_WHATSAPP_URL } from "@/config/support";
import { trackConversion } from "@/lib/attribution";

/** Página de gracias con noindex: acá se disparan los píxeles de conversión. */
export default function CampaignThanks() {
  useEffect(() => {
    trackConversion("lead_thank_you");
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <Helmet>
        <title>Gracias, te escribimos hoy | Visualia</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <img src={simboloVisualia} alt="Visualia" width={40} height={40} className="h-10 w-auto" />
      <CheckCircle2 className="mt-8 h-14 w-14 text-emerald-400" aria-hidden="true" />
      <h1 className="mt-5 font-display text-2xl font-bold text-foreground md:text-3xl">
        Listo, ya tenemos tus datos
      </h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        Te escribimos por WhatsApp en horario de oficina, de lunes a viernes de 8:00 a. m. a 6:00 p. m. Si
        prefieres, escríbenos tú ahora mismo.
      </p>
      <a
        href={SUPPORT_WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 inline-flex items-center justify-center rounded-full bg-[#25D366] px-7 py-3.5 text-base font-semibold text-[#052e16] transition hover:bg-[#1fb855]"
      >
        Escribir por WhatsApp
      </a>
    </div>
  );
}
