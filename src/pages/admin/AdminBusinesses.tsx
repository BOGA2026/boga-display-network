import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Search, Building2 } from "lucide-react";
import { AdminTableSkeleton, AdminInlineError } from "@/components/admin/AdminSkeletons";
import { AdminPageHeader } from "@/components/admin/AdminUI";

type Row = {
  id: string;
  name: string;
  created_at: string;
  screenCount: number;
  memberCount: number;
};

export default function AdminBusinesses() {
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.functions.invoke("admin-overview");
    if (error) setError(error.message);
    else setRows(data?.businesses ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = rows.filter((r) => r.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1400px]">
      <AdminPageHeader title="Negocios" subtitle="Todos los negocios registrados" />

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 admin-dim" />
        <Input
          placeholder="Buscar negocio..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="pl-9"
        />
      </div>

      {error ? (
        <AdminInlineError message={error} onRetry={load} />
      ) : loading ? (
        <div className="admin-card overflow-hidden">
          <AdminTableSkeleton rows={6} cols={5} />
        </div>
      ) : rows.length === 0 ? (
        <div className="admin-card p-10 flex flex-col items-center justify-center text-center gap-2">
          <Building2 className="h-6 w-6 admin-dim" />
          <p className="text-[13px] font-medium" style={{ color: "hsl(var(--admin-fg))" }}>
            Aún no hay negocios registrados
          </p>
          <p className="text-[12px] admin-muted max-w-sm">
            Cuando alguien complete el registro aparecerá aquí.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="admin-card p-10 text-center text-[13px] admin-muted">
          Sin resultados para "{q}"
        </div>
      ) : (
        <div className="admin-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr
                  className="text-[11px] uppercase tracking-wider admin-dim"
                  style={{ borderBottom: "1px solid hsl(var(--admin-border))" }}
                >
                  <th className="text-left px-4 py-3 font-medium">Nombre</th>
                  <th className="text-right px-4 py-3 font-medium">Pantallas</th>
                  <th className="text-right px-4 py-3 font-medium">Miembros</th>
                  <th className="text-left px-4 py-3 font-medium">Registrado</th>
                  <th className="text-left px-4 py-3 font-medium">ID</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr
                    key={r.id}
                    style={{ borderBottom: "1px solid hsl(var(--admin-border) / 0.6)" }}
                  >
                    <td className="px-4 py-3.5 font-medium" style={{ color: "hsl(var(--admin-fg))" }}>
                      {r.name}
                    </td>
                    <td className="px-4 py-3.5 text-right tabular-nums">{r.screenCount}</td>
                    <td className="px-4 py-3.5 text-right tabular-nums">{r.memberCount}</td>
                    <td className="px-4 py-3.5 admin-muted tabular-nums">
                      {new Date(r.created_at).toLocaleDateString("es-CO")}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-[11px] admin-dim">
                      {r.id.slice(0, 8)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
