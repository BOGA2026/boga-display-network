import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";

type ServiceTier = "core" | "pro" | "studio" | "";
type StudioPlan = "studio_start" | "studio_pro" | "studio_elite" | "";

interface VisualiaStudioFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTier?: ServiceTier;
  selectedStudioPlan?: string;
}

const studioPlanLabels: Record<string, string> = {
  studio_start: "Studio Start",
  studio_pro: "Studio Pro",
  studio_elite: "Studio Elite",
};

const VisualiaStudioForm = ({
  open,
  onOpenChange,
  defaultTier = "studio",
  selectedStudioPlan = "",
}: VisualiaStudioFormProps) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [business, setBusiness] = useState("");
  const [tier, setTier] = useState<ServiceTier>(defaultTier);
  const [studioPlan, setStudioPlan] = useState<StudioPlan>(selectedStudioPlan as StudioPlan);
  const [hasPhotos, setHasPhotos] = useState("");
  const [needsMenu, setNeedsMenu] = useState("");
  const [itemCount, setItemCount] = useState("");

  useEffect(() => {
    if (selectedStudioPlan) {
      setStudioPlan(selectedStudioPlan as StudioPlan);
      setTier("studio");
    }
  }, [selectedStudioPlan, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("¡Solicitud enviada! Te contactaremos pronto.");
    onOpenChange(false);
    setName("");
    setEmail("");
    setBusiness("");
    setTier(defaultTier);
    setStudioPlan("");
    setHasPhotos("");
    setNeedsMenu("");
    setItemCount("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-md border-border/30"
        style={{
          background:
            "linear-gradient(180deg, hsl(260 30% 10%) 0%, hsl(260 25% 7%) 100%)",
        }}
      >
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            Solicitar presupuesto
            {studioPlan && studioPlanLabels[studioPlan] && (
              <span className="ml-2 text-gradient-primary">
                — {studioPlanLabels[studioPlan]}
              </span>
            )}
          </DialogTitle>
          <DialogDescription>
            Cuéntanos sobre tu proyecto y te contactaremos en menos de 24h.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-2 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="sf-name">Nombre</Label>
            <Input
              id="sf-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sf-email">Email</Label>
            <Input
              id="sf-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sf-business">Negocio</Label>
            <Input
              id="sf-business"
              required
              value={business}
              onChange={(e) => setBusiness(e.target.value)}
              placeholder="Nombre de tu negocio"
            />
          </div>

          <div className="space-y-1.5">
            <Label>¿Qué necesitas? *</Label>
            <Select
              value={tier}
              onValueChange={(v) => {
                setTier(v as ServiceTier);
                if (v !== "studio") setStudioPlan("");
              }}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="core">Solo software (Visualia Core)</SelectItem>
                <SelectItem value="pro">
                  Software + asesoría visual (Visualia Pro)
                </SelectItem>
                <SelectItem value="studio">
                  Software + producción premium (Visualia Studio)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Studio plan selector */}
          {tier === "studio" && (
            <div className="space-y-4 rounded-lg border border-primary/20 bg-primary/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                Detalles Studio
              </p>

              <div className="space-y-1.5">
                <Label>Plan Studio</Label>
                <Select value={studioPlan} onValueChange={(v) => setStudioPlan(v as StudioPlan)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un plan Studio" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="studio_start">Studio Start</SelectItem>
                    <SelectItem value="studio_pro">Studio Pro</SelectItem>
                    <SelectItem value="studio_elite">Studio Elite</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>¿Tienes fotos profesionales?</Label>
                <Select value={hasPhotos} onValueChange={setHasPhotos}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Sí</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>¿Necesitas diseño de menú digital?</Label>
                <Select value={needsMenu} onValueChange={setNeedsMenu}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Sí</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sf-items">¿Cuántos productos/ítems aprox.?</Label>
                <Input
                  id="sf-items"
                  type="number"
                  min={1}
                  value={itemCount}
                  onChange={(e) => setItemCount(e.target.value)}
                  placeholder="Ej. 30"
                />
              </div>
            </div>
          )}

          <Button
            type="submit"
            className="gradient-primary glow-primary w-full border-0 text-primary-foreground"
          >
            Enviar solicitud
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default VisualiaStudioForm;
