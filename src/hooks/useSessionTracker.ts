import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

/** Registra una fila en user_sessions al iniciar y hace ping cada 5 minutos. */
export function useSessionTracker(userId: string | undefined) {
  const sessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    (async () => {
      const { data, error } = await supabase
        .from("user_sessions")
        .insert({ user_id: userId, user_agent: navigator.userAgent })
        .select("id")
        .single();
      if (!error && data && !cancelled) sessionIdRef.current = data.id;
    })();

    const ping = async () => {
      if (!sessionIdRef.current) return;
      await supabase
        .from("user_sessions")
        .update({ last_ping_at: new Date().toISOString() })
        .eq("id", sessionIdRef.current);
    };
    const interval = setInterval(ping, 5 * 60 * 1000);
    const onVisible = () => document.visibilityState === "visible" && ping();
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [userId]);
}
