/**
 * AuthContext — ÚNICA fuente de verdad de la sesión y del usuario.
 *
 * Regla del proyecto: `supabase.auth.getUser()` hace un viaje de red a
 * /auth/v1/user para revalidar el token contra el servidor de Auth. Este
 * archivo es el ÚNICO lugar autorizado a llamarlo, y lo hace una sola vez al
 * arrancar la app. Cualquier otro punto del código debe leer el usuario de
 * este contexto (`useAuthContext`) o, en código imperativo, usar
 * `supabase.auth.getSession()`, que lee de memoria y no cuesta nada.
 */
import * as React from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

type AuthState = {
  session: Session | null;
  user: User | null;
  userId: string | null;
  loading: boolean;
};

const AuthContext = React.createContext<AuthState | null>(null);

async function flushPendingConsent(userId: string) {
  try {
    const raw = sessionStorage.getItem("visualia_pending_consent");
    if (!raw) return;
    const parsed = JSON.parse(raw) as { privacy: string; terms: string; context?: string };
    await supabase.from("legal_consents").insert({
      user_id: userId,
      policy_version: parsed.privacy,
      terms_version: parsed.terms,
      user_agent: navigator.userAgent,
      context: parsed.context ?? "registration",
    });
    sessionStorage.removeItem("visualia_pending_consent");
  } catch (err) {
    console.warn("No se pudo registrar el consentimiento pendiente:", err);
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = React.useState<Session | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, next) => {
      if (!mounted) return;
      // Cualquier cambio de identidad tira el caché del usuario anterior.
      if (event === "SIGNED_OUT" || event === "SIGNED_IN") queryClient.clear();
      setSession(next);
      setLoading(false);
      if (next?.user?.id) void flushPendingConsent(next.user.id);
    });

    void (async () => {
      // 1. Lectura local, instantánea: pinta la UI sin esperar red.
      const { data: { session: local } } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(local);
      setLoading(false);
      if (!local) return;

      // 2. Única validación del token contra el servidor en toda la app.
      const { data, error } = await supabase.auth.getUser();
      if (!mounted) return;
      if (error || !data.user) {
        await supabase.auth.signOut();
        return;
      }
      void flushPendingConsent(data.user.id);
    })();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = React.useMemo<AuthState>(
    () => ({
      session,
      user: session?.user ?? null,
      userId: session?.user?.id ?? null,
      loading,
    }),
    [session, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthState {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext debe usarse dentro de <AuthProvider>");
  return ctx;
}
