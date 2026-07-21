/**
 * Conflict resolver for weekly recurring schedule blocks.
 *
 * Rules (in this order):
 *   1. Only enabled blocks that apply to the given weekday are considered.
 *   2. If two blocks overlap in the same minute, the block with the HIGHER
 *      `priority` (from its layer) wins.
 *   3. On priority ties, the block updated MOST RECENTLY wins.
 *   4. Blocks whose date range excludes today are ignored.
 *
 * The exported helpers work on plain typed inputs so the same code runs in
 * the panel (React) and in the Kotlin TV player through kotlinx-serialization
 * of a compact JSON snapshot published by /publish.
 */

export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday

export interface ScheduleBlock {
  id: string;
  playlist_id: string;
  layer_id: string;
  /** "HH:mm" 24h, inclusive */
  start_time: string;
  /** "HH:mm" 24h, exclusive. Must be > start_time (same day, no wraparound). */
  end_time: string;
  days_of_week: Weekday[];
  /** ISO date "YYYY-MM-DD" or null for open start */
  start_date: string | null;
  /** ISO date "YYYY-MM-DD" or null for open end */
  end_date: string | null;
  is_enabled: boolean;
  /** ISO timestamp; used as tie-breaker. */
  updated_at: string;
  /** Cached from schedule_layers.priority. Higher = wins. */
  priority: number;
}

export interface Conflict {
  a: ScheduleBlock;
  b: ScheduleBlock;
  /** Overlap window in "HH:mm" 24h. */
  overlap_start: string;
  overlap_end: string;
  /** Weekday where they collide (any of a.days ∩ b.days). */
  day: Weekday;
  /** True when they have the same priority (harder conflict). */
  samePriority: boolean;
}

const toMinutes = (t: string): number => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

const fromMinutes = (n: number): string => {
  const h = Math.floor(n / 60).toString().padStart(2, "0");
  const m = (n % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
};

const dateInRange = (isoDate: string, block: ScheduleBlock): boolean => {
  if (block.start_date && isoDate < block.start_date) return false;
  if (block.end_date && isoDate > block.end_date) return false;
  return true;
};

/**
 * Return every pairwise overlap between the given blocks so the editor can
 * warn the user BEFORE saving. Runs O(n²) — fine for the tens of blocks a
 * single restaurant will ever configure.
 */
export function findConflicts(blocks: ScheduleBlock[]): Conflict[] {
  const conflicts: Conflict[] = [];
  const active = blocks.filter((b) => b.is_enabled);

  for (let i = 0; i < active.length; i++) {
    for (let j = i + 1; j < active.length; j++) {
      const a = active[i];
      const b = active[j];
      const sharedDays = a.days_of_week.filter((d) => b.days_of_week.includes(d));
      if (sharedDays.length === 0) continue;

      const aStart = toMinutes(a.start_time);
      const aEnd = toMinutes(a.end_time);
      const bStart = toMinutes(b.start_time);
      const bEnd = toMinutes(b.end_time);
      const overlapStart = Math.max(aStart, bStart);
      const overlapEnd = Math.min(aEnd, bEnd);
      if (overlapEnd <= overlapStart) continue;

      for (const day of sharedDays) {
        conflicts.push({
          a,
          b,
          overlap_start: fromMinutes(overlapStart),
          overlap_end: fromMinutes(overlapEnd),
          day: day as Weekday,
          samePriority: a.priority === b.priority,
        });
      }
    }
  }
  return conflicts;
}

/**
 * Pick the single winning block for a specific instant. Returns null when
 * nothing applies (TV should fall back to the default idle playlist).
 */
export function resolveScheduleConflicts(
  blocks: ScheduleBlock[],
  at: { isoDate: string; weekday: Weekday; minutesSinceMidnight: number },
): ScheduleBlock | null {
  const applicable = blocks.filter((b) => {
    if (!b.is_enabled) return false;
    if (!b.days_of_week.includes(at.weekday)) return false;
    if (!dateInRange(at.isoDate, b)) return false;
    const s = toMinutes(b.start_time);
    const e = toMinutes(b.end_time);
    return at.minutesSinceMidnight >= s && at.minutesSinceMidnight < e;
  });
  if (applicable.length === 0) return null;

  applicable.sort((x, y) => {
    if (y.priority !== x.priority) return y.priority - x.priority; // higher priority first
    return Date.parse(y.updated_at) - Date.parse(x.updated_at); // more recent wins ties
  });
  return applicable[0];
}
