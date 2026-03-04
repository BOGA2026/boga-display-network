import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Receipt, Download, FileText } from "lucide-react";
import { fmtCOP, fmtDate } from "@/lib/proration";
import type { InvoiceRow } from "@/hooks/useSubscriptionData";

interface Props {
  invoices: InvoiceRow[];
  legacyPayments?: any[];
}

function paymentStatusBadge(status: string) {
  switch (status) {
    case "paid":
    case "completed":
      return <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-xs">Pagada</Badge>;
    case "pending":
      return <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30 text-xs">Pendiente</Badge>;
    case "failed":
      return <Badge className="bg-destructive/15 text-destructive border-destructive/30 text-xs">Fallida</Badge>;
    default:
      return <Badge variant="outline" className="text-xs">{status}</Badge>;
  }
}

export function InvoicesList({ invoices, legacyPayments = [] }: Props) {
  // Merge legacy payments as invoices if no new invoices exist
  const allItems = invoices.length > 0
    ? invoices.map((inv) => ({
        id: inv.id,
        number: inv.invoice_number,
        date: inv.created_at,
        total: inv.total,
        status: inv.status,
        pdfUrl: inv.pdf_url,
      }))
    : legacyPayments.map((p) => ({
        id: p.id,
        number: p.invoice_number,
        date: p.created_at,
        total: p.amount,
        status: p.status === "completed" ? "paid" : p.status,
        pdfUrl: null as string | null,
      }));

  return (
    <Card className="surface-elevated border-border/30">
      <CardHeader className="pb-3 px-6">
        <CardTitle className="font-display text-lg flex items-center gap-2">
          <Receipt className="h-5 w-5 text-primary" />
          Historial de facturas
        </CardTitle>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        {allItems.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Aún no tienes facturas</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border/30 hover:bg-transparent">
                <TableHead className="text-xs">Fecha</TableHead>
                <TableHead className="text-xs">Factura</TableHead>
                <TableHead className="text-xs">Monto</TableHead>
                <TableHead className="text-xs">Estado</TableHead>
                <TableHead className="text-xs text-right">PDF</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allItems.map((item) => (
                <TableRow key={item.id} className="border-border/20">
                  <TableCell className="text-sm py-3">{fmtDate(item.date)}</TableCell>
                  <TableCell className="font-mono text-xs py-3">{item.number}</TableCell>
                  <TableCell className="text-sm font-medium py-3">{fmtCOP(item.total)}</TableCell>
                  <TableCell className="py-3">{paymentStatusBadge(item.status)}</TableCell>
                  <TableCell className="text-right py-3">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      disabled={!item.pdfUrl}
                      title={item.pdfUrl ? "Descargar PDF" : "PDF no disponible"}
                    >
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
