import { useState, useEffect, useCallback } from "react";
import logoVisualia from "@/assets/logo-visualia.png";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Eye, EyeOff, Mail, KeyRound, ArrowLeft, Loader2 } from "lucide-react";

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

type AuthMethod = "password" | "otp";
type OtpStep = "email" | "verify";

const RESEND_COOLDOWN = 30;

const Login = () => {
  const [method, setMethod] = useState<AuthMethod>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpStep, setOtpStep] = useState<OtpStep>("email");
  const [otpCode, setOtpCode] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  // ─── Password login ───
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;
      navigate("/dashboard");
    } catch (err: any) {
      toast({
        title: "Error al iniciar sesión",
        description: err.message || "Credenciales incorrectas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // ─── OTP request ───
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { shouldCreateUser: false },
      });
      if (error) throw error;
      setOtpStep("verify");
      setCooldown(RESEND_COOLDOWN);
      toast({
        title: "Código enviado",
        description: "Revisa tu bandeja de entrada. El código expira en 10 minutos.",
      });
    } catch (err: any) {
      // Generic message to prevent email enumeration
      toast({
        title: "Solicitud procesada",
        description:
          "Si el correo está registrado, recibirás un código de acceso.",
      });
      setOtpStep("verify");
      setCooldown(RESEND_COOLDOWN);
    } finally {
      setLoading(false);
    }
  };

  // ─── OTP verify ───
  const handleVerifyOtp = useCallback(async (code: string) => {
    if (code.length !== 6) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: code,
        type: "email",
      });
      if (error) throw error;
      navigate("/dashboard");
    } catch (err: any) {
      toast({
        title: "Código inválido",
        description: "El código es incorrecto o ha expirado. Inténtalo de nuevo.",
        variant: "destructive",
      });
      setOtpCode("");
    } finally {
      setLoading(false);
    }
  }, [email, navigate, toast]);

  // Auto-submit when 6 digits entered
  useEffect(() => {
    if (otpCode.length === 6) {
      handleVerifyOtp(otpCode);
    }
  }, [otpCode, handleVerifyOtp]);

  const handleResend = async () => {
    if (cooldown > 0) return;
    setLoading(true);
    try {
      await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { shouldCreateUser: false },
      });
      setCooldown(RESEND_COOLDOWN);
      toast({ title: "Código reenviado", description: "Revisa tu correo." });
    } catch {
      toast({
        title: "Error",
        description: "No se pudo reenviar. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetOtp = () => {
    setOtpStep("email");
    setOtpCode("");
    setCooldown(0);
  };

  // ─── Google login ───
  const handleGoogleLogin = async () => {
    setLoading(true);
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

  // ─── Render helpers ───
  const renderMethodSwitcher = () => (
    <div className="grid grid-cols-2 gap-2 rounded-lg border border-border/40 bg-muted/30 p-1">
      <button
        type="button"
        onClick={() => { setMethod("password"); resetOtp(); }}
        className={`flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all ${
          method === "password"
            ? "bg-primary/20 text-primary shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <KeyRound className="h-4 w-4" />
        Contraseña
      </button>
      <button
        type="button"
        onClick={() => { setMethod("otp"); resetOtp(); }}
        className={`flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all ${
          method === "otp"
            ? "bg-primary/20 text-primary shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <Mail className="h-4 w-4" />
        Correo
      </button>
    </div>
  );

  const renderPasswordForm = () => (
    <form onSubmit={handlePasswordLogin}>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Correo electrónico</Label>
          <Input
            id="email"
            type="email"
            placeholder="tu@negocio.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Contraseña</Label>
            <Link to="/recuperar" className="text-xs text-primary hover:underline">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-4">
        <Button
          type="submit"
          className="w-full gradient-primary hover:gradient-primary-hover glow-primary-sm text-primary-foreground border-0"
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Ingresando...</span>
          ) : "Ingresar"}
        </Button>
      </CardFooter>
    </form>
  );

  const renderOtpEmailForm = () => (
    <form onSubmit={handleRequestOtp}>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="otp-email">Correo electrónico</Label>
          <Input
            id="otp-email"
            type="email"
            placeholder="tu@negocio.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Te enviaremos un código de 6 dígitos para ingresar sin contraseña.
        </p>
      </CardContent>
      <CardFooter className="flex flex-col gap-4">
        <Button
          type="submit"
          className="w-full gradient-primary hover:gradient-primary-hover glow-primary-sm text-primary-foreground border-0"
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Enviando...</span>
          ) : "Enviar código"}
        </Button>
      </CardFooter>
    </form>
  );

  const renderOtpVerifyForm = () => (
    <div>
      <CardContent className="space-y-6">
        <div className="space-y-2 text-center">
          <p className="text-sm text-muted-foreground">
            Enviamos un código de verificación a
          </p>
          <p className="text-sm font-medium text-foreground">{email}</p>
        </div>

        <div className="flex justify-center">
          <InputOTP
            maxLength={6}
            value={otpCode}
            onChange={setOtpCode}
            disabled={loading}
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>

        {loading && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Verificando...
          </div>
        )}

        <div className="flex items-center justify-between text-sm">
          <button
            type="button"
            onClick={resetOtp}
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3 w-3" />
            Cambiar correo
          </button>
          <button
            type="button"
            onClick={handleResend}
            disabled={cooldown > 0 || loading}
            className={`transition-colors ${
              cooldown > 0
                ? "text-muted-foreground/50 cursor-not-allowed"
                : "text-primary hover:underline"
            }`}
          >
            {cooldown > 0
              ? `Reenviar en ${cooldown}s`
              : "Reenviar código"}
          </button>
        </div>
      </CardContent>
    </div>
  );

  return (
    <PremiumBackground className="flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        {/* Branding */}
        <div className="mb-8 flex flex-col items-center gap-2">
          <div className="relative">
            <div
              className="absolute inset-0 scale-150 rounded-full opacity-30 blur-2xl"
              style={{
                background:
                  "radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)",
              }}
            />
            <img src={logoVisualia} alt="Visualia" className="relative h-20 w-auto" />
          </div>
        </div>

        <Card className="surface-elevated border-border/30 backdrop-blur">
          <CardHeader className="space-y-3">
            <CardTitle className="text-xl">Iniciar sesión</CardTitle>
            <CardDescription>
              {method === "password"
                ? "Ingresa tus credenciales para acceder al panel"
                : otpStep === "email"
                ? "Ingresa tu correo para recibir un código de acceso"
                : "Ingresa el código que enviamos a tu correo"}
            </CardDescription>
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
            {renderMethodSwitcher()}
          </CardHeader>

          {method === "password" && renderPasswordForm()}
          {method === "otp" && otpStep === "email" && renderOtpEmailForm()}
          {method === "otp" && otpStep === "verify" && renderOtpVerifyForm()}

          <div className="px-6 pb-6">
            <p className="text-center text-sm text-muted-foreground">
              ¿No tienes una cuenta?{" "}
              <Link to="/registro" className="text-primary hover:underline">
                Registra tu negocio
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </PremiumBackground>
  );
};

export default Login;
