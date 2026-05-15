// Recibe audio en base64, llama a ElevenLabs Scribe y devuelve la transcripción.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    if (!ELEVENLABS_API_KEY) throw new Error("ELEVENLABS_API_KEY no configurada");

    const { audio, mimeType } = await req.json();
    if (!audio || typeof audio !== "string") {
      return new Response(JSON.stringify({ error: "audio (base64) requerido" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Decodificar base64 → bytes
    const binary = Uint8Array.from(atob(audio), (c) => c.charCodeAt(0));
    const blob = new Blob([binary], { type: mimeType || "audio/webm" });

    const form = new FormData();
    form.append("file", blob, "recording.webm");
    form.append("model_id", "scribe_v1");
    form.append("language_code", "spa");
    form.append("tag_audio_events", "false");
    form.append("diarize", "false");

    const resp = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
      method: "POST",
      headers: { "xi-api-key": ELEVENLABS_API_KEY },
      body: form,
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error("ElevenLabs STT error:", resp.status, errText);
      return new Response(JSON.stringify({ error: "Transcripción falló", detail: errText }), {
        status: resp.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    return new Response(JSON.stringify({ text: data.text || "" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("voice-transcribe error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
