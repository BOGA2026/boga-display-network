import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ShieldCheck, Trash2, User } from "lucide-react";

type AllowRow = { email: string };

export default function AdminAdmins() {
  const [allowlist, setAllowlist] = useState<AllowRow[]>([]);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentEmail, setCurrentEmail] = useState<string | null>(null);

  const load = async () => {
    const [{ data }, userRes] = await Promise.all([
      supabase.from("platform_admin_allowlist").select("email").order("email"),
      supabase.auth.getUser(),
    ]);
    setAllowlist((data as AllowRow[]) ?? []);
    setCurrentEmail(userRes.data.user?.email ?? null);
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
    <div className="p-6 md:p-8 space-y-4 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Administradores de plataforma</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Correos autorizados como super-admin. Se activan automáticamente cuando el usuario se registra y
          confirma su correo.
        </p>
      </div>

      {currentEmail && (
        <div
          className="rounded-md p-3 flex items-center gap-3"
          style={{
            background: "hsl(var(--admin-accent) / 0.1)",
            border: "1px solid hsl(var(--admin-accent) / 0.3)",
          }}
        >
          <User className="h-4 w-4" style={{ color: "hsl(var(--admin-accent))" }} />
          <div className="text-sm">
            Sesión actual: <span className="font-medium">{currentEmail}</span>
            <span className="admin-muted"> · administrador activo</span>
          </div>
        </div>
      )}

      <Card className="p-4 bg-background/40 border-border/50 backdrop-blur-sm">
        <label className="text-xs font-medium admin-muted block mb-2">
          Invitar a otro administrador
        </label>
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
        <div className="px-4 py-3 border-b border-border/50 text-sm font-medium">
          Correos autorizados ({allowlist.length})
        </div>
        {loading ? (
          <div className="p-8 text-center text-muted-foreground text-sm">Cargando…</div>
        ) : allowlist.length === 0 ? (
          <div className="p-8 text-center text-sm admin-muted">
            No hay administradores adicionales invitados todavía.
            <br />
            Agrega un correo arriba para permitir que otra persona acceda al panel.
          </div>
        ) : (
          <ul className="divide-y divide-border/50">
            {allowlist.map((r) => (
              <li key={r.email} className="flex items-center justify-between p-3">
                <span className="font-mono text-sm">
                  {r.email}
                  {currentEmail && r.email.toLowerCase() === currentEmail.toLowerCase() && (
                    <span className="ml-2 text-xs uppercase tracking-wider admin-muted">
                      (tú)
                    </span>
                  )}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => remove(r.email)}
                  disabled={
                    !!currentEmail && r.email.toLowerCase() === currentEmail.toLowerCase()
                  }
                  title={
                    !!currentEmail && r.email.toLowerCase() === currentEmail.toLowerCase()
                      ? "No puedes eliminarte a ti mismo"
                      : "Eliminar"
                  }
                >
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
