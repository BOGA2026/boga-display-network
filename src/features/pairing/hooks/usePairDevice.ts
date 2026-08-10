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

/** Datos del equipo que mostró el código, para confirmar antes de bautizarlo. */
export interface PairedDeviceInfo {
  device_model: string | null;
  resolution: string | null;
  network_type: string | null;
  app_version: string | null;
  os_version: string | null;
  expires_at: string | null;
}

async function parseFnError(fnErr: unknown): Promise<PairError> {
  const anyErr = fnErr as { context?: Response; message?: string };
  let payload: { error?: string } | null = null;
  try {
    payload = anyErr.context ? await anyErr.context.clone().json() : null;
  } catch {
    payload = null;
  }
  const code = payload?.error;
  if (code === "code_not_found") return "code_not_found";
  if (code === "code_already_used") return "code_already_used";
  if (code === "code_expired") return "code_expired";
  if (code === "rate_limited" || anyErr.context?.status === 429) return "rate_limited";
  if (anyErr.context?.status === 401 || anyErr.context?.status === 403) return "unauthorized";
  return "server_error";
}

/**
 * Vinculación de un código de 6 caracteres que muestra el televisor.
 * `lookup` solo verifica el código y dice qué equipo es; `claim` lo vincula.
 */
export function usePairDevice() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PairError | null>(null);
  const [result, setResult] = useState<PairResult | null>(null);

  const lookup = async (code: string): Promise<PairedDeviceInfo | null> => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke("pair-device/lookup", {
        body: { device_code: code },
      });
      if (fnErr) {
        setError(await parseFnError(fnErr));
        return null;
      }
      return data as PairedDeviceInfo;
    } catch {
      setError("server_error");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const claim = async (
    code: string,
    opts?: { screenName?: string; locationId?: string; timezone?: string }
  ): Promise<PairResult | null> => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke("pair-device/claim", {
        body: {
          device_code: code,
          screen_name: opts?.screenName,
          location_id: opts?.locationId,
          timezone: opts?.timezone,
        },
      });
      if (fnErr) {
        setError(await parseFnError(fnErr));
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

  return { lookup, claim, reset, loading, error, result };
}

/** Mensajes que dicen qué hacer, no solo qué falló. */
export const pairErrorMessage = (e: PairError | null): string => {
  switch (e) {
    case "code_not_found":
    case "code_expired":
      return "Ese código no es válido. Si pasaron más de 15 minutos, el televisor ya generó uno nuevo — miralo en pantalla e intentá de nuevo.";
    case "code_already_used":
      return "Ese código ya se usó. Mirá el televisor: ahí aparece el código nuevo.";
    case "rate_limited":
      return "Demasiados intentos seguidos. Esperá un minuto y volvé a probar con el código que muestra el televisor.";
    case "unauthorized":
      return "Tu usuario no puede vincular pantallas en este negocio. Pedile al administrador que lo haga.";
    case "server_error":
      return "Algo salió mal de nuestro lado. Intentá de nuevo en unos segundos.";
    default:
      return "";
  }
};
