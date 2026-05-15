# Agente Visualia de Voz

Convertimos a Visualia en un asistente conversacional al que el dueño del negocio le habla y él ejecuta cambios reales en las pantallas: precios, promos, horarios, contenido y consultas.

## Recomendación de tipo de voz

**Push-to-talk con confirmación visual** (no conversación continua tipo Alexa).

Razones para un restaurante:
- Cocinas y barras son **ruidosos** → un mic siempre abierto capta interrupciones, ruido y cambia cosas sin querer.
- Cambiar precios es **irreversible para el cliente** → siempre debe haber una tarjeta de "¿Confirmás?" antes de aplicar.
- Mucho más **barato** (~10x menos que conversación continua tipo ElevenLabs).
- El dueño puede **ver** el cambio antes de confirmarlo, no solo oírlo.

Flujo: presionar 🎤 → hablar → soltar → ver tarjeta de preview → confirmar con voz ("sí") o tap.

Stack:
- Transcripción: **ElevenLabs Scribe v2** (español, baja latencia)
- Cerebro: **Lovable AI Gateway** con `google/gemini-3-flash-preview` + tool calling
- Respuesta hablada (opcional, corta): **ElevenLabs TTS** para confirmaciones tipo "Listo, precio actualizado"

## Fase 1 — Web (esta semana)

Botón flotante 🎤 en el dashboard (`/screens`, `/content`, `/schedule`) que abre un panel lateral con el agente.

### Herramientas que entiende el agente (tool calling)

| Tool | Qué hace |
|---|---|
| `update_content_price` | Cambia precio de un item dentro de un contenido tipo menú |
| `toggle_content_active` | Activa/pausa un contenido o promoción |
| `create_promo_from_template` | Crea contenido nuevo desde plantilla (`menu_templates`) con datos dictados |
| `assign_playlist_to_screen` | Cambia qué playlist corre en qué pantalla |
| `schedule_block_create` | Crea bloque horario ("happy hour de 5 a 7") |
| `query_screen_status` | "¿Qué está mostrando ahora la pantalla X?" |
| `reload_screens` | Inserta comando `RELOAD` en `screen_commands` |
| `list_locations_screens` | Para que el agente sepa qué pantallas/sedes existen |

### Componentes nuevos

- `src/components/voice-agent/VoiceAgentDock.tsx` — botón flotante + panel
- `src/components/voice-agent/VoiceRecorder.tsx` — push-to-talk con MediaRecorder
- `src/components/voice-agent/ActionPreviewCard.tsx` — tarjeta de confirmación antes de ejecutar
- `src/components/voice-agent/ConversationLog.tsx` — historial de la sesión actual
- `src/hooks/useVoiceAgent.ts` — orquestación de grabar → transcribir → llamar al agente → confirmar → ejecutar

### Edge functions nuevas

- `supabase/functions/voice-transcribe/index.ts` — recibe audio (base64), llama a ElevenLabs Scribe, devuelve texto.
- `supabase/functions/voice-agent/index.ts` — recibe `{messages, business_id}`, llama a Gemini con las herramientas, devuelve `tool_calls` o respuesta. **No ejecuta cambios** — solo propone. La ejecución vive en el cliente para que la RLS del usuario aplique naturalmente.
- `supabase/functions/voice-tts/index.ts` (opcional) — confirmación hablada corta.

### Cambios de DB

Una tabla nueva para auditar lo que el agente hace (importante para deshacer y para confianza):

- `voice_agent_actions` — guarda cada acción ejecutada (tool, parámetros, resultado, usuario, timestamp). RLS por business.

Una tabla para "items dentro de un contenido tipo menú" si vamos a cambiar precios individuales por voz. Hoy `content` es un blob; necesitamos estructura para que el agente pueda decir "cambiá el precio del menú ejecutivo". Propuesta: `content_items` (content_id, name, price, is_active, sort_order).

## Fase 2 — App móvil (PWA, después de validar Fase 1)

- PWA instalable desde `visualiamedia.com/agente` con icono en el home screen del celular
- Optimizada para uso vertical y manos ocupadas (botón gigante, vibración háptica al confirmar)
- Acceso al micrófono nativo, funciona offline para la grabación (sincroniza al recuperar señal)
- Notificaciones push cuando una pantalla pierde conexión ("Pantalla del comedor se desconectó")

## Detalles técnicos

```text
[Dueño] --hold mic--> [VoiceRecorder]
            |
            v
   audio blob (webm/opus)
            |
            v
[voice-transcribe edge fn] --> ElevenLabs Scribe --> texto
            |
            v
[voice-agent edge fn] --> Gemini Flash + tools --> tool_call JSON
            |
            v
[ActionPreviewCard]  ← muestra: "Cambiar precio Menú Ejecutivo $22k → $25k"
            |
       confirma sí
            v
[ejecutor en cliente] --> supabase.from(...).update(...)  (RLS aplica)
            |
            v
[voice_agent_actions] log + screen_commands RELOAD
            |
            v
[ElevenLabs TTS] "Listo, 3 pantallas actualizadas"
```

### Seguridad
- El agente **nunca** ejecuta directamente; siempre devuelve una *intención*.
- El cliente ejecuta usando la sesión del usuario → RLS bloquea cambios fuera de su business.
- Confirmación obligatoria para: cambios de precio, eliminar contenido, pausar pantallas. No requiere confirmación para: consultas, recargar pantalla.

### Secrets necesarios
- `ELEVENLABS_API_KEY` (te lo pediré con el tool de secrets cuando aprobés el plan)
- `LOVABLE_API_KEY` ya está configurado.

### Costos estimados por sesión de 1 minuto
- Transcripción Scribe: ~$0.005
- Gemini Flash: ~$0.002
- TTS confirmación: ~$0.003
- **Total: ~$0.01 por interacción** (1000 cambios al mes = $10 USD)

## Lo que NO incluye este plan (para después)
- Reconocimiento de quién habla (multi-usuario por voz)
- Comandos en inglés (solo español Colombia)
- Generación de imágenes nuevas por voz (eso queda para el editor visual)
- Integración con WhatsApp para mandar comandos por audio (Fase 3)

## Orden de implementación
1. Tabla `content_items` + tabla `voice_agent_actions` (migración)
2. Pedir `ELEVENLABS_API_KEY`
3. Edge functions `voice-transcribe` y `voice-agent`
4. Componentes UI del dock + recorder + preview card
5. Integrar herramientas una por una, empezando por las **lectoras** (`query_screen_status`, `list_locations_screens`) para validar el ciclo sin riesgo
6. Agregar herramientas de escritura con confirmación obligatoria
7. TTS de confirmación
8. PWA mobile (Fase 2)
