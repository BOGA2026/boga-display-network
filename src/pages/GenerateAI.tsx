import { useState, useCallback } from "react";
import { Sparkles, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import type { Proposal, GenerateResponse } from "@/components/generate-ai/types";
import ProposalSelector from "@/components/generate-ai/ProposalSelector";
import FabricEditorModal from "@/components/generate-ai/FabricEditorModal";

const TIPOS = ["Digital Signage", "Menú", "Bienvenida", "Promoción", "Evento"] as const;

const STEPS = [
  "Analizando descripción",
  "Definiendo estructura visual",
  "Generando 3 propuestas",
  "Propuestas listas",
];

export default function GenerateAI() {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState("");
  const [tipo, setTipo] = useState<string>("Digital Signage");
  const [formato, setFormato] = useState("16:9");
  const [estilo, setEstilo] = useState("Moderno");
  const [cliente, setCliente] = useState("");

  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [propuestas, setPropuestas] = useState<Proposal[] | null>(null);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [saving, setSaving] = useState(false);

  const reset = useCallback(() => {
    setPropuestas(null);
    setSelectedProposal(null);
    setCurrentStep(-1);
    setPrompt("");
    setCliente("");
  }, []);

  const generate = async () => {
    if (!prompt.trim()) {
      toast({ title: "Escribe una descripción", variant: "destructive" });
      return;
    }

    setPropuestas(null);
    setSelectedProposal(null);
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

      const data: GenerateResponse = await res.json();
      setCurrentStep(3);
      setTimeout(() => setPropuestas(data.propuestas), 600);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const saveDesign = useCallback(async (dataUrl: string) => {
    setSaving(true);
    try {
      const { data: bid } = await supabase.rpc("get_user_business_id");
      if (!bid) throw new Error("No business");

      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const fileName = `ai-designs/${Date.now()}.png`;

      const { error: uploadErr } = await supabase.storage
        .from("media")
        .upload(fileName, blob, { contentType: "image/png" });
      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage.from("media").getPublicUrl(fileName);

      const { error } = await supabase.from("content").insert({
        business_id: bid,
        name: selectedProposal?.texto_principal ?? "Diseño IA",
        type: "image",
        file_url: urlData.publicUrl,
        created_by: (await supabase.auth.getUser()).data.user?.id ?? null,
      });

      if (error) throw error;
      toast({ title: "Guardado en Contenido" });
      reset();
    } catch (e: any) {
      toast({ title: "Error al guardar", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }, [selectedProposal, toast, reset]);

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">
          Generar diseño con IA
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Describe lo que necesitas y la IA genera 3 propuestas editables
        </p>
      </div>

      {/* Form — shown when no proposals yet */}
      {!propuestas && !selectedProposal && (
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
                  <SelectTrigger className="bg-background/50 border-sidebar-border"><SelectValue /></SelectTrigger>
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
                  <SelectTrigger className="bg-background/50 border-sidebar-border"><SelectValue /></SelectTrigger>
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

            <Button onClick={generate} disabled={loading} className="gradient-primary glow-primary-sm w-full sm:w-auto" size="lg">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Generar diseño
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stepper */}
      {currentStep >= 0 && !propuestas && !selectedProposal && (
        <Card className="border-sidebar-border bg-sidebar">
          <CardContent className="pt-6">
            <div className="space-y-4">
              {STEPS.map((label, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all duration-500",
                    i < currentStep ? "gradient-primary text-primary-foreground"
                      : i === currentStep ? "gradient-primary text-primary-foreground animate-pulse"
                      : "bg-muted text-muted-foreground"
                  )}>
                    {i < currentStep ? <Check className="h-4 w-4" /> : i + 1}
                  </div>
                  <span className={cn("text-sm transition-colors duration-300", i <= currentStep ? "text-foreground font-medium" : "text-muted-foreground")}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Proposal selector */}
      {propuestas && !selectedProposal && (
        <ProposalSelector
          propuestas={propuestas}
          formato={formato}
          onSelect={(p) => setSelectedProposal(p)}
          onRegenerate={generate}
          loading={loading}
        />
      )}

      {/* Fabric editor */}
      {selectedProposal && (
        <FabricEditorModal
          proposal={selectedProposal}
          formato={formato}
          cliente={cliente}
          onClose={reset}
          onSave={saveDesign}
          saving={saving}
        />
      )}
    </div>
  );
}