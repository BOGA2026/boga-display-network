import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

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

  useEffect(() => {
    (async () => {
      const { data } = await supabase.functions.invoke("admin-overview");
      setRows(data?.businesses ?? []);
      setLoading(false);
    })();
  }, []);

  const filtered = rows.filter((r) => r.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Negocios</h1>
        <p className="text-sm text-muted-foreground">Todos los negocios registrados</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar negocio..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
      </div>

      <Card className="bg-background/40 border-border/50 backdrop-blur-sm">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Cargando...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-muted-foreground border-b border-border/50">
                <tr>
                  <th className="text-left p-3">Nombre</th>
                  <th className="text-left p-3">Pantallas</th>
                  <th className="text-left p-3">Miembros</th>
                  <th className="text-left p-3">Registrado</th>
                  <th className="text-left p-3">ID</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-b border-border/30 hover:bg-white/5">
                    <td className="p-3 font-medium">{r.name}</td>
                    <td className="p-3">{r.screenCount}</td>
                    <td className="p-3">{r.memberCount}</td>
                    <td className="p-3 text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString("es-CO")}
                    </td>
                    <td className="p-3 font-mono text-xs text-muted-foreground">{r.id.slice(0, 8)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
