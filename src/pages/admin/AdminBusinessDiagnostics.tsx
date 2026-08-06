import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  ArrowLeft, RefreshCw, Copy, ImageDown, AlertTriangle, CheckCircle2, XCircle, Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageHeader } from "@/components/admin/AdminUI";
import { AdminInlineError } from "@/components/admin/AdminSkeletons";
import { Button } from "@/components/ui/button";
import { LastSyncLabel } from "@/components/system/LastSyncLabel";
import { syncSeverity } from "@/hooks/useAnalytics";
import { statusMeta, TONE_STYLE, fmtCOP } from "@/hooks/useAdminBusinessStats";
import {
  DEFAULT_TIMEZONE, nowLocalDayIndex, nowLocalMinutes, nowLocalTime, timeToMinutes, minutesToTime, timeZoneLabel,
} from "@/lib/businessTime";
import { toast } from "@/hooks/use-toast";

/* ── Tipos del informe que devuelve la edge function ─────────────────── */

interface DiagScreen {
  id: string; name: string; location_name: string; status: string;
  last_seen_at: string | null; license_status: string; device_type: string | null;
  device_model: string | null; os_version: string | null; app_version: string | null;
  schedule_version: number;
  heartbeat: { ts: string; cpu_pct: number | null; mem_pct: number | null; net_kbps: number | null } | null;
  last_playback: { content_id: string | null; content_name: string | null; started_at: string; duration_ms: number; interrupted: boolean } | null;
}
interface DiagBlock {
  id: string; name: string; screen_id: string; start_time: string; end_time: string;
  days_of_week: number[]; start_date: string | null; end_date: string | null;
  is_enabled: boolean; playlist_name: string | null;
}
interface DiagReport {
  generated_at: string;
  business: { id: string; name: string; timezone: string | null };
  latest_app_version: string | null;
  screens: DiagScreen[];
  schedule_blocks: DiagBlock[];
  content: {
    total: number; in_playlists: number;
    orphans: { id: string; name: string; type: string }[];
    thumbnail_errors: { id: string; name: string }[];
    heavy_files: { id: string; name: string; mb: number }[];
  };
  errors: { at: string; kind: string; message: string; screen_id: string }[];
  subscription: Record<string, any> | null;
  payments: Record<string, any>[];
  payment_methods: { id: string; brand: string; masked: string; expires: string; is_default: boolean }[];
  members_total: number;
  activity: { at: string; action: string; entity: string | null; entity_id: string | null; details: any; user_agent: string | null }[];
}

const DAYS = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sá"];

const fmtDateTime = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" }) : "—";

function deviceOf(userAgent: string | null) {
  if (!userAgent) return "—";
  if (/Android/i.test(userAgent)) return "Android";
  if (/iPhone|iPad/i.test(userAgent)) return "iOS";
  if (/Windows/i.test(userAgent)) return "Windows";
  if (/Mac OS/i.test(userAgent)) return "Mac";
  return "Navegador";
}

/* ── Programación vigente en hora local del negocio ──────────────────── */

function scheduleNow(blocks: DiagBlock[], tz: string) {
  const day = nowLocalDayIndex(tz);
  const mins = nowLocalMinutes(tz);
  const today = blocks.filter((b) => b.is_enabled && (b.days_of_week ?? []).includes(day));
  const active = today.filter((b) => timeToMinutes(b.start_time) <= mins && mins < timeToMinutes(b.end_time));
  const next = today
    .filter((b) => timeToMinutes(b.start_time) > mins)
    .sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time))[0] ?? null;
  const endsAt = active.length
    ? minutesToTime(Math.min(...active.map((b) => timeToMinutes(b.end_time))))
    : null;
  return { day, mins, active, next, endsAt };
}

/* ── Veredicto con reglas explícitas ─────────────────────────────────── */

