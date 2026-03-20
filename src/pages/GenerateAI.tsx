import { useState, useCallback } from "react";
import { Sparkles, ExternalLink, Save, RotateCcw, Check, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const TIPOS = ["Digital Signage", "Menú", "Bienvenida", "Promoción", "Evento"] as const;

const STEPS = [
  "Analizando descripción",
  "Definiendo estructura visual",
  "Generando en Canva",
  "Diseño listo",
];

interface DesignResult {
  titulo: string;
  descripcion: string;
  colores: string[];
  fuente_principal: string;
  elementos: string[];
  canva_url: string;
}

/* ─── Full-screen modal ─── */
function DesignModal({
  result,
  cliente,
  onClose,
  onSave,
  saving,
}: {
  result: DesignResult;
  cliente: string;
  onClose: () => void;
  onSave: () => void;
  saving: boolean;
}) {
  const [iframeLoading, setIframeLoading] = useState(true);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in-0 duration-200">
      <div className="flex flex-col w-[90vw] h-[90vh] rounded-xl border border-sidebar-border bg-[hsl(var(--sidebar-background))] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 px-5 py-3 border-b border-sidebar-border shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <h2 className="font-display text-base font-bold truncate">{result.titulo}</h2>
            {cliente && (
              <Badge variant="secondary" className="shrink-0 text-xs">
                {cliente}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a href={result.canva_url} target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="outline" className="border-sidebar-border">
                <ExternalLink className="h-3.5 w-3.5" />
                Abrir en Canva
              </Button>
            </a>
            <Button size="icon" variant="ghost" onClick={onClose} className="h-8 w-8">
              <X className="h-4 w-4" />
              <span className="sr-only">Cerrar</span>
            </Button>
          </div>
        </div>

        {/* Body — iframe */}
        <div className="relative flex-1 min-h-0">
          {iframeLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/60 z-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          <iframe
            src={result.canva_url}
            title="Canva Design"
            className="w-full h-full border-0"
            onLoad={() => setIframeLoading(false)}
            allow="clipboard-write"
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-3 border-t border-sidebar-border shrink-0">
          <Button variant="secondary" onClick={onSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Guardar como contenido
          </Button>
          <Button variant="outline" className="border-sidebar-border" onClick={onClose}>
            <RotateCcw className="h-4 w-4" />
            Generar otro diseño
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─── Page ─── */
export default function GenerateAI() {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState("");
  const [tipo, setTipo] = useState<string>("Digital Signage");
  const [formato, setFormato] = useState("16:9");
  const [estilo, setEstilo] = useState("Moderno");
  const [cliente, setCliente] = useState("");

  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [result, setResult] = useState<DesignResult | null>(null);
  const [saving, setSaving] = useState(false);

  const reset = useCallback(() => {
    setResult(null);
    setCurrentStep(-1);
    setPrompt("");
    setCliente("");
  }, []);

  const generate = async () => {
    if (!prompt.trim()) {
      toast({ title: "Escribe una descripción", variant: "destructive" });
      return;
    }

    setResult(null);
    setLoading(true);
    setCurrentStep(0);

    const stepTimers = [1200, 2400, 3600];
    stepTimers.forEach((ms, i) => {
      setTimeout(() => setCurrentStep(i + 1), ms);
    });

    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-design`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ prompt, tipo, formato, estilo, cliente }),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al generar");
      }

      const data: DesignResult = await res.json();
      setCurrentStep(3);
      setTimeout(() => setResult(data), 600);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const saveAsContent = async () => {
    if (!result) return;
    setSaving(true);
    try {
      const { data: bid } = await supabase.rpc("get_user_business_id");
      if (!bid) throw new Error("No business");

      const { error } = await supabase.from("content").insert({
        business_id: bid,
        name: result.titulo,
        type: "layout",
        file_url: result.canva_url,
        created_by: (await supabase.auth.getUser()).data.user?.id ?? null,
      });

      if (error) throw error;
      toast({ title: "Guardado como borrador en Contenido" });
    } catch (e: any) {
      toast({ title: "Error al guardar", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">
          Generar diseño con IA
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Describe lo que necesita tu cliente y la IA crea el diseño en Canva
        </p>
      </div>

      {/* Form */}
      {!result && (
        <Card className="border-sidebar-border bg-sidebar">
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-2">
              <Label>Describe el diseño</Label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ej: Pantalla de bienvenida para restaurante italiano, colores cálidos, menú del día..."
                className="min-h-[100px] bg-background/50 border-sidebar-border"
              />
            </div>

            <div className="space-y-2">
              <Label>Tipo</Label>
              <div className="flex flex-wrap gap-2">
                {TIPOS.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTipo(t)}
                    className={cn(
                      "rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200",
                      tipo === t
                        ? "gradient-primary text-primary-foreground glow-primary-sm"
                        : "bg-background/50 text-muted-foreground border border-sidebar-border hover:text-foreground"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Formato de pantalla</Label>
                <Select value={formato} onValueChange={setFormato}>
                  <SelectTrigger className="bg-background/50 border-sidebar-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="16:9">Horizontal 16:9</SelectItem>
                    <SelectItem value="9:16">Vertical 9:16</SelectItem>
                    <SelectItem value="1:1">Cuadrado 1:1</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Estilo visual</Label>
                <Select value={estilo} onValueChange={setEstilo}>
                  <SelectTrigger className="bg-background/50 border-sidebar-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Moderno">Moderno</SelectItem>
                    <SelectItem value="Vibrante">Vibrante</SelectItem>
                    <SelectItem value="Elegante">Elegante</SelectItem>
                    <SelectItem value="Corporativo">Corporativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Nombre del cliente (opcional)</Label>
              <Input
                value={cliente}
                onChange={(e) => setCliente(e.target.value)}
                placeholder="Ej: Restaurante La Toscana"
                className="bg-background/50 border-sidebar-border"
              />
            </div>

            <Button
              onClick={generate}
              disabled={loading}
              className="gradient-primary glow-primary-sm w-full sm:w-auto"
              size="lg"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Generar diseño
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stepper */}
      {currentStep >= 0 && !result && (
        <Card className="border-sidebar-border bg-sidebar">
          <CardContent className="pt-6">
            <div className="space-y-4">
              {STEPS.map((label, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all duration-500",
                      i < currentStep
                        ? "gradient-primary text-primary-foreground"
                        : i === currentStep
                        ? "gradient-primary text-primary-foreground animate-pulse"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {i < currentStep ? <Check className="h-4 w-4" /> : i + 1}
                  </div>
                  <span
                    className={cn(
                      "text-sm transition-colors duration-300",
                      i <= currentStep ? "text-foreground font-medium" : "text-muted-foreground"
                    )}
                  >
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Full-screen modal with iframe */}
      {result && (
        <DesignModal
          result={result}
          cliente={cliente}
          onClose={reset}
          onSave={saveAsContent}
          saving={saving}
        />
      )}
    </div>
  );
}
