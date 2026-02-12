import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Monitor, ArrowLeft } from "lucide-react";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // TODO: Supabase password reset
    setTimeout(() => {
      setLoading(false);
      setSent(true);
    }, 1000);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <Monitor className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="text-center">
            <h1 className="font-display text-2xl font-bold tracking-tight text-gradient-primary">Visualia</h1>
            <p className="text-sm text-muted-foreground">Pantallas que venden</p>
          </div>
        </div>

        <Card className="border-border/50 bg-card/80 backdrop-blur">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Recuperar contraseña</CardTitle>
            <CardDescription>
              {sent
                ? "Revisa tu bandeja de entrada para continuar"
                : "Te enviaremos un enlace para restablecer tu contraseña"}
            </CardDescription>
          </CardHeader>
          {!sent ? (
            <form onSubmit={handleSubmit}>
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
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Enviando..." : "Enviar enlace"}
                </Button>
                <Link to="/login" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="h-3 w-3" /> Volver al inicio de sesión
                </Link>
              </CardFooter>
            </form>
          ) : (
            <CardContent>
              <div className="rounded-lg bg-primary/10 p-4 text-center">
                <p className="text-sm text-foreground">
                  Hemos enviado un enlace de recuperación a <strong>{email}</strong>
                </p>
              </div>
              <div className="mt-4 text-center">
                <Link to="/login" className="flex items-center justify-center gap-1 text-sm text-primary hover:underline">
                  <ArrowLeft className="h-3 w-3" /> Volver al inicio de sesión
                </Link>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;
