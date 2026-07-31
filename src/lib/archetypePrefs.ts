import { orderArchetypes, isArchetypeId, type ArchetypeId } from "./designArchetypes";

const KEY = "visualia.ai.archetype.picks";

type Picks = Partial<Record<ArchetypeId, number>>;

export function readArchetypePicks(): Picks {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const picks: Picks = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (isArchetypeId(k) && typeof v === "number" && Number.isFinite(v)) picks[k] = v;
    }
    return picks;
  } catch {
    return {};
  }
}

/** Order to request from the generator: the archetype the user picks most goes first. */
export function preferredArchetypeOrder(): ArchetypeId[] {
  return orderArchetypes(readArchetypePicks());
}

export function recordArchetypePick(id: unknown) {
  if (!isArchetypeId(id)) return;
  try {
    const picks = readArchetypePicks();
    picks[id] = (picks[id] ?? 0) + 1;
    localStorage.setItem(KEY, JSON.stringify(picks));
  } catch {
    /* storage unavailable — ordering just falls back to the default */
  }
}
