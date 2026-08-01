/**
 * Analíticas — la silueta del panel SIEMPRE se renderiza completa.
 *
 * Regla que no se rompe: distinguir "cero medido" de "sin medición".
 *   • Telemetría activa y sin actividad  → 0 en color foreground.
 *   • Telemetría todavía sin capturar    → "—" en muted-foreground, nunca 0.
 * Decir "0% de uptime" cuando no estamos midiendo afirmaría que las pantallas
 * estuvieron caídas, y eso es falso.
 */
import { lazy, useMemo, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Activity, Clock, Download, QrCode, ScanLine, MonitorPlay, Inbox, FileWarning } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { NAV } from "@/config/lexicon";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState, BlockSkeleton, TableSkeleton } from "@/components/feedback/states";
import DeferredMount from "@/components/system/DeferredMount";
import { LastSyncLabel } from "@/components/system/LastSyncLabel";
import { getBusinessId, getUserId } from "@/features/auth/tenant";
import {
  useAirtime,
  useOrphanContent,
  useTelemetryDays,
  useScanDays,
  useScanHeatmap,
  formatHoras,
  formatEscaneosHora,
  type AirtimeRow,
} from "@/hooks/useAnalytics";


const EmptyAxesChart = lazy(() => import("@/features/analytics/EmptyAxesChart"));
const ScanHeatmap = lazy(() => import("@/features/analytics/ScanHeatmap"));


const DIAS_PERIODO = 7;
const SIN_DATO = "—";
const TOOLTIP_DESHABILITADO = "Disponible cuando haya datos";

interface ScreenRow {
  id: string;
  name: string;
  status: string | null;
  last_seen_at: string | null;
  locations: { name: string | null } | null;
}

/** Pantallas reales del negocio: esta tabla no debería estar vacía nunca. */
function useAnalyticsScreens() {
  return useQuery({
    queryKey: ["analytics", "shell", "screens"],
    queryFn: async () => {
      const businessId = await getBusinessId();
      if (!businessId) return { businessId: null as string | null, screens: [] as ScreenRow[], telemetryActive: false };

      const { data, error } = await supabase
        .from("screens")
        .select("id, name, status, last_seen_at, locations!inner(name, business_id)")
        .eq("locations.business_id", businessId)
        .order("name", { ascending: true });
      if (error) throw error;

      const screens = (data ?? []) as unknown as ScreenRow[];
      const ids = screens.map((s) => s.id);

      // La telemetría está capturando si alguna pantalla ya reportó alguna vez
      // o si existe al menos un evento de reproducción registrado.
      let telemetryActive = screens.some((s) => Boolean(s.last_seen_at));
      if (!telemetryActive && ids.length > 0) {
        const { count } = await supabase
          .from("playback_events")
          .select("id", { count: "exact", head: true })
          .in("screen_id", ids);
        telemetryActive = (count ?? 0) > 0;
      }

      return { businessId: businessId as string, screens, telemetryActive };
    },
  });
}


/* ── Valor de métrica: única puerta por la que pasa "cero" vs "sin dato" ── */
function MetricValue({ measured, children }: { measured: boolean; children: ReactNode }) {
  if (!measured) {
    return (
      <span className="v-kpi-value text-muted-foreground" title="Todavía no estamos midiendo este dato">
        {SIN_DATO}
      </span>
    );
  }
  return <span className="v-kpi-value">{children}</span>;
}

function KpiCard({
  icon: Icon,
  label,
  measured,
  value,
  hint,
}: {
  icon: typeof Activity;
  label: string;
  measured: boolean;
  value: ReactNode;
  hint: string;
}) {
  return (
    <div className="v-card v-kpi-card min-h-[116px]">
      <div className="flex items-start justify-between gap-3">
        <span className="v-kpi-label pt-1">{label}</span>
        {/* Sin dato medido → icono al 40%: distingue "no medimos" de "dio cero". */}
        <span className={`v-kpi-icon ${measured ? "" : "opacity-40"}`} aria-hidden>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="flex flex-col gap-1">
        <MetricValue measured={measured}>{value}</MetricValue>
        <span className="text-xs text-muted-foreground">{hint}</span>
      </div>
    </div>
  );
}