function verdictOf(report: DiagReport, sched: ReturnType<typeof scheduleNow>) {
  const screens = report.screens;
  const total = screens.length;
  if (total === 0) {
    return { tone: "danger" as const, text: "Este negocio no tiene ninguna pantalla creada." };
  }
  const sev = screens.map((s) => ({ s, info: syncSeverity(s.last_seen_at) }));
  const critical = sev.filter((x) => x.info.severity === "critical" || x.info.severity === "never");
  const warn = sev.filter((x) => x.info.severity === "warn");
  const ok = sev.filter((x) => x.info.severity === "ok");

  if (critical.length === total) {
    const oldest = Math.max(...critical.map((c) => c.info.hoursSince ?? 99999));
    const days = Number.isFinite(oldest) ? Math.round(oldest / 24) : null;
    return {
      tone: "danger" as const,
      text: days
        ? `Ninguna pantalla reporta desde hace ${days} días.`
        : "Ninguna pantalla ha reportado nunca.",
    };
  }
  if (critical.length > 0) {
    return {
      tone: "danger" as const,
      text: `${critical.length} de ${total} pantallas llevan más de 48 h sin reportar (${critical.map((c) => c.s.name).join(", ")}).`,
    };
  }
  if (warn.length > 0) {
    const w = warn[0];
    return {
      tone: "warn" as const,
      text: `La pantalla ${w.s.name} lleva ${w.info.label.replace("Hace ", "")} sin reportar.`,
    };
  }
  if (sched.active.length === 0) {
    return {
      tone: "warn" as const,
      text: `Las ${ok.length} pantallas reportan bien, pero no hay ninguna programación activa a esta hora: la pantalla se ve vacía.`,
    };
  }
  const mismatched = screens.filter(
    (s) => s.last_playback && s.last_playback.interrupted,
  );
  if (mismatched.length > 0) {
    return {
      tone: "warn" as const,
      text: `${mismatched.length} pantalla(s) reportan la última reproducción como interrumpida.`,
    };
  }
  return {
    tone: "ok" as const,
    text: `Todo en orden. ${ok.length} de ${total} pantallas al aire con el contenido correcto.`,
  };
}

const VERDICT_STYLE = {
  ok: { bg: "hsl(var(--admin-success) / 0.12)", fg: "hsl(var(--admin-success))", Icon: CheckCircle2, label: "Todo en orden" },
  warn: { bg: "hsl(var(--admin-warning) / 0.12)", fg: "hsl(var(--admin-warning))", Icon: AlertTriangle, label: "Requiere atención" },
  danger: { bg: "hsl(var(--admin-danger) / 0.12)", fg: "hsl(var(--admin-danger))", Icon: XCircle, label: "Falla" },
};

/* ── Piezas de UI compactas ──────────────────────────────────────────── */

function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="admin-card p-4">
      <header className="mb-3">
        <h2 className="text-[13px] font-semibold" style={{ color: "hsl(var(--admin-fg))" }}>{title}</h2>
        {subtitle && <p className="text-[11px] admin-dim mt-0.5">{subtitle}</p>}
      </header>
      {children}
    </section>
  );
}

const Th = ({ children, right }: { children: React.ReactNode; right?: boolean }) => (
  <th className={`px-2.5 py-2 font-medium text-[11px] uppercase tracking-wider admin-dim ${right ? "text-right" : "text-left"}`}>
    {children}
  </th>
);
const Td = ({ children, right, mono }: { children: React.ReactNode; right?: boolean; mono?: boolean }) => (
  <td className={`px-2.5 py-2 align-top ${right ? "text-right" : ""} ${mono ? "v-numeric" : ""}`}>{children}</td>
);

/* ── Página ──────────────────────────────────────────────────────────── */

