import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, ShieldCheck, AlertTriangle } from "lucide-react";
import PremiumBackground from "@/components/layout/PremiumBackground";
import logoVisualia from "@/assets/logo-visualia.webp";

// Typed shim for the beta supabase.auth.oauth namespace.
type AuthOAuth = {
  getAuthorizationDetails: (id: string) => Promise<{ data: any; error: any }>;
  approveAuthorization: (id: string) => Promise<{ data: any; error: any }>;
  denyAuthorization: (id: string) => Promise<{ data: any; error: any }>;
};
const authOAuth = (supabase.auth as unknown as { oauth: AuthOAuth }).oauth;

export default function OAuthConsent() {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [authorizationExpired, setAuthorizationExpired] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) return setError("Falta authorization_id");
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        // Preserve the FULL consent URL so auth returns the user here.
        const next = window.location.pathname + window.location.search;
        window.location.href = "/login?next=" + encodeURIComponent(next);
        return;
      }
      if (!authOAuth?.getAuthorizationDetails) {
        setError(
          "OAuth 2.1 no está habilitado en este proyecto de Supabase. Un admin debe activarlo en el panel de Supabase."
        );
        return;
      }
      const { data, error } = await authOAuth.getAuthorizationDetails(authorizationId);
      if (!active) return;
      if (error) {
        const message = error.message?.toLowerCase() ?? "";
        if (message.includes("authorization not found")) {
          setAuthorizationExpired(true);
          setError(
            "Esta solicitud de conexión venció. Volvé a Claude, eliminá la conexión pendiente e intentá agregar Visualia otra vez. La nueva solicitud debe aprobarse dentro de 10 minutos."
          );
          return;
        }
        return setError(error.message);
      }
      const immediate = data?.redirect_url ?? data?.redirect_to;
      if (immediate && !data?.client) {
        window.location.href = immediate;
        return;
      }
      setDetails(data);
    })();
    return () => {
      active = false;
    };
  }, [authorizationId]);

  async function decide(approve: boolean) {
    setBusy(true);
    const { data, error } = approve
      ? await authOAuth.approveAuthorization(authorizationId)
      : await authOAuth.denyAuthorization(authorizationId);
    if (error) {
      setBusy(false);
      return setError(error.message);
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      return setError("El servidor de autorización no devolvió una URL de redirección.");
    }
    window.location.href = target;
  }

  return (
    <PremiumBackground className="flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="mb-6 flex justify-center">
          <img src={logoVisualia} alt="Visualia" className="h-16 w-auto" />
        </div>

        <Card className="surface-elevated border-border/30 backdrop-blur">
          {error ? (
            <>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  <CardTitle className="text-xl">No se pudo completar</CardTitle>
                </div>
                <CardDescription>{error}</CardDescription>
              </CardHeader>
              {authorizationExpired && (
                <CardContent>
                  <Button asChild className="w-full">
                    <a href="https://claude.ai/settings/connectors" target="_blank" rel="noreferrer">
                      Volver a conexiones de Claude
                    </a>
                  </Button>
                </CardContent>
              )}
            </>
          ) : !details ? (
            <CardContent className="flex flex-col items-center gap-3 py-10">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Cargando solicitud…</p>
            </CardContent>
          ) : (
            <>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  <CardTitle className="text-xl">
                    Conectar {details.client?.name ?? "aplicación"} a tu cuenta
                  </CardTitle>
                </div>
                <CardDescription>
                  {details.client?.name ?? "Esta aplicación"} podrá usar Visualia en tu nombre
                  con los permisos que autorices. Podrás revocar el acceso en cualquier momento.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <Button
                  disabled={busy}
                  className="w-full gradient-primary hover:gradient-primary-hover glow-primary-sm text-primary-foreground border-0"
                  onClick={() => decide(true)}
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Aprobar"}
                </Button>
                <Button
                  disabled={busy}
                  variant="outline"
                  className="w-full"
                  onClick={() => decide(false)}
                >
                  Rechazar
                </Button>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </PremiumBackground>
  );
}
