import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Building2, Monitor, MapPin, FileImage, Inbox, CreditCard, TrendingUp, Wifi } from "lucide-react";

type Stats = {
  businesses: number;
  screens: number;
  screensOnline: number;
  locations: number;
  content: number;
  leads: number;
  leadsNew: number;
  activeSubscriptions: number;
  revenueTotal: number;
  revenueMonth: number;
  paymentsCount: number;
};

type Business = {
  id: string;
  name: string;
  created_at: string;
  screenCount: number;
  memberCount: number;
};

const fmtCOP = (n: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);

export default function AdminOverview() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.functions.invoke("admin-overview");
      if (error) {
        setError(error.message);
      } else {
        setStats(data.stats);
        setBusinesses(data.businesses ?? []);
      }
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !stats) {
    return <div className="p-6 text-destructive">Error: {error ?? "Sin datos"}</div>;
  }

  const kpis = [
    { label: "Negocios", value: stats.businesses, icon: Building2, color: "text-purple-400" },
    { label: "Pantallas", value: `${stats.screensOnline}/${stats.screens}`, sub: "Online / total", icon: Monitor, color: "text-cyan-400" },
    { label: "Ubicaciones", value: stats.locations, icon: MapPin, color: "text-emerald-400" },
    { label: "Contenido", value: stats.content, icon: FileImage, color: "text-amber-400" },
    { label: "Leads", value: stats.leads, sub: `${stats.leadsNew} nuevos`, icon: Inbox, color: "text-pink-400" },
    { label: "Suscripciones activas", value: stats.activeSubscriptions, icon: Wifi, color: "text-indigo-400" },
    { label: "Ingresos del mes", value: fmtCOP(stats.revenueMonth), icon: TrendingUp, color: "text-primary" },
    { label: "Ingresos totales", value: fmtCOP(stats.revenueTotal), sub: `${stats.paymentsCount} pagos`, icon: CreditCard, color: "text-green-400" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Panel de administración</h1>
        <p className="text-sm text-muted-foreground">Vista global de la plataforma Visualia</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {kpis.map(({ label, value, sub, icon: Icon, color }) => (
          <Card key={label} className="p-4 bg-background/40 border-border/50 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">{label}</span>
              <Icon className={`h-4 w-4 ${color}`} />
            </div>
            <div className="text-2xl font-bold">{value}</div>
            {sub && <div className="text-[10px] text-muted-foreground mt-1">{sub}</div>}
          </Card>
        ))}
      </div>

      <Card className="bg-background/40 border-border/50 backdrop-blur-sm">
        <div className="p-4 border-b border-border/50 flex items-center justify-between">
          <h2 className="font-semibold">Negocios recientes</h2>
          <span className="text-xs text-muted-foreground">{businesses.length}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-muted-foreground border-b border-border/50">
              <tr>
                <th className="text-left p-3">Nombre</th>
                <th className="text-left p-3">Pantallas</th>
                <th className="text-left p-3">Miembros</th>
                <th className="text-left p-3">Registrado</th>
              </tr>
            </thead>
            <tbody>
              {businesses.map((b) => (
                <tr key={b.id} className="border-b border-border/30 hover:bg-white/5">
                  <td className="p-3 font-medium">{b.name}</td>
                  <td className="p-3">{b.screenCount}</td>
                  <td className="p-3">{b.memberCount}</td>
                  <td className="p-3 text-muted-foreground">
                    {new Date(b.created_at).toLocaleDateString("es-CO")}
                  </td>
                </tr>
              ))}
              {businesses.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-muted-foreground">
                    Sin negocios todavía
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
