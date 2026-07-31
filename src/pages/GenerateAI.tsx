import { useState, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Sparkles, Loader2, UtensilsCrossed, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/feedback/states";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import type { Proposal, GenerateResponse } from "@/components/generate-ai/types";
import { CANVAS_SIZES } from "@/components/generate-ai/types";
import { enforceTvProposal } from "@/lib/tvLegibility";
import { normalizeProposalVisuals, validarPropuesta, logViolations } from "@/lib/proposalValidator";
import { enforceArchetype } from "@/lib/designArchetypes";
import type { ArchetypeId } from "@/lib/designArchetypes";
import { preferredArchetypeOrder, recordArchetypePick } from "@/lib/archetypePrefs";
import ProposalSelector from "@/components/generate-ai/ProposalSelector";
import GenerationSkeletons, { type GenerationStage } from "@/components/generate-ai/GenerationSkeletons";
import FabricEditorModal from "@/components/generate-ai/FabricEditorModal";
import { NAV } from "@/config/lexicon";

const TIPOS = ["Digital Signage", "Menú", "Bienvenida", "Promoción", "Evento"] as const;

const MENU_LIMIT = 7; // Legibilidad en TV: máximo 7 platos por pieza


type MenuItem = {
  name: string;
  description: string | null;
  price: number | null;
  currency: string;
  category: string;
  sort_order: number;
};

/** Real menu of the active business — never generate filler dishes when this exists. */
function useMenuData() {
  return useQuery({
    queryKey: ["generate-ai", "menu-data"],
    queryFn: async () => {
      const { data: businessId } = await supabase.rpc("get_user_business_id");
      if (!businessId) return { items: [] as MenuItem[], total: 0, brandKit: null, businessName: "" };

      const [{ data: items, count }, { data: brand }, { data: negocio }] = await Promise.all([
        supabase
          .from("content_items")
          .select("name, description, price, currency, category, sort_order", { count: "exact" })
          .eq("business_id", businessId)
          .eq("is_active", true)
          .order("category", { ascending: true })
          .order("sort_order", { ascending: true })
          .limit(MENU_LIMIT),
        supabase
          .from("brand_kits")
          .select("primary_color, secondary_color, accent_color, font_family, logo_url")
          .eq("business_id", businessId)
          .maybeSingle(),
        supabase.from("businesses").select("name").eq("id", businessId).maybeSingle(),
      ]);

      return {
        items: (items ?? []) as MenuItem[],
        total: count ?? (items?.length ?? 0),
        brandKit: brand ?? null,
        businessName: negocio?.name ?? "",
      };
    },
  });
}

export default function GenerateAI() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [prompt, setPrompt] = useState("");
  const [tipo, setTipo] = useState<string>("Digital Signage");
  const [formato, setFormato] = useState("16:9");
  const [estilo, setEstilo] = useState("Moderno");
  const [cliente, setCliente] = useState("");

  const [stage, setStage] = useState<GenerationStage | null>(null);
  const [propuestas, setPropuestas] = useState<Proposal[] | null>(null);
  const [fallidos, setFallidos] = useState<ArchetypeId[]>([]);
  const [retryTarget, setRetryTarget] = useState<ArchetypeId | null>(null);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [saving, setSaving] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const loading = stage !== null;

  const { data: menuData } = useMenuData();
  const isMenu = tipo === "Menú";
  const menuItems = menuData?.items ?? [];
  const menuTotal = menuData?.total ?? 0;
  const menuVacio = isMenu && menuTotal === 0;
  const menuRecortado = isMenu && menuTotal > MENU_LIMIT;

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setPropuestas(null);
    setFallidos([]);
    setRetryTarget(null);
    setSelectedProposal(null);
    setStage(null);
    setPrompt("");
    setCliente("");
  }, []);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStage(null);
    setRetryTarget(null);
    toast({ title: "Generación cancelada" });
  }, [toast]);

  /**
   * Generates proposals. When `targets` is given we only ask for those
   * archetypes (retry of a failed slot) and merge the result with what we
   * already have, so a partial failure never throws away good proposals.
   */
  const generate = async (targets?: ArchetypeId[]) => {
    if (!prompt.trim()) {
      toast({ title: "Escribe una descripción", variant: "destructive" });
      return;
    }
    if (menuVacio) {
      toast({ title: "Carga tu menú primero", variant: "destructive" });
      return;
    }

    const esReintento = !!targets?.length;
    const orden = targets ?? preferredArchetypeOrder();

    if (!esReintento) {
      setPropuestas(null);
      setFallidos([]);
      setSelectedProposal(null);
    }
    setRetryTarget(esReintento ? orden[0] : null);

    const controller = new AbortController();
    abortRef.current = controller;
    setStage("menu");

    try {
      setStage("generando");
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-design`,
        {
          method: "POST",
          signal: controller.signal,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            prompt,
            tipo,
            formato,
            estilo,
            cliente: cliente || menuData?.businessName || "",
            menu_items: menuItems,
            arquetipos: orden,
            brand_kit: menuData?.brandKit ?? null,
          }),
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Error al generar");
      }

      const data: GenerateResponse = await res.json();
      setStage("marca");

      // Validación obligatoria entre la respuesta del modelo y el render.
      const canvas = CANVAS_SIZES[formato] ?? CANVAS_SIZES["16:9"];
      const recibidas = (data.propuestas ?? []).filter((p) => !targets || !p.arquetipo || targets.includes(p.arquetipo));
      const legibles: Proposal[] = [];
      const rotos: ArchetypeId[] = [];

      recibidas.forEach((p) => {
        try {
          const base = p.arquetipo
            ? enforceArchetype(enforceTvProposal(p, canvas.h, canvas.w), p.arquetipo)
            : enforceTvProposal(p, canvas.h, canvas.w);
          const normalizada = normalizeProposalVisuals(base as any, {
            primary: menuData?.brandKit?.primary_color ?? null,
            accent: menuData?.brandKit?.accent_color ?? null,
            secondary: menuData?.brandKit?.secondary_color ?? null,
            logo_url: menuData?.brandKit?.logo_url ?? null,
          }) as Proposal;

          const { ok, violaciones } = validarPropuesta(normalizada as any, canvas.w, canvas.h);
          logViolations(1, normalizada.id, violaciones);
          if (ok) {
            legibles.push(normalizada);
          } else if (normalizada.arquetipo) {
            rotos.push(normalizada.arquetipo);
          }
        } catch (err) {
          console.warn("Propuesta descartada por error de post-proceso", p.arquetipo, err);
          if (p.arquetipo) rotos.push(p.arquetipo);
        }
      });

      // Arquetipos pedidos que no llegaron o no pasaron el validador.
      const entregados = new Set(legibles.map((p) => p.arquetipo).filter(Boolean) as ArchetypeId[]);
      const faltantes = orden.filter((a) => !entregados.has(a)).concat(rotos.filter((a) => !entregados.has(a)));

      if (esReintento) {
        setPropuestas((prev) => [...(prev ?? []), ...legibles]);
        setFallidos((prev) => prev.filter((a) => !entregados.has(a)).concat(faltantes.filter((a) => !prev.includes(a))));
      } else {
        setPropuestas(legibles);
        setFallidos([...new Set(faltantes)]);
      }

      if (legibles.length === 0) {
        toast({ title: "No pudimos generar propuestas", description: "Intenta de nuevo en unos segundos.", variant: "destructive" });
      }
    } catch (e: any) {
      if (e?.name === "AbortError") return;
      if (esReintento) {
        toast({ title: "No pudimos regenerar esa propuesta", description: e.message, variant: "destructive" });
      } else {
        toast({ title: "Error", description: e.message, variant: "destructive" });
      }
    } finally {
      abortRef.current = null;
      setStage(null);
      setRetryTarget(null);
    }
  };


  const [subiendoLogo, setSubiendoLogo] = useState(false);

  /** Sube el logo del negocio y lo guarda en el brand kit para futuras piezas. */
  const subirLogo = useCallback(async (file: File) => {
    setSubiendoLogo(true);
    try {
      const { data: bid } = await supabase.rpc("get_user_business_id");
      if (!bid) throw new Error("No business");
      const path = `brand/${bid}/logo-${Date.now()}-${file.name.replace(/[^\w.-]/g, "_")}`;
      const { error: upErr } = await supabase.storage.from("media").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("media").getPublicUrl(path);
      const { error } = await supabase
        .from("brand_kits")
        .upsert({ business_id: bid, logo_url: urlData.publicUrl }, { onConflict: "business_id" });
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ["generate-ai", "menu-data"] });
      toast({ title: "Logo cargado", description: "Lo usaremos en la franja de cierre de tus piezas." });
    } catch (e: any) {
      toast({ title: "No pudimos subir el logo", description: e.message, variant: "destructive" });
    } finally {
      setSubiendoLogo(false);
    }
  }, [queryClient, toast]);

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
        <h1 className="font-display text-2xl font-bold tracking-tight">{NAV.generarIa.pageTitle}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{NAV.generarIa.pageSubtitle}</p>
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

            {menuVacio && (
              <EmptyState
                icon={<UtensilsCrossed className="h-9 w-9" />}
                title="Tu menú aún no tiene platos"
                description="Para no generar platos inventados, primero carga tu menú real con nombres, descripciones y precios."
                action={
                  <Button asChild className="gradient-primary glow-primary-sm">
                    <Link to="/dashboard/contenido">Cargar mi menú</Link>
                  </Button>
                }
                className="py-10"
              />
            )}

            {menuRecortado && (
              <div className="flex items-start gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                <p className="text-muted-foreground">
                  Se muestran {MENU_LIMIT} de {menuTotal} platos. Crea varias piezas o usa una lista para rotarlos.
                </p>
              </div>
            )}

            <Button
              onClick={() => generate()}
              disabled={loading || menuVacio}
              className="gradient-primary glow-primary-sm w-full sm:w-auto"
              size="lg"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Generar diseño
            </Button>

          </CardContent>
        </Card>
      )}

      {/* Loading: three placeholders shaped like the pieces that are coming */}
      {loading && !retryTarget && !selectedProposal && (
        <GenerationSkeletons stage={stage!} formato={formato} onCancel={cancel} />
      )}

      {/* Proposal selector */}
      {propuestas && !selectedProposal && (
        <ProposalSelector
          propuestas={propuestas}
          formato={formato}
          onSelect={(p) => {
            recordArchetypePick(p.arquetipo);
            setSelectedProposal(p);
          }}
          onRegenerate={() => generate()}
          loading={loading}
          fallidos={fallidos}
          retryTarget={retryTarget}
          onRetryArchetype={(a) => generate([a])}
          sinLogo={!menuData?.brandKit?.logo_url}
          subiendoLogo={subiendoLogo}
          onSubirLogo={subirLogo}
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