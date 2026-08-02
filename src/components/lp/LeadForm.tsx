import { useEffect, useMemo, useState } from "react";
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

/**
 * Texto literal de la autorización. Se guarda junto con el lead: la Ley 1581
 * exige poder demostrar QUÉ aceptó la persona y CUÁNDO, no solo que aceptó.
 * Si cambia el texto, se sube la versión.
 */
export const CONSENT_VERSION = "2026-08-lp-v1";
const CONSENT_PREFIX =
  "Autorizo a Boga Casa de Contenidos S.A.S. (Visualia) a tratar mis datos personales para contactarme por WhatsApp, llamada o correo con información comercial sobre el servicio, conforme a la ";
export const CONSENT_TEXT = `${CONSENT_PREFIX}política de tratamiento de datos.`;


/** Celular colombiano: 10 dígitos empezando en 3, con o sin +57. */
function normalizeCoPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  const local = digits.startsWith("57") && digits.length === 12 ? digits.slice(2) : digits;
  return /^3\d{9}$/.test(local) ? `+57${local}` : null;
}

type Field = "name" | "phone" | "company" | "city" | "consent";

export default function LeadForm({ campaignSlug }: Props) {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [city, setCity] = useState("");
  const [consent, setConsent] = useState(false);
  const [consentAt, setConsentAt] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});

  useEffect(() => {
    captureAttribution(window.location.pathname);
  }, []);

  const errors = useMemo(() => {
    const e: Partial<Record<Field, string>> = {};
    if (name.trim().length < 2) e.name = "Escribe tu nombre.";
    if (!normalizeCoPhone(phone))
      e.phone = "Escribe un celular colombiano de 10 dígitos, por ejemplo 3001234567.";
    if (company.trim().length < 2) e.company = "Escribe el nombre de tu restaurante.";
    if (city.trim().length < 2) e.city = "Escribe tu ciudad.";
    if (!consent) e.consent = "Necesitamos tu autorización para contactarte.";
    return e;
  }, [name, phone, company, city, consent]);

  const isValid = Object.keys(errors).length === 0;
  const blur = (f: Field) => () => setTouched((t) => ({ ...t, [f]: true }));
  const show = (f: Field) => (touched[f] ? errors[f] : undefined);

  const toggleConsent = (checked: boolean) => {
    setConsent(checked);
    setConsentAt(checked ? new Date().toISOString() : null);
    setTouched((t) => ({ ...t, consent: true }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, phone: true, company: true, city: true, consent: true });
    if (!isValid || sending) return;

    const whatsapp = normalizeCoPhone(phone)!;
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
          consent_at: consentAt ?? new Date().toISOString(),
          consent_text: CONSENT_TEXT,
          consent_version: CONSENT_VERSION,
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

  const fieldError = (f: Field) =>
    show(f) ? (
      <p id={`lp-${f}-error`} role="alert" className="mt-1.5 text-[13px] text-destructive">
        {show(f)}
      </p>
    ) : null;

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div>
        <Label htmlFor="lp-name">Nombre</Label>
        <Input
          id="lp-name"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={blur("name")}
          aria-invalid={Boolean(show("name"))}
          aria-describedby={show("name") ? "lp-name-error" : undefined}
          className="mt-1.5"
        />
        {fieldError("name")}
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
          onBlur={blur("phone")}
          aria-invalid={Boolean(show("phone"))}
          aria-describedby={show("phone") ? "lp-phone-error" : undefined}
          className="mt-1.5"
        />
        {fieldError("phone")}
      </div>
      <div>
        <Label htmlFor="lp-company">Nombre del restaurante</Label>
        <Input
          id="lp-company"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          onBlur={blur("company")}
          aria-invalid={Boolean(show("company"))}
          aria-describedby={show("company") ? "lp-company-error" : undefined}
          className="mt-1.5"
        />
        {fieldError("company")}
      </div>
      <div>
        <Label htmlFor="lp-city">Ciudad</Label>
        <Input
          id="lp-city"
          autoComplete="address-level2"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          onBlur={blur("city")}
          aria-invalid={Boolean(show("city"))}
          aria-describedby={show("city") ? "lp-city-error" : undefined}
          className="mt-1.5"
        />
        {fieldError("city")}
      </div>

      <div className="flex items-start gap-3">
        <Checkbox
          id="lp-consent"
          checked={consent}
          onCheckedChange={(v) => toggleConsent(v === true)}
          className="mt-0.5"
          aria-describedby={show("consent") ? "lp-consent-error" : undefined}
        />
        <Label htmlFor="lp-consent" className="text-xs font-normal leading-relaxed text-muted-foreground">
          {CONSENT_TEXT.replace(", conforme a la política de tratamiento de datos.", ", conforme a la ")}
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
      {fieldError("consent")}

      <Button type="submit" size="lg" className="w-full" disabled={!isValid || sending}>
        {sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
        Quiero que me contacten
      </Button>
    </form>
  );
}
