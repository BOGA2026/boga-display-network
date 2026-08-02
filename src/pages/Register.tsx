import { useMemo, useState } from "react";
import { captureTvChoiceFromUrl } from "@/lib/attribution";

import logoVisualia from "@/assets/logo-visualia.webp";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Monitor, Eye, EyeOff } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { LEGAL_VERSIONS } from "@/lib/legalVersions";

const GoogleIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);
import { useToast } from "@/hooks/use-toast";
import PremiumBackground from "@/components/layout/PremiumBackground";


const Register = () => {
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedLegal, setAcceptedLegal] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // ?marca=samsung&dispositivo=si — la elección del verificador viaja con la
  // persona y se guarda antes de que el registro pueda perder la URL.
  const tvChoice = useMemo(() => captureTvChoiceFromUrl(), []);


  // ─── Google login ───
  const handleGoogleLogin = async () => {
    if (!acceptedLegal) {
      toast({
        title: "Aceptación requerida",
        description: "Debes aceptar la política de tratamiento de datos y los términos para continuar.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    // Persist intended consent so we can log it after OAuth returns.
    try {
      sessionStorage.setItem(
        "visualia_pending_consent",
        JSON.stringify({
          privacy: LEGAL_VERSIONS.privacy,
          terms: LEGAL_VERSIONS.terms,
          at: new Date().toISOString(),
          context: "registration_google",
        }),
      );
    } catch { /* ignore */ }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
    if (error) {
      toast({
        title: "Error al iniciar con Google",
        description: error.message,
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName.trim() || !email.trim() || !password.trim()) return;
    if (!acceptedLegal) {
      toast({
        title: "Aceptación requerida",
        description: "Debes aceptar la política de tratamiento de datos y los términos para crear la cuenta.",
        variant: "destructive",
      });
      return;
    }

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
      const { data: regData, error: regError } = await supabase.functions.invoke(
        "register-business",
        { body: { user_id: userId, business_name: businessName.trim() } },
      );

      if (regError || (regData && (regData as any).error)) {
        throw new Error((regError && regError.message) || (regData as any)?.error || "Error al crear negocio");
      }

      // 3. Persist consent audit trail (best-effort; do not block signup)
      if (authData.session) {
        try {
          await supabase.from("legal_consents").insert({
            user_id: userId,
            policy_version: LEGAL_VERSIONS.privacy,
            terms_version: LEGAL_VERSIONS.terms,
            user_agent: navigator.userAgent,
            context: "registration",
          });
        } catch (consentErr) {
          console.warn("No se pudo registrar el consentimiento:", consentErr);
        }
      } else {
        // Session not yet available (email confirmation on) — stash intent
        try {
          sessionStorage.setItem(
            "visualia_pending_consent",
            JSON.stringify({
              privacy: LEGAL_VERSIONS.privacy,
              terms: LEGAL_VERSIONS.terms,
              at: new Date().toISOString(),
              context: "registration",
            }),
          );
        } catch { /* ignore */ }
      }

      toast({ title: "Cuenta creada exitosamente" });

      // If session exists (email confirmation disabled), go to dashboard.
      // Quien ya respondió el verificador sigue directo a conectar su pantalla.
      if (authData.session) {
        navigate(tvChoice.tv_brand ? "/dashboard/pantallas" : "/dashboard");

      } else {
        toast({
          title: "Revisa tu correo",
          description: "Te enviamos un enlace de confirmación para activar tu cuenta.",
        });
        navigate("/login");
      }
    } catch (err: any) {
      if (import.meta.env.DEV) console.error("Register error:", err);
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
    <PremiumBackground className="flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        <h1 className="sr-only">Crear cuenta en Visualia</h1>
        <div className="mb-8 flex flex-col items-center gap-3">
          <img src={logoVisualia} alt="Visualia" width={240} height={64} decoding="async" className="h-16 w-auto" />
        </div>


        <Card className="surface-elevated border-border/30 backdrop-blur">
          <CardHeader className="space-y-3">
            <CardTitle className="text-xl">Registra tu negocio</CardTitle>
            <CardDescription>Crea una cuenta para gestionar tus pantallas digitales</CardDescription>
            <Button
              type="button"
              variant="outline"
              className="w-full bg-background/50 border-border/40 hover:bg-background/80 text-foreground"
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              <GoogleIcon />
              Continuar con Google
            </Button>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/40" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-card px-2 text-muted-foreground">o</span>
              </div>
            </div>
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
                  <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"} aria-pressed={showPassword} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded">
                    {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                  </button>

                </div>
              </div>
              <div className="flex items-start gap-3 pt-2">
                <Checkbox
                  id="accept-legal"
                  checked={acceptedLegal}
                  onCheckedChange={(v) => setAcceptedLegal(v === true)}
                  aria-required="true"
                  className="mt-0.5"
                />
                <Label htmlFor="accept-legal" className="text-sm font-normal leading-snug text-muted-foreground cursor-pointer">
                  Acepto la{" "}
                  <Link to="/privacidad" target="_blank" className="text-primary hover:underline">
                    política de tratamiento de datos
                  </Link>{" "}
                  y los{" "}
                  <Link to="/terminos" target="_blank" className="text-primary hover:underline">
                    términos y condiciones
                  </Link>
                  .
                </Label>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full gradient-primary hover:gradient-primary-hover glow-primary-sm text-primary-foreground border-0" disabled={loading || !acceptedLegal}>
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
    </PremiumBackground>
  );
};

export default Register;
