import { useState } from "react";
import { Sparkles, X, Loader2, Image as ImageIcon, Video, Type as TypeIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAiStudio } from "./useAiStudio";
import { UsageCounter } from "./UsageCounter";
import { GenerationHistory } from "./GenerationHistory";

type Mode = "image" | "loop" | "copy";

/**
 * Full "Crear con IA" panel: three tools (image, short loop, copy) that hit
 * the ai-studio edge function, plus live progress, cancel, monthly quota
 * counter and history. When the quota is exhausted we show a friendly card
 * — never a raw 429 error.
 */
export function CrearConIA() {
  const { toast } = useToast();
  const studio = useAiStudio();
  const [mode, setMode] = useState<Mode>("image");
  const [prompt, setPrompt] = useState("");
  const [formato, setFormato] = useState<"16:9" | "9:16" | "1:1" | "4:5">("16:9");
  const [duracion, setDuracion] = useState(6);
  const [tipoPromo, setTipoPromo] = useState("");
  const [ultima, setUltima] = useState<{ url?: string; copy?: { titulo?: string; subtitulo?: string; cta?: string } } | null>(null);

  const quotaReached = studio.usage ? studio.usage.remaining <= 0 : false;

  const handleGenerate = async () => {
    try {
      setUltima(null);
      if (mode === "image") {
        const out = await studio.generateImage({ prompt, formato });
        setUltima({ url: out.url });
      } else if (mode === "loop") {
        const out = await studio.generateVideoLoop({ prompt, formato: formato === "4:5" ? "1:1" : formato, duracion_segundos: duracion });
        setUltima({ url: out.url });
      } else {
        const out = await studio.suggestCopy({ tipo_promocion: tipoPromo });
        setUltima({ copy: out.copy });
      }
      toast({ title: "Generación lista", description: "Ya puedes usarla en tus pantallas." });
    } catch {
      // useAiStudio already surfaces the error via `studio.error`.
    }
  };

  return (
    <div className="space-y-6">
      <UsageCounter usage={studio.usage} />

      <div className="rounded-2xl border border-border/60 bg-card/60 p-5 backdrop-blur">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Crear con IA</h2>
        </div>

        <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
          <TabsList className="mb-4 grid w-full grid-cols-3">
            <TabsTrigger value="image" className="gap-1">
              <ImageIcon className="h-3.5 w-3.5" /> Imagen
            </TabsTrigger>
            <TabsTrigger value="loop" className="gap-1">
              <Video className="h-3.5 w-3.5" /> Loop
            </TabsTrigger>
            <TabsTrigger value="copy" className="gap-1">
              <TypeIcon className="h-3.5 w-3.5" /> Copy
            </TabsTrigger>
          </TabsList>

          <TabsContent value="image" className="space-y-3">
            <div>
              <Label htmlFor="prompt-img">Descripción</Label>
              <Textarea
                id="prompt-img"
                placeholder="Foto profesional de hamburguesa artesanal, iluminación cálida, para pantalla del menú del almuerzo."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
                disabled={studio.busy}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Formato</Label>
                <Select value={formato} onValueChange={(v) => setFormato(v as typeof formato)} disabled={studio.busy}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="16:9">16:9 · TV horizontal</SelectItem>
                    <SelectItem value="9:16">9:16 · TV vertical</SelectItem>
                    <SelectItem value="1:1">1:1 · Cuadrado</SelectItem>
                    <SelectItem value="4:5">4:5 · Redes sociales</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="loop" className="space-y-3">
            <div>
              <Label htmlFor="prompt-loop">Descripción del loop</Label>
              <Textarea
                id="prompt-loop"
                placeholder="Café humeante servido en primer plano, cámara lenta, con vapor y luz de mañana."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
                disabled={studio.busy}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Duración (seg.)</Label>
                <Input
                  type="number"
                  min={3}
                  max={15}
                  value={duracion}
                  onChange={(e) => setDuracion(Math.max(3, Math.min(15, Number(e.target.value) || 6)))}
                  disabled={studio.busy}
                />
              </div>
              <div>
                <Label>Formato</Label>
                <Select value={formato} onValueChange={(v) => setFormato(v as typeof formato)} disabled={studio.busy}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="16:9">16:9</SelectItem>
                    <SelectItem value="9:16">9:16</SelectItem>
                    <SelectItem value="1:1">1:1</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="copy" className="space-y-3">
            <div>
              <Label htmlFor="tipo-promo">Tipo de promoción</Label>
              <Input
                id="tipo-promo"
                placeholder="Ej. Happy hour cervezas 2x1, martes 5–7pm"
                value={tipoPromo}
                onChange={(e) => setTipoPromo(e.target.value)}
                disabled={studio.busy}
              />
              <p className="mt-1 text-xs text-muted-foreground">Usamos el nombre y contexto de tu negocio automáticamente.</p>
            </div>
          </TabsContent>
        </Tabs>

        {studio.busy && (
          <div className="mt-4 rounded-xl border border-primary/30 bg-primary/5 p-3">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-primary">
                <Loader2 className="h-4 w-4 animate-spin" /> Generando… {studio.progress}%
              </span>
              <Button size="sm" variant="ghost" onClick={studio.cancel} className="gap-1 text-muted-foreground">
                <X className="h-3.5 w-3.5" /> Cancelar
              </Button>
            </div>
            <Progress value={studio.progress} className="h-1.5" />
            <p className="mt-2 text-xs text-muted-foreground">
              Estamos consultando la IA. Podés cancelar sin costo si tarda demasiado.
            </p>
          </div>
        )}

        {studio.error && !studio.busy && (
          <div className="mt-4 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {studio.error}
          </div>
        )}

        {quotaReached && !studio.busy && (
          <div className="mt-4 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
            <p className="font-semibold text-amber-700 dark:text-amber-300">Alcanzaste el límite mensual de tu plan.</p>
            <p className="mt-1 text-muted-foreground">
              Sigue disfrutando de la biblioteca ya generada, o actualiza tu plan para seguir creando hoy mismo.
            </p>
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <Button
            onClick={handleGenerate}
            disabled={studio.busy || quotaReached || (mode === "copy" ? tipoPromo.trim().length < 2 : prompt.trim().length < 3)}
            className="gap-2"
          >
            <Sparkles className="h-4 w-4" /> Generar
          </Button>
        </div>
      </div>

      {ultima?.url && (
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/60">
          <img src={ultima.url} alt="Última generación" className="w-full object-cover" />
        </div>
      )}
      {ultima?.copy && (
        <div className="space-y-2 rounded-2xl border border-border/60 bg-card/60 p-5">
          <h3 className="text-lg font-bold">{ultima.copy.titulo}</h3>
          <p className="text-sm text-muted-foreground">{ultima.copy.subtitulo}</p>
          <p className="text-sm font-medium text-primary">→ {ultima.copy.cta}</p>
        </div>
      )}

      <div>
        <h3 className="mb-3 text-sm font-semibold text-muted-foreground">Historial</h3>
        <GenerationHistory items={studio.history} />
      </div>
    </div>
  );
}
