import { useEffect, useRef, useState } from "react";
import { QRCodeSVG, QRCodeCanvas } from "qrcode.react";
import { Copy, Download, ExternalLink, Loader2, QrCode as QrIcon, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { createQRCode, updateQRCode, shortUrlFor, type QRCode } from "./api";

interface Props {
  businessId: string;
  /** Editing an existing QR; when omitted we're creating a new one. */
  existing?: QRCode | null;
  screens?: Array<{ id: string; name: string }>;
  onSaved?: (qr: QRCode) => void;
  onCancel?: () => void;
}

/**
 * QR builder — form on the left, live preview on the right. The preview
 * updates on every keystroke so the user *sees* the code they're publishing.
 * On save, we upsert against Supabase and expose the resulting short URL for
 * quick copy/download in PNG (via canvas) or SVG (native download).
 */
export function QRBuilder({ businessId, existing, screens = [], onSaved, onCancel }: Props) {
  const [label, setLabel] = useState(existing?.label ?? "");
  const [targetUrl, setTargetUrl] = useState(existing?.target_url ?? "");
  const [screenId, setScreenId] = useState<string | null>(existing?.screen_id ?? null);
  const [active, setActive] = useState(existing?.active ?? true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<QRCode | null>(existing ?? null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (existing) {
      setLabel(existing.label);
      setTargetUrl(existing.target_url);
      setScreenId(existing.screen_id);
      setActive(existing.active);
      setSaved(existing);
    }
  }, [existing]);

  // Preview URL: for a saved QR we use its real slug, otherwise a placeholder.
  const previewSlug = saved?.slug ?? "preview";
  const previewUrl = shortUrlFor(previewSlug, screenId);
  const displayHost = new URL(previewUrl).host;
  const displayPath = new URL(previewUrl).search ? `${new URL(previewUrl).pathname}${new URL(previewUrl).search}` : new URL(previewUrl).pathname;

  const validate = () => {
    if (!label.trim()) return "Poné un nombre para reconocer el QR.";
    try {
      const u = new URL(targetUrl.trim());
      if (!/^https?:$/.test(u.protocol)) return "El destino debe empezar con https:// o http://.";
    } catch {
      return "El destino no es una URL válida.";
    }
    return null;
  };

  const handleSave = async () => {
    const err = validate();
    if (err) return toast.error(err);

    setSaving(true);
    try {
      let result: QRCode;
      if (saved) {
        await updateQRCode(saved.id, { label: label.trim(), target_url: targetUrl.trim(), screen_id: screenId, active });
        const { data } = await supabase.from("qr_codes").select("*").eq("id", saved.id).single();
        result = data as QRCode;
      } else {
        result = await createQRCode({ business_id: businessId, label: label.trim(), target_url: targetUrl.trim(), screen_id: screenId });
      }
      setSaved(result);
      toast.success(existing ? "QR actualizado" : "QR creado — ya podés imprimirlo o proyectarlo.");
      onSaved?.(result);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar el QR.");
    } finally {
      setSaving(false);
    }
  };

  const copyShortUrl = async () => {
    if (!saved) return toast.info("Guardá primero para obtener el enlace corto.");
    await navigator.clipboard.writeText(shortUrlFor(saved.slug, screenId));
    toast.success("Enlace copiado");
  };

  const downloadPng = () => {
    if (!saved) return toast.info("Guardá primero para descargar el QR.");
    const canvas = canvasRef.current?.querySelector("canvas");
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `qr-${saved.slug}.png`;
    a.click();
  };

  const downloadSvg = () => {
    if (!saved) return toast.info("Guardá primero para descargar el QR.");
    const svg = svgRef.current?.querySelector("svg");
    if (!svg) return;
    const xml = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([`<?xml version="1.0" standalone="no"?>${xml}`], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `qr-${saved.slug}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      {/* --- Form ------------------------------------------------------- */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="qr-label">Nombre interno</Label>
          <Input
            id="qr-label"
            placeholder="Ej. Menú mesa 1, Encuesta happy hour"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            maxLength={80}
          />
          <p className="mt-1 text-xs text-muted-foreground">Solo lo ves vos. Ayuda a distinguir los QR en el listado.</p>
        </div>

        <div>
          <Label htmlFor="qr-target">Destino</Label>
          <Textarea
            id="qr-target"
            placeholder="https://tunegocio.com/menu"
            value={targetUrl}
            onChange={(e) => setTargetUrl(e.target.value)}
            rows={2}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Podés cambiar este destino cuando quieras sin reimprimir el QR — es dinámico.
          </p>
        </div>

        {screens.length > 0 && (
          <div>
            <Label htmlFor="qr-screen">Pantalla de origen (opcional)</Label>
            <select
              id="qr-screen"
              className="mt-1 flex h-10 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={screenId ?? ""}
              onChange={(e) => setScreenId(e.target.value || null)}
            >
              <option value="">— Sin pantalla asociada —</option>
              {screens.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-muted-foreground">
              Si asignás una pantalla, los escaneos quedan atribuidos a ella y podés ver qué TV vende más.
            </p>
          </div>
        )}

        <div className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2">
          <div>
            <p className="text-sm font-medium">QR activo</p>
            <p className="text-xs text-muted-foreground">Si lo desactivás, los escaneos verán una página de error.</p>
          </div>
          <Switch checked={active} onCheckedChange={setActive} />
        </div>

        {saved && (
          <div className="rounded-md border border-border/60 bg-muted/30 p-3 text-sm">
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Enlace corto</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 truncate text-xs text-foreground">
                {displayHost}
                {displayPath}
              </code>
              <Button variant="ghost" size="icon" onClick={copyShortUrl} aria-label="Copiar enlace">
                <Copy className="h-4 w-4" />
              </Button>
              <a href={previewUrl} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground">
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {existing ? "Guardar cambios" : "Crear QR"}
          </Button>
          {onCancel && (
            <Button variant="ghost" onClick={onCancel} disabled={saving}>
              Cancelar
            </Button>
          )}
        </div>
      </div>

      {/* --- Preview ---------------------------------------------------- */}
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-border/60 bg-card/60 p-5">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <QrIcon className="h-4 w-4" /> Vista previa
        </div>
        <div ref={svgRef} className="rounded-xl bg-white p-4 shadow-sm">
          <QRCodeSVG value={previewUrl} size={220} level="M" includeMargin={false} />
        </div>
        {/* Hidden canvas mirror kept in sync so PNG export shares the same content. */}
        <div ref={canvasRef} className="hidden">
          <QRCodeCanvas value={previewUrl} size={512} level="M" includeMargin />
        </div>
        <div className="flex w-full gap-2">
          <Button variant="outline" size="sm" onClick={downloadPng} disabled={!saved} className="flex-1 gap-1">
            <Download className="h-3.5 w-3.5" /> PNG
          </Button>
          <Button variant="outline" size="sm" onClick={downloadSvg} disabled={!saved} className="flex-1 gap-1">
            <Download className="h-3.5 w-3.5" /> SVG
          </Button>
        </div>
        {!saved && <p className="text-center text-xs text-muted-foreground">Guardá para descargar en alta resolución.</p>}
      </div>
    </div>
  );
}
