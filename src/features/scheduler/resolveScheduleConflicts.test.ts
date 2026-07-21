import { describe, expect, it } from "vitest";
import {
  findConflicts,
  resolveScheduleConflicts,
  type ScheduleBlock,
} from "./resolveScheduleConflicts";

const base = (over: Partial<ScheduleBlock> = {}): ScheduleBlock => ({
  id: "a",
  playlist_id: "p",
  layer_id: "l",
  start_time: "08:00",
  end_time: "12:00",
  days_of_week: [1, 2, 3, 4, 5],
  start_date: null,
  end_date: null,
  is_enabled: true,
  updated_at: "2026-07-01T00:00:00Z",
  priority: 1,
  ...over,
});

describe("findConflicts", () => {
  it("detects full overlap on shared weekday", () => {
    const A = base({ id: "A", start_time: "08:00", end_time: "12:00" });
    const B = base({ id: "B", start_time: "08:00", end_time: "12:00" });
    const c = findConflicts([A, B]);
    expect(c).toHaveLength(5); // one per shared weekday
    expect(c[0].samePriority).toBe(true);
    expect(c[0].overlap_start).toBe("08:00");
    expect(c[0].overlap_end).toBe("12:00");
  });

  it("detects partial overlap", () => {
    const A = base({ id: "A", start_time: "07:00", end_time: "11:00" });
    const B = base({ id: "B", start_time: "10:00", end_time: "13:00" });
    const c = findConflicts([A, B]);
    expect(c.length).toBeGreaterThan(0);
    expect(c[0].overlap_start).toBe("10:00");
    expect(c[0].overlap_end).toBe("11:00");
  });

  it("ignores blocks on disjoint weekdays", () => {
    const A = base({ id: "A", days_of_week: [1, 2] });
    const B = base({ id: "B", days_of_week: [5, 6] });
    expect(findConflicts([A, B])).toHaveLength(0);
  });

  it("ignores disabled blocks", () => {
    const A = base({ id: "A" });
    const B = base({ id: "B", is_enabled: false });
    expect(findConflicts([A, B])).toHaveLength(0);
  });

  it("touching edges do not conflict (end exclusive)", () => {
    const A = base({ id: "A", start_time: "08:00", end_time: "11:00" });
    const B = base({ id: "B", start_time: "11:00", end_time: "13:00" });
    expect(findConflicts([A, B])).toHaveLength(0);
  });

  it("flags samePriority=false when priorities differ", () => {
    const A = base({ id: "A", priority: 1 });
    const B = base({ id: "B", priority: 5 });
    expect(findConflicts([A, B])[0].samePriority).toBe(false);
  });
});

describe("resolveScheduleConflicts", () => {
  const monday = {
    isoDate: "2026-07-06", // Monday
    weekday: 1 as const,
    minutesSinceMidnight: 9 * 60 + 30, // 09:30
  };

  it("higher priority wins over same time slot", () => {
    const low = base({ id: "low", priority: 1 });
    const high = base({ id: "high", priority: 10 });
    expect(resolveScheduleConflicts([low, high], monday)?.id).toBe("high");
  });

  it("on equal priority the most recently updated wins", () => {
    const older = base({ id: "older", priority: 5, updated_at: "2026-01-01T00:00:00Z" });
    const newer = base({ id: "newer", priority: 5, updated_at: "2026-07-01T00:00:00Z" });
    expect(resolveScheduleConflicts([older, newer], monday)?.id).toBe("newer");
  });

  it("returns null when no block applies at that instant", () => {
    const b = base({ start_time: "20:00", end_time: "22:00" });
    expect(resolveScheduleConflicts([b], monday)).toBeNull();
  });

  it("respects start_date / end_date bounds", () => {
    const outdated = base({
      id: "out",
      end_date: "2026-01-01",
      priority: 100,
    });
    const current = base({ id: "curr", priority: 1 });
    expect(resolveScheduleConflicts([outdated, current], monday)?.id).toBe("curr");
  });
});
