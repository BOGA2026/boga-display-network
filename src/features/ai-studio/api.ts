import { supabase } from "@/integrations/supabase/client";

export type AiTool = "generate_image" | "generate_video_loop" | "suggest_copy" | "apply_brand_kit";
export type AiStatus = "pending" | "completed" | "cancelled" | "failed";

export interface GenerationRow {
  id: string;
  tool: AiTool;
  prompt: string | null;
  output_url: string | null;
  output_text: string | null;
  status: AiStatus;
  created_at: string;
  tokens_used: number;
}

export interface UsageState {
  used: number;
  limit: number;
  remaining: number;
  resets_at: string;
}

const BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-studio`;

async function withToken(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const t = data.session?.access_token;
  if (!t) throw new Error("Sesión expirada. Iniciá sesión de nuevo.");
  return t;
}

async function post<T>(path: string, body: unknown, signal?: AbortSignal): Promise<T> {
  const token = await withToken();
  const resp = await fetch(`${BASE}/${path}`, {
    method: "POST",
    signal,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const text = await resp.text();
  const data = text ? (JSON.parse(text) as { error?: string } & Record<string, unknown>) : {};
  if (!resp.ok) throw Object.assign(new Error(data.error ?? `HTTP ${resp.status}`), { status: resp.status });
  return data as T;
}

async function get<T>(path: string): Promise<T> {
  const token = await withToken();
  const resp = await fetch(`${BASE}/${path}`, { headers: { Authorization: `Bearer ${token}` } });
  const text = await resp.text();
  const data = text ? JSON.parse(text) : {};
  if (!resp.ok) throw new Error((data as { error?: string }).error ?? `HTTP ${resp.status}`);
  return data as T;
}

export const aiStudio = {
  generateImage: (
    body: { prompt: string; formato: "16:9" | "9:16" | "1:1" | "4:5"; watermark_off?: boolean; apply_brand_kit?: boolean },
    signal?: AbortSignal,
  ) => post<{ id: string; url: string; tokens_used: number }>("generate_image", body, signal),

  generateVideoLoop: (
    body: { prompt: string; duracion_segundos: number; formato: "16:9" | "9:16" | "1:1" },
    signal?: AbortSignal,
  ) => post<{ id: string; url: string; duracion_segundos: number }>("generate_video_loop", body, signal),

  suggestCopy: (body: { tipo_promocion: string; contexto_negocio?: string }, signal?: AbortSignal) =>
    post<{ id: string; copy: { titulo?: string; subtitulo?: string; cta?: string } }>("suggest_copy", body, signal),

  applyBrandKit: (generation_id: string, signal?: AbortSignal) =>
    post<{ id: string; url: string }>("apply_brand_kit", { generation_id }, signal),

  cancel: (generation_id: string) => post<{ ok: true }>("cancel", { generation_id }),
  usage: () => get<UsageState>("usage"),
  history: (limit = 20) => get<{ items: GenerationRow[] }>(`history?limit=${limit}`),
};