export default function AdminBusinessDiagnostics() {
  const { id = "" } = useParams();
  const [busy, setBusy] = useState<string | null>(null);

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["admin", "diagnostics", id],
    queryFn: async (): Promise<DiagReport> => {
      const { data, error } = await supabase.functions.invoke("admin-diagnostics", {
        body: { business_id: id, action: "report" },
      });
      if (error) throw new Error(error.message);
      if ((data as any)?.error) throw new Error((data as any).error);
      return data as DiagReport;
    },
    enabled: Boolean(id),
    staleTime: 15_000,
  });

  const runAction = useMutation({
    mutationFn: async (action: "force_sync" | "regenerate_thumbnails") => {
      setBusy(action);
      const body: Record<string, unknown> = { business_id: id, action };
      if (action === "force_sync") body.screen_ids = (data?.screens ?? []).map((s) => s.id);
      const { data: res, error } = await supabase.functions.invoke("admin-diagnostics", { body });
      if (error) throw new Error(error.message);
      if ((res as any)?.error) throw new Error((res as any).error);
      return { action, res: res as any };
    },
    onSuccess: ({ action, res }) => {
      toast({
        title: action === "force_sync" ? "Sincronización enviada" : "Miniaturas reprocesadas",
        description:
          action === "force_sync"
            ? `Se pidió recargar a ${res.screens} pantalla(s).`
            : `Se reprocesaron ${res.processed} de ${res.requested ?? 0} piezas.`,
      });
      refetch();
    },
    onError: (e: Error) => toast({ title: "No se pudo completar", description: e.message, variant: "destructive" }),
    onSettled: () => setBusy(null),
  });

  const tz = data?.business?.timezone || DEFAULT_TIMEZONE;
  const sched = useMemo(() => scheduleNow(data?.schedule_blocks ?? [], tz), [data, tz]);
  const verdict = useMemo(() => (data ? verdictOf(data, sched) : null), [data, sched]);

  const copyReport = async () => {
    if (!data || !verdict) return;
    const L: string[] = [];
    L.push(`DIAGNÓSTICO — ${data.business.name}`);
    L.push(`Generado: ${fmtDateTime(data.generated_at)} · Zona del negocio: ${tz}`);
    L.push(`Veredicto: ${verdict.text}`);
    L.push("");
    L.push("PANTALLAS");
    data.screens.forEach((s) => {
      L.push(
        `- ${s.name} (${s.location_name}) · ${syncSeverity(s.last_seen_at).label} · app ${s.app_version ?? "—"}` +
          ` · CPU ${s.heartbeat?.cpu_pct ?? "—"}% / MEM ${s.heartbeat?.mem_pct ?? "—"}% / RED ${s.heartbeat?.net_kbps ?? "—"} kbps` +
          ` · último playback: ${s.last_playback?.content_name ?? "ninguno"}${s.last_playback?.interrupted ? " (interrumpido)" : ""}`,
      );
    });
    L.push("");
    L.push("PROGRAMACIÓN VIGENTE");
    L.push(`Hora local: ${nowLocalTime(tz)} (${DAYS[sched.day]})`);
    L.push(
      sched.active.length
        ? sched.active.map((b) => `- ${b.name} ${b.start_time}–${b.end_time} · ${b.playlist_name ?? "sin lista"}`).join("\n")
        : "- NO hay nada programado para esta hora.",
    );
    L.push(`Próximo cambio: ${sched.next ? `${sched.next.start_time} · ${sched.next.name}` : "sin más bloques hoy"}`);
    L.push("");
    L.push("CONTENIDO");
    L.push(`Piezas: ${data.content.total} · en listas: ${data.content.in_playlists} · huérfanas: ${data.content.orphans.length}`);
    L.push(`Miniaturas en error: ${data.content.thumbnail_errors.length} · archivos > 100 MB: ${data.content.heavy_files.length}`);
    L.push("");
    L.push("ERRORES RECIENTES");
    L.push(data.errors.length ? data.errors.map((e) => `- ${fmtDateTime(e.at)} · ${e.message}`).join("\n") : "- Ninguno");
    L.push("");
    L.push("SUSCRIPCIÓN");
    L.push(
      data.subscription
        ? `Plan ${data.subscription.plan} · ${statusMeta(data.subscription.status).label} · próximo cobro ${data.subscription.next_billing_date ?? "—"}`
        : "Sin suscripción",
    );
    L.push("");
    L.push("ACTIVIDAD RECIENTE");
    L.push(
      data.activity.length
        ? data.activity.slice(0, 20).map((a) => `- ${fmtDateTime(a.at)} · ${a.action} · ${deviceOf(a.user_agent)}`).join("\n")
        : "- Sin registros",
    );
    try {
      await navigator.clipboard.writeText(L.join("\n"));
      toast({ title: "Informe copiado", description: "Pegalo en el ticket o en el chat de soporte." });
    } catch {
      toast({ title: "No se pudo copiar", variant: "destructive" });
    }
  };

  if (error) {
    return (
      <div className="p-6">
        <AdminInlineError message={(error as Error).message} onRetry={() => refetch()} />
      </div>
    );
  }

  const V = verdict ? VERDICT_STYLE[verdict.tone] : null;

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-[1400px] text-[13px]">
      <AdminPageHeader
        title={`Diagnóstico · ${data?.business?.name ?? "…"}`}
        subtitle={`Solo lectura · hora local del negocio ${nowLocalTime(tz)} ${timeZoneLabel(tz)} · generado ${fmtDateTime(data?.generated_at)}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/master/negocios"><ArrowLeft className="h-3.5 w-3.5 mr-1.5" />Negocios</Link>
            </Button>
            <Button size="sm" variant="outline" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isFetching ? "animate-spin" : ""}`} />Actualizar
            </Button>
            <Button size="sm" variant="outline" onClick={() => runAction.mutate("force_sync")} disabled={!data || busy !== null}>
              {busy === "force_sync" ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5 mr-1.5" />}
              Forzar sincronización
            </Button>
            <Button size="sm" variant="outline" onClick={() => runAction.mutate("regenerate_thumbnails")} disabled={!data || busy !== null}>
              {busy === "regenerate_thumbnails" ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <ImageDown className="h-3.5 w-3.5 mr-1.5" />}
              Regenerar miniaturas
            </Button>
            <Button size="sm" onClick={copyReport} disabled={!data}>
              <Copy className="h-3.5 w-3.5 mr-1.5" />Copiar informe
            </Button>
          </div>
        }
      />

      {isLoading || !data || !V || !verdict ? (
        <div className="admin-card p-10 flex items-center justify-center gap-2 admin-muted">
          <Loader2 className="h-4 w-4 animate-spin" /> Reuniendo el estado del negocio…
        </div>
      ) : (
        <>
          {/* 1. VEREDICTO */}
          <div
            className="rounded-lg px-4 py-3 flex items-start gap-3"
            style={{ background: V.bg, border: `1px solid ${V.fg}` }}
          >
            <V.Icon className="h-5 w-5 shrink-0 mt-0.5" style={{ color: V.fg }} />
            <div>
              <p className="font-semibold text-[14px]" style={{ color: V.fg }}>{verdict.text}</p>
              <p className="text-[11px] admin-muted mt-0.5">
                {data.screens.length} pantalla(s) · {data.content.total} pieza(s) · {data.members_total} usuario(s) ·
                {" "}programación activa ahora: {sched.active.length}
              </p>
            </div>
          </div>

          {/* 2. PANTALLAS */}
          <Card title="Pantallas" subtitle="Lo programado frente a lo reproducido: si no coinciden, ahí está el problema.">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr style={{ borderBottom: "1px solid hsl(var(--admin-border))" }}>
                  <Th>Pantalla</Th><Th>Último reporte</Th><Th>App</Th><Th right>CPU</Th><Th right>Mem</Th><Th right>Red</Th>
                  <Th>Debería reproducir</Th><Th>Último reportado</Th>
                </tr></thead>
                <tbody>
                  {data.screens.map((s) => {
                    const blocks = sched.active.filter((b) => b.screen_id === s.id);
                    const should = blocks.map((b) => b.playlist_name ?? b.name).join(", ");
                    const outdated = data.latest_app_version && s.app_version && s.app_version !== data.latest_app_version;
                    return (
                      <tr key={s.id} style={{ borderBottom: "1px solid hsl(var(--admin-border) / 0.6)" }}>
                        <Td>
                          <div className="flex items-center gap-2">
                            <span className={`v-dot ${syncSeverity(s.last_seen_at).severity === "ok" ? "v-dot-ok" : syncSeverity(s.last_seen_at).severity === "warn" ? "v-dot-warn" : "v-dot-danger"}`} />
                            <span className="font-medium" style={{ color: "hsl(var(--admin-fg))" }}>{s.name}</span>
                          </div>
                          <span className="text-[11px] admin-dim ml-4">{s.location_name}</span>
                        </Td>
                        <Td><LastSyncLabel lastSeenAt={s.last_seen_at} className="text-[12px]" /></Td>
                        <Td mono>
                          {s.app_version ?? "—"}
                          {outdated && <span className="ml-1 text-[11px] text-amber-400">desactualizada</span>}
                        </Td>
                        <Td right mono>{s.heartbeat?.cpu_pct ?? "—"}{s.heartbeat?.cpu_pct != null && "%"}</Td>
                        <Td right mono>{s.heartbeat?.mem_pct ?? "—"}{s.heartbeat?.mem_pct != null && "%"}</Td>
                        <Td right mono>{s.heartbeat?.net_kbps != null ? `${s.heartbeat.net_kbps} kbps` : "—"}</Td>
                        <Td>{should || <span className="text-amber-400">Nada programado</span>}</Td>
                        <Td>
                          {s.last_playback ? (
                            <>
                              <span>{s.last_playback.content_name ?? "Contenido eliminado"}</span>
                              {s.last_playback.interrupted && <span className="ml-1 text-[11px] text-rose-400">interrumpido</span>}
                              <div className="text-[11px] admin-dim v-numeric">{fmtDateTime(s.last_playback.started_at)}</div>
                            </>
                          ) : <span className="admin-dim">Sin reportes</span>}
                        </Td>
                      </tr>
                    );
                  })}
                  {data.screens.length === 0 && (
                    <tr><Td>—</Td><td colSpan={7} className="px-2.5 py-3 admin-muted">Este negocio no tiene pantallas.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* 3. PROGRAMACIÓN VIGENTE */}
          <Card title="Programación vigente" subtitle={`Calculada en la hora local del negocio (${nowLocalTime(tz)}, ${DAYS[sched.day]})`}>
            {sched.active.length === 0 ? (
              <div className="rounded-md px-3 py-2.5 text-[13px] flex items-start gap-2"
                style={{ background: "hsl(var(--admin-warning) / 0.12)", color: "hsl(var(--admin-warning))" }}>
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>No hay ningún bloque programado para esta hora. Las pantallas se ven vacías aunque estén conectadas.</span>
              </div>
            ) : (
              <ul className="space-y-1.5">
                {sched.active.map((b) => (
                  <li key={b.id} className="flex items-center justify-between gap-3">
                    <span style={{ color: "hsl(var(--admin-fg))" }}>
                      {b.name} <span className="admin-dim">· {b.playlist_name ?? "sin lista"}</span>
                    </span>
                    <span className="v-numeric admin-muted">{b.start_time}–{b.end_time}</span>
                  </li>
                ))}
              </ul>
            )}
            <p className="text-[12px] admin-muted mt-3">
              {sched.endsAt && <>Termina a las <span className="v-numeric">{sched.endsAt}</span>. </>}
              Próximo cambio:{" "}
              {sched.next
                ? <><span className="v-numeric">{sched.next.start_time}</span> · {sched.next.name} ({sched.next.playlist_name ?? "sin lista"})</>
                : "no hay más bloques hoy."}
            </p>
          </Card>

          {/* 4. CONTENIDO */}
          <Card title="Contenido">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { l: "Piezas", v: data.content.total },
                { l: "En alguna lista", v: data.content.in_playlists },
                { l: "Huérfanas", v: data.content.orphans.length },
                { l: "Miniatura en error", v: data.content.thumbnail_errors.length },
              ].map((k) => (
                <div key={k.l} className="rounded-md p-2.5" style={{ background: "hsl(var(--admin-surface-2))" }}>
                  <div className="text-[11px] admin-dim">{k.l}</div>
                  <div className="v-numeric text-[18px]" style={{ color: "hsl(var(--admin-fg))" }}>{k.v}</div>
                </div>
              ))}
            </div>
            {data.content.thumbnail_errors.length > 0 && (
              <p className="text-[12px] mt-3 text-amber-400">
                Sin miniatura: {data.content.thumbnail_errors.map((c) => c.name).join(", ")}
              </p>
            )}
            {data.content.heavy_files.length > 0 && (
              <p className="text-[12px] mt-2 admin-muted">
                Archivos pesados (pueden tardar en cargar en conexiones lentas):{" "}
                {data.content.heavy_files.map((c) => `${c.name} (${c.mb} MB)`).join(", ")}
              </p>
            )}
          </Card>

          {/* 5. ERRORES RECIENTES */}
          <Card title="Errores recientes" subtitle="Últimos 20 eventos con falla">
            {data.errors.length === 0 ? (
              <p className="admin-muted text-[12px]">Sin errores registrados.</p>
            ) : (
              <ul className="space-y-1">
                {data.errors.map((e, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="v-numeric admin-dim text-[12px] w-[130px] shrink-0">{fmtDateTime(e.at)}</span>
                    <span className="text-[12px]">{e.message}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* 6. SUSCRIPCIÓN Y PAGOS */}
          <Card title="Suscripción y pagos">
            {data.subscription ? (
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-3">
                <span>Plan <b style={{ color: "hsl(var(--admin-fg))" }}>{data.subscription.plan}</b> · {data.subscription.billing_cycle}</span>
                <span
                  className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                  style={{
                    background: TONE_STYLE[statusMeta(data.subscription.status).tone].bg,
                    color: TONE_STYLE[statusMeta(data.subscription.status).tone].fg,
                  }}
                >
                  {statusMeta(data.subscription.status).label}
                </span>
                <span className="admin-muted">Próximo cobro <span className="v-numeric">{data.subscription.next_billing_date ?? "—"}</span></span>
                {data.subscription.grace_period_ends_at && (
                  <span className="text-amber-400">Gracia hasta {fmtDateTime(data.subscription.grace_period_ends_at)}</span>
                )}
              </div>
            ) : (
              <p className="admin-muted mb-3">Sin suscripción registrada.</p>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-wider admin-dim mb-1.5">Últimos pagos</p>
                {data.payments.length === 0 ? <p className="admin-muted text-[12px]">Sin pagos.</p> : (
                  <ul className="space-y-1">
                    {data.payments.map((p) => (
                      <li key={p.id} className="flex justify-between gap-3 text-[12px]">
                        <span className="admin-dim v-numeric">{fmtDateTime(p.created_at)}</span>
                        <span className="v-numeric">{fmtCOP(Number(p.amount))}</span>
                        <span className={p.status === "approved" || p.status === "paid" ? "text-emerald-400" : "text-amber-400"}>{p.status}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider admin-dim mb-1.5">Métodos de pago (enmascarados)</p>
                {data.payment_methods.length === 0 ? <p className="admin-muted text-[12px]">Ninguno.</p> : (
                  <ul className="space-y-1">
                    {data.payment_methods.map((m) => (
                      <li key={m.id} className="text-[12px] v-numeric">
                        {m.brand} {m.masked} · vence {m.expires}{m.is_default ? " · predeterminado" : ""}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </Card>

          {/* 7. ACTIVIDAD DEL USUARIO */}
          <Card title="Actividad del usuario" subtitle="Últimas 20 acciones registradas del negocio">
            {data.activity.length === 0 ? (
              <p className="admin-muted text-[12px]">Sin registros de actividad.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr style={{ borderBottom: "1px solid hsl(var(--admin-border))" }}>
                    <Th>Cuándo</Th><Th>Acción</Th><Th>Sobre</Th><Th>Dispositivo</Th>
                  </tr></thead>
                  <tbody>
                    {data.activity.map((a, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid hsl(var(--admin-border) / 0.6)" }}>
                        <Td mono>{fmtDateTime(a.at)}</Td>
                        <Td>{a.action}</Td>
                        <Td><span className="admin-dim">{a.entity ?? "—"}</span></Td>
                        <Td>{deviceOf(a.user_agent)}</Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <p className="text-[11px] admin-dim">
            Vista de solo lectura. Ninguna acción de esta pantalla modifica contenido, programación,
            suscripción ni datos del negocio. Cada apertura y cada acción queda registrada en la bitácora.
          </p>
        </>
      )}
    </div>
  );
}