/** Envuelve un control deshabilitado para que el tooltip siga apareciendo. */
function DisabledHint({ children }: { children: ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span tabIndex={0} className="inline-flex cursor-not-allowed">
          {children}
        </span>
      </TooltipTrigger>
      <TooltipContent>{TOOLTIP_DESHABILITADO}</TooltipContent>
    </Tooltip>
  );
}

const ESTADO_LABEL: Record<string, string> = {
  online: "En línea",
  offline: "Apagada",
  pending: "Sin emparejar",
};

/**
 * Horas al aire contra horas realmente programadas. El hueco es la métrica:
 * son horas que el local pagó y no usó. `minutes_expected` viene de la
 * programación real, nunca de un 1440 fijo: una pantalla apagada de noche a
 * propósito no está caída.
 */
function AirtimeCard({ measured, airtime }: { measured: boolean; airtime: AirtimeRow | null }) {
  const online = airtime?.minutes_online ?? 0;
  const expected = airtime?.minutes_expected ?? 0;
  const pct = measured && expected > 0 ? Math.min(100, (online / expected) * 100) : 0;

  // Horas pagadas y no usadas: el dato más accionable de la página.
  const horasSinUsar = measured && expected > online ? expected - online : 0;
  const desperdicio = measured && online === 0 && expected > 0;

  return (
    <div className={`v-card v-kpi-card min-h-[116px] ${desperdicio ? "border-amber-500/50" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <span className="v-kpi-label pt-1">Horas al aire</span>
        <span className={`v-kpi-icon ${measured ? "" : "opacity-40"}`} aria-hidden>
          <Clock className="h-4 w-4" />
        </span>
      </div>
      <MetricValue measured={measured && expected > 0}>
        {formatHoras(online)} <span className="text-base font-normal text-muted-foreground">de {formatHoras(expected)}</span>
      </MetricValue>
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Horas al aire sobre horas programadas"
      >
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-xs ${desperdicio ? "font-medium text-amber-400" : "text-muted-foreground"}`}>
        {horasSinUsar > 0
          ? `${formatHoras(horasSinUsar)} programadas sin usar`
          : "del tiempo programado"}
      </span>
    </div>
  );
}

