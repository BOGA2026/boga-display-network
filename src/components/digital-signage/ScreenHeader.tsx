import { Monitor, Plus, FolderPlus, MapPin, LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ScreenHeaderProps {
  totalScreens: number;
  maxScreens: number;
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
  onAddScreen: () => void;
}

export default function ScreenHeader({
  totalScreens,
  maxScreens,
  viewMode,
  onViewModeChange,
  onAddScreen,
}: ScreenHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <Monitor className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-display">Screens</h1>
          <p className="text-sm text-muted-foreground">
            {totalScreens} out of {maxScreens}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" className="gap-1.5">
          <FolderPlus className="h-4 w-4" />
          <span className="hidden sm:inline">Create Group</span>
        </Button>
        <Button size="sm" className="gap-1.5 gradient-primary" onClick={onAddScreen}>
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Add Screen</span>
        </Button>

        <div className="ml-2 hidden items-center gap-1 rounded-md border border-border p-0.5 sm:flex">
          <button
            onClick={() => onViewModeChange("grid")}
            className={`rounded p-1.5 transition-colors ${viewMode === "grid" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            aria-label="Grid view"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => onViewModeChange("list")}
            className={`rounded p-1.5 transition-colors ${viewMode === "list" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            aria-label="List view"
          >
            <List className="h-4 w-4" />
          </button>
        </div>

        <Button variant="ghost" size="icon" className="hidden sm:flex" aria-label="Map view">
          <MapPin className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
