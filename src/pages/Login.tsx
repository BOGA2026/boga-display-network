import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import bogaLogo from "@/assets/logo-boga.png";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
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

  return (
    <div className="flex min-h-screen items-center justify-center p-4" style={{ background: "linear-gradient(180deg, #0E0B16 0%, #12101A 100%)" }}>
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo + branding */}
        <div className="mb-8 flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 scale-150 rounded-full opacity-30 blur-2xl" style={{ background: "radial-gradient(circle, #8A00FF 0%, transparent 70%)" }} />
            <img src={bogaLogo} alt="BOGA" className="relative h-32 w-32 object-contain" />
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Signage Network</p>
            <p className="mt-1 text-xs text-muted-foreground/60">Infraestructura visual inteligente</p>
          </div>
        </div>

        <Card className="surface-elevated border-border/30 backdrop-blur">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Iniciar sesión</CardTitle>
            <CardDescription>Ingresa tus credenciales para acceder al panel</CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input id="email" type="email" placeholder="tu@negocio.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Contraseña</Label>
                  <Link to="/recuperar" className="text-xs text-primary hover:underline">¿Olvidaste tu contraseña?</Link>
                </div>
                <div className="relative">
                  <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full gradient-primary hover:gradient-primary-hover glow-primary-sm text-primary-foreground border-0" disabled={loading}>
                {loading ? "Ingresando..." : "Ingresar"}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                ¿No tienes una cuenta?{" "}
                <Link to="/registro" className="text-primary hover:underline">Registra tu negocio</Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Login;
