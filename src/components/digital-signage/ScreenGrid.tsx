import type { ScreenData } from "@/data/mockScreens";
import { ScreenCard, ScreenCardSkeleton, ScreenCardAdd } from "./ScreenCard";
import { SearchX, MonitorOff } from "lucide-react";

interface ScreenGridProps {
  screens: ScreenData[];
  isLoading: boolean;
  hasSearch: boolean;
  onSelect: (id: string) => void;
  onAddScreen: () => void;
}

export default function ScreenGrid({
  screens,
  isLoading,
  hasSearch,
  onSelect,
  onAddScreen,
}: ScreenGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <ScreenCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (screens.length === 0 && hasSearch) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
        <SearchX className="h-12 w-12 text-muted-foreground" />
        <h3 className="text-lg font-semibold text-foreground">No results found</h3>
        <p className="max-w-sm text-sm text-muted-foreground">
          We couldn't find any screens matching your search. Try a different keyword.
        </p>
      </div>
    );
  }

  if (screens.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
        <MonitorOff className="h-12 w-12 text-muted-foreground" />
        <h3 className="text-lg font-semibold text-foreground">No screens yet</h3>
        <p className="max-w-sm text-sm text-muted-foreground">
          Add your first screen to start managing your digital signage network.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {screens.map((s) => (
        <ScreenCard key={s.id} screen={s} onClick={() => onSelect(s.id)} />
      ))}
      <ScreenCardAdd onClick={onAddScreen} />
    </div>
  );
}
