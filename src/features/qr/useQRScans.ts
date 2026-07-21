import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { listScans, type QRScan } from "./api";

/**
 * Loads the scan history for a given QR and subscribes to `qr_scans` inserts
 * in realtime — every incoming row is prepended so the dashboard counter,
 * chart and breakdown update within ~1s of the actual scan.
 */
export function useQRScans(qrId: string | null, sinceDays = 30) {
  const [scans, setScans] = useState<QRScan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [liveCount, setLiveCount] = useState(0);
  const seenRef = useRef<Set<string>>(new Set());

  const reload = useCallback(async () => {
    if (!qrId) return;
    setLoading(true);
    setError(null);
    try {
      const rows = await listScans(qrId, sinceDays);
      seenRef.current = new Set(rows.map((r) => r.id));
      setScans(rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudieron cargar los escaneos.");
    } finally {
      setLoading(false);
    }
  }, [qrId, sinceDays]);

  useEffect(() => {
    if (!qrId) {
      setScans([]);
      return;
    }
    void reload();
    const channel = supabase
      .channel(`qr-scans-${qrId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "qr_scans", filter: `qr_code_id=eq.${qrId}` },
        (payload) => {
          const row = payload.new as QRScan;
          if (seenRef.current.has(row.id)) return;
          seenRef.current.add(row.id);
          setScans((prev) => [row, ...prev]);
          setLiveCount((c) => c + 1);
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qrId, reload]);

  return { scans, loading, error, reload, liveCount };
}
