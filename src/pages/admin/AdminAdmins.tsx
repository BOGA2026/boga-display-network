import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ShieldCheck, Trash2 } from "lucide-react";

type AllowRow = { email: string };

export default function AdminAdmins() {
  const [allowlist, setAllowlist] = useState<AllowRow[]>([]);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await supabase.from("platform_admin_allowlist").select("email").order("email");
    setAllowlist((data as AllowRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const add = async () => {
    const e = email.trim().toLowerCase();
    if (!e) return;
    const { error } = await supabase.from("platform_admin_allowlist").insert({ email: e });
    if (error) toast.error(error.message);
    else {
      toast.success("Correo agregado a la lista de administradores");
      setEmail("");
      load();
    }
  };

  const remove = async (e: string) => {
    const { error } = await supabase.from("platform_admin_allowlist").delete().eq("email", e);
    if (error) toast.error(error.message);
    else {
      toast.success("Eliminado");
      load();
    }
  };

  return (
    <div className="p-6 space-y-4 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Administradores de plataforma</h1>
        <p className="text-sm text-muted-foreground">
          Correos autorizados como super-admin. Se activan al registrarse y confirmar el correo.
        </p>
      </div>

      <Card className="p-4 bg-background/40 border-border/50 backdrop-blur-sm">
        <div className="flex gap-2">
          <Input
            type="email"
            placeholder="correo@ejemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button onClick={add}>
            <ShieldCheck className="h-4 w-4 mr-2" />
            Agregar
          </Button>
        </div>
      </Card>

      <Card className="bg-background/40 border-border/50 backdrop-blur-sm">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Cargando...</div>
        ) : allowlist.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">Sin administradores autorizados</div>
        ) : (
          <ul className="divide-y divide-border/50">
            {allowlist.map((r) => (
              <li key={r.email} className="flex items-center justify-between p-3">
                <span className="font-mono text-sm">{r.email}</span>
                <Button variant="ghost" size="sm" onClick={() => remove(r.email)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
