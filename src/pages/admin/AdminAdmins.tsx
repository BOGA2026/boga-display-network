import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ShieldCheck, Trash2, User, Clock, ShieldAlert, History } from "lucide-react";

type AccessRow = {
  email: string;
  status: "pending" | "activated" | "expired" | string;
  invited_at: string;
  expires_at: string;
  activated_at: string | null;
  has_account: boolean;
  email_confirmed: boolean;
  is_expired: boolean;
};

type AuditRow = {
  id: string;
  action: string;
  actor_email: string | null;
  target_email: string;
  ip: string | null;
  created_at: string;
};

const ACTION_LABEL: Record<string, string> = {
  invite: "Invitación enviada",
  invite_cancelled: "Invitación cancelada",
  activated: "Acceso total otorgado",
  revoked: "Acceso revocado",
};

const fmt = (v: string | null) =>
  v ? new Date(v).toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" }) : "—";

const diasRestantes = (expires: string) =>
  Math.max(0, Math.ceil((new Date(expires).getTime() - Date.now()) / 86_400_000));

export default function AdminAdmins() {
  const [rows, setRows] = useState<AccessRow[]>([]);
  const [audit, setAudit] = useState<AuditRow[]>([]);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [currentEmail, setCurrentEmail] = useState<string | null>(null);
  const [confirmActivate, setConfirmActivate] = useState<AccessRow | null>(null);

  const load = useCallback(async () => {
    const [accessRes, auditRes, sessRes] = await Promise.all([
      supabase.rpc("list_platform_admin_access"),
      supabase
        .from("platform_admin_audit")
        .select("id, action, actor_email, target_email, ip, created_at")
        .order("created_at", { ascending: false })
        .limit(25),
      supabase.auth.getSession(),
    ]);
    setRows((accessRes.data as AccessRow[]) ?? []);
    setAudit((auditRes.data as AuditRow[]) ?? []);
    setCurrentEmail(sessRes.data.session?.user.email ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const run = async (action: "invite" | "cancel" | "activate" | "revoke", target: string) => {
    setBusy(`${action}:${target}`);
    const { data, error } = await supabase.functions.invoke("platform-admin-access", {
      body: { action, email: target },
    });
    setBusy(null);

    const message = (data as { error?: string } | null)?.error;
    if (error || message) {
      toast.error(message ?? "No se pudo completar la acción");
      return;
    }

    if (action === "invite") {
      toast.success("Invitación creada. Caduca en 7 días y requiere tu aprobación para activarse.");
      setEmail("");
    } else if (action === "activate") {
      const notif = (data as { notification?: { sent?: number } } | null)?.notification;
      toast.success(
        notif?.sent
          ? `Acceso otorgado. Se avisó por correo a ${notif.sent} administradores.`
          : "Acceso otorgado. El aviso por correo no está configurado todavía.",
      );
    } else {
      toast.success(action === "cancel" ? "Invitación cancelada" : "Acceso revocado");
    }
    load();
  };

  const activos = rows.filter((r) => r.status === "activated");
  const pendientes = rows.filter((r) => r.status !== "activated");

  return (
    <div className="p-6 md:p-8 space-y-4 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Administradores de plataforma</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Invitar un correo no otorga ningún permiso. Confirmar el correo solo verifica que existe.
          El acceso total lo aprueba manualmente un administrador activo, y toda invitación caduca a
          los 7 días.
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
          <Button
            onClick={() => run("invite", email.trim().toLowerCase())}
            disabled={!email.trim() || busy !== null}
          >
            <ShieldCheck className="h-4 w-4 mr-2" />
            Invitar
          </Button>
        </div>
      </Card>

      <Card className="bg-background/40 border-border/50 backdrop-blur-sm">
        <div className="px-4 py-3 border-b border-border/50 text-sm font-medium">
          Con acceso total ({activos.length})
        </div>
        {loading ? (
          <div className="p-8 text-center text-muted-foreground text-sm">Cargando…</div>
        ) : (
          <ul className="divide-y divide-border/50">
            {activos.map((r) => {
              const soyYo = !!currentEmail && r.email.toLowerCase() === currentEmail.toLowerCase();
              return (
                <li key={r.email} className="flex items-center justify-between gap-3 p-3">
                  <div className="min-w-0">
                    <div className="font-mono text-sm truncate">
                      {r.email}
                      {soyYo && (
                        <span className="ml-2 text-xs uppercase tracking-wider admin-muted">(tú)</span>
                      )}
                    </div>
                    <div className="text-xs admin-muted">Activo desde {fmt(r.activated_at)}</div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => run("revoke", r.email)}
                    disabled={soyYo || busy !== null}
                    title={soyYo ? "No puedes quitarte el acceso a ti mismo" : "Revocar acceso"}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Card className="bg-background/40 border-border/50 backdrop-blur-sm">
        <div className="px-4 py-3 border-b border-border/50 text-sm font-medium">
          Invitaciones pendientes ({pendientes.length})
        </div>
        {pendientes.length === 0 ? (
          <div className="p-8 text-center text-sm admin-muted">
            No hay invitaciones pendientes.
          </div>
        ) : (
          <ul className="divide-y divide-border/50">
            {pendientes.map((r) => (
              <li key={r.email} className="flex items-center justify-between gap-3 p-3">
                <div className="min-w-0">
                  <div className="font-mono text-sm truncate">{r.email}</div>
                  <div className="text-xs admin-muted flex items-center gap-1 mt-0.5">
                    <Clock className="h-3 w-3" />
                    {r.is_expired
                      ? "Invitación caducada · vuelve a invitarla"
                      : `Caduca en ${diasRestantes(r.expires_at)} día(s) · ${
                          r.email_confirmed
                            ? "correo confirmado"
                            : r.has_account
                              ? "falta confirmar el correo"
                              : "aún no ha creado su cuenta"
                        }`}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    size="sm"
                    onClick={() => setConfirmActivate(r)}
                    disabled={r.is_expired || !r.email_confirmed || busy !== null}
                    title={
                      r.is_expired
                        ? "La invitación caducó"
                        : !r.email_confirmed
                          ? "La persona debe crear su cuenta y confirmar el correo"
                          : "Otorgar acceso total"
                    }
                  >
                    <ShieldAlert className="h-4 w-4 mr-2" />
                    Otorgar acceso
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => run("cancel", r.email)}
                    disabled={busy !== null}
                    title="Cancelar invitación"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="bg-background/40 border-border/50 backdrop-blur-sm">
        <div className="px-4 py-3 border-b border-border/50 text-sm font-medium flex items-center gap-2">
          <History className="h-4 w-4" />
          Bitácora de cambios de privilegios
        </div>
        {audit.length === 0 ? (
          <div className="p-8 text-center text-sm admin-muted">Todavía no hay movimientos.</div>
        ) : (
          <ul className="divide-y divide-border/50">
            {audit.map((a) => (
              <li key={a.id} className="p-3 text-sm">
                <div>
                  <span className="font-medium">{ACTION_LABEL[a.action] ?? a.action}</span>{" "}
                  <span className="font-mono text-xs">{a.target_email}</span>
                </div>
                <div className="text-xs admin-muted">
                  Por {a.actor_email ?? "sistema"} · {fmt(a.created_at)} · IP {a.ip ?? "—"}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <AlertDialog
        open={confirmActivate !== null}
        onOpenChange={(o) => !o && setConfirmActivate(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Otorgar acceso total a la plataforma a {confirmActivate?.email}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta persona podrá ver y administrar todos los negocios, pantallas, pagos y datos de
              todos los clientes de Visualia. Queda registrado en la bitácora con tu correo y tu IP,
              y se avisará por correo a todos los administradores.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const target = confirmActivate?.email;
                setConfirmActivate(null);
                if (target) run("activate", target);
              }}
            >
              Otorgar acceso total
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
