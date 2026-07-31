/**
 * /dashboard/qr — QR codes hub.
 *
 * List on the left, side sheet with QRBuilder + QRAnalytics on the right.
 * The list refreshes counters live (Realtime `qr_scans` INSERTs) so the
 * dashboard reflects field activity without reload.
 */
import { useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import {
  Tabs, TabsList, TabsTrigger, TabsContent,
} from "@/components/ui/tabs";
import { Plus, QrCode as QrIcon, Trash2, PencilLine } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { QRBuilder, QRAnalytics, listQRCodes, deleteQRCode, type QRCode } from "@/features/qr";
import { NAV, COPY } from "@/config/lexicon";

type Screen = { id: string; name: string };

export default function QRCodes() {
  const [items, setItems] = useState<QRCode[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [screens, setScreens] = useState<Screen[]>([]);
  const [selected, setSelected] = useState<QRCode | null>(null);
  const [creating, setCreating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<QRCode | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: biz } = await supabase.rpc("get_user_business_id");
      const bizId = (biz ?? null) as string | null;
      setBusinessId(bizId);
      if (!bizId) {
        setItems([]);
        setCounts({});
        return;
      }
      const qrs = await listQRCodes(bizId);
      const scr = await (supabase.from("screens") as unknown as { select: (c: string) => { eq: (k: string, v: string) => { order: (c: string) => Promise<{ data: Screen[] | null }> } } }).select("id, name").eq("business_id", bizId).order("name");
      setItems(qrs);
      setScreens((scr.data ?? []) as Screen[]);

      // Aggregate scan counts for the last 7 days per QR — cheap projection.
      const ids = qrs.map((q) => q.id);
      if (ids.length) {
        const since = new Date();
        since.setDate(since.getDate() - 7);
        const { data: scans } = await supabase
          .from("qr_scans")
          .select("qr_code_id")
          .in("qr_code_id", ids)
          .gte("scanned_at", since.toISOString());
        const map: Record<string, number> = {};
        (scans ?? []).forEach((s: { qr_code_id: string }) => {
          map[s.qr_code_id] = (map[s.qr_code_id] ?? 0) + 1;
        });
        setCounts(map);
      } else {
        setCounts({});
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudieron cargar los códigos QR");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Live counter: on any qr_scans insert for one of *our* QRs, bump its counter.
  // The detail sheet has its own targeted subscription for the chart.
  useEffect(() => {
    if (items.length === 0) return;
    const ids = new Set(items.map((q) => q.id));
    const channel = supabase
      .channel("qr-scans-hub")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "qr_scans" },
        (payload) => {
          const row = payload.new as { qr_code_id: string };
          if (!ids.has(row.qr_code_id)) return;
          setCounts((prev) => ({ ...prev, [row.qr_code_id]: (prev[row.qr_code_id] ?? 0) + 1 }));
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [items]);

  const sorted = useMemo(
    () => [...items].sort((a, b) => (counts[b.id] ?? 0) - (counts[a.id] ?? 0) || b.created_at.localeCompare(a.created_at)),
    [items, counts],
  );

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteQRCode(confirmDelete.id);
      toast.success("QR eliminado");
      setSelected(null);
      setConfirmDelete(null);
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo eliminar");
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{NAV.qr.pageTitle}</h1>
          <p className="text-sm text-muted-foreground">{NAV.qr.pageSubtitle}</p>
        </div>
        <Button onClick={() => { setSelected(null); setCreating(true); }} disabled={!businessId}>
          <Plus className="mr-2 h-4 w-4" /> {COPY.actions.newQr}
        </Button>
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Cargando…</div>
        ) : sorted.length === 0 ? (
          <div className="p-12 text-center">
            <QrIcon className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{COPY.empty.qr}</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/30 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Destino</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Escaneos (7d)</th>
                <th className="px-4 py-3">Creado</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((q) => (
                <tr
                  key={q.id}
                  onClick={() => { setCreating(false); setSelected(q); }}
                  className="cursor-pointer border-b transition-colors hover:bg-muted/30"
                >
                  <td className="px-4 py-3 font-medium">{q.label}</td>
                  <td className="max-w-xs truncate px-4 py-3 text-muted-foreground">{q.target_url}</td>
                  <td className="px-4 py-3">
                    <span className={q.active ? "inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-600 dark:text-emerald-400" : "inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"}>
                      {q.active ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-4 py-3 v-numeric">{counts[q.id] ?? 0}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {format(new Date(q.created_at), "d MMM yyyy", { locale: es })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* Create sheet */}
      <Sheet open={creating} onOpenChange={(o) => !o && setCreating(false)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle>Nuevo código QR</SheetTitle>
            <SheetDescription>
              Guardá el QR una sola vez. Podés cambiar el destino más adelante sin reimprimirlo.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            {businessId && (
              <QRBuilder
                businessId={businessId}
                screens={screens}
                onSaved={(qr) => { setCreating(false); setSelected(qr); void load(); }}
                onCancel={() => setCreating(false)}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Detail sheet */}
      <Sheet open={selected !== null} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-3xl">
          {selected && (
            <>
              <SheetHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <SheetTitle className="flex items-center gap-2">
                      <QrIcon className="h-5 w-5 text-primary" /> {selected.label}
                    </SheetTitle>
                    <SheetDescription className="break-all">{selected.target_url}</SheetDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(selected)} className="text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </SheetHeader>

              <Tabs defaultValue="analytics" className="mt-6">
                <TabsList>
                  <TabsTrigger value="analytics">Escaneos</TabsTrigger>
                  <TabsTrigger value="edit"><PencilLine className="mr-1 h-3.5 w-3.5" /> Editar</TabsTrigger>
                </TabsList>
                <TabsContent value="analytics" className="mt-4">
                  <QRAnalytics qrId={selected.id} qrLabel={selected.label} />
                </TabsContent>
                <TabsContent value="edit" className="mt-4">
                  {businessId && (
                    <QRBuilder
                      businessId={businessId}
                      screens={screens}
                      existing={selected}
                      onSaved={(qr) => { setSelected(qr); void load(); }}
                    />
                  )}
                </TabsContent>
              </Tabs>
            </>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={confirmDelete !== null} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar código QR</AlertDialogTitle>
            <AlertDialogDescription>
              El QR "{confirmDelete?.label}" dejará de funcionar de inmediato. Los materiales impresos con este código quedarán inservibles. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
