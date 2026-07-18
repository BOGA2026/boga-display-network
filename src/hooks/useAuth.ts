import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";

export function useAuth(redirectTo = "/login") {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const flushPendingConsent = async (userId: string) => {
      try {
        const raw = sessionStorage.getItem("visualia_pending_consent");
        if (!raw) return;
        const parsed = JSON.parse(raw) as {
          privacy: string;
          terms: string;
          context?: string;
        };
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
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setLoading(false);
        if (!session) navigate(redirectTo, { replace: true });
        else if (session.user?.id) void flushPendingConsent(session.user.id);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      if (!session) navigate(redirectTo, { replace: true });
      else if (session.user?.id) void flushPendingConsent(session.user.id);
    });

    return () => subscription.unsubscribe();
  }, [navigate, redirectTo]);

  return { session, loading };
}

export async function signOut() {
  await supabase.auth.signOut();
}
