
## Nueva sección: "Así se ven las pantallas de nuestros clientes"

Se agrega una sección aislada debajo del hero en `src/pages/Landing.tsx`, sin tocar nada existente.

### Archivos

**Nuevo:** `src/components/landing/ClientScreensShowcase.tsx`
- Componente autónomo con el encabezado, TV mockup y dots.
- Sin dependencias externas nuevas.

**Modificado:** `src/pages/Landing.tsx`
- Importar `ClientScreensShowcase` y renderizarlo inmediatamente después del `<section>` del hero. Ningún otro cambio.

### Estructura del componente

```
<section> (con reveal-on-scroll fade-up al entrar en viewport via IntersectionObserver)
  <header centrado>
    <h2>Así se ven las pantallas de nuestros clientes</h2>
    <p>Menús, promos y precios que se actualizan solos, a la hora exacta.</p>
  </header>

  <div class="tv-frame">   // marco negro, rounded-[24px], border, shadow multicapa, max-w-[900px], aspect-video, mx-auto
    <div class="tv-screen"> // inset, rounded-[16px], overflow-hidden, relative
      {SLIDES.map(s => (
        <div style={{opacity: i===active?1:0, transition:'opacity 500ms ease'}} className="absolute inset-0 ...gradiente...">
          {contenido tipográfico de la cartelera}
        </div>
      ))}

      <BadgeEnVivo />   // top-right: punto verde con animate-pulse + texto "EN VIVO", glass chip
      <ClienteChip />   // bottom-left: nombre del cliente activo, glass chip
    </div>
  </div>

  <Dots />  // 4 puntos; el activo verde esmeralda w-6 rounded-full pill, otros grises w-1.5
</section>
```

### Datos (constante interna)

```ts
const SLIDES = [
  { client: "La Esquina · Restaurante", bg: "from-amber-400 via-orange-500 to-orange-700",
    render: menú almuerzo con 3 platos (Bandeja paisa $28.000, ...) },
  { client: "Bar Andino", bg: "from-violet-700 via-fuchsia-700 to-purple-900",
    render: "HAPPY HOUR 2×1" grande + "Todos los días · 5 a 8 p.m." },
  { client: "Panadería Doña Rosa", bg: "from-amber-100 via-orange-200 to-amber-800",
    render: "PAN RECIÉN HORNEADO" + "Croissant + café $9.900" },
  { client: "GymFit", bg: "from-emerald-400 via-teal-500 to-emerald-800",
    render: "PLAN TRIMESTRE −30%" + "Solo esta semana" },
];
```

Cada slide se compone 100% en CSS/tipografía (sin imágenes). Uso de `bg-gradient-to-br`, tipografías grandes (`text-5xl`/`text-7xl`), tracking ajustado, y filas simples para los precios del restaurante.

### Rotación

- `useState` para `active` (0..3).
- `useEffect` con `setInterval` de 3500ms → `active = (active+1) % 4`.
- Se pausa cuando `document.hidden` (limpieza estándar del interval al desmontar).
- Respeta `prefers-reduced-motion`: si está activo, no rota (queda fijo en slide 0) y sin pulso.

### Estilos

- Solo Tailwind + tokens existentes. Verde esmeralda (`emerald-500`) SOLO para el punto de "EN VIVO" y el dot activo.
- Marco TV: `bg-black`, `border border-white/10`, `shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6),0_10px_30px_-10px_rgba(82,39,255,0.25)]`, `p-2 sm:p-3`.
- Reveal: clase `reveal-on-scroll` (ya existe en `index.css`) con IntersectionObserver que agrega `is-visible`.
- Responsive: `max-w-[900px] w-full px-4 sm:px-6`, tipografías con `clamp` o breakpoints `sm:`/`md:`.

### Fuera de alcance

- No se modifica el hero ni ninguna otra sección.
- No se agregan imágenes, dependencias, ni tokens de diseño nuevos.
