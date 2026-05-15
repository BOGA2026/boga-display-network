// Convierte texto en voz usando ElevenLabs y devuelve MP3 base64.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Voz por defecto: Sarah (cálida, neutral, multilingüe — buena para español).
const DEFAULT_VOICE_ID = "EXAVITQu4vr4xnSDxMaL";

import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("ELEVENLABS_API_KEY");
    if (!apiKey) throw new Error("ELEVENLABS_API_KEY no configurada");

    const { text, voice_id } = await req.json();
    const cleanText = (text || "").toString().trim();
    if (!cleanText) {
      return new Response(JSON.stringify({ error: "text requerido" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    // Limitar para no quemar créditos
    const finalText = cleanText.slice(0, 500);

    const voiceId = voice_id || DEFAULT_VOICE_ID;
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`;
    const resp = await fetch(url, {
      method: "POST",
      headers: { "xi-api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        text: finalText,
        model_id: "eleven_turbo_v2_5",
        voice_settings: { stability: 0.45, similarity_boost: 0.75, style: 0.35, use_speaker_boost: true, speed: 1.05 },
      }),
    });

    if (!resp.ok) {
      const t = await resp.text();
      console.error("ElevenLabs TTS error:", resp.status, t);
      return new Response(JSON.stringify({ error: "TTS falló", detail: t }), {
        status: resp.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const buf = new Uint8Array(await resp.arrayBuffer());
    const audioBase64 = base64Encode(buf);
    return new Response(JSON.stringify({ audio: audioBase64, mime: "audio/mpeg" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("voice-tts error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
