import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { captureAttribution, trackConversion } from "@/lib/attribution";

interface Props {
  campaignSlug: string;
}

/** Celular colombiano: 10 dígitos empezando en 3, con o sin +57. */
function normalizeCoPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  const local = digits.startsWith("57") && digits.length === 12 ? digits.slice(2) : digits;
  return /^3\d{9}$/.test(local) ? `+57${local}` : null;
}

export default function LeadForm({ campaignSlug }: Props) {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [city, setCity] = useState("");
  const [consent, setConsent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    captureAttribution(window.location.pathname);
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (name.trim().length < 2) return setError("Escribe tu nombre.");
    const whatsapp = normalizeCoPhone(phone);
    if (!whatsapp) return setError("Escribe un celular colombiano de 10 dígitos, por ejemplo 3001234567.");
    if (company.trim().length < 2) return setError("Escribe el nombre de tu restaurante.");
    if (city.trim().length < 2) return setError("Escribe tu ciudad.");
    if (!consent) return setError("Necesitamos tu autorización para contactarte.");

    setSending(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("submit-lead", {
        body: {
          name: name.trim(),
          whatsapp,
          phone: whatsapp,
          company: company.trim(),
          city: city.trim(),
          preferred_contact: "whatsapp",
          source: `lp/${campaignSlug}`,
          attribution: captureAttribution(),
        },
      });
      if (fnError || !(data as { ok?: boolean } | null)?.ok) {
        throw new Error(fnError?.message ?? "No pudimos enviar tus datos");
      }
      trackConversion("lead_submit", { campaign: campaignSlug });
      navigate("/lp/gracias", { replace: false });
    } catch {
      setSending(false);
      toast.error("No pudimos enviar tus datos. Intenta de nuevo o escríbenos por WhatsApp.");
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div>
        <Label htmlFor="lp-name">Nombre</Label>
        <Input
          id="lp-name"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1.5"
          required
        />
      </div>
      <div>
        <Label htmlFor="lp-phone">WhatsApp</Label>
        <Input
          id="lp-phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="3001234567"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="mt-1.5"
          required
        />
      </div>
      <div>
        <Label htmlFor="lp-company">Nombre del restaurante</Label>
        <Input
          id="lp-company"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          className="mt-1.5"
          required
        />
      </div>
      <div>
        <Label htmlFor="lp-city">Ciudad</Label>
        <Input
          id="lp-city"
          autoComplete="address-level2"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="mt-1.5"
          required
        />
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={sending}>
        {sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
        Quiero que me contacten
      </Button>

      <div className="flex items-start gap-3">
        <Checkbox
          id="lp-consent"
          checked={consent}
          onCheckedChange={(v) => setConsent(v === true)}
          className="mt-0.5"
        />
        <Label htmlFor="lp-consent" className="text-xs font-normal leading-relaxed text-muted-foreground">
          Autorizo el tratamiento de mis datos personales para que me contacten, según la{" "}
          <a
            href="/legal/privacidad"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline underline-offset-4"
          >
            política de tratamiento de datos
          </a>
          .
        </Label>
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </form>
  );
}
