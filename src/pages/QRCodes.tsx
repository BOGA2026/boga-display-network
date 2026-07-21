/**
 * QRCodes — /dashboard/qr
 * List of QR codes with a side sheet showing scan analytics per row.
 */
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Plus, QrCode, Copy } from "lucide-react";
import { toast } from "sonner";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RTooltip,
} from "recharts";
import { format, subDays } from "date-fns";

type QR = {
  id: string;
  label: string;
  target_url: string;
  slug: string;
  screen_id: string | null;
  created_at: string;
};

type Scan = { scanned_at: string };

const FUNCTIONS_BASE = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1`;

function randomSlug() {
  return Math.random().toString(36).slice(2, 10);
}

export default function QRCodes() {
  const [items, setItems] = useState<QR[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<QR | null>(null);
  const [scans, setScans] = useState<Scan[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [label, setLabel] = useState("");
  const [targetUrl, setTargetUrl] = useState("");

  const load = async () => {
    setLoading(true);
    const { data: qrs, error } = await supabase
      .from("qr_codes")
      .select("id, label, target_url, slug, screen_id, created_at")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("No se pudieron cargar los códigos QR");
      setLoading(false);
      return;
    }
    setItems((qrs ?? []) as QR[]);

    // scan counts (last 7d)
    const since = subDays(new Date(), 7).toISOString();
    const ids = (qrs ?? []).map((q) => q.id);
    if (ids.length) {
      const { data: allScans } = await supabase
        .from("qr_scans")
        .select("qr_code_id")
        .in("qr_code_id", ids)
        .gte("scanned_at", since);
      const map: Record<string, number> = {};
      (allScans ?? []).forEach((s: { qr_code_id: string }) => {
        map[s.qr_code_id] = (map[s.qr_code_id] ?? 0) + 1;
      });
      setCounts(map);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const openDetail = async (qr: QR) => {
    setSelected(qr);
    const since = subDays(new Date(), 30).toISOString();
    const { data } = await supabase
      .from("qr_scans")
      .select("scanned_at")
      .eq("qr_code_id", qr.id)
      .gte("scanned_at", since)
      .order("scanned_at");
    setScans((data as Scan[]) ?? []);
  };

  const series = useMemo(() => {
    const days: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
      const key = format(subDays(new Date(), i), "MM-dd");
      days[key] = 0;
    }
    scans.forEach((s) => {
      const key = format(new Date(s.scanned_at), "MM-dd");
      if (key in days) days[key]++;
    });
    return Object.entries(days).map(([day, count]) => ({ day, count }));
  }, [scans]);

  const handleCreate = async () => {
    if (!label.trim() || !targetUrl.trim()) {
      toast.error("Completá etiqueta y URL destino");
      return;
    }
    const { data: bizId } = await supabase.rpc("get_user_business_id");
    if (!bizId) {
      toast.error("No se encontró tu negocio");
      return;
    }
    const { error } = await supabase.from("qr_codes").insert({
      business_id: bizId,
      label: label.trim(),
      target_url: targetUrl.trim(),
      slug: randomSlug(),
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("QR creado");
    setLabel("");
    setTargetUrl("");
    setShowCreate(false);
    load();
  };

  const redirectUrl = (slug: string) =>
    `${FUNCTIONS_BASE}/qr-redirect?slug=${slug}`;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Códigos QR</h1>
          <p className="text-sm text-muted-foreground">
            Creá códigos QR que redirigen a lo que quieras y medí sus escaneos.
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="mr-2 h-4 w-4" /> Nuevo QR
        </Button>
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Cargando…
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center">
            <QrCode className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Todavía no tenés códigos QR. Creá el primero.
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/30 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Etiqueta</th>
                <th className="px-4 py-3">Destino</th>
                <th className="px-4 py-3">Escaneos (7d)</th>
                <th className="px-4 py-3">Creado</th>
              </tr>
            </thead>
            <tbody>
              {items.map((q) => (
                <tr
                  key={q.id}
                  onClick={() => openDetail(q)}
                  className="cursor-pointer border-b hover:bg-muted/30"
                >
                  <td className="px-4 py-3 font-medium">{q.label}</td>
                  <td className="px-4 py-3 max-w-xs truncate text-muted-foreground">
                    {q.target_url}
                  </td>
                  <td className="px-4 py-3">{counts[q.id] ?? 0}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {format(new Date(q.created_at), "dd MMM yyyy")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* Create */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo código QR</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Etiqueta</Label>
              <Input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Menú desayuno"
              />
            </div>
            <div className="space-y-1.5">
              <Label>URL destino</Label>
              <Input
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="https://tunegocio.com/menu"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate}>Crear</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Sheet */}
      <Sheet
        open={selected !== null}
        onOpenChange={(o) => !o && setSelected(null)}
      >
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>{selected.label}</SheetTitle>
                <SheetDescription className="break-all">
                  {selected.target_url}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 flex flex-col items-center gap-3">
                <div className="rounded-xl border bg-white p-4">
                  <QRCodeSVG
                    value={redirectUrl(selected.slug)}
                    size={192}
                    level="M"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(redirectUrl(selected.slug));
                    toast.success("Enlace copiado");
                  }}
                >
                  <Copy className="mr-2 h-3.5 w-3.5" /> Copiar enlace
                </Button>
              </div>

              <div className="mt-8">
                <h3 className="mb-3 text-sm font-semibold">
                  Escaneos (30 días)
                </h3>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={series}>
                      <XAxis dataKey="day" hide />
                      <YAxis allowDecimals={false} width={24} />
                      <RTooltip />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Total 30 días: {scans.length}
                </p>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
