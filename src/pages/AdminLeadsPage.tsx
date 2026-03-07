import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { User, Mail, Phone, Monitor, Calendar } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type Lead = Tables<"leads">;

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      // RLS already restricts to admins — just query directly
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching leads:", error.message);
      }
      setLeads(data ?? []);
      setLoading(false);
    })();
  }, []);

  const statusColor = (s: string) => {
    switch (s) {
      case "nuevo": return "default";
      case "contactado": return "secondary";
      case "convertido": return "outline";
      default: return "default";
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Leads del chatbot</h1>
          <p className="text-sm text-muted-foreground">{leads.length} leads capturados</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : leads.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-20 text-center">
          <User className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">Aún no hay leads. Llegarán desde el chatbot.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border/50 overflow-hidden"
          style={{ background: "hsl(260 20% 8%)" }}>
          <Table>
            <TableHeader>
              <TableRow className="border-border/30 hover:bg-transparent">
                <TableHead className="text-muted-foreground">Nombre</TableHead>
                <TableHead className="text-muted-foreground">Contacto</TableHead>
                <TableHead className="text-muted-foreground">Empresa</TableHead>
                <TableHead className="text-muted-foreground text-center">Pantallas</TableHead>
                <TableHead className="text-muted-foreground">Preferencia</TableHead>
                <TableHead className="text-muted-foreground">Estado</TableHead>
                <TableHead className="text-muted-foreground">Fecha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.map((lead) => (
                <TableRow key={lead.id} className="border-border/20 hover:bg-muted/5">
                  <TableCell className="font-medium text-foreground">
                    <div className="flex items-center gap-2">
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                      {lead.name ?? "—"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                      {lead.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {lead.email}
                        </span>
                      )}
                      {lead.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {lead.phone}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{lead.company ?? "—"}</TableCell>
                  <TableCell className="text-center">
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-foreground">
                      <Monitor className="h-3.5 w-3.5 text-primary" /> {lead.screens}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground capitalize">
                    {lead.preferred_contact ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusColor(lead.status)}>{lead.status}</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {lead.created_at
                        ? format(new Date(lead.created_at), "d MMM yyyy, HH:mm", { locale: es })
                        : "—"}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
