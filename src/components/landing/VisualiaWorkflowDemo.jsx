import { useEffect, useState } from "react";

const STEPS = [
  {
    n: "01",
    title: "Conecta el TV Box",
    desc: "Conecta tu TV Box o Fire Stick al HDMI de tu TV y abre la app Visualia.",
  },
  {
    n: "02",
    title: "Empareja tu pantalla",
    desc: "La TV muestra un código de 6 dígitos. Escríbelo en tu panel y listo.",
  },
  {
    n: "03",
    title: "Crea tu menú",
    desc: "Desde el panel, sube tu menú o diséñalo con IA en segundos.",
  },
  {
    n: "04",
    title: "Publica al instante",
    desc: "El contenido viaja por internet al TV Box y aparece en tu pantalla.",
  },
];

const STEP_MS = 4800;

export default function VisualiaWorkflowDemo() {
  const [step, setStep] = useState(0);
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => {
      setStep((s) => (s + 1) % STEPS.length);
      setCycle((c) => c + 1);
    }, STEP_MS);
    return () => clearTimeout(t);
  }, [step, cycle]);

  const go = (i) => {
    setStep(i);
    setCycle((c) => c + 1);
  };

  const sending = step === 1 || step === 3;

  return (
    <section className="vzd">
      <style>{css}</style>
      <div className="vzd-glow" aria-hidden="true" />

      <div className="vzd-head">
        <h2 className="vzd-title">
          Así funciona <span className="vzd-grad">Visualia</span>
        </h2>
        <p className="vzd-sub">
          Tú publicas desde el panel, el contenido viaja por internet y aparece
          en tu TV. Así de simple.
        </p>
      </div>

      <div className="vzd-steprow">
        {STEPS.map((s, i) => (
          <button
            key={s.n}
            className={`vzd-step ${i === step ? "is-active" : ""} ${
              i < step ? "is-done" : ""
            }`}
            onClick={() => go(i)}
            aria-current={i === step}
          >
            <span className="vzd-step-num">{i < step ? "✓" : s.n}</span>
            <span className="vzd-step-title">{s.title}</span>
            <span className="vzd-step-desc">{s.desc}</span>
            {i === step && <span className="vzd-progress" key={`p-${cycle}`} />}
          </button>
        ))}
      </div>

      <div className="vzd-stage" key={`st-${step}-${cycle}`}>
        {/* ── Laptop: panel de control ── */}
        <div className={`vzd-laptop ${step === 0 ? "is-dim" : ""}`}>
          <div className="vzd-laptop-screen">
            <div className="vzd-laptop-bar">
              <span className="vzd-dot r" />
              <span className="vzd-dot y" />
              <span className="vzd-dot g" />
              <span className="vzd-url">panel.visualia.com</span>
            </div>
            <div className="vzd-laptop-body">
              {step === 0 && (
                <>
                  <div className="vzd-skel w70" />
                  <div className="vzd-skel w90" />
                  <div className="vzd-skel w50" />
                </>
              )}
              {step === 1 && (
                <>
                  <div className="vzd-panel-label vzd-up">Vincular pantalla</div>
                  <div className="vzd-code sm">
                    {["4", "8", "2", "9", "1", "7"].map((d, i) => (
                      <span
                        className="vzd-digit sm vzd-pop"
                        style={{ animationDelay: `${0.9 + i * 0.18}s` }}
                        key={i}
                      >
                        {d}
                      </span>
                    ))}
                  </div>
                  <div className="vzd-btn vzd-up d5">Vincular →</div>
                </>
              )}
              {step === 2 && (
                <>
                  <div className="vzd-panel-label vzd-up">Editor de menú</div>
                  {[
                    ["Hamburguesa clásica", "$18.000"],
                    ["Limonada de coco", "$8.000"],
                  ].map(([name, price], i) => (
                    <div
                      className="vzd-mini-row vzd-up"
                      style={{ animationDelay: `${0.4 + i * 0.35}s` }}
                      key={name}
                    >
                      <span className="vzd-mini-thumb" />
                      <span className="vzd-mini-name">{name}</span>
                      <span className="vzd-mini-price">{price}</span>
                    </div>
                  ))}
                  <div className="vzd-btn ia vzd-up d5">✨ Generar con IA</div>
                </>
              )}
              {step === 3 && (
                <>
                  <div className="vzd-panel-label vzd-up">Listo para publicar</div>
                  <div className="vzd-mini-row vzd-up d1">
                    <span className="vzd-mini-thumb" />
                    <span className="vzd-mini-name">Menú Happy hour</span>
                    <span className="vzd-mini-price ok">✓</span>
                  </div>
                  <div className="vzd-btn pub vzd-pulse vzd-up d2">
                    Publicar en 3 sedes ↑
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="vzd-laptop-base" />
          <div className="vzd-device-tag">Tu panel de control</div>
        </div>

        {/* ── Conexión por internet ── */}
        <div className={`vzd-conn ${sending ? "is-live" : ""}`}>
          <div className="vzd-wifi">
            <span className="vzd-wifi-icon">
              {sending ? "⇆" : "···"}
            </span>
            <span className="vzd-wifi-label">internet</span>
          </div>
          <div className="vzd-line">
            {sending && (
              <>
                <span className="vzd-packet" />
                <span className="vzd-packet p2" />
                <span className="vzd-packet p3" />
              </>
            )}
          </div>
        </div>

        {/* ── TV + TV Box ── */}
        <div className="vzd-tvgroup">
          <div className="vzd-tv-screen">
            {step === 0 && (
              <div className="vzd-center">
                <div className="vzd-logo vzd-pop d3">V</div>
                <div className="vzd-chip ok vzd-up d5">✓ Visualia lista en tu TV</div>
              </div>
            )}
            {step === 1 && (
              <div className="vzd-center">
                <div className="vzd-pairlabel vzd-up">Tu código</div>
                <div className="vzd-code">
                  {["4", "8", "2", "9", "1", "7"].map((d, i) => (
                    <span
                      className="vzd-digit vzd-pop"
                      style={{ animationDelay: `${0.15 + i * 0.1}s` }}
                      key={i}
                    >
                      {d}
                    </span>
                  ))}
                </div>
                <div className="vzd-chip ok vzd-up d6">● Pantalla vinculada</div>
              </div>
            )}
            {step === 2 && (
              <div className="vzd-center">
                <div className="vzd-logo dim">V</div>
                <div className="vzd-chip wait vzd-up d1">
                  Esperando publicación…
                </div>
              </div>
            )}
            {step === 3 && (
              <div className="vzd-menu">
                <div className="vzd-menu-head vzd-up d3">
                  <span>HAPPY HOUR</span>
                  <span className="vzd-chip live">● En vivo</span>
                </div>
                <div className="vzd-row hl vzd-up d4">
                  <span className="vzd-thumb" />
                  <span className="vzd-row-name">Hamburguesa clásica</span>
                  <span className="vzd-row-price">
                    <s className="vzd-old">$18.000</s>{" "}
                    <span className="vzd-new vzd-pop d6">$15.000</span>
                  </span>
                </div>
                <div className="vzd-row vzd-up d5">
                  <span className="vzd-thumb" />
                  <span className="vzd-row-name">Limonada de coco</span>
                  <span className="vzd-row-price">$8.000</span>
                </div>
              </div>
            )}
          </div>

          <div className="vzd-hdmi">
            <span className={`vzd-hdmi-cable ${step === 0 ? "vzd-draw" : ""}`} />
          </div>

          <div className={`vzd-box ${step === 0 ? "vzd-pop" : ""}`}>
            <span
              className={`vzd-led ${
                step === 0 ? "" : sending ? "blink" : "on"
              }`}
            />
            <span className="vzd-box-label">TV Box · Fire Stick</span>
          </div>
          <div className="vzd-device-tag">Tu TV en el negocio</div>
        </div>
      </div>
    </section>
  );
}

const css = `
.vzd{position:relative;background:#060010;padding:96px 24px;overflow:hidden;font-family:'Inter','Figtree',sans-serif}
.vzd-glow{position:absolute;top:30%;left:50%;width:700px;height:700px;transform:translate(-50%,-50%);background:radial-gradient(circle,rgba(82,39,255,.16),transparent 70%);filter:blur(90px);pointer-events:none}
.vzd-head{position:relative;max-width:1080px;margin:0 auto 48px;text-align:center}
.vzd-title{color:#fff;font-size:clamp(32px,5vw,52px);font-weight:700;letter-spacing:-.02em;margin:0 0 12px}
.vzd-grad{background:linear-gradient(90deg,#5227FF,#B19EEF);-webkit-background-clip:text;background-clip:text;color:transparent}
.vzd-sub{color:rgba(255,255,255,.6);font-size:18px;margin:0;max-width:560px;margin-inline:auto}
.vzd-steprow{position:relative;max-width:1080px;margin:0 auto 48px;display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
@media(max-width:860px){.vzd-steprow{grid-template-columns:repeat(2,1fr)}}
.vzd-step{display:flex;flex-direction:column;gap:6px;text-align:left;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:16px;cursor:pointer;transition:all .3s cubic-bezier(.4,0,.2,1)}
.vzd-step:hover{border-color:rgba(255,255,255,.2)}
.vzd-step.is-active{background:rgba(82,39,255,.08);border-color:rgba(82,39,255,.6);box-shadow:0 0 32px rgba(82,39,255,.15)}
.vzd-step-num{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#B19EEF;background:rgba(82,39,255,.15);transition:all .3s}
.vzd-step.is-active .vzd-step-num{background:#5227FF;color:#fff}
.vzd-step.is-done .vzd-step-num{background:rgba(82,39,255,.3);color:#fff}
.vzd-step-title{color:#fff;font-weight:600;font-size:15px}
.vzd-step-desc{color:rgba(255,255,255,.55);font-size:12.5px;line-height:1.45}
.vzd-progress{display:block;height:3px;border-radius:3px;background:linear-gradient(90deg,#5227FF,#B19EEF);margin-top:6px;animation:vzdBar ${STEP_MS}ms linear forwards}
@keyframes vzdBar{from{width:0}to{width:100%}}

.vzd-stage{position:relative;max-width:1080px;margin:0 auto;display:flex;align-items:center;justify-content:center;gap:0}
@media(max-width:860px){.vzd-stage{flex-direction:column;gap:8px}}

.vzd-laptop{flex:none;width:250px;transition:opacity .5s}
.vzd-laptop.is-dim{opacity:.35}
.vzd-laptop-screen{background:#0B0518;border:2px solid rgba(255,255,255,.12);border-radius:10px 10px 0 0;overflow:hidden}
.vzd-laptop-bar{display:flex;align-items:center;gap:5px;padding:7px 10px;border-bottom:1px solid rgba(255,255,255,.08)}
.vzd-dot{width:7px;height:7px;border-radius:50%}
.vzd-dot.r{background:#FF5F57}.vzd-dot.y{background:#FEBC2E}.vzd-dot.g{background:#28C840}
.vzd-url{margin-left:6px;font-size:9px;color:rgba(255,255,255,.4);background:rgba(255,255,255,.06);border-radius:20px;padding:2px 8px}
.vzd-laptop-body{padding:14px;min-height:130px;display:flex;flex-direction:column;gap:8px;align-items:flex-start}
.vzd-laptop-base{height:9px;background:rgba(255,255,255,.14);border-radius:0 0 10px 10px;margin:0 -14px 0 -14px}
.vzd-skel{height:9px;border-radius:5px;background:rgba(255,255,255,.08)}
.vzd-skel.w70{width:70%}.vzd-skel.w90{width:90%}.vzd-skel.w50{width:50%}
.vzd-panel-label{color:rgba(255,255,255,.6);font-size:10px;text-transform:uppercase;letter-spacing:.12em;font-weight:600}
.vzd-btn{font-size:12px;font-weight:700;color:#fff;background:#5227FF;border-radius:50px;padding:7px 16px}
.vzd-btn.ia{background:rgba(82,39,255,.2);color:#B19EEF;border:1px solid rgba(82,39,255,.4)}
.vzd-btn.pub{box-shadow:0 0 20px rgba(82,39,255,.5)}
.vzd-pulse{animation:vzdPulse 1.2s ease-in-out infinite}
@keyframes vzdPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}
.vzd-mini-row{display:flex;align-items:center;gap:8px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:9px;padding:6px 9px;width:100%}
.vzd-mini-thumb{flex:none;width:18px;height:18px;border-radius:5px;background:linear-gradient(135deg,rgba(82,39,255,.5),rgba(177,158,239,.3))}
.vzd-mini-name{color:#fff;font-size:10.5px;font-weight:500;flex:1;min-width:0}
.vzd-mini-price{color:#fff;font-size:10.5px;font-weight:700}
.vzd-mini-price.ok{color:#4ADE80}
.vzd-device-tag{text-align:center;color:rgba(255,255,255,.45);font-size:12px;margin-top:12px}

.vzd-conn{flex:1;max-width:200px;min-width:110px;display:flex;flex-direction:column;align-items:center;gap:6px;padding:0 10px}
.vzd-wifi{display:flex;flex-direction:column;align-items:center;gap:2px}
.vzd-wifi-icon{color:rgba(255,255,255,.35);font-size:16px;transition:color .4s}
.vzd-conn.is-live .vzd-wifi-icon{color:#B19EEF}
.vzd-wifi-label{color:rgba(255,255,255,.35);font-size:10px;text-transform:uppercase;letter-spacing:.15em}
.vzd-line{position:relative;width:100%;height:2px;background:rgba(255,255,255,.12);border-radius:2px;overflow:visible}
.vzd-conn.is-live .vzd-line{background:rgba(82,39,255,.35)}
.vzd-packet{position:absolute;top:50%;left:0;width:10px;height:10px;border-radius:50%;background:#5227FF;box-shadow:0 0 12px #5227FF;transform:translateY(-50%);animation:vzdFlow 1.6s linear infinite}
.vzd-packet.p2{animation-delay:.55s}
.vzd-packet.p3{animation-delay:1.1s}
@keyframes vzdFlow{from{left:-4%;opacity:0}15%{opacity:1}85%{opacity:1}to{left:100%;opacity:0}}
@media(max-width:860px){
.vzd-conn{max-width:none;width:2px;height:70px;padding:0;flex-direction:row}
.vzd-wifi{position:absolute;transform:translateX(28px)}
.vzd-line{width:2px;height:100%}
.vzd-packet{animation-name:vzdFlowV;left:50%;transform:translateX(-50%)}
@keyframes vzdFlowV{from{top:-4%;opacity:0}15%{opacity:1}85%{opacity:1}to{top:100%;opacity:0}}
}

.vzd-tvgroup{flex:none;width:340px;display:flex;flex-direction:column;align-items:center}
@media(max-width:400px){.vzd-tvgroup,.vzd-laptop{width:100%}}
.vzd-tv-screen{width:100%;aspect-ratio:16/9;background:#0B0518;border:2px solid rgba(255,255,255,.12);border-radius:12px;padding:16px;display:flex;flex-direction:column;justify-content:center;box-shadow:0 0 50px rgba(82,39,255,.2);overflow:hidden}
.vzd-hdmi{height:22px;display:flex;justify-content:center}
.vzd-hdmi-cable{width:2px;height:100%;background:rgba(255,255,255,.25);display:block}
.vzd-draw{animation:vzdDraw .8s ease-out forwards;transform-origin:top;transform:scaleY(0)}
@keyframes vzdDraw{to{transform:scaleY(1)}}
.vzd-box{display:flex;align-items:center;gap:8px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.15);border-radius:8px;padding:7px 14px}
.vzd-led{width:7px;height:7px;border-radius:50%;background:rgba(255,255,255,.25)}
.vzd-led.on{background:#4ADE80;box-shadow:0 0 8px rgba(74,222,128,.8)}
.vzd-led.blink{background:#4ADE80;box-shadow:0 0 8px rgba(74,222,128,.8);animation:vzdBlink .5s step-end infinite}
@keyframes vzdBlink{50%{opacity:.25}}
.vzd-box-label{color:rgba(255,255,255,.75);font-size:11px;font-weight:600;letter-spacing:.02em}

.vzd-center{display:flex;flex-direction:column;align-items:center;gap:12px}
.vzd-logo{width:48px;height:48px;border-radius:14px;background:linear-gradient(135deg,#5227FF,#B19EEF);display:flex;align-items:center;justify-content:center;color:#fff;font-size:24px;font-weight:800}
.vzd-logo.dim{opacity:.35}
.vzd-pairlabel{color:rgba(255,255,255,.6);font-size:11px;text-transform:uppercase;letter-spacing:.14em}
.vzd-code{display:flex;gap:7px}
.vzd-code.sm{gap:4px}
.vzd-digit{width:32px;height:42px;border-radius:9px;background:rgba(255,255,255,.05);border:1px solid rgba(82,39,255,.5);color:#fff;font-size:19px;font-weight:700;display:flex;align-items:center;justify-content:center;opacity:0}
.vzd-digit.sm{width:22px;height:30px;font-size:13px;border-radius:6px}
.vzd-chip{font-size:11px;font-weight:600;padding:5px 12px;border-radius:50px;white-space:nowrap}
.vzd-chip.ok,.vzd-chip.live{background:rgba(34,197,94,.15);color:#4ADE80;border:1px solid rgba(34,197,94,.3)}
.vzd-chip.wait{background:rgba(255,255,255,.06);color:rgba(255,255,255,.55);border:1px solid rgba(255,255,255,.12)}
.vzd-menu{display:flex;flex-direction:column;gap:8px}
.vzd-menu-head{display:flex;align-items:center;justify-content:space-between;color:rgba(255,255,255,.85);font-size:11px;font-weight:700;letter-spacing:.1em}
.vzd-row{display:flex;align-items:center;gap:10px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:8px 11px;opacity:0}
.vzd-row.hl{border-color:rgba(82,39,255,.6);background:rgba(82,39,255,.08)}
.vzd-thumb{flex:none;width:24px;height:24px;border-radius:7px;background:linear-gradient(135deg,rgba(82,39,255,.5),rgba(177,158,239,.3))}
.vzd-row-name{color:#fff;font-size:12px;font-weight:500;flex:1;min-width:0}
.vzd-row-price{color:#fff;font-size:12px;font-weight:700}
.vzd-old{color:rgba(255,255,255,.35);font-weight:400;font-size:10.5px}
.vzd-new{display:inline-block;color:#4ADE80;opacity:0}

.vzd-up{animation:vzdUp .6s cubic-bezier(.4,0,.2,1) forwards;opacity:0}
.vzd-up.d1{animation-delay:.3s}
.vzd-up.d2{animation-delay:.6s}
.vzd-up.d3{animation-delay:.9s}
.vzd-up.d4{animation-delay:1.2s}
.vzd-up.d5{animation-delay:1.6s}
.vzd-up.d6{animation-delay:2.2s}
@keyframes vzdUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
.vzd-pop{animation:vzdPop .5s cubic-bezier(.34,1.56,.64,1) forwards;opacity:0}
.vzd-pop.d3{animation-delay:.9s}
.vzd-pop.d6{animation-delay:2.2s}
@keyframes vzdPop{from{opacity:0;transform:scale(.5)}to{opacity:1;transform:scale(1)}}
@media(prefers-reduced-motion:reduce){.vzd-up,.vzd-pop,.vzd-packet,.vzd-pulse,.vzd-draw{animation-duration:.01ms;opacity:1;transform:none}.vzd-progress{animation-duration:.01ms}}
`;
