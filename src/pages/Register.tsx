import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Monitor, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const SUPABASE_URL = "https://ovuhtroiuuqsiltqgqpp.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92dWh0cm9pdXVxc2lsdHFncXBwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MzQ2NjIsImV4cCI6MjA4NjQxMDY2Mn0.qjpz83tFpdxDa8YwbSdQLit4T_IiFV5H6GtEmH1TBNw";

const Register = () => {
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName.trim() || !email.trim() || !password.trim()) return;

    setLoading(true);
    try {
      // 1. Sign up (may or may not auto-confirm)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: { full_name: businessName.trim() },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("No se pudo crear el usuario");

      const userId = authData.user.id;

      // 2. Use edge function with service role to create business + membership
      const res = await fetch(`${SUPABASE_URL}/functions/v1/register-business`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_KEY,
        },
        body: JSON.stringify({ user_id: userId, business_name: businessName.trim() }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Error al crear negocio");
      }

      toast({ title: "Cuenta creada exitosamente" });

      // If session exists (email confirmation disabled), go to dashboard
      if (authData.session) {
        navigate("/dashboard");
      } else {
        toast({
          title: "Revisa tu correo",
          description: "Te enviamos un enlace de confirmación para activar tu cuenta.",
        });
        navigate("/login");
      }
    } catch (err: any) {
      console.error("Register error:", err);
      toast({
        title: "Error al crear cuenta",
        description: err.message || "Intenta de nuevo",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl gradient-primary glow-primary">
            <Monitor className="h-7 w-7 text-primary-foreground" />
          </div>
          <div className="text-center">
            <h1 className="font-display text-2xl font-bold tracking-tight text-gradient-primary">BOGA</h1>
            <p className="text-sm text-muted-foreground">Signage Network</p>
          </div>
        </div>

        <Card className="surface-elevated border-border/30 backdrop-blur">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Registra tu negocio</CardTitle>
            <CardDescription>Crea una cuenta para gestionar tus pantallas digitales</CardDescription>
          </CardHeader>
          <form onSubmit={handleRegister}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="business">Nombre del negocio</Label>
                <Input id="business" placeholder="Mi Restaurante" value={businessName} onChange={(e) => setBusinessName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input id="email" type="email" placeholder="tu@negocio.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Input id="password" type={showPassword ? "text" : "password"} placeholder="Mínimo 8 caracteres" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full gradient-primary hover:gradient-primary-hover glow-primary-sm text-primary-foreground border-0" disabled={loading}>
                {loading ? "Creando cuenta..." : "Crear cuenta"}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                ¿Ya tienes una cuenta?{" "}
                <Link to="/login" className="text-primary hover:underline">Inicia sesión</Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Register;
