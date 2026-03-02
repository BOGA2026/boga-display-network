import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ScreenHeader from "@/components/digital-signage/ScreenHeader";
import ScreenToolbar, { type SortOption } from "@/components/digital-signage/ScreenToolbar";
import ScreenGrid from "@/components/digital-signage/ScreenGrid";
import { mockScreens } from "@/data/mockScreens";

export default function ScreensList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  const filtered = useMemo(() => {
    let list = [...mockScreens];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((s) => s.name.toLowerCase().includes(q));
    }
    switch (sort) {
      case "newest":
        list.sort((a, b) => new Date(b.lastSyncAt).getTime() - new Date(a.lastSyncAt).getTime());
        break;
      case "oldest":
        list.sort((a, b) => new Date(a.lastSyncAt).getTime() - new Date(b.lastSyncAt).getTime());
        break;
      case "name-asc":
        list.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name-desc":
        list.sort((a, b) => b.name.localeCompare(a.name));
        break;
    }
    return list;
  }, [search, sort]);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <ScreenHeader
        totalScreens={mockScreens.length}
        maxScreens={20}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onAddScreen={() => {}}
      />
      <ScreenToolbar
        search={search}
        onSearchChange={setSearch}
        sort={sort}
        onSortChange={setSort}
      />
      <ScreenGrid
        screens={filtered}
        isLoading={isLoading}
        hasSearch={search.trim().length > 0}
        onSelect={(id) => navigate(`/digital-signage/screens/${id}`)}
        onAddScreen={() => {}}
      />
    </div>
  );
}
