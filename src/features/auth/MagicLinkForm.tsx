import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

/**
 * Passwordless sign-in using Supabase magic links.
 * Uses shouldCreateUser:false to avoid silent account creation from this form.
 */
export function MagicLinkForm() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(trimmed)) {
      toast.error("Ingresa un correo válido");
      return;
    }
    setSending(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });
    setSending(false);
    if (error) {
      toast.error("No pudimos enviar el enlace. Revisa el correo o crea una cuenta.");
      return;
    }
    setSent(true);
  };

  if (sent) {
    return (
      <div className="rounded-2xl border border-border/60 bg-card/40 p-5 text-sm">
        <p className="font-medium">Revisa tu correo</p>
        <p className="mt-1 text-muted-foreground">
          Enviamos un enlace de acceso a <span className="text-foreground">{email}</span>. El
          enlace expira en 10 minutos.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="magic-email">Correo electrónico</Label>
        <Input
          id="magic-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@restaurante.com"
          required
        />
      </div>
      <Button type="submit" className="w-full" disabled={sending}>
        {sending ? "Enviando…" : "Enviarme un enlace mágico"}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Te enviamos un enlace seguro; no necesitas recordar contraseña.
      </p>
    </form>
  );
}
