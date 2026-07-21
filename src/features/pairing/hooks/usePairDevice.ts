import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type PairError =
  | "code_not_found"
  | "code_already_used"
  | "code_expired"
  | "rate_limited"
  | "unauthorized"
  | "server_error";

interface PairResult {
  device_id: string;
  screen_id: string;
  business_id: string;
}

/**
 * Claims a 6-digit pairing code shown by a TV device.
 * Talks to the pair-device edge function (route: /claim).
 */
export function usePairDevice() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PairError | null>(null);
  const [result, setResult] = useState<PairResult | null>(null);

  const claim = async (code: string, screenName?: string): Promise<PairResult | null> => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke("pair-device/claim", {
        body: { device_code: code, screen_name: screenName },
      });
      if (fnErr) {
        // supabase-js exposes the response on FunctionsHttpError.context
        const anyErr = fnErr as unknown as { context?: Response; message?: string };
        let payload: { error?: string } | null = null;
        try {
          payload = anyErr.context ? await anyErr.context.clone().json() : null;
        } catch {
          payload = null;
        }
        const code = payload?.error;
        if (code === "code_not_found") setError("code_not_found");
        else if (code === "code_already_used") setError("code_already_used");
        else if (code === "code_expired") setError("code_expired");
        else if (anyErr.context?.status === 429) setError("rate_limited");
        else if (anyErr.context?.status === 401 || anyErr.context?.status === 403) setError("unauthorized");
        else setError("server_error");
        return null;
      }
      const parsed = data as PairResult;
      setResult(parsed);
      return parsed;
    } catch {
      setError("server_error");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setError(null);
    setResult(null);
  };

  return { claim, reset, loading, error, result };
}

export const pairErrorMessage = (e: PairError | null): string => {
  switch (e) {
    case "code_not_found": return "Ese código no existe. Revisa lo que muestra tu TV.";
    case "code_already_used": return "Ese código ya se usó. Regenera uno nuevo en tu TV.";
    case "code_expired": return "El código venció. Regenera uno nuevo en tu TV.";
    case "rate_limited": return "Demasiados intentos. Espera un momento y vuelve a probar.";
    case "unauthorized": return "No tienes permisos para emparejar en este negocio.";
    case "server_error": return "Algo salió mal. Intenta de nuevo.";
    default: return "";
  }
};
