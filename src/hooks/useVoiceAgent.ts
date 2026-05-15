import { useCallback, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type AgentMessage =
  | { role: "user"; content: string; images?: string[] }
  | { role: "assistant"; content: string; tool_calls?: ToolCall[] }
  | { role: "tool"; content: string; tool_call_id: string };

export interface ToolCall {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
}

export interface PendingAction {
  toolCallId: string;
  name: string;
  args: any;
  needsConfirm: boolean;
  description: string;
}

const NEEDS_CONFIRM = new Set([
  "update_content_item_price",
  "toggle_content_item_active",
  "cambiar_horario",
  "pausar_contenido",
  "restaurar_ultima_accion",
  "crear_playlist",
  "crear_item",
  "crear_contenido",
]);

function describeAction(name: string, args: any): string {
  switch (name) {
    case "update_content_item_price":
      return `Cambiar precio de "${args.item_name}" a $${Number(args.new_price).toLocaleString("es-CO")}`;
    case "toggle_content_item_active":
      return `${args.is_active ? "Activar" : "Desactivar"} "${args.item_name}"`;
    case "reload_screens":
      return `Recargar ${args.screen_ids?.length || 0} pantalla(s)`;
    case "cambiar_horario":
      return `Programar "${args.name}" de ${args.start_time} a ${args.end_time}`;
    case "pausar_contenido":
      return `Pausar ${args.screen_ids?.length || 0} pantalla(s) por ${args.duration_minutes} min`;
    case "restaurar_ultima_accion":
      return `Deshacer la última acción aplicada`;
    case "crear_playlist":
      return `Crear playlist "${args.name}"`;
    case "crear_item":
      return `Crear item "${args.name}"${args.price ? ` ($${Number(args.price).toLocaleString("es-CO")})` : ""}`;
    case "crear_contenido":
      return `Crear ${args.type || "menú"} "${args.name}" (${args.aspect_ratio || "?"})`;
    default:
      return name;
  }
}

export function useVoiceAgent(businessId: string | null) {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  /** Reproduce texto vía ElevenLabs TTS. */
  const speak = useCallback(async (text: string) => {
    const clean = (text || "").trim();
    if (!clean) return;
    try {
      setIsSpeaking(true);
      const { data, error } = await supabase.functions.invoke("voice-tts", { body: { text: clean } });
      if (error || !data?.audio) return;
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
      const audio = new Audio(`data:${data.mime || "audio/mpeg"};base64,${data.audio}`);
      audioRef.current = audio;
      audio.onended = () => setIsSpeaking(false);
      audio.onerror = () => setIsSpeaking(false);
      await audio.play().catch(() => setIsSpeaking(false));
    } catch {
      setIsSpeaking(false);
    }
  }, []);

  const stopSpeaking = useCallback(() => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    setIsSpeaking(false);
  }, []);

  /** Ejecuta una herramienta usando la sesión del usuario (RLS aplica). */
  const executeTool = useCallback(async (name: string, args: any): Promise<any> => {
    if (!businessId) throw new Error("No hay business activo");

    switch (name) {
      case "list_locations_screens": {
        const { data: locs } = await supabase
          .from("locations").select("id, name, screens(id, name, status)")
          .eq("business_id", businessId);
        return { locations: locs || [] };
      }
      case "query_screen_status": {
        const { data } = await supabase
          .from("screens").select("id, name, status, last_seen_at")
          .eq("id", args.screen_id).maybeSingle();
        return data || { error: "Pantalla no encontrada" };
      }
      case "reload_screens": {
        const rows = (args.screen_ids || []).map((sid: string) => ({
          screen_id: sid, command: "RELOAD", payload: {},
        }));
        const { error } = await supabase.from("screen_commands").insert(rows);
        if (error) throw error;
        return { ok: true, count: rows.length };
      }
      case "list_content_items": {
        let q = supabase.from("content_items")
          .select("id, name, price, currency, is_active, content_id")
          .eq("business_id", businessId).order("name");
        if (args.search) q = q.ilike("name", `%${args.search}%`);
        const { data } = await q;
        return { items: data || [] };
      }
      case "list_playlists": {
        const { data } = await supabase
          .from("playlists").select("id, name").eq("business_id", businessId).order("name");
        return { playlists: data || [] };
      }
      case "update_content_item_price": {
        // Leer precio anterior para poder restaurar
        const { data: prev } = await supabase.from("content_items")
          .select("price").eq("id", args.item_id).maybeSingle();
        const { error } = await supabase.from("content_items")
          .update({ price: args.new_price }).eq("id", args.item_id);
        if (error) throw error;
        return { ok: true, previous_price: prev?.price ?? null };
      }
      case "toggle_content_item_active": {
        const { data: prev } = await supabase.from("content_items")
          .select("is_active").eq("id", args.item_id).maybeSingle();
        const { error } = await supabase.from("content_items")
          .update({ is_active: args.is_active }).eq("id", args.item_id);
        if (error) throw error;
        return { ok: true, previous_is_active: prev?.is_active ?? null };
      }
      case "cambiar_horario": {
        const { data, error } = await supabase.from("schedule_blocks").insert({
          business_id: businessId,
          screen_id: args.screen_id,
          playlist_id: args.playlist_id,
          name: args.name,
          start_time: args.start_time,
          end_time: args.end_time,
          days_of_week: args.days_of_week,
          // layer_id es NOT NULL — usamos el primer layer del negocio o creamos uno
          layer_id: await ensureDefaultLayer(businessId),
        }).select("id").maybeSingle();
        if (error) throw error;
        return { ok: true, schedule_block_id: data?.id };
      }
      case "pausar_contenido": {
        const expiresAt = new Date(Date.now() + (args.duration_minutes || 5) * 60_000).toISOString();
        const rows = (args.screen_ids || []).map((sid: string) => ({
          screen_id: sid, command: "PAUSE",
          payload: { duration_minutes: args.duration_minutes },
          expires_at: expiresAt,
        }));
        const { error } = await supabase.from("screen_commands").insert(rows);
        if (error) throw error;
        return { ok: true, count: rows.length, resume_at: expiresAt };
      }
      case "restaurar_ultima_accion": {
        // Buscar última acción reversible
        const { data: actions } = await supabase
          .from("voice_agent_actions")
          .select("id, tool_name, parameters, result")
          .eq("business_id", businessId)
          .in("tool_name", ["update_content_item_price", "toggle_content_item_active", "pausar_contenido"])
          .order("created_at", { ascending: false }).limit(1);
        const last = actions?.[0];
        if (!last) return { ok: false, error: "No hay acciones reversibles recientes" };
        const params: any = last.parameters || {};
        const result: any = last.result || {};
        if (last.tool_name === "update_content_item_price" && result.previous_price != null) {
          await supabase.from("content_items").update({ price: result.previous_price }).eq("id", params.item_id);
          return { ok: true, undid: "precio", item: params.item_name, restored_to: result.previous_price };
        }
        if (last.tool_name === "toggle_content_item_active" && result.previous_is_active != null) {
          await supabase.from("content_items").update({ is_active: result.previous_is_active }).eq("id", params.item_id);
          return { ok: true, undid: "estado", item: params.item_name };
        }
        if (last.tool_name === "pausar_contenido") {
          const rows = (params.screen_ids || []).map((sid: string) => ({
            screen_id: sid, command: "RESUME", payload: {},
          }));
          await supabase.from("screen_commands").insert(rows);
          return { ok: true, undid: "pausa", count: rows.length };
        }
        return { ok: false, error: "Última acción no reversible" };
      }
      case "crear_playlist": {
        const { data: { user } } = await supabase.auth.getUser();
        const { data, error } = await supabase.from("playlists").insert({
          business_id: businessId, name: args.name, created_by: user?.id ?? null,
        }).select("id, name").maybeSingle();
        if (error) throw error;
        return { ok: true, playlist: data };
      }
      case "crear_item": {
        const { data, error } = await supabase.from("content_items").insert({
          business_id: businessId,
          content_id: args.content_id,
          name: args.name,
          price: args.price ?? null,
          description: args.description ?? null,
        }).select("id, name, price").maybeSingle();
        if (error) throw error;
        return { ok: true, item: data };
      }
      case "crear_contenido": {
        const { data: { user } } = await supabase.auth.getUser();
        const ratio = args.aspect_ratio ? ` [${args.aspect_ratio}]` : "";
        // Guardamos como "layout" para que la card abra el editor al hacer click
        const { data, error } = await supabase.from("content").insert({
          business_id: businessId,
          name: `${args.name}${ratio}`,
          type: "layout",
          duration_seconds: args.duration_seconds ?? 10,
          created_by: user?.id ?? null,
        }).select("id, name, type").maybeSingle();
        if (error) throw error;
        // Abrimos el editor automáticamente con la plantilla recién creada
        if (data?.id) {
          const url = `/dashboard/editor?contentId=${data.id}&aspect=${encodeURIComponent(args.aspect_ratio || "16:9")}`;
          setTimeout(() => window.open(url, "_blank"), 200);
          return { ok: true, content: data, aspect_ratio: args.aspect_ratio, editor_url: url, message: "Plantilla creada. Abrí el editor en una pestaña nueva." };
        }
        return { ok: true, content: data, aspect_ratio: args.aspect_ratio };
      }
      default:
        throw new Error(`Tool desconocida: ${name}`);
    }
  }, [businessId]);

  /** Envía mensajes al agente y maneja respuesta + tool calls. */
  const sendToAgent = useCallback(async (newMessages: AgentMessage[]) => {
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("voice-agent", {
        body: { messages: newMessages, business_context: `Business ID: ${businessId}` },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const assistantMsg: AgentMessage = {
        role: "assistant",
        content: data.content || "",
        tool_calls: data.tool_calls || [],
      };
      const updated = [...newMessages, assistantMsg];
      setMessages(updated);

      // Hablar la respuesta si hay texto y no hay tool_calls pendientes (evitamos hablar "Ok voy a hacer…")
      if (assistantMsg.content && !(data.tool_calls && data.tool_calls.length)) {
        speak(assistantMsg.content);
      }

      const toExecute: ToolCall[] = [];
      const toConfirm: PendingAction[] = [];
      for (const tc of (data.tool_calls || []) as ToolCall[]) {
        const args = JSON.parse(tc.function.arguments || "{}");
        if (NEEDS_CONFIRM.has(tc.function.name)) {
          toConfirm.push({
            toolCallId: tc.id, name: tc.function.name, args,
            needsConfirm: true, description: describeAction(tc.function.name, args),
          });
        } else {
          toExecute.push(tc);
        }
      }

      if (toConfirm.length) setPendingActions((p) => [...p, ...toConfirm]);

      if (toExecute.length) {
        const toolResults: AgentMessage[] = [];
        for (const tc of toExecute) {
          try {
            const args = JSON.parse(tc.function.arguments || "{}");
            const result = await executeTool(tc.function.name, args);
            toolResults.push({
              role: "tool", tool_call_id: tc.id, content: JSON.stringify(result),
            });
            if (businessId) {
              const { data: { user } } = await supabase.auth.getUser();
              if (user) {
                await supabase.from("voice_agent_actions").insert({
                  business_id: businessId, user_id: user.id,
                  tool_name: tc.function.name, parameters: args, result,
                });
              }
            }
          } catch (err: any) {
            toolResults.push({
              role: "tool", tool_call_id: tc.id,
              content: JSON.stringify({ error: err?.message || String(err) }),
            });
          }
        }
        await sendToAgent([...updated, ...toolResults]);
      }
    } catch (err: any) {
      console.error("voice agent error:", err);
      toast.error(err?.message || "Error al hablar con el agente");
    } finally {
      setIsProcessing(false);
    }
  }, [businessId, executeTool, speak]);

  const confirmAction = useCallback(async (toolCallId: string) => {
    const action = pendingActions.find((a) => a.toolCallId === toolCallId);
    if (!action) return;
    setPendingActions((p) => p.filter((a) => a.toolCallId !== toolCallId));
    setIsProcessing(true);
    try {
      const result = await executeTool(action.name, action.args);
      if (businessId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from("voice_agent_actions").insert({
            business_id: businessId, user_id: user.id,
            tool_name: action.name, parameters: action.args, result,
          });
        }
      }
      const toolResult: AgentMessage = {
        role: "tool", tool_call_id: toolCallId, content: JSON.stringify(result),
      };
      const updated = [...messages, toolResult];
      setMessages(updated);
      await sendToAgent(updated);
      toast.success("Listo, cambio aplicado");
    } catch (err: any) {
      toast.error(err?.message || "No se pudo aplicar");
    } finally {
      setIsProcessing(false);
    }
  }, [pendingActions, executeTool, businessId, messages, sendToAgent]);

  const rejectAction = useCallback((toolCallId: string) => {
    const action = pendingActions.find((a) => a.toolCallId === toolCallId);
    setPendingActions((p) => p.filter((a) => a.toolCallId !== toolCallId));
    if (!action) return;
    const toolResult: AgentMessage = {
      role: "tool", tool_call_id: toolCallId,
      content: JSON.stringify({ cancelled: true, reason: "Usuario rechazó" }),
    };
    const updated = [...messages, toolResult];
    setMessages(updated);
    sendToAgent(updated);
  }, [pendingActions, messages, sendToAgent]);

  const sendText = useCallback(async (text: string, images?: string[]) => {
    if (!text.trim() && !(images && images.length)) return;
    const userMsg: AgentMessage = { role: "user", content: text || "(imagen adjunta)" };
    if (images && images.length) userMsg.images = images;
    const updated: AgentMessage[] = [...messages, userMsg];
    setMessages(updated);
    await sendToAgent(updated);
  }, [messages, sendToAgent]);

  const startRecording = useCallback(async () => {
    try {
      stopSpeaking();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        if (blob.size < 1000) {
          toast.error("Grabación muy corta");
          return;
        }
        const buf = await blob.arrayBuffer();
        const bytes = new Uint8Array(buf);
        let bin = "";
        for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
        const base64 = btoa(bin);
        setIsProcessing(true);
        try {
          const { data, error } = await supabase.functions.invoke("voice-transcribe", {
            body: { audio: base64, mimeType: "audio/webm" },
          });
          if (error) throw error;
          if (data?.error) throw new Error(data.error);
          const text = (data?.text || "").trim();
          if (!text) {
            toast.error("No se entendió, probá de nuevo");
            setIsProcessing(false);
            return;
          }
          await sendText(text);
        } catch (e: any) {
          toast.error(e?.message || "Error al transcribir");
        } finally {
          setIsProcessing(false);
        }
      };
      mediaRecorderRef.current = mr;
      mr.start();
      setIsRecording(true);
    } catch (e: any) {
      toast.error("No se pudo acceder al micrófono");
      console.error(e);
    }
  }, [sendText, stopSpeaking]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  }, []);

  const reset = useCallback(() => {
    setMessages([]); setPendingActions([]); stopSpeaking();
  }, [stopSpeaking]);

  return {
    messages, pendingActions, isProcessing, isRecording, isSpeaking,
    startRecording, stopRecording, sendText, confirmAction, rejectAction, reset, stopSpeaking,
  };
}

/** Devuelve un layer_id válido del negocio; crea uno si no existe. */
async function ensureDefaultLayer(businessId: string): Promise<string> {
  const { data } = await supabase
    .from("schedule_layers").select("id").eq("business_id", businessId)
    .order("priority", { ascending: false }).limit(1).maybeSingle();
  if (data?.id) return data.id;
  const { data: created, error } = await supabase
    .from("schedule_layers").insert({ business_id: businessId, name: "Principal", color: "#8A00FF", priority: 0 })
    .select("id").maybeSingle();
  if (error || !created) throw new Error("No se pudo crear capa de programación");
  return created.id;
}
