import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, X, Sparkles, Send, Volume2, VolumeX, Paperclip, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useVoiceAgent } from "@/hooks/useVoiceAgent";
import { ActionPreviewCard } from "./ActionPreviewCard";
import { toast } from "sonner";

/**
 * Dock flotante con el agente de voz Visualia.
 * Botón circular abajo a la derecha, abre un panel con micrófono push-to-talk.
 */
export const VoiceAgentDock = () => {
  const [open, setOpen] = useState(false);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [textInput, setTextInput] = useState("");
  const [attachedImages, setAttachedImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("business_memberships").select("business_id")
        .eq("user_id", user.id).limit(1).maybeSingle();
      if (data?.business_id) setBusinessId(data.business_id);
    })();
  }, []);

  const {
    messages, pendingActions, isProcessing, isRecording, isSpeaking,
    startRecording, stopRecording, sendText, confirmAction, rejectAction, reset, stopSpeaking,
  } = useVoiceAgent(businessId);

  const fileToDataUrl = (file: File): Promise<string> => new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(file);
  });

  const handleFiles = async (files: FileList | null) => {
    if (!files || !files.length) return;
    const valid = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!valid.length) { toast.error("Sólo imágenes"); return; }
    if (attachedImages.length + valid.length > 4) { toast.error("Máximo 4 imágenes"); return; }
    try {
      const urls = await Promise.all(valid.map(async (f) => {
        if (f.size > 8 * 1024 * 1024) throw new Error(`${f.name} pesa más de 8MB`);
        return fileToDataUrl(f);
      }));
      setAttachedImages((p) => [...p, ...urls]);
    } catch (e: any) {
      toast.error(e?.message || "No se pudo cargar la imagen");
    }
  };

  const handleSendText = () => {
    const t = textInput.trim();
    if (!t && !attachedImages.length) return;
    sendText(t, attachedImages.length ? attachedImages : undefined);
    setTextInput("");
    setAttachedImages([]);
  };

  return (
    <>
      {/* Botón flotante */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-gradient-to-br from-primary to-purple-600 shadow-[0_0_30px_hsl(270_100%_50%/0.5)] hover:shadow-[0_0_40px_hsl(270_100%_50%/0.7)] transition-all flex items-center justify-center group"
          aria-label="Abrir agente de voz Visualia"
        >
          <Sparkles className="h-6 w-6 text-white group-hover:scale-110 transition-transform" />
          <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-green-400 animate-pulse" />
        </button>
      )}

      {/* Panel */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-3rem)] flex flex-col rounded-2xl border border-primary/30 bg-background/95 backdrop-blur-xl shadow-[0_0_50px_hsl(270_100%_50%/0.3)] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-gradient-to-r from-primary/10 to-purple-600/10">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">Agente Visualia</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary">BETA</span>
            </div>
            <div className="flex items-center gap-1">
              {isSpeaking && (
                <button onClick={stopSpeaking} className="p-1 hover:bg-muted/50 rounded text-primary" title="Silenciar">
                  <VolumeX className="h-4 w-4" />
                </button>
              )}
              {!isSpeaking && messages.some((m) => m.role === "assistant" && m.content) && (
                <Volume2 className="h-3.5 w-3.5 text-muted-foreground/50" />
              )}
              {messages.length > 0 && (
                <button onClick={reset} className="text-[10px] text-muted-foreground hover:text-foreground px-2">
                  Limpiar
                </button>
              )}
              <button onClick={() => setOpen(false)} className="p-1 hover:bg-muted/50 rounded">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Conversación */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 min-h-[200px] max-h-[400px]">
            {messages.length === 0 && pendingActions.length === 0 && (
              <div className="text-center py-8 px-4">
                <div className="text-xs text-muted-foreground mb-3">
                  Mantené el micrófono presionado y hablá. Probá:
                </div>
                <div className="space-y-1.5 text-xs">
                  {[
                    '"¿Qué pantallas tengo?"',
                    '"Cambiá el precio del menú ejecutivo a 25 mil"',
                    '"Recargá la pantalla de la entrada"',
                    '"Quitá la hamburguesa BBQ del menú"',
                  ].map((s) => (
                    <div key={s} className="text-muted-foreground/80 italic">{s}</div>
                  ))}
                </div>
              </div>
            )}

            {messages.filter((m) => m.role !== "tool").map((m, i) => {
              const imgs = (m as any).images as string[] | undefined;
              return (
                <div
                  key={i}
                  className={`text-sm rounded-lg px-3 py-2 max-w-[85%] space-y-2 ${
                    m.role === "user"
                      ? "ml-auto bg-primary/20 text-foreground"
                      : "mr-auto bg-muted/50 text-foreground"
                  }`}
                >
                  {imgs && imgs.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {imgs.map((src, idx) => (
                        <img key={idx} src={src} alt="" className="h-16 w-16 object-cover rounded border border-border/50" />
                      ))}
                    </div>
                  )}
                  {m.content && m.content !== "(imagen adjunta)" ? (
                    <div>{m.content}</div>
                  ) : !imgs?.length && m.role === "assistant" && (m as any).tool_calls?.length ? (
                    <span className="text-muted-foreground italic">Trabajando…</span>
                  ) : null}
                </div>
              );
            })}

            {pendingActions.map((a) => (
              <ActionPreviewCard
                key={a.toolCallId} action={a}
                onConfirm={() => confirmAction(a.toolCallId)}
                onReject={() => rejectAction(a.toolCallId)}
              />
            ))}

            {isProcessing && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground px-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                Pensando…
              </div>
            )}
          </div>

          {/* Controles: input texto + botón micrófono */}
          <div className="border-t border-border/50 p-3 space-y-2">
            {attachedImages.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {attachedImages.map((src, idx) => (
                  <div key={idx} className="relative h-14 w-14 rounded-md overflow-hidden border border-primary/30 group">
                    <img src={src} alt="" className="h-full w-full object-cover" />
                    <button
                      onClick={() => setAttachedImages((p) => p.filter((_, i) => i !== idx))}
                      className="absolute top-0.5 right-0.5 h-4 w-4 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <input
              ref={fileInputRef} type="file" accept="image/*" multiple className="hidden"
              onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }}
            />

            <div className="flex gap-2">
              <Button
                size="sm" variant="ghost" onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing || attachedImages.length >= 4}
                className="h-9 w-9 p-0 shrink-0" title="Adjuntar imagen"
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              <Input
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendText()}
                placeholder={attachedImages.length ? "Describí qué hacer con la imagen…" : "O escribí acá…"}
                className="h-9 text-sm"
                disabled={isProcessing}
              />
              <Button
                size="sm" variant="ghost" onClick={handleSendText}
                disabled={(!textInput.trim() && !attachedImages.length) || isProcessing} className="h-9 w-9 p-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>

            <button
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onMouseLeave={isRecording ? stopRecording : undefined}
              onTouchStart={(e) => { e.preventDefault(); startRecording(); }}
              onTouchEnd={(e) => { e.preventDefault(); stopRecording(); }}
              disabled={isProcessing || !businessId}
              className={`w-full h-12 rounded-xl flex items-center justify-center gap-2 font-medium text-sm transition-all select-none ${
                isRecording
                  ? "bg-red-500 text-white shadow-[0_0_30px_rgba(239,68,68,0.6)] scale-[1.02]"
                  : "bg-gradient-to-r from-primary to-purple-600 text-white hover:shadow-[0_0_25px_hsl(270_100%_50%/0.5)] disabled:opacity-50"
              }`}
            >
              {isRecording ? (
                <><MicOff className="h-5 w-5" /> Soltá para enviar</>
              ) : (
                <><Mic className="h-5 w-5" /> Mantené presionado para hablar</>
              )}
            </button>
            {!businessId && (
              <p className="text-[10px] text-muted-foreground text-center">
                Cargando contexto del negocio…
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
};
