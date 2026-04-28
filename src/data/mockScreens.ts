export interface ScreenLocation {
  lat: number;
  lng: number;
  label: string;
}

export interface ScreenContent {
  assetName: string;
  thumbnailUrl: string;
  aspectRatio: string;
}

export interface ScreenScheduleItem {
  day: string;
  startTime: string;
  endTime: string;
  contentName: string;
  thumbnailUrl: string;
}

export interface ScreenData {
  id: string;
  name: string;
  status: "online" | "offline" | "warning";
  lastSyncAt: string;
  location: ScreenLocation;
  storageUsedGb: number;
  storageTotalGb: number;
  volume: number;
  brightness: number;
  adaptiveBrightness: boolean;
  sleepMode: boolean;
  autoReboot: boolean;
  timezone: string;
  orientation: "landscape" | "portrait";
  displayMode: "fill" | "fit" | "stretch";
  rotation?: 0 | 90 | 180 | 270;
  tags: string[];
  currentContent: ScreenContent;
  schedule: ScreenScheduleItem[];
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const mockScreens: ScreenData[] = [
  {
    id: "scr-001",
    name: "Mall Entrance – Left",
    status: "online",
    lastSyncAt: new Date(Date.now() - 120_000).toISOString(),
    location: { lat: 4.711, lng: -74.0721, label: "Mall Central, Bogotá" },
    storageUsedGb: 3.2,
    storageTotalGb: 8,
    volume: 65,
    brightness: 80,
    adaptiveBrightness: true,
    sleepMode: false,
    autoReboot: true,
    timezone: "America/Bogota",
    orientation: "landscape",
    displayMode: "fill",
    tags: ["lobby", "premium"],
    currentContent: {
      assetName: "Summer Promo 2025",
      thumbnailUrl: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80",
      aspectRatio: "16:9",
    },
    schedule: DAYS.map((d) => ({
      day: d,
      startTime: "08:00",
      endTime: "12:00",
      contentName: "Morning Playlist",
      thumbnailUrl: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=120&q=60",
    })).concat(
      DAYS.map((d) => ({
        day: d,
        startTime: "12:00",
        endTime: "18:00",
        contentName: "Afternoon Deals",
        thumbnailUrl: "https://images.unsplash.com/photo-1510693206972-df098062cb71?auto=format&fit=crop&w=120&q=60",
      }))
    ),
  },
  {
    id: "scr-002",
    name: "Food Court Screen",
    status: "online",
    lastSyncAt: new Date(Date.now() - 300_000).toISOString(),
    location: { lat: 4.6951, lng: -74.0519, label: "Food Court, Piso 3" },
    storageUsedGb: 5.1,
    storageTotalGb: 8,
    volume: 40,
    brightness: 70,
    adaptiveBrightness: false,
    sleepMode: false,
    autoReboot: false,
    timezone: "America/Bogota",
    orientation: "landscape",
    displayMode: "fit",
    tags: ["food-court"],
    currentContent: {
      assetName: "Menu Digital",
      thumbnailUrl: "https://images.unsplash.com/photo-1562376552-0d160a2f238d?auto=format&fit=crop&w=600&q=80",
      aspectRatio: "16:9",
    },
    schedule: DAYS.slice(0, 5).map((d) => ({
      day: d,
      startTime: "10:00",
      endTime: "22:00",
      contentName: "Menu Rotation",
      thumbnailUrl: "https://images.unsplash.com/photo-1562376552-0d160a2f238d?auto=format&fit=crop&w=120&q=60",
    })),
  },
  {
    id: "scr-003",
    name: "Outdoor Billboard",
    status: "warning",
    lastSyncAt: new Date(Date.now() - 3_600_000).toISOString(),
    location: { lat: 4.6527, lng: -74.0836, label: "Av. Principal #45" },
    storageUsedGb: 7.6,
    storageTotalGb: 8,
    volume: 0,
    brightness: 100,
    adaptiveBrightness: true,
    sleepMode: true,
    autoReboot: true,
    timezone: "America/Bogota",
    orientation: "landscape",
    displayMode: "fill",
    tags: ["outdoor", "high-brightness"],
    currentContent: {
      assetName: "Brand Campaign Q1",
      thumbnailUrl: "https://images.unsplash.com/photo-1604908554165-162f7b0f2eb8?auto=format&fit=crop&w=600&q=80",
      aspectRatio: "16:9",
    },
    schedule: DAYS.map((d) => ({
      day: d,
      startTime: "06:00",
      endTime: "23:00",
      contentName: "All Day Campaign",
      thumbnailUrl: "https://images.unsplash.com/photo-1604908554165-162f7b0f2eb8?auto=format&fit=crop&w=120&q=60",
    })),
  },
  {
    id: "scr-004",
    name: "Lobby Vertical",
    status: "offline",
    lastSyncAt: new Date(Date.now() - 86_400_000).toISOString(),
    location: { lat: 4.7, lng: -74.06, label: "Edificio Torre Norte" },
    storageUsedGb: 1.2,
    storageTotalGb: 8,
    volume: 50,
    brightness: 60,
    adaptiveBrightness: false,
    sleepMode: false,
    autoReboot: false,
    timezone: "America/Bogota",
    orientation: "portrait",
    displayMode: "fill",
    tags: ["lobby", "vertical"],
    currentContent: {
      assetName: "Welcome Board",
      thumbnailUrl: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=600&q=80",
      aspectRatio: "9:16",
    },
    schedule: DAYS.slice(0, 5).map((d) => ({
      day: d,
      startTime: "07:00",
      endTime: "19:00",
      contentName: "Welcome Loop",
      thumbnailUrl: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=120&q=60",
    })),
  },
  {
    id: "scr-005",
    name: "Window Display – Store A",
    status: "online",
    lastSyncAt: new Date(Date.now() - 60_000).toISOString(),
    location: { lat: 4.7123, lng: -74.0531, label: "Centro Comercial Zona T" },
    storageUsedGb: 2.8,
    storageTotalGb: 8,
    volume: 30,
    brightness: 90,
    adaptiveBrightness: true,
    sleepMode: false,
    autoReboot: true,
    timezone: "America/Bogota",
    orientation: "landscape",
    displayMode: "fill",
    tags: ["retail", "window"],
    currentContent: {
      assetName: "New Arrivals",
      thumbnailUrl: "https://images.unsplash.com/photo-1523362628745-0c100150b504?auto=format&fit=crop&w=600&q=80",
      aspectRatio: "16:9",
    },
    schedule: DAYS.map((d) => ({
      day: d,
      startTime: "09:00",
      endTime: "21:00",
      contentName: "Store Promos",
      thumbnailUrl: "https://images.unsplash.com/photo-1523362628745-0c100150b504?auto=format&fit=crop&w=120&q=60",
    })),
  },
  {
    id: "scr-006",
    name: "Reception Desk",
    status: "online",
    lastSyncAt: new Date(Date.now() - 45_000).toISOString(),
    location: { lat: 4.69, lng: -74.048, label: "Oficina Sede Principal" },
    storageUsedGb: 0.8,
    storageTotalGb: 8,
    volume: 20,
    brightness: 55,
    adaptiveBrightness: false,
    sleepMode: true,
    autoReboot: false,
    timezone: "America/Bogota",
    orientation: "landscape",
    displayMode: "fit",
    tags: ["corporate"],
    currentContent: {
      assetName: "Corporate Reel",
      thumbnailUrl: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=600&q=80",
      aspectRatio: "16:9",
    },
    schedule: DAYS.slice(0, 5).map((d) => ({
      day: d,
      startTime: "08:00",
      endTime: "18:00",
      contentName: "Corporate Info",
      thumbnailUrl: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=120&q=60",
    })),
  },
];
