import { supabase } from "@/integrations/supabase/client";

/**
 * Publish a schedule save:
 *   1. Bumps `screens.schedule_version` (marker the TV compares against local cache).
 *   2. Inserts one `screen_commands` row per affected screen with command
 *      `apply_schedule` — this fires the Realtime channel the TV listens to.
 *   3. Creates one `schedule_publications` row per screen in status `sent`.
 *
 * The TV client is expected to answer via `screen_commands.result` and to
 * update `schedule_publications.status` through the `schedule-ack` edge
 * function (received → playing). The panel subscribes to this table with
 * `usePublishStatus` and animates the badge sent → recibido → reproduciendo.
 */
export async function publishSchedule(
  businessId: string,
  screenIds: string[],
): Promise<{ version: number; publications: string[] }> {
  if (screenIds.length === 0) return { version: 0, publications: [] };

  // Bump schedule_version for all affected screens.
  const { data: bumped, error: bumpErr } = await supabase.rpc("bump_schedule_version" as never, {
    _screen_ids: screenIds,
  } as never);
  // Fallback path when the RPC isn't installed: read → +1 → update.
  let version = 1;
  if (bumpErr || !bumped) {
    for (const id of screenIds) {
      const { data: cur } = await supabase.from("screens").select("schedule_version").eq("id", id).single();
      version = (cur?.schedule_version ?? 0) + 1;
      await supabase.from("screens").update({ schedule_version: version }).eq("id", id);
    }
  } else {
    version = (bumped as unknown as { version: number }).version;
  }

  // Queue Realtime commands.
  const commands = screenIds.map((screen_id) => ({
    screen_id,
    command: "apply_schedule",
    payload: { schedule_version: version },
    status: "pending",
  }));
  await supabase.from("screen_commands").insert(commands);

  // Track ack status per screen.
  const publications = screenIds.map((screen_id) => ({
    business_id: businessId,
    screen_id,
    schedule_version: version,
    status: "sent" as const,
  }));
  const { data: pubs } = await supabase
    .from("schedule_publications")
    .insert(publications)
    .select("id");

  return { version, publications: (pubs ?? []).map((p) => p.id) };
}
