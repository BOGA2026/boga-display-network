import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Monitor } from "lucide-react";

interface Screen {
  id: string;
  name: string;
  status: string;
  locations?: { name: string } | null;
}

interface Props {
  screens: Screen[];
  selectedId: string | undefined;
  onSelect: (id: string) => void;
}

const ScreenSelector = ({ screens, selectedId, onSelect }: Props) => (
  <div className="flex items-center gap-2">
    <Monitor className="h-4 w-4 text-muted-foreground" />
    <Select value={selectedId || ""} onValueChange={onSelect}>
      <SelectTrigger className="w-[260px] bg-card border-border">
        <SelectValue placeholder="Seleccionar pantalla…" />
      </SelectTrigger>
      <SelectContent>
        {screens.map((s) => (
          <SelectItem key={s.id} value={s.id}>
            <span className="flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: s.status === "online" ? "#8A00FF" : "hsl(var(--muted-foreground))" }}
              />
              {s.name}
              {(s as any).locations?.name && (
                <span className="text-xs text-muted-foreground ml-1">— {(s as any).locations.name}</span>
              )}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);

export default ScreenSelector;
