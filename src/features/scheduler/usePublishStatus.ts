import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type PublishStatus = "sent" | "received" | "playing" | "failed";

export interface ScreenPublishState {
  screen_id: string;
  status: PublishStatus;
  updated_at: string;
  error: string | null;
}

/**
 * Realtime hook: subscribes to schedule_publications rows for the current
 * publish version and returns the latest status per screen. Consumers render
 * a badge that animates sent → recibido → reproduciendo.
 */
export function usePublishStatus(publicationIds: string[]) {
  const [byScreen, setByScreen] = useState<Record<string, ScreenPublishState>>({});

  useEffect(() => {
    if (publicationIds.length === 0) return;

    let cancelled = false;
    void (async () => {
      const { data } = await supabase
        .from("schedule_publications")
        .select("id, screen_id, status, updated_at, error")
        .in("id", publicationIds);
      if (cancelled || !data) return;
      const next: Record<string, ScreenPublishState> = {};
      for (const row of data) {
        next[row.screen_id] = {
          screen_id: row.screen_id,
          status: row.status as PublishStatus,
          updated_at: row.updated_at,
          error: row.error,
        };
      }
      setByScreen(next);
    })();

    const channel = supabase
      .channel(`publish-status-${publicationIds[0]}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "schedule_publications",
          filter: `id=in.(${publicationIds.join(",")})`,
        },
        (payload) => {
          const r = payload.new as {
            screen_id: string;
            status: PublishStatus;
            updated_at: string;
            error: string | null;
          };
          setByScreen((prev) => ({ ...prev, [r.screen_id]: r }));
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [publicationIds.join("|")]); // eslint-disable-line react-hooks/exhaustive-deps

  return byScreen;
}
