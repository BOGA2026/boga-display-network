export interface ScreenRow {
  id: string;
  name: string;
  status: string;
  location_id: string;
  device_token: string | null;
  last_seen_at: string | null;
  created_at: string;
  rotation?: number | null;
  device_type?: string | null;
}

export interface LocationRow {
  id: string;
  name: string;
}

export type SortKey = "name" | "last_seen" | "status";
export type StatusFilter = "live" | "offline" | "unpaired";
export type OrientationFilter = "horizontal" | "vertical";