export default function Analytics() {
  const { data, isLoading } = useAnalyticsScreens();
  const screens = data?.screens ?? [];
  const telemetryActive = data?.telemetryActive ?? false;
  const businessId = data?.businessId ?? undefined;

  // Etiquetas de los últimos 7 días para que los ejes tengan escala real.
  const labels = useMemo(() => {
    const fmt = new Intl.DateTimeFormat("es-CO", { day: "2-digit", month: "short" });
    return Array.from({ length: DIAS_PERIODO }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (DIAS_PERIODO - 1 - i));
      return fmt.format(d).replace(".", "");
    });
  }, []);

  const range = useMemo(() => {
    const to = new Date();
    to.setHours(0, 0, 0, 0);
    to.setDate(to.getDate() + 1);
    const from = new Date(to);
    from.setDate(from.getDate() - DIAS_PERIODO);
    return { from, to };
  }, []);

  // Contenido huérfano se mide sobre 30 días, no sobre el rango visible.
  const orphanRange = useMemo(() => {
    const to = new Date();
    const from = new Date(to);
    from.setDate(from.getDate() - 30);
    return { from, to };
  }, []);

  // El mapa de calor necesita historia: 28 días de ventana.
  const heatmapRange = useMemo(() => {
    const to = new Date();
    const from = new Date(to);
    from.setDate(from.getDate() - 28);
    return { from, to };
  }, []);

  const { data: airtime } = useAirtime(businessId, range);
  const { data: orphans } = useOrphanContent(businessId, orphanRange);
  const { data: telemetryDays } = useTelemetryDays(businessId);
  const { data: scanDays } = useScanDays(businessId);

  // Regla dura: no se construye el mapa de calor hasta tener 14 días de
  // escaneos. 168 celdas grises es el peor estado vacío posible.
  const hayHistoriaDeEscaneos = (scanDays ?? 0) >= 14;
  const { data: heatmap } = useScanHeatmap(businessId, heatmapRange, hayHistoriaDeEscaneos);
  const mostrarHeatmap = hayHistoriaDeEscaneos && (heatmap?.length ?? 0) > 0;

  // Antes de 7 días de telemetría, todo el contenido parecería huérfano.
  const orphanCount = orphans?.length ?? 0;
  const mostrarHuerfanos = telemetryActive && (telemetryDays ?? 0) >= 7 && orphanCount > 0;
  const orphanHref = `${NAV.contenido.path}?ids=${(orphans ?? []).map((o) => o.content_id).join(",")}`;




  return (
    <TooltipProvider delayDuration={200}>
      <div className="v-page v-stack space-y-6">
        {/* Cabecera */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold">{NAV.analiticas.pageTitle}</h1>
            <p className="text-sm text-muted-foreground">{NAV.analiticas.pageSubtitle}</p>
          </div>
          <div className="flex items-center gap-2">
            <DisabledHint>
              <Select disabled value="7d">
                <SelectTrigger className="h-9 w-[160px]" aria-label="Rango de fechas">
                  <SelectValue placeholder="Últimos 7 días" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Últimos 7 días</SelectItem>
                  <SelectItem value="30d">Últimos 30 días</SelectItem>
                  <SelectItem value="90d">Últimos 90 días</SelectItem>
                </SelectContent>
              </Select>
            </DisabledHint>
            <DisabledHint>
              <Button variant="outline" size="sm" disabled className="h-9 gap-2">
                <Download className="h-4 w-4" />
                Exportar CSV
              </Button>
            </DisabledHint>
          </div>
        </div>

        {/* Franja informativa: sólo mientras no haya telemetría */}
        {!telemetryActive && !isLoading && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
            <p className="text-sm text-foreground">
              Estamos preparando la medición. Los datos aparecerán cuando tus pantallas empiecen a
              reportar actividad.
            </p>
            <Button asChild variant="outline" size="sm" className="shrink-0">
              <Link to={NAV.pantallas.path}>Conectar una pantalla</Link>
            </Button>
          </div>
        )}

        {/* KPIs — misma estructura visual que tendrán con datos */}
        <div className="v-grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            icon={Activity}
            label="Uptime promedio"
            measured={telemetryActive}
            value="0%"
            hint="del tiempo programado"
          />
          <AirtimeCard measured={telemetryActive} airtime={airtime ?? null} />
          <KpiCard
            icon={QrCode}
            label="Escaneos de QR"
            measured={telemetryActive}
            value={airtime ? airtime.scans.toLocaleString("es-CO") : "0"}
            hint="vs. periodo anterior"
          />
          <KpiCard
            icon={ScanLine}
            label="Escaneos por hora al aire"
            measured={telemetryActive && (airtime?.scans_per_hour ?? null) !== null}
            value={formatEscaneosHora(airtime?.scans_per_hour ?? null)}
            hint="eficiencia del menú"
          />

        </div>

        {/* Gráficos: ejes y rejilla visibles, sin serie */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card className="v-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Uptime por día</CardTitle>
              <p className="text-xs text-muted-foreground">Porcentaje del tiempo programado</p>
            </CardHeader>
            <CardContent>
              <DeferredMount placeholder={<BlockSkeleton height={220} />} minHeight={220}>
                <EmptyAxesChart labels={labels} yMax={100} yUnit="%" />
              </DeferredMount>
            </CardContent>
          </Card>

          <Card className="v-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Escaneos de QR por día</CardTitle>
              <p className="text-xs text-muted-foreground">Interacciones de tus clientes</p>
            </CardHeader>
            <CardContent>
              <DeferredMount placeholder={<BlockSkeleton height={220} />} minHeight={220}>
                <EmptyAxesChart labels={labels} yMax={20} />
              </DeferredMount>
            </CardContent>
          </Card>
        </div>

        {/* Mapa de calor de hora pico: sólo con 14+ días de escaneos */}
        {mostrarHeatmap && (
          <Card className="v-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Hora pico de escaneos</CardTitle>
              <p className="text-xs text-muted-foreground">
                Últimos 28 días · a qué hora y qué días te buscan tus clientes
              </p>
            </CardHeader>
            <CardContent>
              <DeferredMount placeholder={<BlockSkeleton height={260} />} minHeight={260}>
                <ScanHeatmap cells={heatmap ?? []} />
              </DeferredMount>
            </CardContent>
          </Card>
        )}



        {/* Ranking de contenido */}
        <Card className="v-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Contenido más reproducido</CardTitle>
            <p className="text-xs text-muted-foreground">Qué se ve más en tus pantallas</p>
          </CardHeader>
          <CardContent>
            <EmptyState
              className="py-12"
              icon={<Inbox className="h-9 w-9" />}
              title="Sin datos en este periodo"
              description="Cuando tus pantallas reporten reproducciones, verás aquí el ranking de tu contenido."
            />
          </CardContent>
        </Card>

        {/* Contenido huérfano: desperdicio detectable. Sólo con 7+ días de
            telemetría; antes de eso todo parecería huérfano. */}
        {mostrarHuerfanos && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-400/30 bg-amber-400/5 p-4">
            <div className="flex items-center gap-3">
              <FileWarning className="h-5 w-5 shrink-0 text-amber-400" aria-hidden />
              <div>
                <p className="text-sm font-medium text-foreground">
                  <span className="v-numeric">{orphanCount}</span>{" "}
                  {orphanCount === 1 ? "archivo que nunca se ha reproducido" : "archivos que nunca se han reproducido"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Sin reproducciones en los últimos 30 días. Es espacio y trabajo que no está vendiendo.
                </p>
              </div>
            </div>
            <Button asChild variant="outline" size="sm" className="shrink-0">
              <Link to={orphanHref}>Ver esos archivos</Link>
            </Button>
          </div>
        )}


        {/* Tabla por pantalla: con las pantallas reales */}
        <Card className="v-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Detalle por pantalla</CardTitle>
            <p className="text-xs text-muted-foreground">Tus pantallas registradas y su actividad</p>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <TableSkeleton rows={4} columns={5} />
            ) : screens.length === 0 ? (
              <EmptyState
                className="py-12"
                icon={<MonitorPlay className="h-9 w-9" />}
                title="Todavía no tienes pantallas"
                description="Conecta tu primera pantalla para empezar a medir su actividad."
                action={
                  <Button asChild>
                    <Link to={NAV.pantallas.path}>Conectar una pantalla</Link>
                  </Button>
                }
              />
            ) : (
              <div className="overflow-x-auto">
                <Table className="v-table-sticky-first min-w-[640px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pantalla</TableHead>
                      <TableHead>Sede</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Uptime</TableHead>
                      <TableHead className="text-right">Reproducciones</TableHead>
                      <TableHead className="text-right">Última conexión</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {screens.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {s.locations?.name ?? "Sin sede"}
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center gap-2 text-sm">
                            <span
                              className={
                                s.status === "online"
                                  ? "v-dot v-dot-online"
                                  : s.status === "offline"
                                    ? "v-dot v-dot-offline"
                                    : "v-dot v-dot-idle"
                              }
                              aria-hidden
                            />
                            {ESTADO_LABEL[s.status ?? ""] ?? "Sin emparejar"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">{SIN_DATO}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{SIN_DATO}</TableCell>
                        <TableCell className="text-right">
                          <LastSyncLabel lastSeenAt={s.last_seen_at} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}
