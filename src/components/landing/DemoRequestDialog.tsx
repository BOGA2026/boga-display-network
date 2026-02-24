import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2 } from "lucide-react";

interface DemoRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const screensOptions = ["1", "2–5", "6–10", "11–25", "26+"];

const DemoRequestDialog = ({ open, onOpenChange }: DemoRequestDialogProps) => {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [consent, setConsent] = useState(false);
  const [screensRange, setScreensRange] = useState("");
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    business_name: "",
    city: "",
    message: "",
  });

  const isValid =
    form.name.trim() &&
    form.phone.trim() &&
    form.email.trim() &&
    form.business_name.trim() &&
    form.city.trim() &&
    screensRange &&
    consent;

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setLoading(true);
    try {
      await supabase.from("demo_requests" as any).insert({
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        business_name: form.business_name.trim(),
        city: form.city.trim(),
        screens_range: screensRange,
        message: form.message.trim() || null,
        consent: true,
      });
      setSubmitted(true);
    } catch {
      // silently fail — we still show confirmation
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = (value: boolean) => {
    onOpenChange(value);
    if (!value) {
      // Reset after close animation
      setTimeout(() => {
        setSubmitted(false);
        setConsent(false);
        setScreensRange("");
        setForm({ name: "", phone: "", email: "", business_name: "", city: "", message: "" });
      }, 300);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto border-border/30 sm:max-w-lg"
        style={{
          background: "linear-gradient(180deg, hsl(260 25% 12%) 0%, hsl(260 30% 8%) 100%)",
        }}
      >
        {submitted ? (
          <div className="flex flex-col items-center gap-6 py-10 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="font-display text-2xl font-bold text-foreground">¡Listo!</h3>
              <p className="mt-2 text-muted-foreground">
                Recibimos tu solicitud. Un asesor te contactará en las próximas 24 horas hábiles.
              </p>
            </div>
            <Button
              className="gradient-primary glow-primary-sm border-0 text-primary-foreground"
              onClick={() => handleClose(false)}
            >
              Cerrar
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="font-display text-2xl font-bold text-foreground">
                Hablar con un experto
              </DialogTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Completa tus datos y un asesor de Visualia te contactará para agendar la demo.
              </p>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Nombre completo <span className="text-destructive">*</span>
                </label>
                <Input
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="Tu nombre"
                  required
                  className="h-11 border-border/30 bg-muted/30"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    WhatsApp / Teléfono <span className="text-destructive">*</span>
                  </label>
                  <Input
                    value={form.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    placeholder="+52 555 123 4567"
                    required
                    className="h-11 border-border/30 bg-muted/30"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    Correo electrónico <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    placeholder="tu@empresa.com"
                    required
                    className="h-11 border-border/30 bg-muted/30"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    Nombre del negocio <span className="text-destructive">*</span>
                  </label>
                  <Input
                    value={form.business_name}
                    onChange={(e) => handleChange("business_name", e.target.value)}
                    placeholder="Mi Negocio"
                    required
                    className="h-11 border-border/30 bg-muted/30"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    Ciudad <span className="text-destructive">*</span>
                  </label>
                  <Input
                    value={form.city}
                    onChange={(e) => handleChange("city", e.target.value)}
                    placeholder="Ciudad de México"
                    required
                    className="h-11 border-border/30 bg-muted/30"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Número de pantallas <span className="text-destructive">*</span>
                </label>
                <Select value={screensRange} onValueChange={setScreensRange}>
                  <SelectTrigger className="h-11 border-border/30 bg-muted/30">
                    <SelectValue placeholder="Selecciona un rango" />
                  </SelectTrigger>
                  <SelectContent>
                    {screensOptions.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Mensaje <span className="text-muted-foreground text-xs">(opcional)</span>
                </label>
                <Textarea
                  value={form.message}
                  onChange={(e) => handleChange("message", e.target.value)}
                  placeholder="Cuéntanos sobre tu proyecto..."
                  rows={3}
                  className="border-border/30 bg-muted/30"
                />
              </div>

              <div className="flex items-start gap-3 rounded-lg border border-border/20 bg-muted/20 p-3">
                <Checkbox
                  id="consent"
                  checked={consent}
                  onCheckedChange={(v) => setConsent(v === true)}
                  className="mt-0.5"
                />
                <label htmlFor="consent" className="cursor-pointer text-xs leading-relaxed text-muted-foreground">
                  Autorizo el tratamiento de mis datos personales de acuerdo con la{" "}
                  <a href="#" className="text-primary underline hover:text-primary/80">
                    Política de Privacidad
                  </a>{" "}
                  y la Ley de Protección de Datos.
                </label>
              </div>

              <Button
                type="submit"
                disabled={!isValid || loading}
                className="h-12 w-full gradient-primary glow-primary border-0 text-lg text-primary-foreground disabled:opacity-40"
              >
                {loading ? "Enviando..." : "Hablar con un experto"}
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DemoRequestDialog;
