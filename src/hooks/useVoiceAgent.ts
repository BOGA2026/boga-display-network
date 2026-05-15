import { useCallback, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type AgentMessage =
  | { role: "user"; content: string }
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
]);

function describeAction(name: string, args: any): string {
  switch (name) {
    case "update_content_item_price":
      return `Cambiar precio de "${args.item_name}" a $${Number(args.new_price).toLocaleString("es-CO")}`;
    case "toggle_content_item_active":
      return `${args.is_active ? "Activar" : "Desactivar"} "${args.item_name}"`;
    case "reload_screens":
      return `Recargar ${args.screen_ids?.length || 0} pantalla(s)`;
    case "list_locations_screens":
      return "Consultar pantallas y sedes";
    case "list_content_items":
      return "Consultar items del menú";
    case "query_screen_status":
      return "Consultar estado de pantalla";
    default:
      return name;
  }
}

export function useVoiceAgent(businessId: string | null) {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

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
      case "update_content_item_price": {
        const { error } = await supabase.from("content_items")
          .update({ price: args.new_price }).eq("id", args.item_id);
        if (error) throw error;
        return { ok: true };
      }
      case "toggle_content_item_active": {
        const { error } = await supabase.from("content_items")
          .update({ is_active: args.is_active }).eq("id", args.item_id);
        if (error) throw error;
        return { ok: true };
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

      // Separar tool_calls: ejecutar las que no requieren confirmación, encolar las que sí
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
        // Ejecutar inmediatamente y mandar resultado de vuelta
        const toolResults: AgentMessage[] = [];
        for (const tc of toExecute) {
          try {
            const args = JSON.parse(tc.function.arguments || "{}");
            const result = await executeTool(tc.function.name, args);
            toolResults.push({
              role: "tool", tool_call_id: tc.id, content: JSON.stringify(result),
            });
            // log audit
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
        // Re-llamar al agente con los resultados
        await sendToAgent([...updated, ...toolResults]);
      }
    } catch (err: any) {
      console.error("voice agent error:", err);
      toast.error(err?.message || "Error al hablar con el agente");
    } finally {
      setIsProcessing(false);
    }
  }, [businessId, executeTool]);

  /** Confirma una acción pendiente y la ejecuta. */
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

  /** Rechaza una acción pendiente. */
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

  /** Envía texto directo (sin grabar). */
  const sendText = useCallback(async (text: string) => {
    if (!text.trim()) return;
    const updated: AgentMessage[] = [...messages, { role: "user", content: text }];
    setMessages(updated);
    await sendToAgent(updated);
  }, [messages, sendToAgent]);

  /** Comienza a grabar audio. */
  const startRecording = useCallback(async () => {
    try {
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
        // Convertir a base64
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
  }, [sendText]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  }, []);

  const reset = useCallback(() => {
    setMessages([]); setPendingActions([]);
  }, []);

  return {
    messages, pendingActions, isProcessing, isRecording,
    startRecording, stopRecording, sendText, confirmAction, rejectAction, reset,
  };
}
