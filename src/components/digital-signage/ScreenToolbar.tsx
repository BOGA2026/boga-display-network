import { Search, SlidersHorizontal, ArrowDownUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type SortOption = "newest" | "oldest" | "name-asc" | "name-desc";

interface ScreenToolbarProps {
  search: string;
  onSearchChange: (v: string) => void;
  sort: SortOption;
  onSortChange: (v: SortOption) => void;
}

export default function ScreenToolbar({
  search,
  onSearchChange,
  sort,
  onSortChange,
}: ScreenToolbarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search screens…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 bg-card border-border"
        />
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" className="gap-1.5">
          <SlidersHorizontal className="h-4 w-4" />
          Filter
        </Button>

        <Select value={sort} onValueChange={(v) => onSortChange(v as SortOption)}>
          <SelectTrigger className="w-[160px] bg-card border-border">
            <ArrowDownUp className="mr-2 h-4 w-4 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="oldest">Oldest first</SelectItem>
            <SelectItem value="name-asc">Name A–Z</SelectItem>
            <SelectItem value="name-desc">Name Z–A</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
